import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Res,
    UseGuards,
    BadRequestException
} from '@nestjs/common';
import { Response } from 'express';
import { ExamExportService, ExamExportOptions } from './exam-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('exam-export')
@UseGuards(JwtAuthGuard)
export class ExamExportController {
    constructor(private readonly examExportService: ExamExportService) { }

    /**
     * Lấy thông tin để hiển thị dialog export
     * GET /exam-export/:examId/dialog
     */
    @Get(':examId/dialog')
    async getExportDialog(@Param('examId') examId: string) {
        return this.examExportService.getExamExportDialog(examId);
    }

    /**
     * Export đề thi ra file Word - Option 1: Direct export
     * POST /exam-export/:examId/word
     */
    @Post(':examId/word')
    async exportToWord(
        @Param('examId') examId: string,
        @Body() options: ExamExportOptions,
        @Res() res: Response
    ) {
        try {
            const buffer = await this.examExportService.exportExamToWord(examId, options);

            const filename = `DeThi_${examId}_${Date.now()}.docx`;

            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length.toString(),
            });

            res.send(buffer);
        } catch (error) {
            throw new BadRequestException(`Export failed: ${error.message}`);
        }
    }

    /**
     * Export đề thi với custom options - Option 2: With dialog
     * POST /exam-export/:examId/word-custom
     */
    @Post(':examId/word-custom')
    async exportToWordCustom(
        @Param('examId') examId: string,
        @Body() body: {
            options: ExamExportOptions;
            customData?: {
                examTitle?: string;
                subject?: string;
                duration?: string;
                semester?: string;
                academicYear?: string;
                allowMaterials?: string;
                additionalInstructions?: string;
            }
        },
        @Res() res: Response
    ) {
        try {
            // Merge custom data vào options
            const mergedOptions: ExamExportOptions = {
                ...body.options,
                ...body.customData
            };

            const buffer = await this.examExportService.exportExamToWord(examId, mergedOptions);

            const filename = `DeThi_${mergedOptions.examTitle || examId}_${Date.now()}.docx`;

            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length.toString(),
            });

            res.send(buffer);
        } catch (error) {
            throw new BadRequestException(`Export failed: ${error.message}`);
        }
    }

    /**
     * Preview export data (for testing)
     * GET /exam-export/:examId/preview
     */
    @Get(':examId/preview')
    async previewExportData(
        @Param('examId') examId: string
    ) {
        // Sử dụng options mặc định để preview
        const defaultOptions: ExamExportOptions = {
            includeAnswers: true,
            includeImages: true,
            includeAudio: false
        };

        // Return data structure thay vì file
        return this.examExportService['getExamData'](examId, defaultOptions);
    }
}
