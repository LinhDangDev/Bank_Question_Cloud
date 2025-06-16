import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as path from 'path';
import { CauHoi } from '../entities/cau-hoi.entity';
import { CauTraLoi } from '../entities/cau-tra-loi.entity';
import { DeThi } from '../entities/de-thi.entity';
import { ChiTietDeThi } from '../entities/chi-tiet-de-thi.entity';
import { Phan } from '../entities/phan.entity';
import { Files } from '../entities/files.entity';
import { DocxTemplateService } from './docx-template.service';
import { PdfService } from './pdf.service';
import { v4 as uuidv4 } from 'uuid';

interface ExamMatrixItem {
    maPhan: string;
    easy: number;
    medium: number;
    hard: number;
}

interface ExamRequest {
    maMonHoc: string;
    tenDeThi: string;
    matrix: ExamMatrixItem[];
    hoanViDapAn: boolean;
    nguoiTao: string;
}

@Injectable()
export class ExamService {
    private readonly logger = new Logger(ExamService.name);

    constructor(
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
        @InjectRepository(CauTraLoi)
        private readonly cauTraLoiRepository: Repository<CauTraLoi>,
        @InjectRepository(DeThi)
        private readonly deThiRepository: Repository<DeThi>,
        @InjectRepository(ChiTietDeThi)
        private readonly chiTietDeThiRepository: Repository<ChiTietDeThi>,
        @InjectRepository(Phan)
        private readonly phanRepository: Repository<Phan>,
        @InjectRepository(Files)
        private readonly filesRepository: Repository<Files>,
        private readonly docxTemplateService: DocxTemplateService,
        private readonly pdfService: PdfService,
    ) { }

    async generateExam(examRequest: ExamRequest): Promise<{ deThiId: string; docxPath: string; pdfPath: string }> {
        try {
            this.logger.log(`Starting exam generation for: ${examRequest.tenDeThi}`);

            // 1. Create DeThi record
            const deThi = this.deThiRepository.create({
                MaDeThi: uuidv4(),
                MaMonHoc: examRequest.maMonHoc,
                TenDeThi: examRequest.tenDeThi,
                NgayTao: new Date(),
                DaDuyet: false,
            });

            await this.deThiRepository.save(deThi);
            this.logger.log(`Created exam with ID: ${deThi.MaDeThi}`);

            // 2. Select questions based on matrix
            const selectedQuestions = await this.selectQuestionsFromMatrix(examRequest.matrix);
            this.logger.log(`Selected ${selectedQuestions.length} questions`);

            // 3. Create ChiTietDeThi records
            let questionOrder = 1;
            const chiTietDeThiRecords: ChiTietDeThi[] = [];

            for (const question of selectedQuestions) {
                const chiTietDeThi = this.chiTietDeThiRepository.create({
                    MaDeThi: deThi.MaDeThi,
                    MaPhan: question.MaPhan,
                    MaCauHoi: question.MaCauHoi,
                    ThuTu: questionOrder++,
                });

                chiTietDeThiRecords.push(chiTietDeThi);
            }

            await this.chiTietDeThiRepository.save(chiTietDeThiRecords);

            // 4. Prepare data for document generation
            const examData = await this.prepareExamData(deThi.MaDeThi, examRequest.hoanViDapAn);

            // 5. Generate DOCX
            const docxPath = await this.docxTemplateService.generateDocx('DefaultExamTemplate.dotx', examData);

            // 6. Convert to PDF
            const pdfPath = await this.pdfService.convertToPdf(docxPath);

            // 7. Save file reference
            const fileRecord = this.filesRepository.create({
                MaFile: uuidv4(),
                TenFile: path.basename(pdfPath),
                LoaiFile: 1, // PDF
            });

            await this.filesRepository.save(fileRecord);

            this.logger.log(`Exam generation completed: ${pdfPath}`);

            return {
                deThiId: deThi.MaDeThi,
                docxPath,
                pdfPath,
            };
        } catch (error) {
            this.logger.error(`Error generating exam: ${error.message}`, error.stack);
            throw new Error(`Failed to generate exam: ${error.message}`);
        }
    }

