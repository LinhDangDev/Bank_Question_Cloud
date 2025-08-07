import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Res,
    HttpException,
    HttpStatus,
    Logger,
    BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ExamWordExportService, ExamWordExportOptions } from './exam-word-export.service';
import { PythonExamWordExportService, PythonExportOptions } from '../../services/python-exam-word-export.service';

import { IsOptional, IsString, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class StudentInfoDto {
    @IsOptional()
    @IsString()
    studentId?: string;

    @IsOptional()
    @IsString()
    studentName?: string;

    @IsOptional()
    @IsString()
    className?: string;
}

export class ExamWordExportRequestDto {
    @IsOptional()
    @IsString()
    examTitle?: string;

    @IsOptional()
    @IsString()
    subject?: string;

    @IsOptional()
    @IsString()
    course?: string;

    @IsOptional()
    @IsString()
    semester?: string;

    @IsOptional()
    @IsString()
    academicYear?: string;

    @IsOptional()
    @IsString()
    examDate?: string;

    @IsOptional()
    @IsString()
    duration?: string;

    @IsOptional()
    @IsString()
    instructions?: string;

    @IsOptional()
    @IsBoolean()
    allowMaterials?: boolean;

    @IsOptional()
    @IsBoolean()
    showAnswers?: boolean;

    @IsOptional()
    @IsBoolean()
    separateAnswerSheet?: boolean;

    @IsOptional()
    @ValidateNested()
    @Type(() => StudentInfoDto)
    studentInfo?: StudentInfoDto;
}

/**
 * Controller for exporting exams to Word documents with custom headers
 * Author: Linh Dang Dev
 */
@ApiTags('Exam Word Export')
@Controller('exam-word-export')
export class ExamWordExportController {
    private readonly logger = new Logger(ExamWordExportController.name);

    constructor(
        private readonly examWordExportService: ExamWordExportService,
        private readonly pythonExamWordExportService: PythonExamWordExportService,
    ) { }

    /**
     * Get default export options for an exam
     */
    @Get(':examId/default-options')
    @ApiOperation({
        summary: 'Lấy thông tin mặc định cho xuất Word',
        description: 'API để lấy thông tin mặc định của đề thi để điền vào form xuất Word'
    })
    @ApiParam({
        name: 'examId',
        description: 'Mã đề thi',
        example: '6A429A3A-97AB-4043-8F8A-476BEDB7476B'
    })
    @ApiResponse({
        status: 200,
        description: 'Lấy thông tin mặc định thành công'
    })
    async getDefaultOptions(@Param('examId') examId: string) {
        try {
            this.logger.log(`Getting default export options for exam: ${examId}`);

            if (!examId || examId.trim() === '') {
                throw new BadRequestException('Mã đề thi không được để trống');
            }

            const defaultOptions = await this.examWordExportService.getDefaultExportOptions(examId);

            return {
                success: true,
                message: 'Lấy thông tin mặc định thành công',
                data: defaultOptions
            };

        } catch (error) {
            this.logger.error(`Error getting default options: ${error.message}`, error.stack);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new HttpException({
                success: false,
                message: 'Lỗi khi lấy thông tin mặc định',
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Export exam to Word using Python (recommended)
     */
    @Post(':examId/export-python')
    @ApiOperation({
        summary: 'Xuất đề thi ra file Word bằng Python (khuyến nghị)',
        description: 'API để xuất đề thi ra file Word sử dụng Python với định dạng tốt hơn'
    })
    @ApiParam({
        name: 'examId',
        description: 'Mã đề thi cần xuất',
        example: 'D5311678-1D22-40A3-8124-D6CDC34512AE'
    })
    async exportToPython(
        @Param('examId') examId: string,
        @Body() options: any,
        @Res() res: Response
    ) {
        try {
            this.logger.log(`Exporting exam ${examId} to Word using Python`);

            if (!examId || examId.trim() === '') {
                throw new BadRequestException('Mã đề thi không được để trống');
            }

            // Export exam using Python
            const buffer = await this.pythonExamWordExportService.exportExamToWord(examId, options);

            // Generate filename
            const examTitle = options.examTitle || 'DeThi';
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const filename = `${examTitle.replace(/\s+/g, '_')}_${timestamp}.docx`;

            // Set response headers
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            this.logger.log(`Successfully exported exam ${examId} using Python: ${filename}`);
            res.send(buffer);

        } catch (error) {
            this.logger.error(`Error exporting exam using Python: ${error.message}`, error.stack);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new HttpException({
                success: false,
                message: 'Lỗi khi xuất file Word bằng Python',
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Export exam to Word with custom header information (original method)
     */
    @Post(':examId/export')
    @ApiOperation({
        summary: 'Xuất đề thi ra file Word với thông tin tùy chỉnh (phương pháp gốc)',
        description: 'API để xuất đề thi ra file Word với thông tin header tùy chỉnh và có thể bao gồm đáp án'
    })
    @ApiParam({
        name: 'examId',
        description: 'Mã đề thi cần xuất',
        example: '6A429A3A-97AB-4043-8F8A-476BEDB7476B'
    })
    @ApiBody({
        type: ExamWordExportRequestDto,
        description: 'Thông tin tùy chỉnh cho việc xuất Word',
        examples: {
            basic: {
                summary: 'Xuất cơ bản',
                value: {
                    examTitle: 'ĐỀ THI CUỐI KỲ MÔN CƠ SỞ DỮ LIỆU',
                    subject: 'Cơ sở dữ liệu',
                    course: 'Khoa CNTT',
                    semester: 'Học kỳ 1',
                    academicYear: '2024-2025',
                    examDate: '15/12/2024',
                    duration: '90 phút',
                    instructions: 'Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.',
                    allowMaterials: false,
                    showAnswers: false,
                    separateAnswerSheet: false
                }
            },
            withAnswers: {
                summary: 'Xuất kèm đáp án',
                value: {
                    examTitle: 'ĐỀ THI CUỐI KỲ MÔN CƠ SỞ DỮ LIỆU',
                    subject: 'Cơ sở dữ liệu',
                    showAnswers: true,
                    separateAnswerSheet: true
                }
            }
        }
    })
    @ApiResponse({
        status: 200,
        description: 'Xuất file Word thành công',
        content: {
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
                schema: {
                    type: 'string',
                    format: 'binary'
                }
            }
        }
    })
    async exportToWord(
        @Param('examId') examId: string,
        @Body() options: ExamWordExportRequestDto,
        @Res() res: Response
    ) {
        try {
            this.logger.log(`Exporting exam ${examId} to Word with custom options`);
            this.logger.log(`Export options: ${JSON.stringify(options)}`);

            if (!examId || examId.trim() === '') {
                throw new BadRequestException('Mã đề thi không được để trống');
            }

            // Export exam to Word
            this.logger.log(`Calling examWordExportService.exportExamToWord...`);
            const buffer = await this.examWordExportService.exportExamToWord(examId, options);
            this.logger.log(`Export service returned buffer of size: ${buffer.length} bytes`);

            // Generate filename
            const examTitle = options.examTitle || 'DeThi';
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const filename = `${examTitle.replace(/\s+/g, '_')}_${timestamp}.docx`;
            this.logger.log(`Generated filename: ${filename}`);

            // Set response headers
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            this.logger.log(`Response headers set, sending buffer...`);
            this.logger.log(`Successfully exported exam ${examId} to Word: ${filename}`);
            res.send(buffer);

        } catch (error) {
            this.logger.error(`Error exporting exam to Word: ${error.message}`, error.stack);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new HttpException({
                success: false,
                message: 'Lỗi khi xuất file Word',
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Preview exam data before export
     */
    @Get(':examId/preview')
    @ApiOperation({
        summary: 'Xem trước dữ liệu đề thi',
        description: 'API để xem trước dữ liệu đề thi trước khi xuất Word'
    })
    @ApiParam({
        name: 'examId',
        description: 'Mã đề thi',
        example: '6A429A3A-97AB-4043-8F8A-476BEDB7476B'
    })
    async previewExam(@Param('examId') examId: string) {
        try {
            this.logger.log(`Previewing exam data for: ${examId}`);

            if (!examId || examId.trim() === '') {
                throw new BadRequestException('Mã đề thi không được để trống');
            }

            const examData = await this.examWordExportService.getExamForWordExport(examId);

            return {
                success: true,
                message: 'Lấy dữ liệu xem trước thành công',
                data: {
                    examTitle: examData.exam.TenDeThi,
                    subject: examData.exam.MonHoc?.TenMonHoc || '',
                    totalQuestions: examData.totalQuestions,
                    questions: examData.questions.slice(0, 3).map((q, index) => ({
                        number: index + 1,
                        content: q.NoiDung?.substring(0, 100) + '...',
                        answerCount: q.DapAn?.length || 0
                    })),
                    hasMoreQuestions: examData.totalQuestions > 3
                }
            };

        } catch (error) {
            this.logger.error(`Error previewing exam: ${error.message}`, error.stack);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new HttpException({
                success: false,
                message: 'Lỗi khi xem trước đề thi',
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get available export templates
     */
    @Get('templates')
    @ApiOperation({
        summary: 'Lấy danh sách template có sẵn',
        description: 'API để lấy danh sách các template Word có sẵn'
    })
    async getAvailableTemplates() {
        try {
            return {
                success: true,
                message: 'Lấy danh sách template thành công',
                data: {
                    templates: [
                        {
                            id: 'standard',
                            name: 'Template chuẩn HUTECH',
                            description: 'Template chuẩn với header đầy đủ thông tin',
                            features: ['Header thông tin', 'Câu hỏi', 'Đáp án tùy chọn']
                        },
                        {
                            id: 'with-answers',
                            name: 'Template kèm đáp án',
                            description: 'Template có phần đáp án riêng biệt',
                            features: ['Header thông tin', 'Câu hỏi', 'Bảng đáp án riêng']
                        }
                    ]
                }
            };

        } catch (error) {
            this.logger.error(`Error getting templates: ${error.message}`, error.stack);

            throw new HttpException({
                success: false,
                message: 'Lỗi khi lấy danh sách template',
                error: error.message
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
