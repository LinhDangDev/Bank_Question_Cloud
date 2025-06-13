import { IsBoolean, IsOptional, IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKhoaDto {
    @ApiProperty({ description: 'Name of the faculty' })
    @IsString()
    @IsNotEmpty()
    TenKhoa: string;

    @ApiPropertyOptional({ description: 'Soft delete flag' })
    @IsBoolean()
    @IsOptional()
    XoaTamKhoa?: boolean;
}

export class UpdateKhoaDto {
    @ApiPropertyOptional({ description: 'Name of the faculty' })
    @IsString()
    @IsOptional()
    TenKhoa?: string;

    @ApiPropertyOptional({ description: 'Soft delete flag' })
    @IsBoolean()
    @IsOptional()
    XoaTamKhoa?: boolean;
}

export class KhoaResponseDto {
    @ApiProperty({ description: 'Faculty ID' })
    @IsUUID()
    MaKhoa: string;

    @ApiProperty({ description: 'Name of the faculty' })
    @IsString()
    TenKhoa: string;

    @ApiPropertyOptional({ description: 'Soft delete flag' })
    @IsBoolean()
    @IsOptional()
    XoaTamKhoa?: boolean;
}
