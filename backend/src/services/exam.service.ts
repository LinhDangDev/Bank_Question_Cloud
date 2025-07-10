import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, MoreThan } from 'typeorm';
import * as path from 'path';
import { CauHoi } from '../entities/cau-hoi.entity';
import { CauTraLoi } from '../entities/cau-tra-loi.entity';
import { DeThi } from '../entities/de-thi.entity';
import { ChiTietDeThi } from '../entities/chi-tiet-de-thi.entity';
import { Phan } from '../entities/phan.entity';
import { Files } from '../entities/files.entity';
import { DocxTemplateService } from './docx-template.service';
import { PdfService } from './pdf.service';
import { MediaMarkupUtil } from '../utils/media-markup.util';
import { MediaContentProcessor } from '../utils/media-content-processor.util';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

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
    loaiBoChuongPhan?: boolean;
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
            LoaiBoChuongPhan: examRequest.loaiBoChuongPhan || false, // Add chapter structure flag
        });
        await this.deThiRepository.save(deThi);
        this.logger.log(`Created DeThi package with ID: ${deThi.MaDeThi}`);

        // Create ChiTietDeThi entries with proper ordering for group questions
        const chiTietDeThiEntries = this.createChiTietDeThiEntries(deThi.MaDeThi, questions);
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

        // 1. Select a larger pool of questions for better variation
        const allQuestions = await this.selectQuestionsWithCLOStrategy(examRequest.matrix, soLuongDe);

        // 2. Calculate required questions per exam
        const totalRequiredPerExam = examRequest.matrix.reduce((sum, item) =>
            sum + item.clo1 + item.clo2 + item.clo3 + item.clo4 + item.clo5, 0);

        // 3. Pre-distribute questions across all exams to ensure no overlap
        const examQuestionSets = this.distributeQuestionsAcrossExams(allQuestions, examRequest.matrix, soLuongDe);

        for (let i = 0; i < soLuongDe; i++) {
            const examTitle = soLuongDe > 1 ? `${tenDeThi} - Đề ${i + 1}` : tenDeThi;
            this.logger.log(`Generating exam #${i + 1}: ${examTitle}`);

            // 3. Get pre-distributed questions for this exam
            const selectedQuestions = examQuestionSets[i] || [];

            // Validate that we have questions for this exam
            if (selectedQuestions.length === 0) {
                this.logger.error(`No questions available for exam ${i + 1}. Skipping this exam.`);
                continue;
            }

            // 4. Create DeThi record
            const deThi = this.deThiRepository.create({
                MaDeThi: uuidv4(),
                MaMonHoc: examRequest.maMonHoc,
                TenDeThi: examTitle,
                NgayTao: new Date(),
                DaDuyet: false,
                NguoiTao: examRequest.nguoiTao,
                SoCauHoi: selectedQuestions.length,
                LoaiBoChuongPhan: examRequest.loaiBoChuongPhan || false, // Add chapter structure flag
            });
            await this.deThiRepository.save(deThi);
            this.logger.log(`Created exam record with ID: ${deThi.MaDeThi}`);

            // 5. Create ChiTietDeThi records with proper ordering for group questions
            const chiTietDeThiEntities = this.createChiTietDeThiEntries(deThi.MaDeThi, selectedQuestions);
            await this.chiTietDeThiRepository.save(chiTietDeThiEntities);
            this.logger.log(`Saved ${chiTietDeThiEntities.length} question details for exam ${deThi.MaDeThi}`);

            // 6. Generate DOCX and PDF
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
     * Get child questions for selected parent questions
     * @param parentQuestions Array of parent questions
     * @returns Map of parent question ID to child questions array
     */
    private async getChildQuestionsForParents(parentQuestions: CauHoi[]): Promise<Map<string, CauHoi[]>> {
        const parentIds = parentQuestions
            .filter(q => q.SoCauHoiCon && q.SoCauHoiCon > 0)
            .map(q => q.MaCauHoi);

        if (parentIds.length === 0) {
            return new Map();
        }

        this.logger.log(`Fetching child questions for ${parentIds.length} parent questions`);

        const childQuestions = await this.cauHoiRepository.find({
            where: {
                MaCauHoiCha: In(parentIds),
                XoaTamCauHoi: false
            },
            relations: ['CLO', 'Phan', 'CauTraLoi'],
            select: [
                'MaCauHoi', 'MaPhan', 'MaSoCauHoi', 'NoiDung', 'HoanVi', 'CapDo', 'SoCauHoiCon',
                'DoPhanCachCauHoi', 'MaCauHoiCha', 'XoaTamCauHoi', 'SoLanDuocThi', 'SoLanDung',
                'NgayTao', 'NgaySua', 'MaCLO', 'DoKhoThucTe'
            ]
        });

        // Group child questions by parent ID
        const childQuestionsMap = new Map<string, CauHoi[]>();
        childQuestions.forEach(child => {
            if (!childQuestionsMap.has(child.MaCauHoiCha)) {
                childQuestionsMap.set(child.MaCauHoiCha, []);
            }
            childQuestionsMap.get(child.MaCauHoiCha)!.push(child);
        });

        this.logger.log(`Found child questions for ${childQuestionsMap.size} parent questions`);
        return childQuestionsMap;
    }

    /**
     * Adjust question count for group questions
     * When a parent question is selected, we need to account for its child questions
     * @param selectedQuestions Array of selected questions (including parents)
     * @param childQuestionsMap Map of parent ID to child questions
     * @returns Total effective question count
     */
    private calculateEffectiveQuestionCount(selectedQuestions: CauHoi[], childQuestionsMap: Map<string, CauHoi[]>): number {
        let totalCount = 0;

        selectedQuestions.forEach(question => {
            if (question.SoCauHoiCon && question.SoCauHoiCon > 0) {
                // This is a parent question - count it as 1 + number of children
                const childCount = childQuestionsMap.get(question.MaCauHoi)?.length || 0;
                totalCount += 1 + childCount; // Parent + children
                this.logger.log(`Parent question ${question.MaCauHoi} contributes ${1 + childCount} questions`);
            } else {
                // Regular single question
                totalCount += 1;
            }
        });

        return totalCount;
    }

    /**
     * Validate group question integrity
     * Ensure that selected parent questions have their required child questions
     * @param parentQuestions Array of parent questions
     * @param childQuestionsMap Map of parent ID to child questions
     * @returns Validation result with warnings
     */
    private validateGroupQuestionIntegrity(parentQuestions: CauHoi[], childQuestionsMap: Map<string, CauHoi[]>): {
        isValid: boolean;
        warnings: string[];
    } {
        const warnings: string[] = [];
        let isValid = true;

        parentQuestions.forEach(parent => {
            if (parent.SoCauHoiCon && parent.SoCauHoiCon > 0) {
                const childQuestions = childQuestionsMap.get(parent.MaCauHoi) || [];
                const expectedChildCount = parent.SoCauHoiCon;
                const actualChildCount = childQuestions.length;

                if (actualChildCount !== expectedChildCount) {
                    isValid = false;
                    warnings.push(
                        `Parent question ${parent.MaCauHoi} expects ${expectedChildCount} children but has ${actualChildCount}`
                    );
                }
            }
        });

        return { isValid, warnings };
    }

    /**
     * Enhanced CLO-Stratified Weighted Random Sampling Algorithm
     * This algorithm ensures balanced distribution across chapters and CLOs
     * with multiple fallback strategies to guarantee question selection
     * Now supports group questions (parent-child relationships)
     * UPDATED: Added duplicate prevention across different exam extractions
     */
    private async selectQuestionsWithCLOStrategy(matrix: ExamMatrixItem[], multiplier: number = 1): Promise<CauHoi[]> {
        const selectedQuestions: CauHoi[] = [];
        this.logger.log(`Starting enhanced CLO-Stratified Weighted Random Sampling for ${matrix.length} chapters with duplicate prevention`);

        try {
            // Phase 1: Get recently used questions to avoid duplicates
            const recentlyUsedQuestions = await this.getRecentlyUsedQuestions();
            this.logger.log(`Found ${recentlyUsedQuestions.size} recently used questions to avoid`);

            // Phase 2: Pre-load all available questions for better performance
            const allChapterIds = matrix.map(item => item.maPhan);

            // Thay đổi: Lấy câu hỏi theo từng chương riêng biệt thay vì một câu query lớn
            this.logger.log(`Fetching questions for ${allChapterIds.length} chapters individually`);

            const allQuestions: CauHoi[] = [];

            // Lấy câu hỏi cho từng chương một
            for (const chapterId of allChapterIds) {
                this.logger.log(`Fetching questions for chapter ID: ${chapterId}`);

                const chapterQuestions = await this.cauHoiRepository.find({
                    where: {
                        MaPhan: chapterId,
                        XoaTamCauHoi: false,
                        MaCauHoiCha: IsNull() // Only parent questions
                    },
                    relations: ['CLO', 'Phan', 'CauTraLoi'],
                    select: [
                        'MaCauHoi', 'MaPhan', 'MaSoCauHoi', 'NoiDung', 'HoanVi', 'CapDo', 'SoCauHoiCon',
                        'DoPhanCachCauHoi', 'MaCauHoiCha', 'XoaTamCauHoi', 'SoLanDuocThi', 'SoLanDung',
                        'NgayTao', 'NgaySua', 'MaCLO', 'DoKhoThucTe'
                    ],
                    take: 500 // Giới hạn số câu hỏi tối đa cho mỗi chương
                });

                // Filter out recently used questions to avoid duplicates
                const availableQuestions = chapterQuestions.filter(q => !recentlyUsedQuestions.has(q.MaCauHoi));
                this.logger.log(`Found ${chapterQuestions.length} total questions, ${availableQuestions.length} available (not recently used) for chapter ID: ${chapterId}`);
                allQuestions.push(...availableQuestions);
            }

            this.logger.log(`Total questions loaded across all chapters: ${allQuestions.length}`);

            // Check if we have enough questions for the requested matrix
            const totalRequested = matrix.reduce((sum, item) => sum + item.clo1 + item.clo2 + item.clo3 + item.clo4 + item.clo5, 0) * multiplier;
            if (allQuestions.length < totalRequested * 0.5) { // If less than 50% of required questions available
                this.logger.warn(`Low question availability: ${allQuestions.length} available vs ${totalRequested} requested. Expanding search to include older questions.`);

                // Fallback: Include questions from last 60 days if not enough available
                const expandedQuestions = await this.getExpandedQuestionPool(allChapterIds, recentlyUsedQuestions);
                allQuestions.push(...expandedQuestions);
                this.logger.log(`Expanded question pool to ${allQuestions.length} questions`);
            }

            // Debug: Log sample questions to understand CLO structure
            if (allQuestions.length > 0) {
                const sampleQuestion = allQuestions[0];
                this.logger.log(`Sample question structure: MaCauHoi=${sampleQuestion.MaCauHoi}, MaCLO=${sampleQuestion.MaCLO}, CLO.ThuTu=${sampleQuestion.CLO?.ThuTu}`);
            }

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

                // Map CLO based on ThuTu field from CLO relation
                const cloOrder = question.CLO?.ThuTu || 0;
                this.logger.debug(`Question ${question.MaCauHoi} has CLO order: ${cloOrder}, CLO ID: ${question.MaCLO}`);

                if (cloOrder >= 1 && cloOrder <= 5) {
                    const cloMap = questionsByChapterAndCLO.get(question.MaPhan);
                    if (cloMap) {
                        const cloQuestions = cloMap.get(cloOrder) || [];
                        cloQuestions.push(question);
                        cloMap.set(cloOrder, cloQuestions);
                        this.logger.debug(`Added question to CLO ${cloOrder} for chapter ${question.MaPhan}`);
                    }
                } else {
                    this.logger.warn(`Question ${question.MaCauHoi} has invalid CLO order: ${cloOrder}`);
                }
            }

            // Debug: Log CLO distribution after population
            for (const [chapterId, cloMap] of questionsByChapterAndCLO) {
                this.logger.log(`Chapter ${chapterId} CLO distribution:`);
                for (let i = 1; i <= 5; i++) {
                    const count = cloMap.get(i)?.length || 0;
                    this.logger.log(`  CLO ${i}: ${count} questions`);
                }
            }

            // Phase 2: Select questions for each chapter with multiple strategies
            for (const item of matrix) {
                this.logger.log(`Processing chapter ${item.maPhan} with requirements: CLO1=${item.clo1}, CLO2=${item.clo2}, CLO3=${item.clo3}, CLO4=${item.clo4}, CLO5=${item.clo5}`);

                const chapterSelectedQuestions: CauHoi[] = [];
                const cloMap = questionsByChapterAndCLO.get(item.maPhan);
                const allChapterQuestions = questionsByChapter.get(item.maPhan) || [];

                this.logger.log(`Chapter ${item.maPhan} has ${allChapterQuestions.length} total questions`);

                // Strategy 1: Direct CLO matching (multiply by multiplier for better variation)
                const cloRequirements = [
                    { clo: 1, count: Math.ceil(item.clo1 * multiplier) },
                    { clo: 2, count: Math.ceil(item.clo2 * multiplier) },
                    { clo: 3, count: Math.ceil(item.clo3 * multiplier) },
                    { clo: 4, count: Math.ceil(item.clo4 * multiplier) },
                    { clo: 5, count: Math.ceil(item.clo5 * multiplier) }
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

            this.logger.log(`Total selected parent questions: ${selectedQuestions.length}`);

            if (selectedQuestions.length === 0) {
                this.logger.error('No questions were selected! This indicates a serious issue with the question database.');
                throw new Error('Không thể tìm thấy câu hỏi phù hợp cho ma trận đề thi. Vui lòng kiểm tra lại dữ liệu câu hỏi.');
            }

            // ENHANCED: Handle group questions - get child questions for selected parents
            this.logger.log('Processing group questions...');
            const childQuestionsMap = await this.getChildQuestionsForParents(selectedQuestions);

            // Validate group question integrity
            const parentQuestions = selectedQuestions.filter(q => q.SoCauHoiCon && q.SoCauHoiCon > 0);
            if (parentQuestions.length > 0) {
                const validation = this.validateGroupQuestionIntegrity(parentQuestions, childQuestionsMap);
                if (!validation.isValid) {
                    this.logger.warn('Group question integrity issues found:', validation.warnings);
                    // Log warnings but continue - we'll work with available child questions
                    validation.warnings.forEach(warning => this.logger.warn(warning));
                }
            }

            // Combine parent questions with their child questions
            const allQuestionsWithChildren: CauHoi[] = [];
            selectedQuestions.forEach(question => {
                // Add the parent/single question
                allQuestionsWithChildren.push(question);

                // Add child questions if this is a group question
                if (question.SoCauHoiCon && question.SoCauHoiCon > 0) {
                    const childQuestions = childQuestionsMap.get(question.MaCauHoi) || [];
                    allQuestionsWithChildren.push(...childQuestions);
                    this.logger.log(`Added ${childQuestions.length} child questions for parent ${question.MaCauHoi}`);
                }
            });

            // Calculate effective question count for logging
            const effectiveCount = this.calculateEffectiveQuestionCount(selectedQuestions, childQuestionsMap);
            this.logger.log(`Total questions including children: ${allQuestionsWithChildren.length}`);
            this.logger.log(`Effective question count: ${effectiveCount}`);

            return allQuestionsWithChildren;
        } catch (error) {
            this.logger.error(`Error selecting questions: ${error.message}`, error.stack);
            throw new Error(`Lỗi khi chọn câu hỏi cho đề thi: ${error.message}`);
        }
    }

    /**
     * Get recently used questions to avoid duplicates in new exam extractions
     * Returns Set of question IDs that have been used in exams created within the last 30 days
     */
    private async getRecentlyUsedQuestions(): Promise<Set<string>> {
        try {
            // Get exams created in the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentExams = await this.deThiRepository.find({
                where: {
                    NgayTao: MoreThan(thirtyDaysAgo)
                },
                select: ['MaDeThi']
            });

            if (recentExams.length === 0) {
                this.logger.log('No recent exams found, no questions to exclude');
                return new Set<string>();
            }

            const recentExamIds = recentExams.map(exam => exam.MaDeThi);
            this.logger.log(`Found ${recentExamIds.length} recent exams to check for used questions`);

            // Get all questions used in these recent exams
            const usedQuestionDetails = await this.chiTietDeThiRepository.find({
                where: {
                    MaDeThi: In(recentExamIds)
                },
                select: ['MaCauHoi']
            });

            const usedQuestionIds = new Set(usedQuestionDetails.map(detail => detail.MaCauHoi));
            this.logger.log(`Found ${usedQuestionIds.size} unique questions used in recent exams`);

            return usedQuestionIds;
        } catch (error) {
            this.logger.error(`Error getting recently used questions: ${error.message}`, error.stack);
            // Return empty set on error to avoid blocking exam generation
            return new Set<string>();
        }
    }

    /**
     * Get expanded question pool when not enough fresh questions are available
     * Includes questions used in the last 60 days but prioritizes less recently used ones
     */
    private async getExpandedQuestionPool(chapterIds: string[], recentlyUsedQuestions: Set<string>): Promise<CauHoi[]> {
        try {
            const expandedQuestions: CauHoi[] = [];

            // Get questions from last 60 days (but older than 30 days)
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const olderExams = await this.deThiRepository.find({
                where: {
                    NgayTao: MoreThan(sixtyDaysAgo)
                },
                select: ['MaDeThi', 'NgayTao']
            });

            if (olderExams.length > 0) {
                const olderExamIds = olderExams.map(exam => exam.MaDeThi);

                const olderUsedQuestions = await this.chiTietDeThiRepository.find({
                    where: {
                        MaDeThi: In(olderExamIds)
                    },
                    select: ['MaCauHoi']
                });

                const olderUsedQuestionIds = new Set(olderUsedQuestions.map(detail => detail.MaCauHoi));

                // Get these older questions with full details
                for (const chapterId of chapterIds) {
                    const chapterQuestions = await this.cauHoiRepository.find({
                        where: {
                            MaPhan: chapterId,
                            XoaTamCauHoi: false,
                            MaCauHoiCha: IsNull(),
                            MaCauHoi: In(Array.from(olderUsedQuestionIds))
                        },
                        relations: ['CLO', 'Phan', 'CauTraLoi'],
                        select: [
                            'MaCauHoi', 'MaPhan', 'MaSoCauHoi', 'NoiDung', 'HoanVi', 'CapDo', 'SoCauHoiCon',
                            'DoPhanCachCauHoi', 'MaCauHoiCha', 'XoaTamCauHoi', 'SoLanDuocThi', 'SoLanDung',
                            'NgayTao', 'NgaySua', 'MaCLO', 'DoKhoThucTe'
                        ],
                        take: 100
                    });

                    // Filter out questions used in the last 30 days
                    const availableOlderQuestions = chapterQuestions.filter(q => !recentlyUsedQuestions.has(q.MaCauHoi));
                    expandedQuestions.push(...availableOlderQuestions);
                }
            }

            this.logger.log(`Found ${expandedQuestions.length} additional questions from expanded search`);
            return expandedQuestions;
        } catch (error) {
            this.logger.error(`Error getting expanded question pool: ${error.message}`, error.stack);
            return [];
        }
    }

    /**
     * Create ChiTietDeThi entries with proper ordering for group questions
     * This method ensures that parent questions and their children maintain proper sequence
     * @param examId The exam ID
     * @param questions Array of questions (including both parent and child questions)
     * @returns Array of ChiTietDeThi entities ready to be saved
     */
    private createChiTietDeThiEntries(examId: string, questions: CauHoi[]): any[] {
        const entries: any[] = [];
        let currentOrder = 1;

        // Group questions by parent-child relationship
        const parentQuestions: CauHoi[] = [];
        const childQuestionsMap = new Map<string, CauHoi[]>();

        questions.forEach(question => {
            if (!question.MaCauHoiCha) {
                // This is a parent question (or single question)
                parentQuestions.push(question);
            } else {
                // This is a child question
                if (!childQuestionsMap.has(question.MaCauHoiCha)) {
                    childQuestionsMap.set(question.MaCauHoiCha, []);
                }
                childQuestionsMap.get(question.MaCauHoiCha)!.push(question);
            }
        });

        // Sort child questions by their original order (MaSoCauHoi or creation date)
        childQuestionsMap.forEach((children, parentId) => {
            children.sort((a, b) => {
                // Sort by MaSoCauHoi if available, otherwise by creation date
                if (a.MaSoCauHoi && b.MaSoCauHoi) {
                    return a.MaSoCauHoi - b.MaSoCauHoi;
                }
                return new Date(a.NgayTao).getTime() - new Date(b.NgayTao).getTime();
            });
        });

        // Create entries in proper order: parent first, then its children
        parentQuestions.forEach(parent => {
            // Add parent question
            entries.push(this.chiTietDeThiRepository.create({
                MaDeThi: examId,
                MaPhan: parent.MaPhan,
                MaCauHoi: parent.MaCauHoi,
                ThuTu: currentOrder++,
            }));

            // Add child questions if this is a group question
            const childQuestions = childQuestionsMap.get(parent.MaCauHoi);
            if (childQuestions && childQuestions.length > 0) {
                childQuestions.forEach(child => {
                    entries.push(this.chiTietDeThiRepository.create({
                        MaDeThi: examId,
                        MaPhan: child.MaPhan,
                        MaCauHoi: child.MaCauHoi,
                        ThuTu: currentOrder++,
                    }));
                });
            }
        });

        this.logger.log(`Created ${entries.length} ChiTietDeThi entries with proper ordering`);
        return entries;
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
        if (question.DoKhoThucTe !== null && question.DoKhoThucTe !== undefined) {
            // Use real difficulty metrics when available (preferred method)
            const realDifficulty = question.DoKhoThucTe;
            // Prefer questions with real difficulty around 0.5-0.7 (bell curve)
            const distanceFromOptimal = Math.abs(0.6 - realDifficulty);
            const difficultyWeight = Math.max(0.3, 1 - distanceFromOptimal * 1.2);
            weight *= difficultyWeight;
        } else if (question.SoLanDuocThi && question.SoLanDuocThi > 0) {
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
        // Only use declared difficulty if we don't have real difficulty data
        if (question.DoKhoThucTe === null || question.DoKhoThucTe === undefined) {
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
        }

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
                content: MediaMarkupUtil.convertMediaMarkupToHtml(question?.NoiDung || 'Question content not available'),
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
            const docxPath = await this.docxTemplateService.generateDocx('TemplateHutech.dotx', examData);
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
        const deThi = await this.deThiRepository.findOne({
            where: { MaDeThi: deThiId },
            relations: ['MonHoc']
        });

        if (!deThi) {
            throw new Error(`Exam with ID ${deThiId} not found`);
        }

        // Get exam questions with chapter information
        const chiTietDeThi = await this.chiTietDeThiRepository.find({
            where: { MaDeThi: deThiId },
            relations: ['Phan'], // Include Phan relationship for chapter info
            order: { ThuTu: 'ASC' },
        });

        // Get question IDs
        const questionIds = chiTietDeThi.map(item => item.MaCauHoi);

        // Get questions with content and CLO information
        const questions = await this.cauHoiRepository.find({
            where: { MaCauHoi: In(questionIds) },
            relations: ['CLO'], // Include CLO relationship
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

            // Get correct answer information
            const correctAnswers = questionAnswers
                .filter(answer => answer.LaDapAn)
                .map((answer, idx) => String.fromCharCode(65 + questionAnswers.findIndex(a => a.MaCauTraLoi === answer.MaCauTraLoi)));

            // Format answers for template
            const formattedAnswers = questionAnswers.map((answer, ansIndex) => ({
                label: String.fromCharCode(65 + ansIndex), // A, B, C, D...
                text: answer.NoiDung,
                isCorrect: answer.LaDapAn,
            }));

            return {
                number: index + 1,
                text: MediaContentProcessor.processMediaContentForDocument(question?.NoiDung || 'Không có nội dung'),
                answers: formattedAnswers.map(answer => ({
                    ...answer,
                    text: MediaContentProcessor.processMediaContentForDocument(answer.text)
                })),
                correctAnswer: correctAnswers.join(', '), // Include correct answer information
                clo: question?.CLO?.TenCLO || '', // Use CLO name instead of CLO code
                difficulty: question?.CapDo || 1,
                // Include chapter information only if not LoaiBoChuongPhan
                chapter: deThi.LoaiBoChuongPhan ? null : {
                    name: chiTietDeThi.find(ct => ct.MaCauHoi === question?.MaCauHoi)?.Phan?.TenPhan || '',
                    id: chiTietDeThi.find(ct => ct.MaCauHoi === question?.MaCauHoi)?.MaPhan || ''
                }
            };
        });

        // Prepare template data
        return {
            title: deThi.TenDeThi,
            subject: deThi.MonHoc?.TenMonHoc || 'Không có tên môn học',
            date: new Date().toLocaleDateString('vi-VN'),
            questions: questionsList,
            hasAnswers: true, // Flag to indicate answers are included
            hideChapterStructure: deThi.LoaiBoChuongPhan, // Flag to control chapter display
        };
    }

    private shuffleQuestions(questions: CauHoi[]): CauHoi[] {
        const shuffledQuestions = [...questions];
        shuffledQuestions.sort(() => Math.random() - 0.5);
        return shuffledQuestions;
    }

    /**
     * Distribute questions across multiple exams to ensure no overlap and fair distribution
     */
    private distributeQuestionsAcrossExams(
        allQuestions: CauHoi[],
        matrix: ExamMatrixItem[],
        numberOfExams: number
    ): CauHoi[][] {
        const examQuestionSets: CauHoi[][] = Array.from({ length: numberOfExams }, () => []);
        const usedQuestionIds = new Set<string>();

        // Group questions by chapter and CLO
        const questionsByChapterCLO = new Map<string, CauHoi[]>();
        allQuestions.forEach(question => {
            const key = `${question.MaPhan}-${question.MaCLO}`;
            if (!questionsByChapterCLO.has(key)) {
                questionsByChapterCLO.set(key, []);
            }
            questionsByChapterCLO.get(key)!.push(question);
        });

        // Distribute questions for each matrix requirement
        matrix.forEach(matrixItem => {
            const cloRequirements = [
                { clo: 1, count: matrixItem.clo1 },
                { clo: 2, count: matrixItem.clo2 },
                { clo: 3, count: matrixItem.clo3 },
                { clo: 4, count: matrixItem.clo4 },
                { clo: 5, count: matrixItem.clo5 }
            ];

            cloRequirements.forEach(({ clo, count }) => {
                if (count > 0) {
                    const key = `${matrixItem.maPhan}-${clo}`;
                    const availableQuestions = questionsByChapterCLO.get(key) || [];

                    // Filter out already used questions
                    const unusedQuestions = availableQuestions.filter(q => !usedQuestionIds.has(q.MaCauHoi));

                    if (unusedQuestions.length >= count * numberOfExams) {
                        // Enough questions for all exams - distribute evenly
                        const shuffled = this.shuffleQuestions(unusedQuestions);

                        for (let examIndex = 0; examIndex < numberOfExams; examIndex++) {
                            for (let i = 0; i < count; i++) {
                                const questionIndex = examIndex * count + i;
                                if (questionIndex < shuffled.length) {
                                    const question = shuffled[questionIndex];
                                    examQuestionSets[examIndex].push(question);
                                    usedQuestionIds.add(question.MaCauHoi);
                                }
                            }
                        }
                    } else if (unusedQuestions.length > 0) {
                        // Not enough questions - distribute what we have
                        const shuffled = this.shuffleQuestions(unusedQuestions);
                        let questionIndex = 0;

                        for (let examIndex = 0; examIndex < numberOfExams; examIndex++) {
                            for (let i = 0; i < count && questionIndex < shuffled.length; i++) {
                                const question = shuffled[questionIndex % shuffled.length];
                                examQuestionSets[examIndex].push(question);
                                usedQuestionIds.add(question.MaCauHoi);
                                questionIndex++;
                            }
                        }

                        this.logger.warn(`Limited questions available for chapter ${matrixItem.maPhan}, CLO ${clo}. Available: ${unusedQuestions.length}, Required: ${count * numberOfExams}`);
                    } else {
                        this.logger.error(`No questions available for chapter ${matrixItem.maPhan}, CLO ${clo}`);
                    }
                }
            });
        });

        // Log distribution results
        examQuestionSets.forEach((questions, index) => {
            this.logger.log(`Exam ${index + 1} will have ${questions.length} questions`);
        });

        return examQuestionSets;
    }

    /**
     * Select questions for a specific exam version with better variation
     * This method ensures different exams have different questions when possible
     */
    private selectQuestionsForExamVersion(
        allQuestions: CauHoi[],
        matrix: ExamMatrixItem[],
        examIndex: number,
        totalExams: number
    ): CauHoi[] {
        const selectedQuestions: CauHoi[] = [];
        const usedQuestionIds = new Set<string>();

        // Group questions by chapter and CLO
        const questionsByChapterCLO = new Map<string, CauHoi[]>();

        allQuestions.forEach(question => {
            const key = `${question.MaPhan}-${question.MaCLO}`;
            if (!questionsByChapterCLO.has(key)) {
                questionsByChapterCLO.set(key, []);
            }
            questionsByChapterCLO.get(key)!.push(question);
        });

        // For each matrix item, select questions with variation
        matrix.forEach(matrixItem => {
            const cloRequirements = [
                { clo: 1, count: matrixItem.clo1 },
                { clo: 2, count: matrixItem.clo2 },
                { clo: 3, count: matrixItem.clo3 },
                { clo: 4, count: matrixItem.clo4 },
                { clo: 5, count: matrixItem.clo5 }
            ];

            cloRequirements.forEach(({ clo, count }) => {
                if (count > 0) {
                    const key = `${matrixItem.maPhan}-${clo}`;
                    const availableQuestions = questionsByChapterCLO.get(key) || [];

                    // Filter out already used questions
                    const unusedQuestions = availableQuestions.filter(q => !usedQuestionIds.has(q.MaCauHoi));

                    if (unusedQuestions.length > 0) {
                        // Shuffle and select questions with offset for variation
                        const shuffled = this.shuffleQuestions(unusedQuestions);
                        const startIndex = (examIndex * count) % shuffled.length;

                        for (let i = 0; i < count && selectedQuestions.length < count; i++) {
                            const questionIndex = (startIndex + i) % shuffled.length;
                            const selectedQuestion = shuffled[questionIndex];

                            if (!usedQuestionIds.has(selectedQuestion.MaCauHoi)) {
                                selectedQuestions.push(selectedQuestion);
                                usedQuestionIds.add(selectedQuestion.MaCauHoi);
                            }
                        }
                    } else {
                        // If no unused questions available, log warning
                        this.logger.warn(`No unused questions available for chapter ${matrixItem.maPhan}, CLO ${clo} in exam version ${examIndex + 1}`);
                    }
                }
            });
        });

        this.logger.log(`Selected ${selectedQuestions.length} questions for exam version ${examIndex + 1}`);

        // Final shuffle of selected questions
        return this.shuffleQuestions(selectedQuestions);
    }

    /**
     * Generate a custom PDF from provided data
     * @param data Object containing title, instructions, and questions data
     * @returns Object with the generated PDF file path
     */
    async generateCustomPdf(data: any): Promise<{ filePath: string }> {
        this.logger.log(`Generating custom PDF for: ${data.title}`);

        try {
            // Check if examId is provided for extracting real questions
            if (data.examId) {
                this.logger.log(`Using real questions from exam ID: ${data.examId}`);
                return await this.generateExamPdfFromId(data.examId, data.title, data.instructions);
            }

            // Create a unique filename for the PDF
            const fileName = `custom_${Date.now()}_${uuidv4()}`;
            const outputDir = path.join(process.cwd(), '..', 'output');
            const pdfPath = path.join(outputDir, `${fileName}.pdf`);

            if (!Array.isArray(data.questions) || data.questions.length === 0) {
                throw new Error('No questions provided for PDF generation');
            }

            // Ensure output directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Generate the PDF using PDF service
            await this.pdfService.generateCustomPdf(pdfPath, data);

            this.logger.log(`Custom PDF generated successfully at ${pdfPath}`);

            return { filePath: pdfPath };
        } catch (error) {
            this.logger.error(`Error generating custom PDF: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Generate a PDF from an actual exam ID
     * @param examId The ID of the exam to use for questions
     * @param title Custom title (optional)
     * @param instructions Custom instructions (optional)
     * @returns Object with the generated PDF file path
     */
    private async generateExamPdfFromId(
        examId: string,
        title?: string,
        instructions?: string
    ): Promise<{ filePath: string }> {
        this.logger.log(`Generating PDF from exam ID: ${examId}`);

        // Get the exam details
        const deThi = await this.deThiRepository.findOne({
            where: { MaDeThi: examId },
            relations: ['MonHoc'],
        });

        if (!deThi) {
            throw new Error(`Exam with ID ${examId} not found`);
        }

        // Get questions for the exam
        const chiTietDeThi = await this.chiTietDeThiRepository.find({
            where: { MaDeThi: examId },
            relations: ['Phan', 'CauHoi'],
            order: { ThuTu: 'ASC' },
        });

        if (chiTietDeThi.length === 0) {
            throw new Error(`No questions found for exam ID ${examId}`);
        }

        // Get question IDs
        const questionIds = chiTietDeThi.map(item => item.MaCauHoi);

        // Get all questions with their content
        const questions = await this.cauHoiRepository.find({
            where: { MaCauHoi: In(questionIds) },
            relations: ['CLO'],
        });

        // Create a map for quick lookup
        const questionMap = new Map(questions.map(q => [q.MaCauHoi, q]));

        // Get all answers for these questions
        const answers = await this.cauTraLoiRepository.find({
            where: { MaCauHoi: In(questionIds) },
            order: { ThuTu: 'ASC' },
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

        // Format questions with their answers for the PDF
        const formattedQuestions = chiTietDeThi.map((item, index) => {
            const question = questionMap.get(item.MaCauHoi);
            const questionAnswers = answersMap.get(item.MaCauHoi) || [];

            return {
                number: index + 1,
                content: question?.NoiDung || 'Nội dung câu hỏi không có sẵn',
                options: questionAnswers.map((answer, idx) => ({
                    label: String.fromCharCode(65 + idx), // A, B, C, D...
                    content: answer.NoiDung,
                    isCorrect: answer.LaDapAn
                })),
                topic: item.Phan?.TenPhan || '',
                difficulty: question?.CapDo || 1,
                clo: question?.CLO?.TenCLO || ''
            };
        });

        // Create unique filename
        const fileName = `exam_${examId}_${Date.now()}`;
        const outputDir = path.join(process.cwd(), '..', 'output');
        const pdfPath = path.join(outputDir, `${fileName}.pdf`);

        // Create the PDF data object
        const pdfData = {
            title: title || deThi.TenDeThi,
            subject: deThi.MonHoc?.TenMonHoc || '',
            date: new Date().toLocaleDateString('vi-VN'),
            instructions: instructions || 'Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.',
            questions: formattedQuestions,
        };

        // Generate the PDF
        await this.pdfService.generateCustomPdf(pdfPath, pdfData);

        this.logger.log(`Exam PDF generated successfully at ${pdfPath}`);

        return { filePath: pdfPath };
    }

    /**
     * Generate a custom DOCX from provided data
     * @param data Object containing title, instructions, and questions data
     * @returns Object with the generated DOCX file path
     */
    async generateCustomDocx(data: any): Promise<{ filePath: string }> {
        this.logger.log(`Generating custom DOCX for: ${data.title}`);

        try {
            // Check if examId is provided for extracting real questions
            if (data.examId) {
                this.logger.log(`Using real questions from exam ID: ${data.examId}`);
                return await this.generateExamDocxFromId(data.examId, data.title, data.instructions);
            }

            // If no examId, use the provided questions (but we need to format them properly)
            // Create a unique filename for the DOCX
            const fileName = `custom_${Date.now()}_${uuidv4()}`;
            const outputDir = path.join(process.cwd(), '..', 'output');
            const docxPath = path.join(outputDir, `${fileName}.docx`);

            // Transform the data to the format needed for docx template generation
            const docxData = {
                title: data.title,
                subject: data.subject || 'Môn học tổng hợp',
                date: data.date || new Date().toLocaleDateString('vi-VN'),
                instructions: data.instructions || 'Không có hướng dẫn',
                hasAnswers: true, // Always include answers in custom exports
                questions: data.questions.map((q: any, index: number) => ({
                    number: index + 1,
                    text: q.content,
                    answers: q.options?.map((opt: any, idx: number) => {
                        // Handle both object options and string options
                        if (typeof opt === 'object') {
                            return {
                                label: opt.label || String.fromCharCode(65 + idx),
                                text: opt.content || '',
                                isCorrect: !!opt.isCorrect
                            };
                        } else {
                            return {
                                label: String.fromCharCode(65 + idx),
                                text: opt || '',
                                isCorrect: q.correctAnswerIndex === idx
                            };
                        }
                    }) || [],
                    correctAnswer: q.correctAnswer || String.fromCharCode(65 + (q.correctAnswerIndex || 0)),
                    clo: q.clo || '',
                    difficulty: q.difficulty || 1,
                })),
            };

            // Generate the DOCX file using the template service
            const templatePath = 'TemplateHutech.dotx'; // Use the standard template
            const outputPath = await this.docxTemplateService.generateDocx(templatePath, docxData);

            this.logger.log(`Custom DOCX generated successfully at ${outputPath}`);

            return { filePath: outputPath };
        } catch (error) {
            this.logger.error(`Error generating custom DOCX: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Generate a DOCX from an actual exam ID
     * @param examId The ID of the exam to use for questions
     * @param title Custom title (optional)
     * @param instructions Custom instructions (optional)
     * @returns Object with the generated DOCX file path
     */
    private async generateExamDocxFromId(
        examId: string,
        title?: string,
        instructions?: string
    ): Promise<{ filePath: string }> {
        // This is very similar to prepareExamDataForTemplate in DeThiService
        // Get the exam details
        const deThi = await this.deThiRepository.findOne({
            where: { MaDeThi: examId },
            relations: ['MonHoc'],
        });

        if (!deThi) {
            throw new Error(`Exam with ID ${examId} not found`);
        }

        // Get questions for the exam
        const chiTietDeThi = await this.chiTietDeThiRepository.find({
            where: { MaDeThi: examId },
            relations: ['Phan'],
            order: { ThuTu: 'ASC' },
        });

        if (chiTietDeThi.length === 0) {
            throw new Error(`No questions found for exam ID ${examId}`);
        }

        // Get question IDs
        const questionIds = chiTietDeThi.map(item => item.MaCauHoi);

        // Get all questions with their content
        const questions = await this.cauHoiRepository.find({
            where: { MaCauHoi: In(questionIds) },
            relations: ['CLO'],
        });

        // Create a map for quick lookup
        const questionMap = new Map(questions.map(q => [q.MaCauHoi, q]));

        // Get all answers for these questions
        const answers = await this.cauTraLoiRepository.find({
            where: { MaCauHoi: In(questionIds) },
            order: { ThuTu: 'ASC' },
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

        // Format questions with their answers for the template
        const formattedQuestions = chiTietDeThi.map((item, index) => {
            const question = questionMap.get(item.MaCauHoi);
            const questionAnswers = answersMap.get(item.MaCauHoi) || [];

            // Get correct answers
            const correctAnswers = questionAnswers
                .filter(answer => answer.LaDapAn)
                .map((answer, idx) => String.fromCharCode(65 + questionAnswers.findIndex(a => a.MaCauTraLoi === answer.MaCauTraLoi)));

            return {
                number: index + 1,
                text: MediaMarkupUtil.convertMediaMarkupToHtml(question?.NoiDung || 'Nội dung câu hỏi không có sẵn'),
                answers: questionAnswers.map((answer, idx) => ({
                    label: String.fromCharCode(65 + idx), // A, B, C, D...
                    text: MediaMarkupUtil.convertMediaMarkupToHtml(answer.NoiDung),
                    isCorrect: answer.LaDapAn
                })),
                correctAnswer: correctAnswers.join(', '),
                clo: question?.CLO?.TenCLO || '',
                difficulty: question?.CapDo || 1,
            };
        });

        // Create the template data
        const docxData = {
            title: title || deThi.TenDeThi,
            subject: deThi.MonHoc?.TenMonHoc || 'Không có tên môn học',
            date: new Date().toLocaleDateString('vi-VN'),
            instructions: instructions || 'Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.',
            hasAnswers: true, // Always include answers in custom exports
            questions: formattedQuestions,
        };

        // Generate the DOCX file
        const templatePath = 'TemplateHutech.dotx'; // Use the standard template
        const outputPath = await this.docxTemplateService.generateDocx(templatePath, docxData);

        this.logger.log(`Exam DOCX generated successfully at ${outputPath}`);

        return { filePath: outputPath };
    }
}
