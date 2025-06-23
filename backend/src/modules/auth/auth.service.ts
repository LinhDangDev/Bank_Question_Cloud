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
        const user = await this.userRepository.findOne({ where: { LoginName: loginName } });
        if (user && await bcrypt.compare(password, user.Password)) {
            const { Password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto): Promise<TokenResponseDto> {
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
            IsBuildInUser: user.IsBuildInUser
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                userId: user.UserId,
                loginName: user.LoginName,
                email: user.Email,
                name: user.Name,
                role: userRole,
                IsBuildInUser: user.IsBuildInUser
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
}
