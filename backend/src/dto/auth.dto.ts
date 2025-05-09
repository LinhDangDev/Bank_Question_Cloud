import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @IsNotEmpty()
    @IsString()
    loginName: string;

    @IsNotEmpty()
    @IsString()
    password: string;
}

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    loginName: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password: string;
}

export class TokenResponseDto {
    access_token: string;
    user: {
        id: string;
        loginName: string;
        email: string;
        name: string;
    };
}
