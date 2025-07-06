import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Res, StreamableFile, HttpCode, BadRequestException, InternalServerErrorException, Logger, HttpException, HttpStatus, UseGuards, UploadedFile, UseInterceptors, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DeThiService } from './de-thi.service';
import { CreateDeThiDto, UpdateDeThiDto } from '../../dto';
import { DeThi } from '../../entities/de-thi.entity';
import { PaginationDto } from '../../dto/pagination.dto';
import { Response } from 'express';
import { createReadStream } from 'fs';
import * as path from 'path';
import { ExamService } from '../../services/exam.service';
import { NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { diskStorage } from 'multer';
import * as fs from 'fs';

interface ExamPackage {
    examId: string;
    title: string;
    subject: string;
    createdAt: Date;
    questionCount: number;
    questions: any[];
    pdfUrl: string;
    docxUrl: string;
    creator?: string;
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
    loaiBoChuongPhan?: boolean;
}

@Controller('de-thi')
export class DeThiController {
    private readonly logger = new Logger(DeThiController.name);
    constructor(
        private readonly deThiService: DeThiService,
        private readonly examService: ExamService
    ) { }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async findAll(@Query() paginationDto: PaginationDto) {
        // Admin và teacher đều được xem danh sách đề thi
        try {
            this.logger.log(`Finding all exams with pagination: ${JSON.stringify(paginationDto)}`);
            const result = await this.deThiService.findAll(paginationDto);

            // Kiểm tra và log kết quả
            if (Array.isArray(result)) {
                this.logger.log(`Found ${result.length} exams (array format)`);
                // Đảm bảo trả về định dạng { items: [...] } để frontend xử lý nhất quán
                return { items: result };
            } else if (result && result.items) {
                this.logger.log(`Found ${result.items.length} exams (paginated format)`);
                return result;
            } else {
                this.logger.warn('No exams found or invalid result format');
                return { items: [], meta: { total: 0 } };
            }
        } catch (error) {
            this.logger.error(`Error finding all exams: ${error.message}`, error.stack);
            throw error;
        }
    }

    @Get('packages')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async getAllExamPackages(): Promise<any> {
        return await this.deThiService.getAllExamPackages();
    }

    @Get('packages/:examId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async getExamPackage(@Param('examId') examId: string): Promise<any> {
        return await this.deThiService.getExamPackage(examId);
    }

    @Get('mon-hoc/:maMonHoc')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async findByMaMonHoc(
        @Param('maMonHoc') maMonHoc: string,
        @Query() paginationDto: PaginationDto
    ) {
        return await this.deThiService.findByMaMonHoc(maMonHoc, paginationDto);
    }

    @Get('approved')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async findApproved(@Query() paginationDto: PaginationDto) {
        return await this.deThiService.findByApprovalStatus(true, paginationDto);
    }

    @Get('pending')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async findPending(@Query() paginationDto: PaginationDto) {
        return await this.deThiService.findByApprovalStatus(false, paginationDto);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async findOne(@Param('id') id: string) {
        return await this.deThiService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async create(@Body() createDeThiDto: CreateDeThiDto) {
        return await this.deThiService.createDeThi(createDeThiDto);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async update(
        @Param('id') id: string,
        @Body() updateDeThiDto: UpdateDeThiDto,
    ) {
        return await this.deThiService.updateDeThi(id, updateDeThiDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async remove(@Param('id') id: string): Promise<void> {
        return await this.deThiService.deleteDeThi(id);
    }

    @Post(':id/duyet')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async duyetDeThi(@Param('id') id: string): Promise<void> {
        return await this.deThiService.duyetDeThi(id);
    }

    @Post(':id/huy-duyet')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async huyDuyetDeThi(@Param('id') id: string): Promise<void> {
        return await this.deThiService.huyDuyetDeThi(id);
    }

    /**
     * Download exam as PDF (admin only)
     */
    @Get(':id/pdf')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
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
     * Check question availability for exam generation
     */
    @Post('check-availability')
    async checkQuestionAvailability(@Body() examRequest: ExamGenerateRequest) {
        try {
            // Validate request
            if (!examRequest.maMonHoc || !examRequest.matrix) {
                return {
                    success: false,
                    message: 'Thiếu thông tin bắt buộc: maMonHoc hoặc matrix',
                    error: 'MISSING_REQUIRED_FIELDS'
                };
            }

            if (!Array.isArray(examRequest.matrix) || examRequest.matrix.length === 0) {
                return {
                    success: false,
                    message: 'Ma trận đề thi không hợp lệ hoặc rỗng',
                    error: 'INVALID_MATRIX'
                };
            }

            const availability = await this.examService.checkQuestionAvailability(examRequest.matrix);

            return {
                success: true,
                message: 'Kiểm tra tính khả dụng thành công',
                availability: availability
            };
        } catch (error) {
            console.error('Error checking question availability:', error);

            return {
                success: false,
                message: 'Lỗi khi kiểm tra tính khả dụng của câu hỏi',
                error: 'AVAILABILITY_CHECK_ERROR',
                details: error.message
            };
        }
    }

    /**
     * Generate exam using CLO-based algorithm
     */
    @Post('generate-clo')
    async generateExamWithCLO(@Body() examRequest: ExamGenerateRequest) {
        try {
            this.logger.log(`Received exam generation request for subject: ${examRequest.maMonHoc}`);
            // Validate request
            if (!examRequest.maMonHoc || !examRequest.tenDeThi || !examRequest.matrix) {
                throw new BadRequestException('Thiếu thông tin bắt buộc: maMonHoc, tenDeThi, hoặc matrix');
            }

            if (!Array.isArray(examRequest.matrix) || examRequest.matrix.length === 0) {
                throw new BadRequestException('Ma trận đề thi không hợp lệ hoặc rỗng');
            }

            // Kiểm tra số lượng đề thi
            const soLuongDe = examRequest.soLuongDe || 1;
            if (soLuongDe < 1 || soLuongDe > 10) {
                throw new BadRequestException('Số lượng đề thi phải từ 1 đến 10');
            }

            // Nếu tạo nhiều đề thi, sử dụng generateExam
            if (soLuongDe > 1) {
                const result = await this.examService.generateExam(examRequest);
                return {
                    success: true,
                    message: `Đã tạo thành công ${result.deThiIds.length} đề thi!`,
                    data: result,
                };
            } else {
                // Tạo 1 đề thi (logic cũ)
                const deThi = await this.examService.generateExamPackage(examRequest);
                return {
                    success: true,
                    message: 'Gói đề thi đã được tạo thành công!',
                    data: deThi,
                };
            }
        } catch (error) {
            this.logger.error(`Failed to generate exam package: ${error.message}`, error.stack);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Đã có lỗi xảy ra trong quá trình tạo gói đề thi.');
        }
    }

    /**
     * Generate exam document with custom template
     */
    @Post(':id/generate-with-template')
    @UseInterceptors(
        FileInterceptor('template', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = path.join(process.cwd(), '..', 'template', 'temp');
                    if (!fs.existsSync(uploadPath)) {
                        fs.mkdirSync(uploadPath, { recursive: true });
                    }
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const uniqueName = `${Date.now()}-${file.originalname}`;
                    cb(null, uniqueName);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.template') {
                    return cb(new BadRequestException('Only DOTX files are allowed'), false);
                }
                cb(null, true);
            },
        }),
    )
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async generateWithTemplate(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body('showAnswers') showAnswers: boolean = false,
        @Res() res: Response,
    ) {
        try {
            if (!file) {
                throw new BadRequestException('Template file is required');
            }

            const result = await this.deThiService.generateExamWithCustomTemplate(
                id,
                file.path,
                showAnswers,
            );

            return res.status(200).json({
                success: true,
                message: 'Exam document generated successfully',
                data: {
                    docxPath: result.docxPath,
                    pdfPath: result.pdfPath,
                },
            });
        } catch (error) {
            this.logger.error(`Failed to generate exam with template: ${error.message}`, error.stack);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to generate exam document with custom template');
        }
    }

    /**
     * Generate custom PDF from data (admin only)
     */
    @Post('generate-pdf')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async generateCustomPdf(@Body() data: any, @Res() res: Response) {
        try {
            this.logger.log(`Received custom PDF generation request`);

            if (!data.title || !data.questions || !Array.isArray(data.questions)) {
                throw new BadRequestException('Missing required fields: title and questions array');
            }

            // Process the data and generate PDF using the exam service
            const result = await this.examService.generateCustomPdf(data);

            // Set the response headers for PDF download
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${data.title.replace(/\s+/g, '_')}.pdf"`,
            });

            // Create readable stream from the PDF file path
            const fileStream = createReadStream(result.filePath);

            // Return the file stream
            return new StreamableFile(fileStream);
        } catch (error) {
            this.logger.error(`Failed to generate custom PDF: ${error.message}`, error.stack);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to generate custom PDF document');
        }
    }

    /**
     * Generate custom DOCX from data
     */
    @Post('generate-docx')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async generateCustomDocx(@Body() data: any, @Res() res: Response) {
        try {
            this.logger.log(`Received custom DOCX generation request`);

            if (!data.title) {
                throw new BadRequestException('Missing required field: title');
            }

            // Process the data and generate DOCX using the exam service
            const result = await this.examService.generateCustomDocx(data);

            // Set the response headers for DOCX download
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${data.title.replace(/\s+/g, '_')}.docx"`,
            });

            // Create readable stream from the DOCX file path
            const fileStream = createReadStream(result.filePath);

            // Return the file stream
            return new StreamableFile(fileStream);
        } catch (error) {
            this.logger.error(`Failed to generate custom DOCX: ${error.message}`, error.stack);
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to generate custom DOCX document');
        }
    }

    /**
     * Get hierarchical questions for an exam
     */
    @Get(':id/hierarchical-questions')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async getHierarchicalQuestions(@Param('id') id: string) {
        return await this.deThiService.getHierarchicalQuestions(id);
    }
}
