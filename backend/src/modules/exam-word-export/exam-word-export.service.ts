import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DeThi } from '../../entities/de-thi.entity';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { DocxTemplateService } from '../../services/docx-template.service';
import * as path from 'path';
import * as fs from 'fs';

export interface ExamWordExportOptions {
    examTitle?: string;
    subject?: string;
    course?: string;
    semester?: string;
    academicYear?: string;
    examDate?: string;
    duration?: string;
    instructions?: string;
    allowMaterials?: boolean;
    showAnswers?: boolean;
    separateAnswerSheet?: boolean;
    studentInfo?: {
        studentId?: string;
        studentName?: string;
        className?: string;
    };
}

export interface ExamWordData {
    // Header information
    examTitle: string;
    subject: string;
    course: string;
    semester: string;
    academicYear: string;
    examDate: string;
    duration: string;
    instructions: string;
    allowMaterials: string;

    // Student info
    studentId: string;
    studentName: string;
    className: string;

    // Questions
    questions: any[];
    totalQuestions: number;

    // Answer sheet
    showAnswers: boolean;
    separateAnswerSheet: boolean;
    answerKey?: any[];
}

/**
 * Service for exporting exams to Word documents with custom headers
 * Author: Linh Dang Dev
 */
@Injectable()
export class ExamWordExportService {
    private readonly logger = new Logger(ExamWordExportService.name);

    constructor(
        @InjectRepository(DeThi)
        private readonly deThiRepository: Repository<DeThi>,
        @InjectRepository(ChiTietDeThi)
        private readonly chiTietDeThiRepository: Repository<ChiTietDeThi>,
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
        @InjectRepository(CauTraLoi)
        private readonly cauTraLoiRepository: Repository<CauTraLoi>,
        private readonly docxTemplateService: DocxTemplateService,
    ) { }

    /**
     * Get exam details for Word export
     */
    async getExamForWordExport(examId: string): Promise<any> {
        // Get exam basic info - only approved exams
        const exam = await this.deThiRepository.findOne({
            where: {
                MaDeThi: examId,
                DaDuyet: true  // Only approved exams can be exported
            },
            relations: ['MonHoc']
        });

        if (!exam) {
            throw new NotFoundException(`Approved exam not found: ${examId}`);
        }

        // Get exam questions
        const examDetails = await this.chiTietDeThiRepository.find({
            where: { MaDeThi: examId },
            order: { ThuTu: 'ASC' }
        });

        const questionIds = examDetails.map(detail => detail.MaCauHoi);

        // Get questions with answers
        const questions = await this.cauHoiRepository.find({
            where: { MaCauHoi: In(questionIds) },
            relations: ['CauTraLoi']
        });

        // Sort questions by exam order
        const sortedQuestions = examDetails.map(detail => {
            const question = questions.find(q => q.MaCauHoi === detail.MaCauHoi);
            return {
                ...question,
                order: detail.ThuTu
            };
        }).filter(q => q);

        return {
            exam,
            questions: sortedQuestions,
            totalQuestions: sortedQuestions.length
        };
    }

