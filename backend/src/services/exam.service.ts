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
    clo1: number;
    clo2: number;
    clo3: number;
    clo4: number;
    clo5: number;
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
            // Select questions for each CLO
            if (item.clo1 > 0) {
                const clo1Questions = await this.getQuestionsForCLO(item.maPhan, 1, item.clo1);
                selectedQuestions.push(...clo1Questions);
            }

            if (item.clo2 > 0) {
                const clo2Questions = await this.getQuestionsForCLO(item.maPhan, 2, item.clo2);
                selectedQuestions.push(...clo2Questions);
            }

            if (item.clo3 > 0) {
                const clo3Questions = await this.getQuestionsForCLO(item.maPhan, 3, item.clo3);
                selectedQuestions.push(...clo3Questions);
            }

            if (item.clo4 > 0) {
                const clo4Questions = await this.getQuestionsForCLO(item.maPhan, 4, item.clo4);
                selectedQuestions.push(...clo4Questions);
            }

            if (item.clo5 > 0) {
                const clo5Questions = await this.getQuestionsForCLO(item.maPhan, 5, item.clo5);
                selectedQuestions.push(...clo5Questions);
            }
        }

        return selectedQuestions;
    }

    private async getQuestionsForCLO(maPhan: string, cloOrder: number, count: number): Promise<CauHoi[]> {
        try {
            // Find questions that belong to the specified chapter and have CLOs with the given order
            const questions = await this.cauHoiRepository
                .createQueryBuilder('cauHoi')
                .leftJoinAndSelect('cauHoi.CLO', 'clo')
                .where('cauHoi.MaPhan = :maPhan', { maPhan })
                .andWhere('cauHoi.XoaTamCauHoi = :xoaTam', { xoaTam: false })
                .andWhere('clo.ThuTu = :cloOrder', { cloOrder })
                .getMany();

            // If not enough questions found with CLO, fallback to any question from the chapter
            if (questions.length < count) {
                this.logger.warn(
                    `Not enough questions with CLO ${cloOrder} in chapter ${maPhan}. ` +
                    `Found ${questions.length}, needed ${count}. Using random questions from chapter.`
                );

                const additionalQuestions = await this.cauHoiRepository.find({
                    where: {
                        MaPhan: maPhan,
                        XoaTamCauHoi: false,
                    },
                    take: count - questions.length,
                });

                questions.push(...additionalQuestions);
            }

            // Shuffle the questions
            const shuffled = [...questions].sort(() => 0.5 - Math.random());

            // Return the requested number of questions
            return shuffled.slice(0, count);
        } catch (error) {
            this.logger.error(`Error getting questions for CLO ${cloOrder}: ${error.message}`);
            return [];
        }
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
            questions: questionsList,
        };
    }
}
