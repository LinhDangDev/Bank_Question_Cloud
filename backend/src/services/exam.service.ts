import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
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
    nguoiTao?: string;
    soLuongDe?: number;
}

interface WeightedQuestion {
    question: CauHoi;
    weight: number;
}

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

    async generateExam(examRequest: ExamRequest): Promise<{ deThiIds: string[]; docxPaths: string[]; pdfPaths: string[] }> {
        const { soLuongDe = 1, tenDeThi } = examRequest;
        const deThiIds: string[] = [];
        const docxPaths: string[] = [];
        const pdfPaths: string[] = [];

        this.logger.log(`Starting generation for ${soLuongDe} exam(s) with base title: ${tenDeThi}`);

        // 1. Select questions once
        const allQuestions = await this.selectQuestionsWithCLOStrategy(examRequest.matrix);

        for (let i = 0; i < soLuongDe; i++) {
            const examTitle = soLuongDe > 1 ? `${tenDeThi} - Đề ${i + 1}` : tenDeThi;
            this.logger.log(`Generating exam #${i + 1}: ${examTitle}`);

            // 2. Shuffle questions for each exam version
            const selectedQuestions = this.shuffleQuestions(allQuestions);

            // 3. Create DeThi record
            const deThi = this.deThiRepository.create({
                MaDeThi: uuidv4(),
                MaMonHoc: examRequest.maMonHoc,
                TenDeThi: examTitle,
                NgayTao: new Date(),
                DaDuyet: false,
                NguoiTao: examRequest.nguoiTao,
            });
            await this.deThiRepository.save(deThi);
            this.logger.log(`Created exam record with ID: ${deThi.MaDeThi}`);

            // 4. Create ChiTietDeThi records
            const chiTietDeThiEntities = selectedQuestions.map((question, index) =>
                this.chiTietDeThiRepository.create({
                    MaDeThi: deThi.MaDeThi,
                    MaCauHoi: question.MaCauHoi,
                    MaPhan: question.MaPhan,
                    ThuTu: index + 1,
                }),
            );
            await this.chiTietDeThiRepository.save(chiTietDeThiEntities);
            this.logger.log(`Saved ${chiTietDeThiEntities.length} question details for exam ${deThi.MaDeThi}`);

            // 5. Generate DOCX and PDF
            const { docxPath, pdfPath } = await this.generateExamDocuments(deThi, selectedQuestions, examRequest.hoanViDapAn);

            deThiIds.push(deThi.MaDeThi);
            docxPaths.push(docxPath);
            pdfPaths.push(pdfPath);
        }

        this.logger.log(`Successfully generated ${soLuongDe} exam(s).`);
        return { deThiIds, docxPaths, pdfPaths };
    }

    /**
     * Enhanced algorithm: CLO-Stratified Weighted Random Sampling
     * Selects questions based on CLO standards and chapters with weighted random selection
     * This algorithm ensures a balanced distribution across chapters and CLOs while
     * considering question difficulty, usage history, and quality metrics
     */
    private async selectQuestionsWithCLOStrategy(matrix: ExamMatrixItem[]): Promise<CauHoi[]> {
        const selectedQuestions: CauHoi[] = [];
        this.logger.log(`Starting CLO-Stratified Weighted Random Sampling for ${matrix.length} chapters`);

        // Phase 1: Gather all available questions by chapter and CLO
        const chapterQuestionsMap = new Map<string, CauHoi[]>();
        const questionsByCLOMap = new Map<string, Map<number, CauHoi[]>>();

        for (const item of matrix) {
            // Get all available questions for this chapter
            const chapterQuestions = await this.cauHoiRepository.find({
                where: {
                    MaPhan: item.maPhan,
                    XoaTamCauHoi: false,
                    MaCauHoiCha: IsNull() // Only parent questions
                },
                relations: ['CLO', 'Phan', 'CauTraLoi']
            });

            chapterQuestionsMap.set(item.maPhan, chapterQuestions);

            // Group by CLO within each chapter
            const cloBuckets = new Map<number, CauHoi[]>();
            for (let i = 1; i <= 5; i++) {
                cloBuckets.set(i, []);
            }

            chapterQuestions.forEach(question => {
                const cloOrder = question.CLO?.ThuTu || 0;
                if (cloOrder >= 1 && cloOrder <= 5) {
                    const bucket = cloBuckets.get(cloOrder);
                    if (bucket) {
                        bucket.push(question);
                    }
                }
            });

            questionsByCLOMap.set(item.maPhan, cloBuckets);
        }

        // Phase 2: Select questions for each chapter based on CLO distribution, ensuring no duplicates
        for (const item of matrix) {
            this.logger.log(`Processing chapter ${item.maPhan} with CLO distribution:
                CLO1: ${item.clo1}, CLO2: ${item.clo2}, CLO3: ${item.clo3}, CLO4: ${item.clo4}, CLO5: ${item.clo5}`);

            const cloBuckets = questionsByCLOMap.get(item.maPhan)!;
            let allChapterQuestions = chapterQuestionsMap.get(item.maPhan)!;
            const chapterSelectedQuestions: CauHoi[] = [];

            // Helper to select and remove questions from pools to avoid duplicates
            const selectAndRemove = (pool: CauHoi[], count: number, targetCLO?: number): CauHoi[] => {
                if (count <= 0 || pool.length === 0) return [];

                const weightedPool = pool.map(q => ({ question: q, weight: this.calculateQuestionWeight(q, targetCLO) }));
                const newSelections = this.weightedRandomSelection(weightedPool, count);

                // Remove newly selected questions from all available pools for this chapter
                const selectedIds = new Set(newSelections.map(q => q.MaCauHoi));
                if (selectedIds.size > 0) {
                    for (let i = 1; i <= 5; i++) {
                        const bucket = cloBuckets.get(i) || [];
                        cloBuckets.set(i, bucket.filter(q => !selectedIds.has(q.MaCauHoi)));
                    }
                    allChapterQuestions = allChapterQuestions.filter(q => !selectedIds.has(q.MaCauHoi));
                    chapterQuestionsMap.set(item.maPhan, allChapterQuestions);
                }
                return newSelections;
            };

            const cloRequests = [
                { clo: 1, count: item.clo1 },
                { clo: 2, count: item.clo2 },
                { clo: 3, count: item.clo3 },
                { clo: 4, count: item.clo4 },
                { clo: 5, count: item.clo5 },
            ];

            // Primary selection pass
            for (const req of cloRequests) {
                if (req.count > 0) {
                    const primaryPool = cloBuckets.get(req.clo) || [];
                    const selections = selectAndRemove(primaryPool, req.count, req.clo);
                    chapterSelectedQuestions.push(...selections);
                    req.count -= selections.length;
                }
            }

            // Fallback pass for any remaining needs
            for (const req of cloRequests) {
                if (req.count > 0) {
                    this.logger.warn(
                        `Not enough unique questions for CLO ${req.clo} in chapter ${item.maPhan}. ` +
                        `Attempting fallback from remaining chapter questions.`
                    );
                    const selections = selectAndRemove(allChapterQuestions, req.count);
                    chapterSelectedQuestions.push(...selections);
                }
            }

            selectedQuestions.push(...chapterSelectedQuestions);
        }

        this.logger.log(`Selected ${selectedQuestions.length} questions total`);
        return selectedQuestions;
    }

    /**
     * Calculate a weight for each question based on usage history, difficulty, CLO match and quality metrics
     * @param question The question to calculate weight for
     * @param targetCLO The target CLO we're trying to match (for better weighting)
     */
    private calculateQuestionWeight(question: CauHoi, targetCLO?: number): number {
        // Base weight starts at 1.0
        let weight = 1.0;

        // Factor 1: Usage history - prefer less frequently used questions
        // Use inverse logarithmic scaling to decrease weight as usage increases
        const usageCount = question.SoLanDuocThi || 0;
        const usageWeight = usageCount === 0 ? 1.5 : 1 / Math.log2(2 + usageCount);
        weight *= usageWeight;

        // Factor 2: Success rate - prefer questions with moderate success rates
        // Questions that are too easy (high success) or too hard (low success) get lower weights
        if (question.SoLanDuocThi && question.SoLanDuocThi > 0) {
            const successRate = (question.SoLanDung || 0) / question.SoLanDuocThi;
            // Prefer questions with success rates around 0.6-0.8 (bell curve)
            const successWeight = 1 - Math.abs(0.7 - successRate) * 0.5;
            weight *= Math.max(0.5, successWeight); // Don't reduce weight too much
        }

        // Factor 3: Difficulty level - adjust based on question difficulty
        const difficulty = question.CapDo || 3; // Default to medium difficulty
        const difficultyWeight = 1 + (difficulty - 3) * 0.1; // Slight preference for harder questions
        weight *= difficultyWeight;

        // Factor 4: CLO match - strongly prefer questions that match the target CLO
        const questionCLO = question.CLO?.ThuTu || 0;
        if (targetCLO) {
            if (questionCLO === targetCLO) {
                // Exact match gets highest weight
                weight *= 2.0;
            } else if (questionCLO > 0) {
                // Other CLOs get reduced weight based on "distance" from target
                const cloDistance = Math.abs(questionCLO - targetCLO);
                weight *= Math.max(0.3, 1 - cloDistance * 0.2);
            }
        }

        // Factor 5: Answer quality - prefer questions with more answer options
        const answerCount = question.CauTraLoi?.length || 0;
        if (answerCount >= 4) {
            weight *= 1.2; // Bonus for questions with 4+ answers
        } else if (answerCount < 2) {
            weight *= 0.5; // Penalty for questions with < 2 answers
        }

        return weight;
    }

    /**
     * Select items with weighted random selection using reservoir sampling algorithm
     * This ensures diversity while still respecting the weights
     */
    private weightedRandomSelection(items: WeightedQuestion[], count: number): CauHoi[] {
        if (items.length === 0) return [];
        if (items.length <= count) return items.map(item => item.question);

        // Sort by weight descending for initial bias
        items.sort((a, b) => b.weight - a.weight);

        // Use weighted reservoir sampling
        const selected: CauHoi[] = [];
        let totalWeight = 0;

        // First, calculate total weight
        items.forEach(item => {
            totalWeight += item.weight;
        });

        // Then perform weighted selection
        for (let i = 0; i < count; i++) {
            // Choose a random weight value
            let randomWeight = Math.random() * totalWeight;
            let selectedIndex = 0;

            // Find the item at this weight position
            for (let j = 0; j < items.length; j++) {
                randomWeight -= items[j].weight;
                if (randomWeight <= 0) {
                    selectedIndex = j;
                    break;
                }
            }

            // Add the selected item
            selected.push(items[selectedIndex].question);

            // Remove the selected item from the pool and adjust total weight
            totalWeight -= items[selectedIndex].weight;
            items.splice(selectedIndex, 1);
        }

        return selected;
    }

    /**
     * Get a complete exam package with all details for a given exam ID
     */
    async getExamPackage(examId: string): Promise<ExamPackage> {
        const exam = await this.deThiRepository.findOne({
            where: { MaDeThi: examId },
            relations: ['MonHoc'],
        });

        if (!exam) {
            throw new NotFoundException(`Exam with ID ${examId} not found`);
        }

        const questions = await this.getExamQuestionsWithDetails(examId);

        return {
            examId: exam.MaDeThi,
            title: exam.TenDeThi,
            subject: exam.MonHoc ? exam.MonHoc.TenMonHoc : 'N/A',
            createdAt: exam.NgayTao,
            questionCount: questions.length,
            questions: questions,
            pdfUrl: `/de-thi/${exam.MaDeThi}/pdf`,
            docxUrl: `/de-thi/${exam.MaDeThi}/docx`,
            creator: exam.NguoiTao,
        };
    }

    /**
     * Get all exam packages for listing (summary view)
     */
    async getAllExamPackages(): Promise<ExamPackage[]> {
        const exams = await this.deThiRepository.find({
            relations: ['MonHoc', 'ChiTietDeThi'],
            order: { NgayTao: 'DESC' },
        });

        return exams.map(exam => ({
            examId: exam.MaDeThi,
            title: exam.TenDeThi,
            subject: exam.MonHoc ? exam.MonHoc.TenMonHoc : 'N/A',
            createdAt: exam.NgayTao,
            questionCount: exam.ChiTietDeThi ? exam.ChiTietDeThi.length : 0,
            pdfUrl: `/de-thi/${exam.MaDeThi}/pdf`,
            docxUrl: `/de-thi/${exam.MaDeThi}/docx`,
            questions: [], // Not needed for the list view
            creator: exam.NguoiTao,
        }));
    }

    /**
     * Get detailed questions for an exam
     */
    private async getExamQuestionsWithDetails(examId: string): Promise<any[]> {
        // Get exam questions
        const chiTietDeThi = await this.chiTietDeThiRepository.find({
            where: { MaDeThi: examId },
            relations: ['CauHoi', 'Phan'],
            order: { ThuTu: 'ASC' }
        });

        if (chiTietDeThi.length === 0) {
            return [];
        }

        // Get question IDs
        const questionIds = chiTietDeThi.map(item => item.MaCauHoi);

        // Get questions with CLO information
        const questions = await this.cauHoiRepository.find({
            where: { MaCauHoi: In(questionIds) },
            relations: ['CLO']
        });

        // Create a map for quick lookup
        const questionMap = new Map(questions.map(q => [q.MaCauHoi, q]));

        // Get answers for all questions
        const answers = await this.cauTraLoiRepository.find({
            where: { MaCauHoi: In(questionIds) },
            order: { ThuTu: 'ASC' }
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

        // Format questions with their answers
        return chiTietDeThi.map((item, index) => {
            const question = questionMap.get(item.MaCauHoi);
            const questionAnswers = answersMap.get(item.MaCauHoi) || [];

            return {
                id: question?.MaCauHoi,
                number: index + 1,
                content: question?.NoiDung || 'Question content not available',
                chapter: item.Phan?.TenPhan || 'Unknown Chapter',
                chapterId: item.MaPhan,
                clo: question?.CLO?.TenCLO || 'No CLO',
                cloId: question?.MaCLO,
                difficulty: question?.CapDo || 1,
                answers: questionAnswers.map((answer, ansIndex) => ({
                    id: answer.MaCauTraLoi,
                    label: String.fromCharCode(65 + ansIndex), // A, B, C, D...
                    content: answer.NoiDung,
                    isCorrect: answer.LaDapAn
                }))
            };
        });
    }

    private async generateExamDocuments(deThi: DeThi, questions: CauHoi[], shuffleAnswers: boolean): Promise<{ docxPath: string, pdfPath: string }> {
        try {
            // 1. Prepare data for document generation
            const examData = await this.prepareExamData(deThi.MaDeThi, shuffleAnswers);

            // 2. Generate DOCX
            const docxPath = await this.docxTemplateService.generateDocx('DefaultExamTemplate.dotx', examData);
            this.logger.log(`Generated DOCX for exam ${deThi.MaDeThi} at ${docxPath}`);

            // 3. Convert to PDF
            const pdfPath = await this.pdfService.convertDocxToPdf(docxPath);
            this.logger.log(`Converted DOCX to PDF for exam ${deThi.MaDeThi} at ${pdfPath}`);

            // 4. Save file reference (optional, if you track generated files)
            const fileRecord = this.filesRepository.create({
                MaFile: uuidv4(),
                TenFile: path.basename(pdfPath),
                LoaiFile: 1, // 1 for PDF, adjust as needed
            });
            await this.filesRepository.save(fileRecord);

            return { docxPath, pdfPath };
        } catch (error) {
            this.logger.error(`Error generating documents for exam ${deThi.MaDeThi}: ${error.message}`, error.stack);
            throw new Error(`Failed to generate documents for exam ${deThi.MaDeThi}: ${error.message}`);
        }
    }

    private async prepareExamData(deThiId: string, shuffleAnswers: boolean): Promise<any> {
        const deThi = await this.deThiRepository.findOne({ where: { MaDeThi: deThiId }, relations: ['MonHoc'] });

        if (!deThi) {
            throw new Error(`Exam with ID ${deThiId} not found`);
        }

        // Get exam questions
        const chiTietDeThi = await this.chiTietDeThiRepository.find({
            where: { MaDeThi: deThiId },
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
            if (shuffleAnswers && question?.HoanVi) {
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

    private shuffleQuestions(questions: CauHoi[]): CauHoi[] {
        const shuffledQuestions = [...questions];
        shuffledQuestions.sort(() => Math.random() - 0.5);
        return shuffledQuestions;
    }
}
