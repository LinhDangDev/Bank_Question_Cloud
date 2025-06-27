import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { CauHoiChoDuyet } from '../../entities/cau-hoi-cho-duyet.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocxParserService } from '../../services/docx-parser.service';
import { PaginationDto } from '../../dto/pagination.dto';
import { MulterFile } from '../../interfaces/multer-file.interface';

interface ParseOptions {
    processImages?: boolean;
    limit?: number;
}

export interface ImportedQuestion {
    id: string;
    content: string;
    clo?: string | null;
    cloId?: string | null;
    type?: string;
    questionNumber?: number | string;
    answers?: {
        id: string;
        content: string;
        isCorrect: boolean;
        order: number;
    }[];
    files?: {
        type: string;
        path: string;
    }[];
    childQuestions?: ImportedQuestion[];
    groupContent?: string;
}

interface ImportSession {
    fileId: string;
    filePath: string;
    questions: ImportedQuestion[];
    maPhan?: string;
    createdAt: Date;
}

@Injectable()
export class QuestionsImportService {
    private readonly logger = new Logger(QuestionsImportService.name);
    private importSessions: Map<string, ImportSession> = new Map();
    private readonly sessionExpiryMs = 30 * 60 * 1000; // 30 minutes

    constructor(
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
        @InjectRepository(CauTraLoi)
        private readonly cauTraLoiRepository: Repository<CauTraLoi>,
        @InjectRepository(CauHoiChoDuyet)
        private readonly cauHoiChoDuyetRepository: Repository<CauHoiChoDuyet>,
        private readonly docxParserService: DocxParserService,
        private readonly dataSource: DataSource,
    ) {
        // Start a cleanup timer
        setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000); // Cleanup every 5 minutes
    }

    async parseAndSaveQuestions(
        file: MulterFile,
        maPhan?: string,
        options: ParseOptions = { processImages: true, limit: 100 }
    ): Promise<{ fileId: string; count: number }> {
        // Create a unique ID for this import session
        const fileId = uuidv4();

        // Create a dedicated directory for this import
        const uploadDir = path.join(process.cwd(), 'uploads', 'questions');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Save the uploaded file
        const filePath = path.join(uploadDir, `${fileId}${path.extname(file.originalname)}`);
        fs.writeFileSync(filePath, file.buffer);

        try {
            // Use the DocxParserService to parse the file with Python integration
            const { questions } = await this.docxParserService.processUploadedFile({
                ...file,
                path: filePath // Ensure path is available for direct file access
            });

            this.logger.log(`DocxParserService returned ${questions.length} questions`);

            // Apply any limits to the questions (if specified)
            const limitedQuestions = options.limit && questions.length > options.limit
                ? questions.slice(0, options.limit)
                : questions;

            // Store the parsed questions in the import session
            this.importSessions.set(fileId, {
                fileId,
                filePath,
                questions: limitedQuestions,
                maPhan,
                createdAt: new Date(),
            });

            this.logger.log(`Parsed ${limitedQuestions.length} questions for file ID ${fileId}`);

            // Clean up expired sessions
            this.cleanupExpiredSessions();

            return {
                fileId,
                count: limitedQuestions.length,
            };
        } catch (error) {
            this.logger.error(`Error parsing DOCX file: ${error.message}`, error.stack);
            // Clean up the file if parsing failed
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            throw error;
        }
    }

    // Use our enhanced parser for better question detection
    private async parseDocxWithEnhancedParser(
        filePath: string,
        options: ParseOptions
    ): Promise<ImportedQuestion[]> {
        try {
            // Try to use the Python-based enhanced parser first
            const result = await this.docxParserService.parseDocx(filePath, {
                processImages: options.processImages,
                extractStyles: true
            });

            this.logger.log(`Successfully parsed ${result.length} questions from ${path.basename(filePath)}`);
            return result;
        } catch (error) {
            this.logger.warn(`Enhanced parser failed: ${error.message}, falling back to default...`);

            // If the enhanced parser fails, fall back to the original parser or throw
            throw new Error(`Document parsing failed: ${error.message}`);
        }
    }

    async getImportedQuestions(fileId: string, paginationDto: PaginationDto) {
        const session = this.importSessions.get(fileId);
        if (!session) {
            throw new Error(`Import session ${fileId} not found or expired`);
        }

        const { page = 1, limit = 10 } = paginationDto;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const paginatedQuestions = session.questions.slice(startIndex, endIndex);

        return {
            items: paginatedQuestions,
            meta: {
                total: session.questions.length,
                page,
                limit,
                totalPages: Math.ceil(session.questions.length / limit)
            }
        };
    }

    async saveQuestionsToApprovalQueue(
        fileId: string,
        questionIds: string[],
        maPhan?: string,
        questionMetadata?: any[],
        nguoiTao?: string
    ): Promise<{ success: boolean; savedCount: number }> {
        // Get the import session
        const session = this.importSessions.get(fileId);
        if (!session) {
            throw new Error('Import session not found');
        }

        // Get the selected questions
        const selectedQuestions = session.questions.filter(q => questionIds.includes(q.id));
        if (selectedQuestions.length === 0) {
            throw new Error('No questions selected');
        }

        if (!maPhan) {
            maPhan = session.maPhan;
        }

        if (!maPhan) {
            throw new Error('No section (maPhan) provided');
        }

        if (!nguoiTao) {
            throw new Error('No creator (nguoiTao) provided');
        }

        let savedCount = 0;

        for (const question of selectedQuestions) {
            try {
                // Chuẩn bị dữ liệu câu trả lời
                let duLieuCauTraLoi: string | null = null;
                if (question.answers && question.answers.length > 0) {
                    duLieuCauTraLoi = JSON.stringify(question.answers.map(answer => ({
                        NoiDung: answer.content,
                        ThuTu: answer.order,
                        LaDapAn: answer.isCorrect,
                        HoanVi: true
                    })));
                }

                // Chuẩn bị dữ liệu câu hỏi con
                let duLieuCauHoiCon: string | null = null;
                if (question.childQuestions && question.childQuestions.length > 0) {
                    duLieuCauHoiCon = JSON.stringify(question.childQuestions.map(child => ({
                        MaSoCauHoi: child.questionNumber || Math.floor(Math.random() * 9000) + 1000,
                        NoiDung: child.content,
                        HoanVi: true,
                        CapDo: 2,
                        MaCLO: child.cloId || child.clo,
                        CauTraLoi: child.answers ? child.answers.map(answer => ({
                            NoiDung: answer.content,
                            ThuTu: answer.order,
                            LaDapAn: answer.isCorrect,
                            HoanVi: true
                        })) : []
                    })));
                }

                // Generate question number as string if needed
                const questionNumber = question.questionNumber
                    ? (typeof question.questionNumber === 'number'
                        ? String(question.questionNumber)
                        : question.questionNumber)
                    : String(Math.floor(Math.random() * 9000) + 1000);

                // Handle CLO value with fallback to empty string
                const maCLO = (question.cloId || question.clo || '');

                // Tạo câu hỏi chờ duyệt - create a new entity instance first
                const cauHoiChoDuyet = new CauHoiChoDuyet();

                // Then set properties with proper type handling
                cauHoiChoDuyet.MaPhan = maPhan;
                cauHoiChoDuyet.MaSoCauHoi = questionNumber;
                cauHoiChoDuyet.NoiDung = question.content;
                cauHoiChoDuyet.HoanVi = true;
                cauHoiChoDuyet.CapDo = 2; // Medium difficulty by default
                cauHoiChoDuyet.SoCauHoiCon = question.childQuestions ? question.childQuestions.length : 0;
                cauHoiChoDuyet.XoaTamCauHoi = false;
                cauHoiChoDuyet.SoLanDuocThi = 0;
                cauHoiChoDuyet.SoLanDung = 0;
                cauHoiChoDuyet.NgayTao = new Date();
                cauHoiChoDuyet.MaCLO = maCLO;
                cauHoiChoDuyet.NguoiTao = nguoiTao;
                cauHoiChoDuyet.TrangThai = 0; // Chờ duyệt
                cauHoiChoDuyet.DuLieuCauTraLoi = duLieuCauTraLoi || '';
                cauHoiChoDuyet.DuLieuCauHoiCon = duLieuCauHoiCon || '';

                // Save the entity
                await this.cauHoiChoDuyetRepository.save(cauHoiChoDuyet);
                savedCount++;
            } catch (error) {
                this.logger.error(`Error saving question ${question.id} to approval queue: ${error.message}`);
                throw error;
            }
        }

        return { success: true, savedCount };
    }

    async saveQuestionsToDatabase(
        fileId: string,
        questionIds: string[],
        maPhan?: string,
        questionMetadata?: any[]
    ): Promise<{ success: boolean; savedCount: number }> {
        // Get the import session
        const session = this.importSessions.get(fileId);
        if (!session) {
            throw new Error('Import session not found');
        }

        // Get the selected questions
        const selectedQuestions = session.questions.filter(q => questionIds.includes(q.id));
        if (selectedQuestions.length === 0) {
            throw new Error('No questions selected');
        }

        if (!maPhan) {
            maPhan = session.maPhan;
        }

        // If still no maPhan, throw error
        if (!maPhan) {
            throw new Error('No section (maPhan) provided');
        }

        // Start transaction
        const queryRunner = this.cauHoiRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            let savedCount = 0;

            // Process each question
            for (const question of selectedQuestions) {
                try {
                    // Get CLO if provided in metadata
                    let cloid = null;
                    if (questionMetadata) {
                        const meta = questionMetadata.find(m => m.id === question.id);
                        if (meta && meta.clo) {
                            try {
                                // Find CLO by name - using raw query to work with SQL Server
                                const cloResult = await queryRunner.manager.query(
                                    `SELECT TOP 1 "MaCLO" FROM "CLO" WHERE "TenCLO" = @0`,
                                    [meta.clo]
                                );

                                if (cloResult && cloResult.length > 0) {
                                    cloid = cloResult[0].MaCLO;
                                } else {
                                    this.logger.warn(`Could not find CLO with name ${meta.clo}`);
                                }
                            } catch (error) {
                                this.logger.warn(`Could not find CLO with name ${meta.clo}: ${error.message}`);
                            }
                        }
                    }

                    // Check if question already exists
                    const existingQuestion = await queryRunner.manager.query(
                        `SELECT TOP 1 "CauHoi"."MaCauHoi" FROM "CauHoi" "CauHoi" WHERE "CauHoi"."MaCauHoi" = @0`,
                        [question.id]
                    );

                    // Generate random question number between 1000 and 9999
                    const questionNumber = Math.floor(Math.random() * 9000) + 1000;

                    // Create the question
                    if (!existingQuestion || existingQuestion.length === 0) {
                        // Insert new question with the generated question number
                        await queryRunner.manager.query(
                            `INSERT INTO "CauHoi"("MaCauHoi", "MaPhan", "MaSoCauHoi", "NoiDung", "HoanVi", "CapDo", "SoCauHoiCon", "DoPhanCachCauHoi", "MaCauHoiCha", "XoaTamCauHoi", "SoLanDuocThi", "SoLanDung", "NgayTao", "NgaySua", "MaCLO")
                            VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)`,
                            [
                                question.id,
                                maPhan,
                                questionNumber, // Use the generated number
                                question.content,
                                1, // HoanVi
                                2, // CapDo (medium difficulty by default)
                                question.childQuestions ? question.childQuestions.length : 0,
                                null, // DoPhanCachCauHoi
                                null, // MaCauHoiCha
                                0, // XoaTamCauHoi
                                0, // SoLanDuocThi
                                0, // SoLanDung
                                new Date(),
                                null, // NgaySua
                                cloid
                            ]
                        );

                        // Save answers if present
                        if (question.answers && question.answers.length > 0) {
                            for (const answer of question.answers) {
                                await queryRunner.manager.query(
                                    `INSERT INTO "CauTraLoi"("MaCauTraLoi", "MaCauHoi", "NoiDung", "ThuTu", "LaDapAn", "HoanVi")
                                    VALUES (@0, @1, @2, @3, @4, @5)`,
                                    [
                                        answer.id,
                                        question.id,
                                        answer.content,
                                        answer.order,
                                        answer.isCorrect ? 1 : 0,
                                        1 // HoanVi
                                    ]
                                );
                            }
                        }

                        // Process child questions if present (for group questions)
                        if (question.childQuestions && question.childQuestions.length > 0) {
                            for (const [index, childQuestion] of question.childQuestions.entries()) {
                                // Generate random number for child question
                                const childQuestionNumber = Math.floor(Math.random() * 9000) + 1000;

                                await queryRunner.manager.query(
                                    `INSERT INTO "CauHoi"("MaCauHoi", "MaPhan", "MaSoCauHoi", "NoiDung", "HoanVi", "CapDo", "SoCauHoiCon", "DoPhanCachCauHoi", "MaCauHoiCha", "XoaTamCauHoi", "SoLanDuocThi", "SoLanDung", "NgayTao", "NgaySua", "MaCLO")
                                    VALUES (@0, @1, @2, @3, @4, @5, @6, @7, @8, @9, @10, @11, @12, @13, @14)`,
                                    [
                                        childQuestion.id,
                                        maPhan,
                                        childQuestionNumber, // Use generated number
                                        childQuestion.content,
                                        1, // HoanVi
                                        2, // CapDo
                                        0, // SoCauHoiCon
                                        null, // DoPhanCachCauHoi
                                        question.id, // Parent question ID
                                        0, // XoaTamCauHoi
                                        0, // SoLanDuocThi
                                        0, // SoLanDung
                                        new Date(),
                                        null, // NgaySua
                                        cloid
                                    ]
                                );

                                // Save child question answers
                                if (childQuestion.answers && childQuestion.answers.length > 0) {
                                    for (const answer of childQuestion.answers) {
                                        await queryRunner.manager.query(
                                            `INSERT INTO "CauTraLoi"("MaCauTraLoi", "MaCauHoi", "NoiDung", "ThuTu", "LaDapAn", "HoanVi")
                                            VALUES (@0, @1, @2, @3, @4, @5)`,
                                            [
                                                answer.id,
                                                childQuestion.id,
                                                answer.content,
                                                answer.order,
                                                answer.isCorrect ? 1 : 0,
                                                1 // HoanVi
                                            ]
                                        );
                                    }
                                }
                            }
                        }

                        savedCount++;
                    }
                } catch (error) {
                    this.logger.error(`Error saving question ${question.id}: ${error.message}`);
                    throw error; // Re-throw to trigger rollback
                }
            }

            // Commit transaction
            await queryRunner.commitTransaction();
            return { success: true, savedCount };

        } catch (error) {
            // Rollback transaction on error
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error saving questions: ${error.message}`);
            throw error;
        } finally {
            // Release queryRunner
            await queryRunner.release();
        }
    }

    private cleanupExpiredSessions() {
        const now = Date.now();
        for (const [fileId, session] of this.importSessions.entries()) {
            if (now - session.createdAt.getTime() > this.sessionExpiryMs) {
                // Delete the file
                if (fs.existsSync(session.filePath)) {
                    try {
                        fs.unlinkSync(session.filePath);
                    } catch (error) {
                        this.logger.warn(`Error deleting file ${session.filePath}: ${error.message}`);
                    }
                }
                // Remove the session
                this.importSessions.delete(fileId);
                this.logger.log(`Cleaned up expired import session ${fileId}`);
            }
        }
    }
}
