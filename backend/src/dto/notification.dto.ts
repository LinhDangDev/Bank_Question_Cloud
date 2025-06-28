import { IsBoolean, IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
    @ApiProperty({ description: 'User ID to receive notification' })
    @IsUUID()
    UserId: string;

    @ApiProperty({ description: 'Notification title' })
    @IsString()
    Title: string;

    @ApiProperty({ description: 'Notification message' })
    @IsString()
    Message: string;

    @ApiProperty({ description: 'Notification type' })
    @IsString()
    Type: string;

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
    @ApiProperty({ description: 'Notification ID' })
    @IsUUID()
    NotificationId: string;

    @ApiProperty({ description: 'User ID' })
    @IsUUID()
    UserId: string;

    @ApiProperty({ description: 'Notification title' })
    @IsString()
    Title: string;

    @ApiProperty({ description: 'Notification message' })
    @IsString()
    Message: string;

    @ApiProperty({ description: 'Notification type' })
    @IsString()
    Type: string;

    @ApiPropertyOptional({ description: 'Related table name' })
    @IsString()
    @IsOptional()
    RelatedTable?: string;

    @ApiPropertyOptional({ description: 'Related record ID' })
    @IsString()
    @IsOptional()
    RelatedId?: string;

    @ApiProperty({ description: 'Is notification read' })
    @IsBoolean()
    IsRead: boolean;

    @ApiProperty({ description: 'Created date' })
    @IsDate()
    CreatedAt: Date;

    @ApiPropertyOptional({ description: 'Read date' })
    @IsDate()
    @IsOptional()
    ReadAt?: Date;
}

export class MarkAsReadDto {
    @ApiProperty({ description: 'Mark notification as read' })
    @IsBoolean()
    IsRead: boolean;
}
