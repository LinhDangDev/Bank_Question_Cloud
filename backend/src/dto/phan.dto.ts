import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsNumber, IsDate } from 'class-validator';

export class CreatePhanDto {
    @IsString()
    @IsNotEmpty()
    TenPhan: string;

    @IsUUID()
    @IsNotEmpty()
    MaMonHoc: string;

    @IsString()
    @IsOptional()
    NoiDung?: string;

    @IsNumber()
    @IsNotEmpty()
    ThuTu: number;

    @IsNumber()
    @IsNotEmpty()
    SoLuongCauHoi: number;

    @IsUUID()
    @IsOptional()
    MaPhanCha?: string;

    @IsNumber()
    @IsOptional()
    MaSoPhan?: number;

    @IsBoolean()
    @IsOptional()
    XoaTamPhan?: boolean;

    @IsBoolean()
    @IsOptional()
    LaCauHoiNhom?: boolean;
}

export class UpdatePhanDto {
    @IsString()
    @IsOptional()
    TenPhan?: string;

    @IsUUID()
    @IsOptional()
    MaMonHoc?: string;

    @IsString()
    @IsOptional()
    NoiDung?: string;

    @IsNumber()
    @IsOptional()
    ThuTu?: number;

    @IsNumber()
    @IsOptional()
    SoLuongCauHoi?: number;

    @IsUUID()
    @IsOptional()
    MaPhanCha?: string;

    @IsNumber()
    @IsOptional()
    MaSoPhan?: number;

    @IsBoolean()
    @IsOptional()
    XoaTamPhan?: boolean;

    @IsBoolean()
    @IsOptional()
    LaCauHoiNhom?: boolean;
}

export class PhanResponseDto {
    @IsUUID()
    MaPhan: string;

    @IsUUID()
    MaMonHoc: string;

    @IsString()
    TenPhan: string;

    @IsString()
    @IsOptional()
    NoiDung?: string;

    @IsNumber()
    ThuTu: number;

    @IsNumber()
    SoLuongCauHoi: number;

    @IsUUID()
    @IsOptional()
    MaPhanCha?: string;

    @IsNumber()
    @IsOptional()
    MaSoPhan?: number;

    @IsBoolean()
    @IsOptional()
    XoaTamPhan?: boolean;

    @IsBoolean()
    LaCauHoiNhom: boolean;

    @IsDate()
    @IsOptional()
    NgayTao?: Date;

    @IsDate()
    @IsOptional()
    NgaySua?: Date;
}
