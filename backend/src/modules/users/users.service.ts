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
                'UserId', 'LoginName', 'Email', 'Name', 'DateCreated', 'IsDeleted',
                'IsLockedOut', 'LastActivityDate', 'LastLoginDate', 'IsBuildInUser', 'MaKhoa'
            ],
            relations: ['Khoa']
        });

        return users;
    }

    async findOne(id: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { UserId: id },
            select: [
                'UserId', 'LoginName', 'Email', 'Name', 'DateCreated', 'IsDeleted',
                'IsLockedOut', 'LastActivityDate', 'LastLoginDate', 'IsBuildInUser', 'MaKhoa'
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
                { LoginName: createUserDto.LoginName },
                { Email: createUserDto.Email }
            ]
        });

        if (existingUser) {
            throw new BadRequestException('Username or email already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(createUserDto.Password, salt);

        // Create user with explicit values for non-nullable fields
        const user = this.userRepository.create({
            ...createUserDto,
            UserId: uuidv4(),
            Password: hashedPassword,
            PasswordSalt: salt,
            DateCreated: new Date(),
            IsDeleted: createUserDto.IsDeleted !== undefined ? createUserDto.IsDeleted : false,
            IsLockedOut: createUserDto.IsLockedOut !== undefined ? createUserDto.IsLockedOut : false,
            NeedChangePassword: createUserDto.NeedChangePassword !== undefined ? createUserDto.NeedChangePassword : true,
            IsBuildInUser: createUserDto.IsBuildInUser !== undefined ? createUserDto.IsBuildInUser : false
        });

        // Save user and return without password
        const savedUser = await this.userRepository.save(user);

        // Create a new object without sensitive data
        const { Password, PasswordSalt, ...userWithoutSensitiveData } = savedUser;

        return userWithoutSensitiveData as User;
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        // Check if user exists
        const user = await this.userRepository.findOne({ where: { UserId: id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // Check if email or login name is already taken by another user
        if (updateUserDto.Email !== user.Email || updateUserDto.LoginName !== user.LoginName) {
            const existingUser = await this.userRepository.findOne({
                where: [
                    { LoginName: updateUserDto.LoginName },
                    { Email: updateUserDto.Email }
                ]
            });

            if (existingUser && existingUser.UserId !== id) {
                throw new BadRequestException('Username or email already exists');
            }
        }

        // Update user data
        const updateData: any = { ...updateUserDto };

        // Hash password if provided
        if (updateUserDto.Password) {
            const salt = await bcrypt.genSalt();
            updateData.Password = await bcrypt.hash(updateUserDto.Password, salt);
            updateData.PasswordSalt = salt;
        } else {
            // Remove password from update data if not provided
            delete updateData.Password;
        }

        await this.userRepository.update(id, updateData);

        // Return updated user without password
        const updatedUser = await this.userRepository.findOne({
            where: { UserId: id },
            select: [
                'UserId', 'LoginName', 'Email', 'Name', 'DateCreated', 'IsDeleted',
                'IsLockedOut', 'LastActivityDate', 'LastLoginDate', 'IsBuildInUser', 'MaKhoa'
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
        const user = await this.userRepository.findOne({ where: { UserId: id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // Update the IsDeleted field (inverted from active)
        await this.userRepository.update(id, { IsDeleted: !active });

        // Return updated user
        return this.findOne(id);
    }

    async changePassword(id: string, password: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { UserId: id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // Hash the new password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user password
        await this.userRepository.update(id, {
            Password: hashedPassword,
            PasswordSalt: salt,
            LastPasswordChangedDate: new Date(),
            NeedChangePassword: false
        });

        // Return updated user
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
                result.errors.push(`User ${userData.Name} (${userData.Email}): ${error.message}`);
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
            where: { LoginName: username }
        });

        return !!existingUser;
    }
}
