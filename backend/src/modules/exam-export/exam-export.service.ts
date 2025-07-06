import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeThi } from '../../entities/de-thi.entity';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { Files } from '../../entities/files.entity';
import { FilesUrlService } from '../files/files-url.service';
import * as fs from 'fs';
import * as path from 'path';
import * as Docxtemplater from 'docxtemplater';
import * as PizZip from 'pizzip';

export interface ExamExportOptions {
    includeAnswers?: boolean;
    includeImages?: boolean;
    includeAudio?: boolean;
    customHeader?: string;
    customFooter?: string;
    examTitle?: string;
    subject?: string;
    duration?: string;
    semester?: string;
    academicYear?: string;
    allowMaterials?: string;
}

export interface ExamQuestion {
    questionNumber: number;
    content: string;
    answers: string[];
    correctAnswer?: string;
    images?: string[];
    audioFiles?: string[];
    difficulty: number;
}

export interface ExamData {
    examInfo: {
        title: string;
        subject: string;
        duration: string;
        semester: string;
        academicYear: string;
        allowMaterials: string;
        totalQuestions: number;
    };
    questions: ExamQuestion[];
    metadata: {
        exportedAt: Date;
        exportedBy: string;
        options: ExamExportOptions;
    };
}

@Injectable()
export class ExamExportService {
    private readonly TEMPLATE_PATH = path.join(process.cwd(), 'template', 'TemplateHutechOffical.dotx');

    constructor(
        @InjectRepository(DeThi)
        private readonly deThiRepository: Repository<DeThi>,
        @InjectRepository(ChiTietDeThi)
        private readonly chiTietDeThiRepository: Repository<ChiTietDeThi>,
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
        @InjectRepository(CauTraLoi)
        private readonly cauTraLoiRepository: Repository<CauTraLoi>,
        private readonly filesUrlService: FilesUrlService,
    ) { }

    /**
     * Export đề thi ra file Word với template HUTECH
     */
    async exportExamToWord(examId: string, options: ExamExportOptions = {}): Promise<Buffer> {
        // 1. Lấy dữ liệu đề thi
        const examData = await this.getExamData(examId, options);

        // 2. Load template
        const template = await this.loadTemplate();

        // 3. Generate Word document using docxtemplater
        const zip = new PizZip(template);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Set data
        doc.setData(examData);

        try {
            doc.render();
        } catch (error) {
            throw new BadRequestException(`Template rendering failed: ${error.message}`);
        }

        const buffer = doc.getZip().generate({ type: 'nodebuffer' });
        return buffer;
    }

    /**
     * Lấy thông tin cơ bản của đề thi để hiển thị dialog
     */
    async getExamExportDialog(examId: string): Promise<{
        examInfo: any;
        availableOptions: ExamExportOptions;
        questionCount: number;
        hasMultimedia: boolean;
    }> {
        const exam = await this.deThiRepository.findOne({
            where: { MaDeThi: examId },
            relations: ['MonHoc', 'ChiTietDeThi']
        });

        if (!exam) {
            throw new NotFoundException(`Exam not found: ${examId}`);
        }

        // Đếm số câu hỏi và kiểm tra multimedia
        const questionCount = exam.ChiTietDeThi?.length || 0;
        const hasMultimedia = await this.checkExamHasMultimedia(examId);

        return {
            examInfo: {
                MaDeThi: exam.MaDeThi,
                TenDeThi: exam.TenDeThi,
                MonHoc: exam.MonHoc?.TenMonHoc || '',
                NgayTao: exam.NgayTao,
                SoCauHoi: questionCount
            },
            availableOptions: {
                includeAnswers: true,
                includeImages: hasMultimedia,
                includeAudio: false, // Audio không thể in
                customHeader: '',
                customFooter: '',
                examTitle: exam.TenDeThi,
                subject: exam.MonHoc?.TenMonHoc || '',
                duration: '90 phút',
                semester: 'HK1',
                academicYear: '2024-2025',
                allowMaterials: 'KHÔNG'
            },
            questionCount,
            hasMultimedia
        };
    }

