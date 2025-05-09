import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCLODto {
    @IsString()
    TenCLO: string;

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

export class UpdateCLODto extends CreateCLODto { }

export class CLOResponseDto {
    @IsUUID()
    MaCLO: string;

    @IsString()
    TenCLO: string;

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
