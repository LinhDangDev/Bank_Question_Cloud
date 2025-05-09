import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from '../../dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) { }

    async validateUser(loginName: string, password: string): Promise<any> {
        const user = await this.userRepository.findOne({ where: { LoginName: loginName } });
        if (user && await bcrypt.compare(password, user.Password)) {
            const { Password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.loginName, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.userRepository.update(user.UserId, {
            LastLoginDate: new Date(),
            LastActivityDate: new Date(),
        });

        const payload = { username: user.LoginName, sub: user.UserId };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.UserId,
                loginName: user.LoginName,
                email: user.Email,
                name: user.Name,
            },
        };
    }

    async register(registerDto: RegisterDto) {
        const { password, ...rest } = registerDto;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = this.userRepository.create({
            ...rest,
            Password: hashedPassword,
            DateCreated: new Date(),
            IsDeleted: false,
            IsLockedOut: false,
            IsBuildInUser: false,
        });

        try {
            const savedUser = await this.userRepository.save(user);
            const { Password, ...result } = savedUser;
            return result;
        } catch (error) {
            if (error.code === 'UNIQUE_VIOLATION') {
                throw new UnauthorizedException('Username or email already exists');
            }
            throw error;
        }
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
