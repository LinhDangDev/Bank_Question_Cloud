import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export class CreateCauHoiChoDuyetDto {
    @IsUUID()
    @IsOptional()
    MaPhan?: string;

    @IsString()
    @IsOptional()
    MaSoCauHoi?: string;

    @IsString()
    NoiDung: string;

    @IsBoolean()
    @IsOptional()
    HoanVi?: boolean;

    @IsNumber()
    @IsOptional()
    CapDo?: number;

    @IsNumber()
    @IsOptional()
    SoCauHoiCon?: number;

    @IsString()
    @IsOptional()
    DoPhanCachCauHoi?: string;

    @IsUUID()
    @IsOptional()
    MaCauHoiCha?: string;

    @IsUUID()
    @IsOptional()
    MaCLO?: string;

    @IsUUID()
    NguoiTao: string;

    @IsString()
    @IsOptional()
    DuLieuCauTraLoi?: string; // JSON string

    @IsString()
    @IsOptional()
    DuLieuCauHoiCon?: string; // JSON string
}

export class UpdateCauHoiChoDuyetDto {
    @IsString()
    @IsOptional()
    GhiChu?: string;

    @IsNumber()
    @IsOptional()
    TrangThai?: number; // 0: Chờ duyệt, 1: Đã duyệt, 2: Từ chối

    @IsUUID()
    @IsOptional()
    NguoiDuyet?: string;

    @IsDateString()
    @IsOptional()
    NgayDuyet?: Date;
}

export class DuyetCauHoiDto {
    @IsUUID()
    MaCauHoiChoDuyet: string;

    @IsNumber()
    TrangThai: number; // 1: Duyệt, 2: Từ chối

    @IsString()
    @IsOptional()
    GhiChu?: string;

    @IsUUID()
    @IsOptional()
    MaPhan?: string; // Có thể thay đổi phân khi duyệt
}

export class CauHoiChoDuyetResponseDto {
    MaCauHoiChoDuyet: string;
    MaPhan?: string;
    MaSoCauHoi?: string;
    NoiDung: string;
    HoanVi?: boolean;
    CapDo?: number;
    SoCauHoiCon?: number;
    DoPhanCachCauHoi?: string;
    MaCauHoiCha?: string;
    MaCLO?: string;
    NguoiTao: string;
    GhiChu?: string;
    TrangThai: number;
    NguoiDuyet?: string;
    NgayTao?: Date;
    NgayDuyet?: Date;
    DuLieuCauTraLoi?: string;
    DuLieuCauHoiCon?: string;
    
    // Thông tin liên quan
    Teacher?: {
        UserId: string;
        Name: string;
        Email: string;
    };
    Admin?: {
        UserId: string;
        Name: string;
        Email: string;
    };
    Phan?: {
        MaPhan: string;
        TenPhan: string;
    };
    CLO?: {
        MaCLO: string;
        TenCLO: string;
    };
}