    private async selectQuestionsFromMatrix(matrix: ExamMatrixItem[]): Promise<CauHoi[]> {
        const selectedQuestions: CauHoi[] = [];

        for (const item of matrix) {
            // Get easy questions
            if (item.easy > 0) {
                const easyQuestions = await this.getRandomQuestions(item.maPhan, 1, item.easy);
                selectedQuestions.push(...easyQuestions);
            }

            // Get medium questions
            if (item.medium > 0) {
                const mediumQuestions = await this.getRandomQuestions(item.maPhan, 2, item.medium);
                selectedQuestions.push(...mediumQuestions);
            }

            // Get hard questions
            if (item.hard > 0) {
                const hardQuestions = await this.getRandomQuestions(item.maPhan, 3, item.hard);
                selectedQuestions.push(...hardQuestions);
            }
        }

        return selectedQuestions;
    }

    private async getRandomQuestions(maPhan: string, capDo: number, count: number): Promise<CauHoi[]> {
        // Get all questions matching the criteria
        const questions = await this.cauHoiRepository.find({
            where: {
                MaPhan: maPhan,
                CapDo: capDo,
                XoaTamCauHoi: false,
            },
        });

        // Shuffle the questions
        const shuffled = [...questions].sort(() => 0.5 - Math.random());

        // Return the requested number of questions
        return shuffled.slice(0, count);
    }

    private async prepareExamData(maDethi: string, hoanViDapAn: boolean): Promise<any> {
        // Get exam details
        const deThi = await this.deThiRepository.findOne({
            where: { MaDeThi: maDethi },
            relations: ['MonHoc'],
        });

        if (!deThi) {
            throw new Error(`Exam with ID ${maDethi} not found`);
        }

        // Get exam questions
        const chiTietDeThi = await this.chiTietDeThiRepository.find({
            where: { MaDeThi: maDethi },
            order: { ThuTu: 'ASC' },
        });

        // Get question IDs
        const questionIds = chiTietDeThi.map(item => item.MaCauHoi);

        // Get questions with content
        const questions = await this.cauHoiRepository.find({
            where: { MaCauHoi: In(questionIds) },
        });

        // Create a map for quick lookup
        const questionMap = new Map(questions.map(q => [q.MaCauHoi, q]));

        // Get answers for all questions
        const answers = await this.cauTraLoiRepository.find({
            where: { MaCauHoi: In(questionIds) },
        });

        // Group answers by question
        const answersMap = answers.reduce((map, answer) => {
            if (!map.has(answer.MaCauHoi)) {
                map.set(answer.MaCauHoi, []);
            }
            const answerArray = map.get(answer.MaCauHoi);
            if (answerArray) {
                answerArray.push(answer);
            }
            return map;
        }, new Map<string, CauTraLoi[]>());

        // Process questions and answers for template
        const questionsList = chiTietDeThi.map((item, index) => {
            const question = questionMap.get(item.MaCauHoi);
            let questionAnswers = answersMap.get(item.MaCauHoi) || [];

            // Sort answers by ThuTu
            questionAnswers.sort((a, b) => a.ThuTu - b.ThuTu);

            // Shuffle answers if requested and if question has HoanVi flag
            if (hoanViDapAn && question?.HoanVi) {
                questionAnswers = [...questionAnswers].sort(() => 0.5 - Math.random());
            }

            // Format answers for template
            const formattedAnswers = questionAnswers.map((answer, ansIndex) => ({
                label: String.fromCharCode(65 + ansIndex), // A, B, C, D...
                text: answer.NoiDung,
                isCorrect: answer.LaDapAn,
            }));

            return {
                number: index + 1,
                text: question?.NoiDung || 'Không có nội dung',
                answers: formattedAnswers,
            };
        });

        // Prepare template data
        return {
            title: deThi.TenDeThi,
            subject: deThi.MonHoc?.TenMonHoc || 'Không có tên môn học',
            date: new Date().toLocaleDateString('vi-VN'),
            time: '90 phút', // TODO: Make this configurable
            questions: questionsList,
        };
    }
}
