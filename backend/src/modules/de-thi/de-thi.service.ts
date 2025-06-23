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
        private readonly examService: ExamService,
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

    async findAll(paginationDto?: PaginationDto) {
        if (!paginationDto) {
            return await this.deThiRepository.find({
                relations: ['MonHoc', 'ChiTietDeThi'],
                order: { NgayTao: 'DESC' },
            });
        }

        const { page = PAGINATION_CONSTANTS.DEFAULT_PAGE, limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT } = paginationDto;
        const [items, total] = await this.deThiRepository.findAndCount({
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
}
