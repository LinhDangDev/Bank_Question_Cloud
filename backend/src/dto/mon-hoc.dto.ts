import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMonHocDto {
    @IsUUID()
    MaKhoa: string;

    @IsString()
    MaSoMonHoc: string;

    @IsString()
    TenMonHoc: string;

    @IsBoolean()
    @IsOptional()
    XoaTamMonHoc?: boolean;
}

export class UpdateMonHocDto extends CreateMonHocDto { }

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
}
