import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, IsArray, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCauTraLoiDto } from './cau-tra-loi.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCauHoiDto {
    @ApiProperty({ description: 'ID of the section this question belongs to' })
    @IsUUID('all', { message: 'MaPhan phải là một UUID hợp lệ' })
    MaPhan: string;

    @ApiPropertyOptional({ description: 'Question number' })
    @IsNumber({}, { message: 'MaSoCauHoi phải là một số nguyên' })
    @Min(1, { message: 'MaSoCauHoi phải lớn hơn hoặc bằng 1' })
    @IsOptional()
    MaSoCauHoi?: number;

    @ApiProperty({ description: 'Question content' })
    @IsString({ message: 'NoiDung phải là một chuỗi' })
    @IsNotEmpty({ message: 'NoiDung không được để trống' })
    NoiDung: string;

    @ApiProperty({ description: 'Whether to shuffle the question' })
    @IsBoolean({ message: 'HoanVi phải là kiểu boolean' })
    HoanVi: boolean;

    @ApiProperty({ description: 'Difficulty level of the question' })
    @IsNumber({}, { message: 'CapDo phải là một số nguyên' })
    @Min(1, { message: 'CapDo phải lớn hơn hoặc bằng 1' })
    CapDo: number;

    @ApiPropertyOptional({ description: 'Number of child questions' })
    @IsNumber({}, { message: 'SoCauHoiCon phải là một số nguyên' })
    @Min(0, { message: 'SoCauHoiCon không được nhỏ hơn 0' })
    @IsOptional()
    SoCauHoiCon?: number;

    @ApiPropertyOptional({ description: 'Question spacing' })
    @IsNumber({}, { message: 'DoPhanCachCauHoi phải là một số' })
    @IsOptional()
    DoPhanCachCauHoi?: number;

    @ApiPropertyOptional({ description: 'Parent question ID' })
    @IsUUID('all', { message: 'MaCauHoiCha phải là một UUID hợp lệ' })
    @IsOptional()
    MaCauHoiCha?: string;

    @ApiPropertyOptional({ description: 'Soft delete flag' })
    @IsBoolean({ message: 'XoaTamCauHoi phải là kiểu boolean' })
    @IsOptional()
    XoaTamCauHoi?: boolean;

    @ApiPropertyOptional({ description: 'Number of times the question has been used in exams' })
    @IsNumber({}, { message: 'SoLanDuocThi phải là một số nguyên' })
    @IsOptional()
    SoLanDuocThi?: number;

    @ApiPropertyOptional({ description: 'Number of times the question was answered correctly' })
    @IsNumber({}, { message: 'SoLanDung phải là một số nguyên' })
    @IsOptional()
    SoLanDung?: number;

    @ApiPropertyOptional({ description: 'CLO ID' })
    @IsUUID('all', { message: 'MaCLO phải là một UUID hợp lệ' })
    @IsOptional()
    MaCLO?: string;

    @ApiPropertyOptional({ description: 'Real difficulty level based on statistics' })
    @IsNumber({}, { message: 'DoKhoThucTe phải là một số' })
    @IsOptional()
    DoKhoThucTe?: number;

    @ApiPropertyOptional({ description: 'Creator user ID' })
    @IsUUID('all', { message: 'NguoiTao phải là một UUID hợp lệ' })
    @IsOptional()
    NguoiTao?: string;
}

export class UpdateCauHoiDto extends CreateCauHoiDto { }

export class CreateQuestionWithAnswersDto {
    @ApiProperty({ description: 'Question data', type: CreateCauHoiDto })
    @ValidateNested({ message: 'Câu hỏi không đúng định dạng' })
    @Type(() => CreateCauHoiDto)
    question: CreateCauHoiDto;

    @ApiProperty({ description: 'Answers for the question', type: [CreateCauTraLoiDto] })
    @IsArray({ message: 'Danh sách câu trả lời phải là một mảng' })
    @ValidateNested({ each: true, message: 'Câu trả lời không đúng định dạng' })
    @Type(() => CreateCauTraLoiDto)
    answers: CreateCauTraLoiDto[];
}

export class UpdateQuestionWithAnswersDto {
    @ApiProperty({ description: 'Question data to update', type: UpdateCauHoiDto })
    @ValidateNested({ message: 'Câu hỏi không đúng định dạng' })
    @Type(() => UpdateCauHoiDto)
    question: UpdateCauHoiDto;

    @ApiProperty({ description: 'Updated answers for the question', type: [CreateCauTraLoiDto] })
    @IsArray({ message: 'Danh sách câu trả lời phải là một mảng' })
    @ValidateNested({ each: true, message: 'Câu trả lời không đúng định dạng' })
    @Type(() => CreateCauTraLoiDto)
    answers: CreateCauTraLoiDto[];
}

export class CreateGroupQuestionDto {
    @ApiProperty({ description: 'Parent question data', type: CreateCauHoiDto })
    @ValidateNested({ message: 'Câu hỏi cha không đúng định dạng' })
    @Type(() => CreateCauHoiDto)
    parentQuestion: CreateCauHoiDto;

    @ApiProperty({ description: 'Child questions with their answers', type: [CreateQuestionWithAnswersDto] })
    @IsArray({ message: 'Danh sách câu hỏi con phải là một mảng' })
    @ValidateNested({ each: true, message: 'Câu hỏi con không đúng định dạng' })
    @Type(() => CreateQuestionWithAnswersDto)
    childQuestions: CreateQuestionWithAnswersDto[];
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

    @ApiPropertyOptional({ description: 'Real difficulty level based on statistics' })
    @IsNumber()
    @IsOptional()
    DoKhoThucTe?: number;
}
