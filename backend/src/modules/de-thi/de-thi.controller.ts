import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Res, StreamableFile } from '@nestjs/common';
import { DeThiService } from './de-thi.service';
import { CreateDeThiDto, UpdateDeThiDto } from '../../dto';
import { DeThi } from '../../entities/de-thi.entity';
import { PaginationDto } from '../../dto/pagination.dto';
import { Response } from 'express';
import { createReadStream } from 'fs';
import * as path from 'path';
import { ExamService } from '../../services/exam.service';

interface ExamPackage {
    examId: string;
    title: string;
    subject: string;
    createdAt: Date;
    questionCount: number;
    questions: any[];
    pdfUrl: string;
    docxUrl: string;
}

interface ExamGenerateRequest {
    maMonHoc: string;
    tenDeThi: string;
    matrix: {
        maPhan: string;
        clo1: number;
        clo2: number;
        clo3: number;
        clo4: number;
        clo5: number;
    }[];
    hoanViDapAn: boolean;
    nguoiTao?: string;
    soLuongDe?: number;
}

@Controller('de-thi')
export class DeThiController {
    constructor(
        private readonly deThiService: DeThiService,
        private readonly examService: ExamService
    ) { }

    @Get()
    async findAll(@Query() paginationDto: PaginationDto) {
        return await this.deThiService.findAll(paginationDto);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.deThiService.findOne(id);
    }

    @Get('mon-hoc/:maMonHoc')
    async findByMaMonHoc(
        @Param('maMonHoc') maMonHoc: string,
        @Query() paginationDto: PaginationDto
    ) {
        return await this.deThiService.findByMaMonHoc(maMonHoc, paginationDto);
    }

    @Post()
    async create(@Body() createDeThiDto: CreateDeThiDto) {
        return await this.deThiService.createDeThi(createDeThiDto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateDeThiDto: UpdateDeThiDto,
    ) {
        return await this.deThiService.updateDeThi(id, updateDeThiDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return await this.deThiService.delete(id);
    }

    @Patch(':id/duyet')
    async duyetDeThi(@Param('id') id: string): Promise<void> {
        return await this.deThiService.duyetDeThi(id);
    }

    @Patch(':id/huy-duyet')
    async huyDuyetDeThi(@Param('id') id: string): Promise<void> {
        return await this.deThiService.huyDuyetDeThi(id);
    }

    /**
     * Get all exam packages for listing
     */
    @Get('packages/all')
    async getAllExamPackages(): Promise<ExamPackage[]> {
        console.log('getAllExamPackages');
        console.log(await this.deThiService.getAllExamPackages());
        return await this.deThiService.getAllExamPackages();
    }

    /**
     * Get a specific exam package with all details
     */
    @Get('packages/:id')
    async getExamPackage(@Param('id') id: string): Promise<ExamPackage> {
        return await this.deThiService.getExamPackage(id);
    }

    /**
     * Download exam as PDF
     */
    @Get(':id/pdf')
    async downloadPdf(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
        const pdfPath = await this.deThiService.getExamPdfPath(id);
        const file = createReadStream(pdfPath);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="exam-${id}.pdf"`,
        });

        return new StreamableFile(file);
    }

    /**
     * Download exam as DOCX
     */
    @Get(':id/docx')
    async downloadDocx(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
        const docxPath = await this.deThiService.getExamDocxPath(id);
        const file = createReadStream(docxPath);

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="exam-${id}.docx"`,
        });

        return new StreamableFile(file);
    }

    /**
     * Generate exam using CLO-based algorithm
     */
    @Post('generate-clo')
    async generateExamWithCLO(@Body() examRequest: ExamGenerateRequest) {
        try {
            const result = await this.examService.generateExam(examRequest);
            return {
                success: true,
                message: 'Exam generated successfully',
                examIds: result.deThiIds,
                pdfUrls: result.pdfPaths,
                docxUrls: result.docxPaths
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to generate exam',
                error: error.toString()
            };
        }
    }
}
