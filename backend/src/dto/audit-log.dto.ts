import { IsDate, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditLogDto {
    @ApiProperty({ description: 'Tên bảng được audit' })
    @IsString()
    TenBang: string;

    @ApiProperty({ description: 'Mã bản ghi được audit' })
    @IsString()
    MaBanGhi: string;

    @ApiProperty({ description: 'Hành động thực hiện (INSERT, UPDATE, DELETE)' })
    @IsString()
    HanhDong: string;

    @ApiPropertyOptional({ description: 'Giá trị cũ (JSON string)' })
    @IsString()
    @IsOptional()
    GiaTriCu?: string;

    @ApiPropertyOptional({ description: 'Giá trị mới (JSON string)' })
    @IsString()
    @IsOptional()
    GiaTriMoi?: string;

    @ApiPropertyOptional({ description: 'Mã người dùng thực hiện hành động' })
    @IsUUID()
    @IsOptional()
    MaNguoiDung?: string;

    @ApiPropertyOptional({ description: 'Tên người dùng thực hiện hành động' })
    @IsString()
    @IsOptional()
    TenNguoiDung?: string;

    @ApiPropertyOptional({ description: 'Địa chỉ IP của người dùng' })
    @IsString()
    @IsOptional()
    DiaChiIP?: string;

    @ApiPropertyOptional({ description: 'User agent string' })
    @IsString()
    @IsOptional()
    UserAgent?: string;

    @ApiPropertyOptional({ description: 'Ghi chú bổ sung' })
    @IsString()
    @IsOptional()
    Notes?: string;
}

export class AuditLogResponseDto {
    @ApiProperty({ description: 'Mã nhật ký' })
    @IsNumber()
    MaNhatKy: number;

    @ApiProperty({ description: 'Tên bảng được audit' })
    @IsString()
    TenBang: string;

    @ApiProperty({ description: 'Mã bản ghi được audit' })
    @IsString()
    MaBanGhi: string;

    @ApiProperty({ description: 'Hành động thực hiện' })
    @IsString()
    HanhDong: string;

    @ApiPropertyOptional({ description: 'Giá trị cũ (JSON string)' })
    @IsString()
    @IsOptional()
    GiaTriCu?: string;

    @ApiPropertyOptional({ description: 'Giá trị mới (JSON string)' })
    @IsString()
    @IsOptional()
    GiaTriMoi?: string;

    @ApiPropertyOptional({ description: 'Mã người dùng thực hiện hành động' })
    @IsUUID()
    @IsOptional()
    MaNguoiDung?: string;

    @ApiPropertyOptional({ description: 'Tên người dùng thực hiện hành động' })
    @IsString()
    @IsOptional()
    TenNguoiDung?: string;

    @ApiProperty({ description: 'Thời gian thực hiện' })
    @IsDate()
    ThoiGianThucHien: Date;

    @ApiPropertyOptional({ description: 'Địa chỉ IP của người dùng' })
    @IsString()
    @IsOptional()
    DiaChiIP?: string;

    @ApiPropertyOptional({ description: 'User agent string' })
    @IsString()
    @IsOptional()
    UserAgent?: string;

    @ApiPropertyOptional({ description: 'Additional notes' })
    @IsString()
    @IsOptional()
    Notes?: string;
}

export class AuditLogFilterDto {
    @ApiPropertyOptional({ description: 'Filter by table name' })
    @IsString()
    @IsOptional()
    tableName?: string;

    @ApiPropertyOptional({ description: 'Filter by record ID' })
    @IsString()
    @IsOptional()
    recordId?: string;

    @ApiPropertyOptional({ description: 'Filter by action' })
    @IsString()
    @IsOptional()
    action?: string;

    @ApiPropertyOptional({ description: 'Filter by user ID' })
    @IsUUID()
    @IsOptional()
    userId?: string;

    @ApiPropertyOptional({ description: 'Filter by username' })
    @IsString()
    @IsOptional()
    userName?: string;

    @ApiPropertyOptional({ description: 'Start date for filtering' })
    @IsDate()
    @IsOptional()
    startDate?: Date;

    @ApiPropertyOptional({ description: 'End date for filtering' })
    @IsDate()
    @IsOptional()
    endDate?: Date;

    @ApiPropertyOptional({ description: 'Page number for pagination' })
    @IsNumber()
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({ description: 'Items per page for pagination' })
    @IsNumber()
    @IsOptional()
    limit?: number;
}
