import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    loginName: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    loginName: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}

export class AssignRoleDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    role: string;
}

export class TokenResponseDto {
    access_token: string;
    user: {
        userId: string;
        loginName: string;
        email: string;
        name: string;
        role: string;
        IsBuildInUser: boolean;
        needChangePassword?: boolean;
    };
}
