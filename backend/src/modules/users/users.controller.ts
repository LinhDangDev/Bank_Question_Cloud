import { Controller, Get, Post, Body, Param, Put, Delete, Patch, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from '../../dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async changeStatus(@Param('id') id: string, @Body('active') active: boolean) {
        return this.usersService.changeStatus(id, active);
    }

    @Patch(':id/password')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async changePassword(@Param('id') id: string, @Body('password') password: string) {
        if (!password || password.length < 6) {
            throw new BadRequestException('Password must be at least 6 characters');
        }
        return this.usersService.changePassword(id, password);
    }

    /**
     * Public endpoint for first-time password change
     * This can be used by any user to change their own password when NeedChangePassword is true
     */
    @Patch('first-time-password/:id')
    @UseGuards(JwtAuthGuard)
    async firstTimePasswordChange(
        @Param('id') id: string,
        @Body('password') password: string,
        @Body('currentPassword') currentPassword: string
    ) {
        if (!password || password.length < 6) {
            throw new BadRequestException('Password must be at least 6 characters');
        }

        if (!currentPassword) {
            throw new BadRequestException('Current password is required');
        }

        return this.usersService.firstTimePasswordChange(id, password, currentPassword);
    }

    @Post('/import')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async importUsers(@Body() users: CreateUserDto[]) {
        if (!users || !Array.isArray(users) || users.length === 0) {
            throw new BadRequestException('Invalid users data');
        }
        return this.usersService.importUsers(users);
    }

    @Get('check-username/:username')
    async checkUsername(@Param('username') username: string) {
        if (!username || username.length < 3) {
            return { available: false, message: 'Username must be at least 3 characters' };
        }

        const exists = await this.usersService.isUsernameTaken(username);
        return { available: !exists };
    }
}
