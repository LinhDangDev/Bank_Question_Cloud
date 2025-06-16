import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsDate } from 'class-validator';

export class CreateMonHocDto {
    @IsString()
    @IsNotEmpty()
    TenMonHoc: string;

    @IsString()
    @IsNotEmpty()
    MaSoMonHoc: string;

    @IsUUID()
    @IsNotEmpty()
    MaKhoa: string;

    @IsBoolean()
    @IsOptional()
    XoaTamMonHoc?: boolean;
}

export class UpdateMonHocDto {
    @IsString()
    @IsOptional()
    TenMonHoc?: string;

    @IsString()
    @IsOptional()
    MaSoMonHoc?: string;

    @IsUUID()
    @IsOptional()
    MaKhoa?: string;

    @IsBoolean()
    @IsOptional()
    XoaTamMonHoc?: boolean;
}

export class MonHocResponseDto {
    @IsUUID()
    MaMonHoc: string;

    @IsUUID()
    MaKhoa: string;

    @IsString()
    MaSoMonHoc: string;

    @IsString()
    TenMonHoc: string;

    @IsBoolean()
    @IsOptional()
    XoaTamMonHoc?: boolean;

    @IsDate()
    @IsOptional()
    NgayTao?: Date;

    @IsDate()
    @IsOptional()
    NgaySua?: Date;
}