    /**
     * Lấy dữ liệu đầy đủ của đề thi
     */
    private async getExamData(examId: string, options: ExamExportOptions): Promise<ExamData> {
        const exam = await this.deThiRepository.findOne({
            where: { MaDeThi: examId },
            relations: ['MonHoc', 'ChiTietDeThi', 'ChiTietDeThi.CauHoi', 'ChiTietDeThi.CauHoi.CauTraLoi']
        });

        if (!exam) {
            throw new NotFoundException(`Exam not found: ${examId}`);
        }

        const questions: ExamQuestion[] = [];

        for (let i = 0; i < exam.ChiTietDeThi.length; i++) {
            const chiTiet = exam.ChiTietDeThi[i];
            const cauHoi = chiTiet.CauHoi;

            if (!cauHoi) continue;

            // Lấy câu trả lời
            const answers = cauHoi.CauTraLoi
                ?.sort((a, b) => a.ThuTu - b.ThuTu)
                ?.map(answer => answer.NoiDung) || [];

            // Tìm câu trả lời đúng
            const correctAnswer = options.includeAnswers
                ? cauHoi.CauTraLoi?.find(a => a.LaDapAn)?.NoiDung
                : undefined;

            // Lấy files multimedia
            const questionFiles = await this.filesUrlService.getQuestionFiles(cauHoi.MaCauHoi);

            const images = options.includeImages
                ? questionFiles
                    .filter(f => f.LoaiFile === 2)
                    .map(f => {
                        // Đảm bảo lấy URL trực tiếp từ CDN
                        return f.CDNUrl || f.ResolvedUrl || this.buildDirectCdnUrl(f.TenFile, f.LoaiFile);
                    })
                : [];

            const audioFiles = options.includeAudio
                ? questionFiles
                    .filter(f => f.LoaiFile === 1)
                    .map(f => {
                        // Đảm bảo lấy URL trực tiếp từ CDN
                        return f.CDNUrl || f.ResolvedUrl || this.buildDirectCdnUrl(f.TenFile, f.LoaiFile);
                    })
                : [];

            questions.push({
                questionNumber: i + 1,
                content: cauHoi.NoiDung || '',
                answers,
                correctAnswer,
                images,
                audioFiles,
                difficulty: cauHoi.CapDo || 1
            });
        }

        return {
            examInfo: {
                title: options.examTitle || exam.TenDeThi,
                subject: options.subject || exam.MonHoc?.TenMonHoc || '',
                duration: options.duration || '90 phút',
                semester: options.semester || 'HK1',
                academicYear: options.academicYear || '2024-2025',
                allowMaterials: options.allowMaterials || 'KHÔNG',
                totalQuestions: questions.length
            },
            questions,
            metadata: {
                exportedAt: new Date(),
                exportedBy: 'System', // TODO: Get from JWT token
                options
            }
        };
    }

    /**
     * Build direct CDN URL cho file
     */
    private buildDirectCdnUrl(fileName: string, fileType: number): string {
        const folder = this.getFolderByType(fileType);
        return `https://datauploads.sgp1.cdn.digitaloceanspaces.com/${folder}/${fileName}`;
    }

    /**
     * Lấy folder name theo loại file
     */
    private getFolderByType(fileType: number): string {
        switch (fileType) {
            case 1: return 'audio';
            case 2: return 'images';
            case 3: return 'documents';
            case 4: return 'videos';
            default: return 'files';
        }
    }

    /**
     * Load Word template
     */
    private async loadTemplate(): Promise<Buffer> {
        try {
            if (!fs.existsSync(this.TEMPLATE_PATH)) {
                throw new NotFoundException(`Template not found: ${this.TEMPLATE_PATH}`);
            }

            return fs.readFileSync(this.TEMPLATE_PATH);
        } catch (error) {
            throw new BadRequestException(`Failed to load template: ${error.message}`);
        }
    }

    /**
     * Kiểm tra đề thi có multimedia không
     */
    private async checkExamHasMultimedia(examId: string): Promise<boolean> {
        const result = await this.chiTietDeThiRepository
            .createQueryBuilder('ctdt')
            .innerJoin('ctdt.CauHoi', 'ch')
            .innerJoin('ch.Files', 'f')
            .where('ctdt.MaDeThi = :examId', { examId })
            .getCount();

        return result > 0;
    }
}
