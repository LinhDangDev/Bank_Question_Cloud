import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class MultimediaFileDto {
    @IsString()
    MaFile: string;

    @IsString()
    TenFile: string;

    @IsNumber()
    LoaiFile: number;

    @IsString()
    CDNUrl: string;

    @IsString()
    PublicUrl: string;
}

export class CauTraLoiIntegrationDto {
    @IsString()
    MaCauTraLoi: string;

    @IsString()
    NoiDung: string;

    @IsString()
    LaDapAn: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => MultimediaFileDto)
    MultimediaFiles?: MultimediaFileDto[];
}

export class CauHoiIntegrationDto {
    @IsString()
    MaCauHoi: string;

    @IsString()
    NoiDung: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CauTraLoiIntegrationDto)
    CauTraLois: CauTraLoiIntegrationDto[];

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => MultimediaFileDto)
    MultimediaFiles?: MultimediaFileDto[];
}

export class PhanIntegrationDto {
    @IsString()
    MaPhan: string;

    @IsString()
    @IsOptional()
    MaPhanCha?: string | null;

    @IsString()
    TenPhan: string;

    @IsString()
    KieuNoiDung: string;

    @IsString()
    @IsOptional()
    NoiDung?: string;

    @IsString()
    SoLuongCauHoi: string;

    @IsString()
    LaCauHoiNhom: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CauHoiIntegrationDto)
    CauHois: CauHoiIntegrationDto[];
}

export class ExamDetailsResponseDto {
    @IsString()
    MaDeThi: string;

    @IsString()
    TenDeThi: string;

    @IsString()
    NgayTao: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PhanIntegrationDto)
    Phans: PhanIntegrationDto[];
}

export class ExamStatusResponseDto {
    @IsString()
    maDeThi: string;

    @IsString()
    trangThai: string; // 'ready', 'processing', 'error'

    @IsBoolean()
    daDuyet: boolean;

    @IsString()
    ngayTao: string;

    @IsString()
    soCauHoi: string;

    @IsString()
    @IsOptional()
    tenDeThi?: string;

    @IsString()
    @IsOptional()
    tenMonHoc?: string;
}

// New DTOs for improved exam details endpoint
export class CauTraLoiNewDto {
    @IsString()
    MaCauTraLoi: string;

    @IsString()
    NoiDung: string;

    @IsString()
    LaDapAn: string; // "true" or "false" as string
}

export class CauHoiNewDto {
    @IsString()
    MaCauHoi: string;

    @IsString()
    NoiDung: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CauTraLoiNewDto)
    CauTraLois: CauTraLoiNewDto[];

    @IsBoolean()
    IsParentQuestion: boolean;

    @IsString()
    @IsOptional()
    MaCauHoiCha?: string;
}

export class PhanNewDto {
    @IsString()
    MaPhan: string;

    @IsString()
    @IsOptional()
    MaPhanCha?: string | null;

    @IsString()
    TenPhan: string;

    @IsString()
    KieuNoiDung: string;

    @IsString()
    NoiDung: string;

    @IsString()
    SoLuongCauHoi: string;

    @IsString()
    LaCauHoiNhom: string; // "true" or "false" as string

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CauHoiNewDto)
    CauHois: CauHoiNewDto[];
}

export class ExamDetailsNewResponseDto {
    @IsString()
    MaDeThi: string;

    @IsString()
    TenDeThi: string;

    @IsString()
    NgayTao: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PhanNewDto)
    Phans: PhanNewDto[];
}

export class ApiResponseDto<T> {
    @IsBoolean()
    success: boolean;

    @IsString()
    @IsOptional()
    message?: string;

    @IsOptional()
    data?: T;

    @IsString()
    @IsOptional()
    error?: string;

    @IsString()
    @IsOptional()
    code?: string;
}
