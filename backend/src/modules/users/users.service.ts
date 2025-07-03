import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../../dto/user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findAll(): Promise<User[]> {
        // Return all users with password excluded
        const users = await this.userRepository.find({
            select: [
                'MaNguoiDung', 'TenDangNhap', 'Email', 'HoTen', 'NgayTao', 'DaXoa',
                'BiKhoa', 'NgayHoatDongCuoi', 'NgayDangNhapCuoi', 'LaNguoiDungHeThong', 'MaKhoa'
            ],
            relations: ['Khoa']
        });

        return users;
    }

    async findOne(id: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { MaNguoiDung: id },
            select: [
                'MaNguoiDung', 'TenDangNhap', 'Email', 'HoTen', 'NgayTao', 'DaXoa',
                'BiKhoa', 'NgayHoatDongCuoi', 'NgayDangNhapCuoi', 'LaNguoiDungHeThong', 'MaKhoa'
            ],
            relations: ['Khoa']
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        // Check if user already exists
        const existingUser = await this.userRepository.findOne({
            where: [
                { TenDangNhap: createUserDto.TenDangNhap },
                { Email: createUserDto.Email }
            ]
        });

        if (existingUser) {
            throw new BadRequestException('Username or email already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(createUserDto.MatKhau, salt);

        // Create user with explicit values for non-nullable fields
        const user = this.userRepository.create({
            ...createUserDto,
            MaNguoiDung: uuidv4(),
            MatKhau: hashedPassword,
            MuoiMatKhau: salt,
            NgayTao: new Date(),
            DaXoa: createUserDto.DaXoa !== undefined ? createUserDto.DaXoa : false,
            BiKhoa: createUserDto.BiKhoa !== undefined ? createUserDto.BiKhoa : false,
            CanDoiMatKhau: createUserDto.CanDoiMatKhau !== undefined ? createUserDto.CanDoiMatKhau : true,
            LaNguoiDungHeThong: createUserDto.LaNguoiDungHeThong !== undefined ? createUserDto.LaNguoiDungHeThong : false
        });

        // Save user and return without password
        const savedUser = await this.userRepository.save(user);

        // Create a new object without sensitive data
        const { MatKhau, MuoiMatKhau, ...userWithoutSensitiveData } = savedUser;

        return userWithoutSensitiveData as User;
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        // Check if user exists
        const user = await this.userRepository.findOne({ where: { MaNguoiDung: id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // Check if email or login name is already taken by another user
        if (updateUserDto.Email !== user.Email || updateUserDto.TenDangNhap !== user.TenDangNhap) {
            const existingUser = await this.userRepository.findOne({
                where: [
                    { TenDangNhap: updateUserDto.TenDangNhap },
                    { Email: updateUserDto.Email }
                ]
            });

            if (existingUser && existingUser.MaNguoiDung !== id) {
                throw new BadRequestException('Username or email already exists');
            }
        }

        // Update user data
        const updateData: any = { ...updateUserDto };

        // Hash password if provided
        if (updateUserDto.MatKhau) {
            const salt = await bcrypt.genSalt();
            updateData.MatKhau = await bcrypt.hash(updateUserDto.MatKhau, salt);
            updateData.MuoiMatKhau = salt;
        } else {
            // Remove password from update data if not provided
            delete updateData.MatKhau;
        }

        await this.userRepository.update(id, updateData);

        // Return updated user without password
        const updatedUser = await this.userRepository.findOne({
            where: { MaNguoiDung: id },
            select: [
                'MaNguoiDung', 'TenDangNhap', 'Email', 'HoTen', 'NgayTao', 'DaXoa',
                'BiKhoa', 'NgayHoatDongCuoi', 'NgayDangNhapCuoi', 'LaNguoiDungHeThong', 'MaKhoa'
            ],
            relations: ['Khoa']
        });

        return updatedUser as User;
    }

    async remove(id: string): Promise<void> {
        const result = await this.userRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    }

    async changeStatus(id: string, active: boolean): Promise<User> {
        const user = await this.userRepository.findOne({ where: { MaNguoiDung: id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // Update the IsDeleted field (inverted from active)
        await this.userRepository.update(id, { DaXoa: !active });

        // Return updated user
        return this.findOne(id);
    }

    async changePassword(id: string, password: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { MaNguoiDung: id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // Hash the new password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user password
        await this.userRepository.update(id, {
            MatKhau: hashedPassword,
            MuoiMatKhau: salt,
            NgayDoiMatKhauCuoi: new Date(),
            CanDoiMatKhau: false
        });

        // Return updated user
        return this.findOne(id);
    }

    /**
     * Handle first-time password change with current password validation
     */
    async firstTimePasswordChange(id: string, newPassword: string, currentPassword: string): Promise<User> {
        // Get the user with password
        const user = await this.userRepository.findOne({
            where: { MaNguoiDung: id },
            select: ['MaNguoiDung', 'MatKhau', 'CanDoiMatKhau']
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // Verify that the user needs to change password
        if (!user.CanDoiMatKhau) {
            throw new BadRequestException('Password change not required for this user');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.MatKhau);
        if (!isPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        // Hash the new password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user password
        await this.userRepository.update(id, {
            MatKhau: hashedPassword,
            MuoiMatKhau: salt,
            NgayDoiMatKhauCuoi: new Date(),
            CanDoiMatKhau: false
        });

        // Return updated user without password
        return this.findOne(id);
    }

    async importUsers(users: CreateUserDto[]): Promise<{ success: number; failed: number; errors: string[] }> {
        const result = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const userData of users) {
            try {
                await this.create(userData);
                result.success++;
            } catch (error) {
                result.failed++;
                result.errors.push(`User ${userData.HoTen} (${userData.Email}): ${error.message}`);
            }
        }

        return result;
    }

    /**
     * Check if a username is already taken
     * @param username The username to check
     * @returns True if the username is already taken, false otherwise
     */
    async isUsernameTaken(username: string): Promise<boolean> {
        const existingUser = await this.userRepository.findOne({
            where: { TenDangNhap: username }
        });

        return !!existingUser;
    }
}
