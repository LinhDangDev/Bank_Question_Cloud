import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateKhoaDto {
    @IsString()
    TenKhoa: string;

    @IsBoolean()
    @IsOptional()
    XoaTamKhoa?: boolean;
}

export class UpdateKhoaDto extends CreateKhoaDto { }

export class KhoaResponseDto {
    @IsUUID()
    MaKhoa: string;

    @IsString()
    TenKhoa: string;

    @IsBoolean()
    @IsOptional()
    XoaTamKhoa?: boolean;
}
