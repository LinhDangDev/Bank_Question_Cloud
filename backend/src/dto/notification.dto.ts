import { IsBoolean, IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
    @ApiProperty({ description: 'Mã người dùng nhận thông báo' })
    @IsUUID()
    MaNguoiDung: string;

    @ApiProperty({ description: 'Tiêu đề thông báo' })
    @IsString()
    TieuDe: string;

    @ApiProperty({ description: 'Nội dung thông báo' })
    @IsString()
    NoiDung: string;

    @ApiProperty({ description: 'Loại thông báo' })
    @IsString()
    LoaiThongBao: string;

    @ApiPropertyOptional({ description: 'Tên bảng liên quan' })
    @IsString()
    @IsOptional()
    BangLienQuan?: string;

    @ApiPropertyOptional({ description: 'Mã bản ghi liên quan' })
    @IsString()
    @IsOptional()
    MaLienQuan?: string;

    @ApiPropertyOptional({ description: 'Đã đọc thông báo' })
    @IsBoolean()
    @IsOptional()
    DaDoc?: boolean;
}

export class UpdateNotificationDto {
    @ApiPropertyOptional({ description: 'Notification title' })
    @IsString()
    @IsOptional()
    Title?: string;

    @ApiPropertyOptional({ description: 'Notification message' })
    @IsString()
    @IsOptional()
    Message?: string;

    @ApiPropertyOptional({ description: 'Notification type' })
    @IsString()
    @IsOptional()
    Type?: string;

    @ApiPropertyOptional({ description: 'Related table name' })
    @IsString()
    @IsOptional()
    RelatedTable?: string;

    @ApiPropertyOptional({ description: 'Related record ID' })
    @IsString()
    @IsOptional()
    RelatedId?: string;

    @ApiPropertyOptional({ description: 'Is notification read' })
    @IsBoolean()
    @IsOptional()
    IsRead?: boolean;
}

export class NotificationResponseDto {
    @ApiProperty({ description: 'Mã thông báo' })
    @IsUUID()
    MaThongBao: string;

    @ApiProperty({ description: 'Mã người dùng' })
    @IsUUID()
    MaNguoiDung: string;

    @ApiProperty({ description: 'Tiêu đề thông báo' })
    @IsString()
    TieuDe: string;

    @ApiProperty({ description: 'Nội dung thông báo' })
    @IsString()
    NoiDung: string;

    @ApiProperty({ description: 'Loại thông báo' })
    @IsString()
    LoaiThongBao: string;

    @ApiPropertyOptional({ description: 'Tên bảng liên quan' })
    @IsString()
    @IsOptional()
    BangLienQuan?: string;

    @ApiPropertyOptional({ description: 'Mã bản ghi liên quan' })
    @IsString()
    @IsOptional()
    MaLienQuan?: string;

    @ApiProperty({ description: 'Đã đọc thông báo' })
    @IsBoolean()
    DaDoc: boolean;

    @ApiProperty({ description: 'Ngày tạo' })
    @IsDate()
    NgayTao: Date;

    @ApiPropertyOptional({ description: 'Ngày đọc' })
    @IsDate()
    @IsOptional()
    NgayDoc?: Date;
}

export class MarkAsReadDto {
    @ApiProperty({ description: 'Đánh dấu thông báo đã đọc' })
    @IsBoolean()
    DaDoc: boolean;
}
