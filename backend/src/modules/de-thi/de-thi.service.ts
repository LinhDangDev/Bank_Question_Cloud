import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/base.service';
import { DeThi } from '../../entities/de-thi.entity';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { CreateDeThiDto, UpdateDeThiDto } from '../../dto';
import { PaginationDto } from '../../dto/pagination.dto';
import { PAGINATION_CONSTANTS } from '../../constants/pagination.constants';
import { ExamService } from '../../services/exam.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocxTemplateService } from '../../services/docx-template.service';
import { PdfService } from '../../services/pdf.service';
import { CauHoi } from '../../entities/cau-hoi.entity';

// Define the interface here to avoid importing from external module
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

@Injectable()
export class DeThiService extends BaseService<DeThi> {
    private readonly logger = new Logger(DeThiService.name);

    constructor(
        @InjectRepository(DeThi)
        private readonly deThiRepository: Repository<DeThi>,
        @InjectRepository(ChiTietDeThi)
        private readonly chiTietDeThiRepository: Repository<ChiTietDeThi>,
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
        private readonly examService: ExamService,
        private readonly docxTemplateService: DocxTemplateService,
        private readonly pdfService: PdfService,
    ) {
        super(deThiRepository, 'MaDeThi');
    }

    async findByMaMonHoc(maMonHoc: string, paginationDto?: PaginationDto) {
        if (!paginationDto) {
            return await this.deThiRepository.find({
                where: { MaMonHoc: maMonHoc },
                relations: ['ChiTietDeThi'],
                order: { NgayTao: 'DESC' },
            });
        }
        const { page = PAGINATION_CONSTANTS.DEFAULT_PAGE, limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT } = paginationDto;
        const [items, total] = await this.deThiRepository.findAndCount({
            where: { MaMonHoc: maMonHoc },
            relations: ['ChiTietDeThi'],
            order: { NgayTao: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                availableLimits: PAGINATION_CONSTANTS.AVAILABLE_LIMITS
            }
        };
    }

    async findByApprovalStatus(isApproved: boolean, paginationDto?: PaginationDto) {
        if (!paginationDto) {
            return await this.deThiRepository.find({
                where: { DaDuyet: isApproved },
                relations: ['MonHoc', 'ChiTietDeThi'],
                order: { NgayTao: 'DESC' },
            });
        }
        const { page = PAGINATION_CONSTANTS.DEFAULT_PAGE, limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT } = paginationDto;
        const [items, total] = await this.deThiRepository.findAndCount({
            where: { DaDuyet: isApproved },
            relations: ['MonHoc', 'ChiTietDeThi'],
            order: { NgayTao: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                availableLimits: PAGINATION_CONSTANTS.AVAILABLE_LIMITS
            }
        };
    }

    async createDeThi(createDeThiDto: CreateDeThiDto): Promise<DeThi> {
        const deThi = this.deThiRepository.create({
            MaDeThi: uuidv4(),
            ...createDeThiDto,
            NgayTao: new Date(),
        });
        return await this.deThiRepository.save(deThi);
    }

    async updateDeThi(maDeThi: string, updateDeThiDto: UpdateDeThiDto): Promise<DeThi> {
        await this.deThiRepository.update(maDeThi, updateDeThiDto);
        return await this.findOne(maDeThi);
    }

    async duyetDeThi(maDeThi: string): Promise<void> {
        await this.deThiRepository.update(maDeThi, { DaDuyet: true });
    }

    async huyDuyetDeThi(maDeThi: string): Promise<void> {
        await this.deThiRepository.update(maDeThi, { DaDuyet: false });
    }

    /**
     * Get all exam packages for listing
     */
    async getAllExamPackages(): Promise<ExamPackage[]> {
        return await this.examService.getAllExamPackages();
    }

    /**
     * Get a specific exam package with all details
     */
    async getExamPackage(examId: string): Promise<ExamPackage> {
        return this.examService.getExamPackage(examId);
    }

    /**
     * Get the path to the PDF file for an exam
     */
    async getExamPdfPath(examId: string): Promise<string> {
        // First check if the exam exists
        const exam = await this.deThiRepository.findOne({
            where: { MaDeThi: examId }
        });

        if (!exam) {
            throw new NotFoundException(`Exam with ID ${examId} not found`);
        }

        // Look for PDF file in the output directory
        const outputDir = path.join(process.cwd(), '..', 'output');
        const pdfPattern = new RegExp(`.*\\.pdf$`, 'i');

        // Search for matching files
        const findPdfFile = (dir: string): string | null => {
            if (!fs.existsSync(dir)) {
                return null;
            }

            const files = fs.readdirSync(dir);

            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);

                if (stats.isDirectory()) {
                    const found = findPdfFile(filePath);
                    if (found) return found;
                } else if (pdfPattern.test(file)) {
                    return filePath;
                }
            }

            return null;
        };

        const pdfPath = findPdfFile(outputDir);

        if (!pdfPath) {
            throw new NotFoundException(`PDF file for exam ${examId} not found`);
        }

        return pdfPath;
    }

