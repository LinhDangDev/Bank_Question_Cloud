import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateYeuCauRutTrichDto {
    @IsString()
    TenYeuCau: string;

    @IsString()
    @IsOptional()
    NoiDung?: string;

    @IsString()
    @IsOptional()
    TrangThai?: string;

    @IsString()
    @IsOptional()
    NguoiTao?: string;
}

export class UpdateYeuCauRutTrichDto extends CreateYeuCauRutTrichDto { }

export class YeuCauRutTrichResponseDto {
    @IsUUID()
    MaYeuCau: string;

    @IsString()
    TenYeuCau: string;

    @IsString()
    @IsOptional()
    NoiDung?: string;

    @IsDate()
    NgayTao: Date;

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
