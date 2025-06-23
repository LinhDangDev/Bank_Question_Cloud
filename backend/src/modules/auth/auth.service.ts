import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { LoginDto, RegisterDto, AssignRoleDto, TokenResponseDto } from '../../dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async validateUser(loginName: string, password: string): Promise<any> {
        if (!loginName || !password) {
            return null;
        }

        const user = await this.userRepository.findOne({ where: { LoginName: loginName } });

        if (!user || !user.Password) {
            return null;
        }

        try {
            const isPasswordValid = await bcrypt.compare(password, user.Password);
            if (isPasswordValid) {
                const { Password, PasswordSalt, ...result } = user;
                return result;
            }
        } catch (error) {
            console.error('Error validating password:', error);
        }

        return null;
    }

    async login(loginDto: LoginDto): Promise<TokenResponseDto> {
        if (!loginDto || !loginDto.loginName || !loginDto.password) {
            throw new UnauthorizedException('Invalid credentials: Missing username or password');
        }

        const user = await this.validateUser(loginDto.loginName, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.IsLockedOut) {
            throw new UnauthorizedException('Account is locked');
        }

        if (user.IsDeleted) {
            throw new UnauthorizedException('Account is deleted');
        }

        // Update last login date
        await this.userRepository.update(user.UserId, {
            LastLoginDate: new Date(),
            LastActivityDate: new Date()
        });

        // Xác định role dựa trên IsBuildInUser
        let userRole = 'teacher'; // Default role cho non-admin
        if (user.IsBuildInUser) {
            userRole = 'admin';
        }

        const payload = {
            sub: user.UserId,
            loginName: user.LoginName,
            email: user.Email,
            name: user.Name,
            role: userRole,
            IsBuildInUser: user.IsBuildInUser,
            needChangePassword: user.NeedChangePassword
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                userId: user.UserId,
                loginName: user.LoginName,
                email: user.Email,
                name: user.Name,
                role: userRole,
                IsBuildInUser: user.IsBuildInUser,
                needChangePassword: user.NeedChangePassword
            }
        };
    }

    async register(registerDto: RegisterDto): Promise<User> {
        const existingUser = await this.userRepository.findOne({
            where: [
                { LoginName: registerDto.loginName },
                { Email: registerDto.email }
            ]
        });

        if (existingUser) {
            throw new BadRequestException('Username or email already exists');
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(registerDto.password, salt);

        const user = this.userRepository.create({
            LoginName: registerDto.loginName,
            Email: registerDto.email,
            Name: registerDto.name,
            Password: hashedPassword,
            PasswordSalt: salt,
            DateCreated: new Date(),
            IsBuildInUser: false
        });

        return this.userRepository.save(user);
    }

    async assignRole(assignRoleDto: AssignRoleDto): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { UserId: assignRoleDto.userId }
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Only allow assigning admin role to build-in users
        if (assignRoleDto.role === 'admin' && !user.IsBuildInUser) {
            throw new BadRequestException('Cannot assign admin role to non-build-in users');
        }

        user.IsBuildInUser = assignRoleDto.role === 'admin';
        return this.userRepository.save(user);
    }

    async validateToken(token: string) {
        try {
            const payload = this.jwtService.verify(token);
            const user = await this.userRepository.findOne({ where: { UserId: payload.sub } });
            if (!user) {
                throw new UnauthorizedException('User not found');
            }
            return user;
        } catch {
            throw new UnauthorizedException('Invalid token');
        }
    }

    async forceLogout(userId: string): Promise<{ success: boolean, message: string }> {
        try {
            const user = await this.userRepository.findOne({ where: { UserId: userId } });

            if (!user) {
                throw new BadRequestException('User not found');
            }

            if (user.IsBuildInUser) {
                throw new BadRequestException('Cannot force logout an admin user');
            }

            // Update last activity date to invalidate token
            // We use a past date to ensure token is invalid
            await this.userRepository.update(userId, {
                LastActivityDate: new Date(2000, 1, 1)
            });

            return {
                success: true,
                message: 'User has been logged out successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to logout user'
            };
        }
    }
}
