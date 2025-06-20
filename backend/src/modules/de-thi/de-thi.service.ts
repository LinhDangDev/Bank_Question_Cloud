import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/base.service';
import { DeThi } from '../../entities/de-thi.entity';
import { CreateDeThiDto, UpdateDeThiDto } from '../../dto';
import { PaginationDto } from '../../dto/pagination.dto';
import { PAGINATION_CONSTANTS } from '../../constants/pagination.constants';
import { ExamService } from '../../services/exam.service';
import * as fs from 'fs';
import * as path from 'path';

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
}

@Injectable()
export class DeThiService extends BaseService<DeThi> {
    constructor(
        @InjectRepository(DeThi)
        private readonly deThiRepository: Repository<DeThi>,
        private readonly examService: ExamService,
    ) {
        super(deThiRepository);
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

    async createDeThi(createDeThiDto: CreateDeThiDto): Promise<DeThi> {
        const deThi = this.deThiRepository.create({
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

        // Look for PDF file in the uploads directory
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const pdfPattern = new RegExp(`${examId}.*\\.pdf$`, 'i');

        // Search for matching files
        const findPdfFile = (dir: string): string | null => {
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

        const pdfPath = findPdfFile(uploadsDir);

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

        // Look for DOCX file in the uploads directory
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const docxPattern = new RegExp(`${examId}.*\\.docx$`, 'i');

        // Search for matching files
        const findDocxFile = (dir: string): string | null => {
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

        const docxPath = findDocxFile(uploadsDir);

        if (!docxPath) {
            throw new NotFoundException(`DOCX file for exam ${examId} not found`);
        }

        return docxPath;
    }
}
