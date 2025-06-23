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

    async generateExamPackage(examRequest: ExamRequest): Promise<DeThi> {
        this.logger.log(`Generating exam package for subject: ${examRequest.maMonHoc}`);

        const questions = await this.selectQuestionsWithCLOStrategy(examRequest.matrix);
        this.logger.log(`Selected ${questions.length} questions.`);

        const totalRequested = examRequest.matrix.reduce((sum, item) => sum + item.clo1 + item.clo2 + item.clo3 + item.clo4 + item.clo5, 0);

        if (questions.length < totalRequested) {
            this.logger.warn(`Could not select all requested questions. Requested: ${totalRequested}, Selected: ${questions.length}`);
            // Decide if you want to throw an error or proceed with fewer questions.
            // For now, we proceed.
        }

        // Create the DeThi entity (exam package)
        const deThi = this.deThiRepository.create({
            MaDeThi: uuidv4(), // Explicitly generate UUID
            TenDeThi: examRequest.tenDeThi,
            MaMonHoc: examRequest.maMonHoc,
            NgayTao: new Date(),
            NguoiTao: examRequest.nguoiTao,
            DaDuyet: false, // Exams are not approved by default
            SoCauHoi: questions.length,
        });
        await this.deThiRepository.save(deThi);
        this.logger.log(`Created DeThi package with ID: ${deThi.MaDeThi}`);

        // Create ChiTietDeThi entries
        const chiTietDeThiEntries = questions.map((question, index) => {
            return this.chiTietDeThiRepository.create({
                MaDeThi: deThi.MaDeThi,
                MaPhan: question.MaPhan,
                MaCauHoi: question.MaCauHoi,
                ThuTu: index + 1,
            });
        });
        await this.chiTietDeThiRepository.save(chiTietDeThiEntries);
        this.logger.log(`Saved ${chiTietDeThiEntries.length} entries to ChiTietDeThi.`);

        return deThi;
    }

    async generateExamDocumentsForPackage(deThiId: string, shuffleAnswers: boolean): Promise<{ docxPath: string, pdfPath: string }> {
        const deThi = await this.deThiRepository.findOne({ where: { MaDeThi: deThiId }, relations: ['ChiTietDeThi', 'ChiTietDeThi.CauHoi'] });
        if (!deThi) {
            throw new NotFoundException(`Exam with ID ${deThiId} not found`);
        }
        const questions = deThi.ChiTietDeThi.map(detail => detail.CauHoi).sort((a, b) => {
            const orderA = deThi.ChiTietDeThi.find(d => d.MaCauHoi === a.MaCauHoi)?.ThuTu || 0;
            const orderB = deThi.ChiTietDeThi.find(d => d.MaCauHoi === b.MaCauHoi)?.ThuTu || 0;
            return orderA - orderB;
        });

        return this.generateExamDocuments(deThi, questions, shuffleAnswers);
    }

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
     * Check question availability for a given matrix
     * This helps users understand if they have enough questions before generating an exam
     */
    async checkQuestionAvailability(matrix: ExamMatrixItem[]): Promise<any> {
        const availability = {
            totalChapters: matrix.length,
            chapters: [] as any[],
            summary: {
                totalRequired: 0,
                totalAvailable: 0,
                canGenerate: true,
                warnings: [] as string[]
            }
        };

        for (const item of matrix) {
            const chapterAvailability = {
                chapterId: item.maPhan,
                required: {
                    clo1: item.clo1,
                    clo2: item.clo2,
                    clo3: item.clo3,
                    clo4: item.clo4,
                    clo5: item.clo5,
                    total: item.clo1 + item.clo2 + item.clo3 + item.clo4 + item.clo5
                },
                available: {
                    clo1: 0,
                    clo2: 0,
                    clo3: 0,
                    clo4: 0,
                    clo5: 0,
                    total: 0
                },
                canFulfill: true,
                warnings: [] as string[]
            };

            // Get questions for this chapter
            const questions = await this.cauHoiRepository.find({
                where: {
                    MaPhan: item.maPhan,
                    XoaTamCauHoi: false,
                    MaCauHoiCha: IsNull()
                },
                relations: ['CLO']
            });

            // Count questions by CLO
            for (const question of questions) {
                const cloOrder = question.CLO?.ThuTu || 0;
                if (cloOrder >= 1 && cloOrder <= 5) {
                    chapterAvailability.available[`clo${cloOrder}` as keyof typeof chapterAvailability.available]++;
                    chapterAvailability.available.total++;
                }
            }

            // Check if requirements can be fulfilled
            for (let i = 1; i <= 5; i++) {
                const required = item[`clo${i}` as keyof ExamMatrixItem] as number;
                const available = chapterAvailability.available[`clo${i}` as keyof typeof chapterAvailability.available] as number;

                if (required > available) {
                    chapterAvailability.canFulfill = false;
                    chapterAvailability.warnings.push(
                        `CLO ${i}: Cần ${required} câu hỏi, chỉ có ${available} câu hỏi khả dụng`
                    );
                }
            }

            // Check total availability
            if (chapterAvailability.required.total > chapterAvailability.available.total) {
                chapterAvailability.canFulfill = false;
                chapterAvailability.warnings.push(
                    `Tổng cộng: Cần ${chapterAvailability.required.total} câu hỏi, chỉ có ${chapterAvailability.available.total} câu hỏi khả dụng`
                );
            }

            availability.chapters.push(chapterAvailability);
            availability.summary.totalRequired += chapterAvailability.required.total;
            availability.summary.totalAvailable += chapterAvailability.available.total;

            if (!chapterAvailability.canFulfill) {
                availability.summary.canGenerate = false;
                availability.summary.warnings.push(
                    `Chương ${item.maPhan}: ${chapterAvailability.warnings.join(', ')}`
                );
            }
        }

        // Add overall warnings
        if (availability.summary.totalRequired > availability.summary.totalAvailable) {
            availability.summary.warnings.push(
                `Tổng quan: Cần ${availability.summary.totalRequired} câu hỏi, chỉ có ${availability.summary.totalAvailable} câu hỏi khả dụng`
            );
        }

        return availability;
    }

    /**
     * Enhanced CLO-Stratified Weighted Random Sampling Algorithm
     * This algorithm ensures balanced distribution across chapters and CLOs
     * with multiple fallback strategies to guarantee question selection
     */
    private async selectQuestionsWithCLOStrategy(matrix: ExamMatrixItem[]): Promise<CauHoi[]> {
        const selectedQuestions: CauHoi[] = [];
        this.logger.log(`Starting enhanced CLO-Stratified Weighted Random Sampling for ${matrix.length} chapters`);

        // Phase 1: Pre-load all available questions for better performance
        const allChapterIds = matrix.map(item => item.maPhan);
        const allQuestions = await this.cauHoiRepository.find({
            where: {
                MaPhan: In(allChapterIds),
                XoaTamCauHoi: false,
                MaCauHoiCha: IsNull() // Only parent questions
            },
            relations: ['CLO', 'Phan', 'CauTraLoi']
        });

        this.logger.log(`Found ${allQuestions.length} total available questions across all chapters`);

        // Group questions by chapter and CLO
        const questionsByChapter = new Map<string, CauHoi[]>();
        const questionsByChapterAndCLO = new Map<string, Map<number, CauHoi[]>>();

        // Initialize structure
        for (const item of matrix) {
            questionsByChapter.set(item.maPhan, []);
            const cloMap = new Map<number, CauHoi[]>();
            for (let i = 1; i <= 5; i++) {
                cloMap.set(i, []);
            }
            questionsByChapterAndCLO.set(item.maPhan, cloMap);
        }

        // Populate the structure
        for (const question of allQuestions) {
            const chapterQuestions = questionsByChapter.get(question.MaPhan) || [];
            chapterQuestions.push(question);
            questionsByChapter.set(question.MaPhan, chapterQuestions);

            const cloOrder = question.CLO?.ThuTu || 0;
            if (cloOrder >= 1 && cloOrder <= 5) {
                const cloMap = questionsByChapterAndCLO.get(question.MaPhan);
                if (cloMap) {
                    const cloQuestions = cloMap.get(cloOrder) || [];
                    cloQuestions.push(question);
                    cloMap.set(cloOrder, cloQuestions);
                }
            }
        }

        // Phase 2: Select questions for each chapter with multiple strategies
        for (const item of matrix) {
            this.logger.log(`Processing chapter ${item.maPhan} with requirements: CLO1=${item.clo1}, CLO2=${item.clo2}, CLO3=${item.clo3}, CLO4=${item.clo4}, CLO5=${item.clo5}`);

            const chapterSelectedQuestions: CauHoi[] = [];
            const cloMap = questionsByChapterAndCLO.get(item.maPhan);
            const allChapterQuestions = questionsByChapter.get(item.maPhan) || [];

            this.logger.log(`Chapter ${item.maPhan} has ${allChapterQuestions.length} total questions`);

            // Strategy 1: Direct CLO matching
            const cloRequirements = [
                { clo: 1, count: item.clo1 },
                { clo: 2, count: item.clo2 },
                { clo: 3, count: item.clo3 },
                { clo: 4, count: item.clo4 },
                { clo: 5, count: item.clo5 }
            ];

            for (const req of cloRequirements) {
                if (req.count > 0) {
                    const availableQuestions = cloMap?.get(req.clo) || [];
                    this.logger.log(`CLO ${req.clo} has ${availableQuestions.length} available questions, need ${req.count}`);

                    if (availableQuestions.length > 0) {
                        const selected = this.weightedRandomSelection(
                            availableQuestions.map(q => ({ question: q, weight: this.calculateQuestionWeight(q, req.clo) })),
                            Math.min(req.count, availableQuestions.length)
                        );
                        chapterSelectedQuestions.push(...selected);
                        req.count -= selected.length;

                        // Remove selected questions from all pools
                        const selectedIds = new Set(selected.map(q => q.MaCauHoi));
                        this.removeQuestionsFromPools(questionsByChapterAndCLO, item.maPhan, selectedIds);
                        this.removeQuestionsFromPool(questionsByChapter, item.maPhan, selectedIds);
                    }
                }
            }

            // Strategy 2: Fallback to any available questions in the chapter
            const remainingRequirements = cloRequirements.filter(req => req.count > 0);
            if (remainingRequirements.length > 0) {
                this.logger.log(`Fallback needed for chapter ${item.maPhan}. Remaining requirements:`, remainingRequirements);

                const totalRemaining = remainingRequirements.reduce((sum, req) => sum + req.count, 0);
                const availableQuestions = questionsByChapter.get(item.maPhan) || [];

                if (availableQuestions.length > 0) {
                    const fallbackSelected = this.weightedRandomSelection(
                        availableQuestions.map(q => ({ question: q, weight: this.calculateQuestionWeight(q) })),
                        Math.min(totalRemaining, availableQuestions.length)
                    );

                    chapterSelectedQuestions.push(...fallbackSelected);

                    // Remove selected questions from all pools
                    const selectedIds = new Set(fallbackSelected.map(q => q.MaCauHoi));
                    this.removeQuestionsFromPools(questionsByChapterAndCLO, item.maPhan, selectedIds);
                    this.removeQuestionsFromPool(questionsByChapter, item.maPhan, selectedIds);
                }
            }

            // Strategy 3: Cross-chapter fallback if still no questions
            const finalRequirements = cloRequirements.filter(req => req.count > 0);
            if (finalRequirements.length > 0) {
                this.logger.warn(`Cross-chapter fallback needed for chapter ${item.maPhan}. Final requirements:`, finalRequirements);

                const totalFinal = finalRequirements.reduce((sum, req) => sum + req.count, 0);
                const allAvailableQuestions = Array.from(questionsByChapter.values()).flat();

                if (allAvailableQuestions.length > 0) {
                    const crossChapterSelected = this.weightedRandomSelection(
                        allAvailableQuestions.map(q => ({ question: q, weight: this.calculateQuestionWeight(q) })),
                        Math.min(totalFinal, allAvailableQuestions.length)
                    );

                    chapterSelectedQuestions.push(...crossChapterSelected);

                    // Remove selected questions from all pools
                    const selectedIds = new Set(crossChapterSelected.map(q => q.MaCauHoi));
                    for (const chapterId of allChapterIds) {
                        this.removeQuestionsFromPools(questionsByChapterAndCLO, chapterId, selectedIds);
                        this.removeQuestionsFromPool(questionsByChapter, chapterId, selectedIds);
                    }
                }
            }

            this.logger.log(`Selected ${chapterSelectedQuestions.length} questions for chapter ${item.maPhan}`);
            selectedQuestions.push(...chapterSelectedQuestions);
        }

        this.logger.log(`Total selected questions: ${selectedQuestions.length}`);

        if (selectedQuestions.length === 0) {
            this.logger.error('No questions were selected! This indicates a serious issue with the question database.');
            throw new Error('Không thể tìm thấy câu hỏi phù hợp cho ma trận đề thi. Vui lòng kiểm tra lại dữ liệu câu hỏi.');
        }

        return selectedQuestions;
    }

    /**
     * Remove selected questions from CLO-specific pools
     */
    private removeQuestionsFromPools(
        questionsByChapterAndCLO: Map<string, Map<number, CauHoi[]>>,
        chapterId: string,
        selectedIds: Set<string>
    ): void {
        const cloMap = questionsByChapterAndCLO.get(chapterId);
        if (cloMap) {
            for (let i = 1; i <= 5; i++) {
                const questions = cloMap.get(i) || [];
                cloMap.set(i, questions.filter(q => !selectedIds.has(q.MaCauHoi)));
            }
        }
    }

    /**
     * Remove selected questions from general chapter pool
     */
    private removeQuestionsFromPool(
        questionsByChapter: Map<string, CauHoi[]>,
        chapterId: string,
        selectedIds: Set<string>
    ): void {
        const questions = questionsByChapter.get(chapterId) || [];
        questionsByChapter.set(chapterId, questions.filter(q => !selectedIds.has(q.MaCauHoi)));
    }

    /**
     * Enhanced question weight calculation with better metrics and stability
     * @param question The question to calculate weight for
     * @param targetCLO The target CLO we're trying to match (for better weighting)
     */
    private calculateQuestionWeight(question: CauHoi, targetCLO?: number): number {
        // Base weight starts at 1.0
        let weight = 1.0;

        // Factor 1: Usage history - prefer less frequently used questions
        // Use inverse logarithmic scaling to decrease weight as usage increases
        const usageCount = question.SoLanDuocThi || 0;
        let usageWeight = 1.0;
        if (usageCount === 0) {
            usageWeight = 1.5; // Bonus for unused questions
        } else if (usageCount === 1) {
            usageWeight = 1.3; // Bonus for questions used only once
        } else {
            usageWeight = 1 / Math.log2(2 + usageCount);
        }
        weight *= usageWeight;

        // Factor 2: Success rate - prefer questions with moderate success rates
        // Questions that are too easy (high success) or too hard (low success) get lower weights
        if (question.SoLanDuocThi && question.SoLanDuocThi > 0) {
            const successRate = (question.SoLanDung || 0) / question.SoLanDuocThi;
            // Prefer questions with success rates around 0.6-0.8 (bell curve)
            const distanceFromOptimal = Math.abs(0.7 - successRate);
            const successWeight = Math.max(0.3, 1 - distanceFromOptimal * 0.8);
            weight *= successWeight;
        } else {
            // For questions with no usage history, give moderate weight
            weight *= 0.8;
        }

        // Factor 3: Difficulty level - adjust based on question difficulty
        const difficulty = question.CapDo || 3; // Default to medium difficulty
        let difficultyWeight = 1.0;
        if (difficulty >= 1 && difficulty <= 5) {
            // Prefer medium difficulty questions (level 3-4)
            if (difficulty === 3 || difficulty === 4) {
                difficultyWeight = 1.2;
            } else if (difficulty === 2 || difficulty === 5) {
                difficultyWeight = 1.0;
            } else {
                difficultyWeight = 0.8; // Very easy or very hard questions
            }
        }
        weight *= difficultyWeight;

        // Factor 4: CLO match - strongly prefer questions that match the target CLO
        const questionCLO = question.CLO?.ThuTu || 0;
        if (targetCLO && questionCLO > 0) {
            if (questionCLO === targetCLO) {
                // Exact match gets highest weight
                weight *= 3.0;
            } else {
                // Other CLOs get reduced weight based on "distance" from target
                const cloDistance = Math.abs(questionCLO - targetCLO);
                const cloWeight = Math.max(0.2, 1 - cloDistance * 0.3);
                weight *= cloWeight;
            }
        } else if (targetCLO && questionCLO === 0) {
            // Questions without CLO get very low weight when target CLO is specified
            weight *= 0.1;
        }

        // Factor 5: Answer quality - prefer questions with more answer options
        const answerCount = question.CauTraLoi?.length || 0;
        let answerWeight = 1.0;
        if (answerCount >= 4) {
            answerWeight = 1.3; // Bonus for questions with 4+ answers
        } else if (answerCount === 3) {
            answerWeight = 1.1; // Slight bonus for 3 answers
        } else if (answerCount === 2) {
            answerWeight = 0.8; // Penalty for questions with only 2 answers
        } else {
            answerWeight = 0.3; // Heavy penalty for questions with < 2 answers
        }
        weight *= answerWeight;

        // Factor 6: Content quality - prefer questions with substantial content
        const contentLength = question.NoiDung?.length || 0;
        let contentWeight = 1.0;
        if (contentLength > 50) {
            contentWeight = 1.1; // Bonus for substantial content
        } else if (contentLength < 10) {
            contentWeight = 0.7; // Penalty for very short content
        }
        weight *= contentWeight;

        // Factor 7: Question type - prefer standard questions over group questions
        if (question.SoCauHoiCon && question.SoCauHoiCon > 0) {
            weight *= 0.9; // Slight penalty for group questions
        }

        // Ensure weight is within reasonable bounds
        weight = Math.max(0.1, Math.min(10.0, weight));

        return weight;
    }

    /**
     * Enhanced weighted random selection using reservoir sampling with better distribution
     * This ensures diversity while still respecting the weights
     */
    private weightedRandomSelection(items: WeightedQuestion[], count: number): CauHoi[] {
        if (items.length === 0) return [];
        if (items.length <= count) return items.map(item => item.question);

        // Normalize weights to avoid numerical issues
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        if (totalWeight <= 0) {
            // If all weights are zero or negative, use uniform distribution
            const shuffled = [...items].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, count).map(item => item.question);
        }

        const normalizedItems = items.map(item => ({
            ...item,
            weight: item.weight / totalWeight
        }));

        // Use weighted reservoir sampling with replacement prevention
        const selected: CauHoi[] = [];
        const usedIndices = new Set<number>();

        for (let i = 0; i < count; i++) {
            let randomValue = Math.random();
            let selectedIndex = -1;
            let cumulativeWeight = 0;

            // Find the item at this random position
            for (let j = 0; j < normalizedItems.length; j++) {
                if (usedIndices.has(j)) continue; // Skip already selected items

                cumulativeWeight += normalizedItems[j].weight;
                if (randomValue <= cumulativeWeight) {
                    selectedIndex = j;
                    break;
                }
            }

            // Fallback: if no item was selected, pick the first available
            if (selectedIndex === -1) {
                for (let j = 0; j < normalizedItems.length; j++) {
                    if (!usedIndices.has(j)) {
                        selectedIndex = j;
                        break;
                    }
                }
            }

            if (selectedIndex !== -1) {
                selected.push(normalizedItems[selectedIndex].question);
                usedIndices.add(selectedIndex);
            }
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
