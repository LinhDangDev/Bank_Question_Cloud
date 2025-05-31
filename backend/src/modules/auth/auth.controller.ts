import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AssignRoleDto, TokenResponseDto } from '../../dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
        return this.authService.login(loginDto);
    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('assign-role')
    async assignRole(@Body() assignRoleDto: AssignRoleDto) {
        return this.authService.assignRole(assignRoleDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }
}