    /**
     * Get the path to the DOCX file for an exam
     */
    async getExamDocxPath(examId: string): Promise<string> {
        // First check if the exam exists
        const exam = await this.deThiRepository.findOne({
            where: { MaDeThi: examId }
        });

        if (!exam) {
            throw new NotFoundException(`Exam with ID ${examId} not found`);
        }

        // Look for DOCX file in the output directory
        const outputDir = path.join(process.cwd(), '..', 'output');
        const docxPattern = new RegExp(`.*\\.docx$`, 'i');

        // Search for matching files
        const findDocxFile = (dir: string): string | null => {
            if (!fs.existsSync(dir)) {
                return null;
            }

            const files = fs.readdirSync(dir);

            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);

                if (stats.isDirectory()) {
                    const found = findDocxFile(filePath);
                    if (found) return found;
                } else if (docxPattern.test(file)) {
                    return filePath;
                }
            }

            return null;
        };

        const docxPath = findDocxFile(outputDir);

        if (!docxPath) {
            throw new NotFoundException(`DOCX file for exam ${examId} not found`);
        }

        return docxPath;
    }

    async findAll(paginationDto?: PaginationDto): Promise<DeThi[] | { items: DeThi[]; meta: { total: number; page: number; limit: number; totalPages: number; availableLimits: readonly [5, 10, 20, 50, 100, 1000]; } }> {
        try {
            this.logger.log('Finding all exams');
            if (!paginationDto) {
                const items = await this.deThiRepository.find({
                    relations: ['MonHoc', 'ChiTietDeThi'],
                    order: { NgayTao: 'DESC' },
                });

                this.logger.log(`Found ${items.length} exams without pagination`);
                // Trả về mảng trực tiếp để tuân thủ kiểu dữ liệu của BaseService
                return items;
            }

            const { page = PAGINATION_CONSTANTS.DEFAULT_PAGE, limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT } = paginationDto;
            const [items, total] = await this.deThiRepository.findAndCount({
                relations: ['MonHoc', 'ChiTietDeThi'],
                order: { NgayTao: 'DESC' },
                skip: (page - 1) * limit,
                take: limit,
            });

            this.logger.log(`Found ${items.length} exams with pagination (total: ${total})`);
            return {
                items,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    availableLimits: PAGINATION_CONSTANTS.AVAILABLE_LIMITS
                }
            };
        } catch (error) {
            this.logger.error(`Error finding all exams: ${error.message}`, error.stack);
            throw error;
        }
    }

    async deleteDeThi(maDeThi: string): Promise<void> {
        const deThi = await this.deThiRepository.findOne({ where: { MaDeThi: maDeThi } });

        if (!deThi) {
            throw new NotFoundException(`Đề thi với mã ${maDeThi} không tồn tại`);
        }

        // Delete related ChiTietDeThi entries by the foreign key
        await this.chiTietDeThiRepository.delete({ MaDeThi: maDeThi });

        // Delete the exam files (DOCX and PDF)
        try {
            const docxPath = await this.getExamDocxPath(maDeThi);
            if (docxPath && fs.existsSync(docxPath)) {
                fs.unlinkSync(docxPath);
                this.logger.log(`Deleted DOCX file: ${docxPath}`);
            }
        } catch (error) {
            this.logger.warn(`Could not find or delete DOCX for exam ${maDeThi}: ${error.message}`);
        }

        try {
            const pdfPath = await this.getExamPdfPath(maDeThi);
            if (pdfPath && fs.existsSync(pdfPath)) {
                fs.unlinkSync(pdfPath);
                this.logger.log(`Deleted PDF file: ${pdfPath}`);
            }
        } catch (error) {
            this.logger.warn(`Could not find or delete PDF for exam ${maDeThi}: ${error.message}`);
        }

        // Finally, delete the DeThi entry
        await this.deThiRepository.delete(maDeThi);
    }

    /**
     * Generate exam document with a custom template
     */
    async generateExamWithCustomTemplate(
        examId: string,
        templatePath: string,
        showAnswers: boolean = false,
    ): Promise<{ docxPath: string; pdfPath: string }> {
        try {
            // Check if exam exists
            const exam = await this.deThiRepository.findOne({
                where: { MaDeThi: examId },
                relations: ['MonHoc'],
            });

            if (!exam) {
                throw new NotFoundException(`Exam with ID ${examId} not found`);
            }

            // Get the prepared data for the exam
            const examData = await this.prepareExamDataForTemplate(examId, showAnswers);

            // Get the template filename only
            const templateFilename = path.basename(templatePath);

            // Generate DOCX using the template
            const docxPath = await this.docxTemplateService.generateDocx(templateFilename, examData, templatePath);

            // Convert to PDF
            const pdfPath = await this.pdfService.convertDocxToPdf(docxPath);

            return { docxPath, pdfPath };
        } catch (error) {
            this.logger.error(`Error generating exam document with custom template: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Prepare exam data for template generation
     */
    private async prepareExamDataForTemplate(examId: string, includeAnswers: boolean): Promise<any> {
        // Get exam details
        const exam = await this.deThiRepository.findOne({
            where: { MaDeThi: examId },
            relations: ['MonHoc'],
        });

        if (!exam) {
            throw new NotFoundException(`Exam with ID ${examId} not found`);
        }

        // Get exam questions with details
        const examPackage = await this.examService.getExamPackage(examId);

        // Format questions for template
        const questions = examPackage.questions.map(question => ({
            number: question.number,
            text: question.content,
            answers: question.answers.map(answer => ({
                label: answer.label,
                text: answer.content,
                isCorrect: answer.isCorrect,
            })),
            correctAnswer: question.answers
                .filter(answer => answer.isCorrect)
                .map(answer => answer.label)
                .join(', '),
            clo: question.clo,
            difficulty: question.difficulty,
        }));

        // Prepare template data
        return {
            title: exam.TenDeThi,
            subject: exam.MonHoc?.TenMonHoc || 'Không có tên môn học',
            date: new Date().toLocaleDateString('vi-VN'),
            questions: questions,
            hasAnswers: includeAnswers,
            hideChapterStructure: exam.LoaiBoChuongPhan, // Add flag to control chapter display
        };
    }

    /**
     * Get hierarchical questions for an exam
     * If LoaiBoChuongPhan is true, questions will be grouped without chapter structure
     */
    async getHierarchicalQuestions(examId: string) {
        const exam = await this.deThiRepository.findOne({
            where: { MaDeThi: examId }
        });

        if (!exam) {
            throw new NotFoundException(`Exam with ID ${examId} not found`);
        }

        const examDetails = await this.chiTietDeThiRepository.find({
            where: { MaDeThi: examId },
            relations: ['Phan', 'CauHoi', 'CauHoi.CauTraLoi', 'CauHoi.CLO'],
            order: { ThuTu: 'ASC' }
        });

        if (exam.LoaiBoChuongPhan) {
            // For exams without chapter structure, return a flattened list
            return {
                ignoreChapters: true,
                questions: examDetails,
            };
        } else {
            // For exams with chapter structure, group by chapter
            return {
                ignoreChapters: false,
                questions: examDetails,
            };
        }
    }
}
