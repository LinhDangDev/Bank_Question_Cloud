import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsEnum, IsNumber, IsUrl, IsDateString, Min } from 'class-validator';
import { FileType } from '../enums/file-type.enum';

export class CreateFilesDto {
    @ApiPropertyOptional({ description: 'Question ID this file belongs to' })
    @IsUUID('all', { message: 'MaCauHoi must be a valid UUID' })
    @IsOptional()
    MaCauHoi?: string;

    @ApiPropertyOptional({ description: 'Answer ID this file belongs to' })
    @IsUUID('all', { message: 'MaCauTraLoi must be a valid UUID' })
    @IsOptional()
    MaCauTraLoi?: string;

    @ApiProperty({ description: 'File name or path' })
    @IsString()
    TenFile: string;

    @ApiProperty({ description: 'File type', enum: FileType })
    @IsEnum(FileType)
    LoaiFile: FileType;

    // NguoiTao field has been removed as it no longer exists in the database
}

export class UpdateFilesDto {
    @ApiPropertyOptional({ description: 'File name or path' })
    @IsString()
    @IsOptional()
    TenFile?: string;

    @ApiPropertyOptional({ description: 'File type', enum: FileType })
    @IsEnum(FileType)
    @IsOptional()
    LoaiFile?: FileType;

}

export class FilesResponseDto {
    @ApiProperty({ description: 'File ID' })
    @IsUUID()
    MaFile: string;

    @ApiPropertyOptional({ description: 'Question ID this file belongs to' })
    @IsUUID()
    @IsOptional()
    MaCauHoi?: string;

    @ApiPropertyOptional({ description: 'Answer ID this file belongs to' })
    @IsUUID()
    @IsOptional()
    MaCauTraLoi?: string;

    @ApiProperty({ description: 'File name or path' })
    @IsString()
    TenFile: string;

    @ApiProperty({ description: 'File type', enum: FileType })
    @IsEnum(FileType)
    LoaiFile: FileType;

    // Removed fields that don't exist in the database
    // KichThuocFile, NgayTao, NgaySua, NguoiTao
}

export class FileUploadResponseDto extends FilesResponseDto {
    @ApiPropertyOptional({ description: 'Public URL for accessing the file' })
    @IsUrl()
    @IsOptional()
    publicUrl?: string;

    // Add back some fields as non-persistent metadata
    @ApiPropertyOptional({ description: 'File size in bytes (non-persistent)' })
    @IsNumber()
    @IsOptional()
    size?: number;

    @ApiPropertyOptional({ description: 'File MIME type (non-persistent)' })
    @IsString()
    @IsOptional()
    mimetype?: string;

    @ApiPropertyOptional({ description: 'Original file name (non-persistent)' })
    @IsString()
    @IsOptional()
    originalFilename?: string;
}

export class BulkFileOperationDto {
    @ApiProperty({ description: 'Array of file IDs to operate on' })
    @IsUUID('all', { each: true })
    fileIds: string[];
}

export class FileSearchDto {
    @ApiPropertyOptional({ description: 'Question ID to filter by' })
    @IsUUID()
    @IsOptional()
    MaCauHoi?: string;

    @ApiPropertyOptional({ description: 'Answer ID to filter by' })
    @IsUUID()
    @IsOptional()
    MaCauTraLoi?: string;

    @ApiPropertyOptional({ description: 'File type to filter by', enum: FileType })
    @IsEnum(FileType)
    @IsOptional()
    LoaiFile?: FileType;

    @ApiPropertyOptional({ description: 'Search term for file name' })
    @IsString()
    @IsOptional()
    searchTerm?: string;
}
