import { IsBoolean, IsDate, IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserDto {
    @IsString()
    LoginName: string;

    @IsEmail()
    Email: string;

    @IsString()
    Name: string;

    @IsString()
    Password: string;

    @IsBoolean()
    @IsOptional()
    IsDeleted?: boolean;

    @IsBoolean()
    @IsOptional()
    IsLockedOut?: boolean;

    @IsString()
    @IsOptional()
    PasswordSalt?: string;

    @IsString()
    @IsOptional()
    Comment?: string;

    @IsBoolean()
    IsBuildInUser: boolean;
}

export class UpdateUserDto extends CreateUserDto { }

export class UserResponseDto {
    @IsUUID()
    UserId: string;

    @IsString()
    LoginName: string;

    @IsEmail()
    Email: string;

    @IsString()
    Name: string;

    @IsDate()
    DateCreated: Date;

    @IsBoolean()
    IsDeleted: boolean;

    @IsBoolean()
    IsLockedOut: boolean;

    @IsDate()
    @IsOptional()
    LastActivityDate?: Date;

    @IsDate()
    @IsOptional()
    LastLoginDate?: Date;

    @IsDate()
    @IsOptional()
    LastPasswordChangedDate?: Date;

    @IsDate()
    @IsOptional()
    LastLockoutDate?: Date;

    @IsOptional()
    FailedPwdAttemptCount?: number;

    @IsDate()
    @IsOptional()
    FailedPwdAttemptWindowStart?: Date;

    @IsOptional()
    FailedPwdAnswerCount?: number;

    @IsDate()
    @IsOptional()
    FailedPwdAnswerWindowStart?: Date;

    @IsString()
    @IsOptional()
    PasswordSalt?: string;

    @IsString()
    @IsOptional()
    Comment?: string;

    @IsBoolean()
    IsBuildInUser: boolean;
}
