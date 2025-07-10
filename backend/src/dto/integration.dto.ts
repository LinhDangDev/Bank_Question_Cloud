import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

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

    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    LaDapAn: boolean;

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

    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    KieuNoiDung: number;

    @IsString()
    @IsOptional()
    NoiDung?: string;

    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    SoLuongCauHoi: number;

    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    LaCauHoiNhom: boolean;

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

    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    LaDapAn: boolean; // Convert string to boolean
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

    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    KieuNoiDung: number;

    @IsString()
    NoiDung: string;

    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    SoLuongCauHoi: number;

    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    LaCauHoiNhom: boolean;

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

// DTO for approved exams list to match .NET DeThiMock model
export class ApprovedExamDto {
    @IsString()
    TenDeThi: string;

    @IsString()
    @IsOptional()
    KyHieuDe?: string | undefined;

    @IsString()
    MaDeThi: string; // Maps to Guid in .NET

    @IsString()
    NgayTao: string; // ISO format: 2025-07-08T02:42:01
}