    /**
     * Export exam to Word with custom header information
     */
    async exportExamToWord(examId: string, options: ExamWordExportOptions = {}): Promise<Buffer> {
        try {
            this.logger.log(`Exporting exam ${examId} to Word with custom options`);

            // Get exam data
            const examData = await this.getExamForWordExport(examId);

            // Prepare template data
            const templateData = this.prepareTemplateData(examData, options);

            // Generate Word document
            const templatePath = this.getTemplatePath(options.separateAnswerSheet || false);
            const buffer = await this.generateWordDocument(templatePath, templateData);

            this.logger.log(`Successfully exported exam ${examId} to Word`);
            return buffer;

        } catch (error) {
            this.logger.error(`Error exporting exam to Word: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Prepare data for Word template
     */
    private prepareTemplateData(examData: any, options: ExamWordExportOptions): ExamWordData {
        const { exam, questions } = examData;

        // Format questions for template
        const formattedQuestions = questions.map((question, index) => {
            const answers = question.CauTraLoi || [];
            const sortedAnswers = answers.sort((a, b) => a.ThuTu - b.ThuTu);

            return {
                number: index + 1,
                content: question.NoiDung || '',
                type: question.LoaiCauHoi || 'single-choice',
                answers: sortedAnswers.map((answer, answerIndex) => ({
                    label: String.fromCharCode(65 + answerIndex), // A, B, C, D
                    content: answer.NoiDung || '',
                    isCorrect: answer.LaDapAn === true
                })),
                correctAnswer: this.getCorrectAnswerLabel(sortedAnswers),
                clo: question.MaCLO || '',
                difficulty: question.CapDo || 1
            };
        });

        // Prepare answer key if needed
        const answerKey = options.showAnswers ? formattedQuestions.map(q => ({
            number: q.number,
            correctAnswer: q.correctAnswer
        })) : [];

        return {
            // Header information with defaults
            examTitle: options.examTitle || exam.TenDeThi || 'ĐỀ THI HỌC KỲ',
            subject: options.subject || exam.MonHoc?.TenMonHoc || '',
            course: options.course || '',
            semester: options.semester || '',
            academicYear: options.academicYear || new Date().getFullYear().toString(),
            examDate: options.examDate || new Date().toLocaleDateString('vi-VN'),
            duration: options.duration || '90 phút',
            instructions: options.instructions || 'Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.',
            allowMaterials: options.allowMaterials ? 'CÓ' : 'KHÔNG',

            // Student info
            studentId: options.studentInfo?.studentId || '',
            studentName: options.studentInfo?.studentName || '',
            className: options.studentInfo?.className || '',

            // Questions and answers
            questions: formattedQuestions,
            totalQuestions: formattedQuestions.length,
            showAnswers: options.showAnswers || false,
            separateAnswerSheet: options.separateAnswerSheet || false,
            answerKey
        };
    }

    /**
     * Get correct answer label (A, B, C, D)
     */
    private getCorrectAnswerLabel(answers: any[]): string {
        const correctIndex = answers.findIndex(answer => answer.LaDapAn === true);
        return correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : 'A';
    }

    /**
     * Get template path based on export type
     */
    private getTemplatePath(separateAnswerSheet: boolean): string {
        // Always use the official HUTECH template
        return path.join(process.cwd(), 'template', 'TemplateHutechOffical.dotx');
    }

    /**
     * Generate Word document using template
     */
    private async generateWordDocument(templatePath: string, data: ExamWordData): Promise<Buffer> {
        try {
            // Ensure template exists
            if (!fs.existsSync(templatePath)) {
                this.logger.error(`Template not found: ${templatePath}`);
                throw new BadRequestException(`Template file not found: ${templatePath}`);
            }

            this.logger.log(`Using template: ${templatePath}`);
            this.logger.log(`Template data keys: ${Object.keys(data).join(', ')}`);

            // Generate document using docx template service
            const outputPath = await this.docxTemplateService.generateDocx(
                path.basename(templatePath),
                data,
                templatePath
            );

            this.logger.log(`Generated document at: ${outputPath}`);

            // Read generated file as buffer
            const buffer = fs.readFileSync(outputPath);

            // Clean up temporary file
            try {
                fs.unlinkSync(outputPath);
                this.logger.log(`Cleaned up temp file: ${outputPath}`);
            } catch (cleanupError) {
                this.logger.warn(`Failed to cleanup temp file: ${outputPath}`);
            }

            return buffer;

        } catch (error) {
            this.logger.error(`Error generating Word document: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to generate Word document: ${error.message}`);
        }
    }

    /**
     * Get default export options for an exam
     */
    async getDefaultExportOptions(examId: string): Promise<Partial<ExamWordExportOptions>> {
        const examData = await this.getExamForWordExport(examId);
        const { exam } = examData;

        return {
            examTitle: exam.TenDeThi,
            subject: exam.MonHoc?.TenMonHoc || '',
            academicYear: new Date().getFullYear().toString(),
            examDate: new Date().toLocaleDateString('vi-VN'),
            duration: '90 phút',
            instructions: 'Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.',
            allowMaterials: false,
            showAnswers: false,
            separateAnswerSheet: false
        };
    }
}
