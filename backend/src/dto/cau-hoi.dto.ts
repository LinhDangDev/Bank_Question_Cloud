import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCauTraLoiDto } from './cau-tra-loi.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCauHoiDto {
    @ApiProperty({ description: 'ID of the section this question belongs to' })
    @IsUUID()
    MaPhan: string;

    @ApiProperty({ description: 'Question number' })
    @IsNumber()
    MaSoCauHoi: number;

    @ApiPropertyOptional({ description: 'Question content' })
    @IsString()
    @IsOptional()
    NoiDung?: string;

    @ApiProperty({ description: 'Whether to shuffle the question' })
    @IsBoolean()
    HoanVi: boolean;

    @ApiProperty({ description: 'Difficulty level of the question' })
    @IsNumber()
    CapDo: number;

    @ApiProperty({ description: 'Number of child questions' })
    @IsNumber()
    SoCauHoiCon: number;

    @ApiPropertyOptional({ description: 'Question spacing' })
    @IsNumber()
    @IsOptional()
    DoPhanCachCauHoi?: number;

    @ApiPropertyOptional({ description: 'Parent question ID' })
    @IsUUID()
    @IsOptional()
    MaCauHoiCha?: string;

    @ApiPropertyOptional({ description: 'Soft delete flag' })
    @IsBoolean()
    @IsOptional()
    XoaTamCauHoi?: boolean;

    @ApiPropertyOptional({ description: 'Number of times the question has been used in exams' })
    @IsNumber()
    @IsOptional()
    SoLanDuocThi?: number;

    @ApiPropertyOptional({ description: 'Number of times the question was answered correctly' })
    @IsNumber()
    @IsOptional()
    SoLanDung?: number;

    @ApiPropertyOptional({ description: 'CLO ID' })
    @IsUUID()
    @IsOptional()
    MaCLO?: string;
}

export class UpdateCauHoiDto extends CreateCauHoiDto { }

export class CreateQuestionWithAnswersDto {
    @ApiProperty({ description: 'Question data', type: CreateCauHoiDto })
    @ValidateNested()
    @Type(() => CreateCauHoiDto)
    question: CreateCauHoiDto;

    @ApiProperty({ description: 'Answers for the question', type: [CreateCauTraLoiDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCauTraLoiDto)
    answers: CreateCauTraLoiDto[];
}

export class UpdateQuestionWithAnswersDto {
    @ApiProperty({ description: 'Question data to update', type: UpdateCauHoiDto })
    @ValidateNested()
    @Type(() => UpdateCauHoiDto)
    question: UpdateCauHoiDto;

    @ApiProperty({ description: 'Updated answers for the question', type: [CreateCauTraLoiDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCauTraLoiDto)
    answers: CreateCauTraLoiDto[];
}

export class CauHoiResponseDto {
    @ApiProperty({ description: 'Question ID' })
    @IsUUID()
    MaCauHoi: string;

    @ApiProperty({ description: 'Section ID' })
    @IsUUID()
    MaPhan: string;

    @ApiProperty({ description: 'Question number' })
    @IsNumber()
    MaSoCauHoi: number;

    @ApiPropertyOptional({ description: 'Question content' })
    @IsString()
    @IsOptional()
    NoiDung?: string;

    @ApiProperty({ description: 'Whether to shuffle the question' })
    @IsBoolean()
    HoanVi: boolean;

    @ApiProperty({ description: 'Difficulty level of the question' })
    @IsNumber()
    CapDo: number;

    @ApiProperty({ description: 'Number of child questions' })
    @IsNumber()
    SoCauHoiCon: number;

    @ApiPropertyOptional({ description: 'Question spacing' })
    @IsNumber()
    @IsOptional()
    DoPhanCachCauHoi?: number;

    @ApiPropertyOptional({ description: 'Parent question ID' })
    @IsUUID()
    @IsOptional()
    MaCauHoiCha?: string;

    @ApiPropertyOptional({ description: 'Soft delete flag' })
    @IsBoolean()
    @IsOptional()
    XoaTamCauHoi?: boolean;

    @ApiPropertyOptional({ description: 'Number of times the question has been used in exams' })
    @IsNumber()
    @IsOptional()
    SoLanDuocThi?: number;

    @ApiPropertyOptional({ description: 'Number of times the question was answered correctly' })
    @IsNumber()
    @IsOptional()
    SoLanDung?: number;

    @ApiPropertyOptional({ description: 'Creation date' })
    @IsDate()
    @IsOptional()
    NgayTao?: Date;

    @ApiPropertyOptional({ description: 'Last update date' })
    @IsDate()
    @IsOptional()
    NgaySua?: Date;

    @ApiPropertyOptional({ description: 'CLO ID' })
    @IsUUID()
    @IsOptional()
    MaCLO?: string;
}
