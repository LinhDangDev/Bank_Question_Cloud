import { IsDate, IsOptional, IsString, IsUUID, IsNumber } from 'class-validator';

export class CreateCLODto {
    @IsString()
    TenCLO: string;

    @IsString()
    @IsOptional()
    MoTa?: string;

    @IsNumber()
    @IsOptional()
    ThuTu?: number;

    @IsUUID()
    @IsOptional()
    MaMonHoc?: string;

    @IsString()
    @IsOptional()
    TrangThai?: string;

    @IsString()
    @IsOptional()
    NguoiTao?: string;
}

export class UpdateCLODto extends CreateCLODto { }

export class CLOResponseDto {
    @IsUUID()
    MaCLO: string;

    @IsString()
    TenCLO: string;

    @IsString()
    @IsOptional()
    MoTa?: string;

    @IsNumber()
    ThuTu: number;

    @IsUUID()
    @IsOptional()
    MaMonHoc?: string;

    @IsOptional()
    XoaTamCLO?: boolean;

    @IsDate()
    @IsOptional()
    NgayTao?: Date;

    @IsDate()
    @IsOptional()
    NgayCapNhat?: Date;

    @IsString()
    @IsOptional()
    TrangThai?: string;

    @IsString()
    @IsOptional()
    NguoiTao?: string;

    @IsString()
    @IsOptional()
    NguoiCapNhat?: string;
}
