import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePhanDto {
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
}

export class UpdatePhanDto extends CreatePhanDto { }

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
}
