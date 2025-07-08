import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UploadExamPackageDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'ZIP file containing Word document and media files'
    })
    file: any;

    @ApiProperty({
        description: 'Section ID to assign questions to',
        required: false
    })
    @IsOptional()
    @IsString()
    maPhan?: string;

    @ApiProperty({
        description: 'Whether to process images and convert to WebP',
        default: true,
        required: false
    })
    @IsOptional()
    @IsBoolean()
    processImages?: boolean;

    @ApiProperty({
        description: 'Whether to process audio files',
        default: true,
        required: false
    })
    @IsOptional()
    @IsBoolean()
    processAudio?: boolean;

    @ApiProperty({
        description: 'Maximum number of questions to process',
        default: 100,
        required: false
    })
    @IsOptional()
    limit?: number;
}

export class ExamPackageUploadResponseDto {
    @ApiProperty({ description: 'Unique package ID' })
    packageId: string;

    @ApiProperty({ description: 'Number of questions processed' })
    questionCount: number;

    @ApiProperty({ description: 'Number of media files processed' })
    mediaFileCount: number;

    @ApiProperty({ description: 'Number of audio files uploaded' })
    audioFileCount: number;

    @ApiProperty({ description: 'Number of images converted and uploaded' })
    imageFileCount: number;

    @ApiProperty({ description: 'Processing status' })
    status: 'success' | 'partial' | 'failed';

    @ApiProperty({ description: 'Processing errors if any', required: false })
    errors?: string[];

    @ApiProperty({ description: 'Processing warnings if any', required: false })
    warnings?: string[];
}
