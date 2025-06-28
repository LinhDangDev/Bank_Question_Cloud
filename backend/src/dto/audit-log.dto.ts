import { IsDate, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditLogDto {
    @ApiProperty({ description: 'Table name being audited' })
    @IsString()
    TableName: string;

    @ApiProperty({ description: 'Record ID being audited' })
    @IsString()
    RecordId: string;

    @ApiProperty({ description: 'Action performed (INSERT, UPDATE, DELETE)' })
    @IsString()
    Action: string;

    @ApiPropertyOptional({ description: 'Old values (JSON string)' })
    @IsString()
    @IsOptional()
    OldValues?: string;

    @ApiPropertyOptional({ description: 'New values (JSON string)' })
    @IsString()
    @IsOptional()
    NewValues?: string;

    @ApiPropertyOptional({ description: 'User ID who performed the action' })
    @IsUUID()
    @IsOptional()
    UserId?: string;

    @ApiPropertyOptional({ description: 'Username who performed the action' })
    @IsString()
    @IsOptional()
    UserName?: string;

    @ApiPropertyOptional({ description: 'IP address of the user' })
    @IsString()
    @IsOptional()
    IPAddress?: string;

    @ApiPropertyOptional({ description: 'User agent string' })
    @IsString()
    @IsOptional()
    UserAgent?: string;

    @ApiPropertyOptional({ description: 'Additional notes' })
    @IsString()
    @IsOptional()
    Notes?: string;
}

export class AuditLogResponseDto {
    @ApiProperty({ description: 'Log ID' })
    @IsNumber()
    LogId: number;

    @ApiProperty({ description: 'Table name being audited' })
    @IsString()
    TableName: string;

    @ApiProperty({ description: 'Record ID being audited' })
    @IsString()
    RecordId: string;

    @ApiProperty({ description: 'Action performed' })
    @IsString()
    Action: string;

    @ApiPropertyOptional({ description: 'Old values (JSON string)' })
    @IsString()
    @IsOptional()
    OldValues?: string;

    @ApiPropertyOptional({ description: 'New values (JSON string)' })
    @IsString()
    @IsOptional()
    NewValues?: string;

    @ApiPropertyOptional({ description: 'User ID who performed the action' })
    @IsUUID()
    @IsOptional()
    UserId?: string;

    @ApiPropertyOptional({ description: 'Username who performed the action' })
    @IsString()
    @IsOptional()
    UserName?: string;

    @ApiProperty({ description: 'Timestamp of the action' })
    @IsDate()
    Timestamp: Date;

    @ApiPropertyOptional({ description: 'IP address of the user' })
    @IsString()
    @IsOptional()
    IPAddress?: string;

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
