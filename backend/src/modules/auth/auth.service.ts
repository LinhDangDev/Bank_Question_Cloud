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

        const user = await this.userRepository.findOne({ where: { TenDangNhap: loginName } });

        if (!user || !user.MatKhau) {
            return null;
        }

        try {
            const isPasswordValid = await bcrypt.compare(password, user.MatKhau);
            if (isPasswordValid) {
                const { MatKhau, MuoiMatKhau, ...result } = user;
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

        if (user.BiKhoa) {
            throw new UnauthorizedException('Account is locked');
        }

        if (user.DaXoa) {
            throw new UnauthorizedException('Account is deleted');
        }

        // Update last login date
        await this.userRepository.update(user.MaNguoiDung, {
            NgayDangNhapCuoi: new Date(),
            NgayHoatDongCuoi: new Date()
        });

        // Xác định role dựa trên LaNguoiDungHeThong
        let userRole = 'teacher'; // Default role cho non-admin
        if (user.LaNguoiDungHeThong) {
            userRole = 'admin';
        }

        const payload = {
            sub: user.MaNguoiDung,
            loginName: user.TenDangNhap,
            email: user.Email,
            name: user.HoTen,
            role: userRole,
            IsBuildInUser: user.LaNguoiDungHeThong,
            needChangePassword: user.CanDoiMatKhau
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                userId: user.MaNguoiDung,
                loginName: user.TenDangNhap,
                email: user.Email,
                name: user.HoTen,
                role: userRole,
                IsBuildInUser: user.LaNguoiDungHeThong,
                needChangePassword: user.CanDoiMatKhau
            }
        };
    }

    async register(registerDto: RegisterDto): Promise<User> {
        const existingUser = await this.userRepository.findOne({
            where: [
                { TenDangNhap: registerDto.loginName },
                { Email: registerDto.email }
            ]
        });

        if (existingUser) {
            throw new BadRequestException('Username or email already exists');
        }

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(registerDto.password, salt);

        const user = this.userRepository.create({
            TenDangNhap: registerDto.loginName,
            Email: registerDto.email,
            HoTen: registerDto.name,
            MatKhau: hashedPassword,
            MuoiMatKhau: salt,
            NgayTao: new Date(),
            LaNguoiDungHeThong: false
        });

        return this.userRepository.save(user);
    }

    async assignRole(assignRoleDto: AssignRoleDto): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { MaNguoiDung: assignRoleDto.userId }
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Only allow assigning admin role to build-in users
        if (assignRoleDto.role === 'admin' && !user.LaNguoiDungHeThong) {
            throw new BadRequestException('Cannot assign admin role to non-build-in users');
        }

        user.LaNguoiDungHeThong = assignRoleDto.role === 'admin';
        return this.userRepository.save(user);
    }

    async validateToken(token: string) {
        try {
            const payload = this.jwtService.verify(token);
            const user = await this.userRepository.findOne({ where: { MaNguoiDung: payload.sub } });
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
            const user = await this.userRepository.findOne({ where: { MaNguoiDung: userId } });

            if (!user) {
                throw new BadRequestException('User not found');
            }

            if (user.LaNguoiDungHeThong) {
                throw new BadRequestException('Cannot force logout an admin user');
            }

            // Update last activity date to invalidate token
            // We use a past date to ensure token is invalid
            await this.userRepository.update(userId, {
                NgayHoatDongCuoi: new Date(2000, 1, 1)
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

    async getDetailedProfile(userId: string) {
        try {
            const user = await this.userRepository.findOne({
                where: { MaNguoiDung: userId },
                relations: ['Khoa'],
                select: [
                    'MaNguoiDung',
                    'TenDangNhap',
                    'HoTen',
                    'Email',
                    'LaNguoiDungHeThong',
                    'MaKhoa',
                    'DaXoa',
                    'NgayTao',
                    'NgayHoatDongCuoi'
                ]
            });

            if (!user) {
                throw new BadRequestException('User not found');
            }

            return {
                userId: user.MaNguoiDung,
                loginName: user.TenDangNhap,
                hoTen: user.HoTen,
                email: user.Email,
                role: user.LaNguoiDungHeThong ? 'admin' : 'teacher',
                khoa: user.Khoa ? {
                    maKhoa: user.Khoa.MaKhoa,
                    tenKhoa: user.Khoa.TenKhoa
                } : null,
                isActive: !user.DaXoa,
                createdDate: user.NgayTao,
                lastActivityDate: user.NgayHoatDongCuoi
            };
        } catch (error) {
            throw new BadRequestException('Failed to get user profile');
        }
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        try {
            const user = await this.userRepository.findOne({
                where: { MaNguoiDung: userId }
            });

            if (!user) {
                throw new BadRequestException('User not found');
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.MatKhau);
            if (!isCurrentPasswordValid) {
                throw new BadRequestException('Current password is incorrect');
            }

            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            await this.userRepository.update(userId, {
                MatKhau: hashedNewPassword,
                NgayHoatDongCuoi: new Date()
            });

            return {
                success: true,
                message: 'Password changed successfully'
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to change password');
        }
    }
}
