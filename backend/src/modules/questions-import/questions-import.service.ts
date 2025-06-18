import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
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
    type?: string;
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
        private readonly docxParserService: DocxParserService,
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

    async saveQuestionsToDatabase(
        fileId: string,
        questionIds: string[],
        maPhan?: string,
        questionMetadata?: any[]
    ): Promise<{ success: boolean; savedCount: number }> {
        const session = this.importSessions.get(fileId);
        if (!session) {
            throw new Error(`Import session ${fileId} not found or expired`);
        }

        // Use the section from the session if not provided
        if (!maPhan && session.maPhan) {
            maPhan = session.maPhan;
        }

        if (!maPhan) {
            throw new Error('Section (maPhan) is required to save questions');
        }

        // Filter the questions to save based on the provided IDs
        const questionsToSave = session.questions.filter(q => questionIds.includes(q.id));

        if (questionsToSave.length === 0) {
            return { success: true, savedCount: 0 };
        }

        const queryRunner = this.cauHoiRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            let savedCount = 0;

            // Process each question
            for (const question of questionsToSave) {
                // Check if metadata exists for this question
                const metadata = questionMetadata?.find(meta => meta.id === question.id);
                const clo = metadata?.clo || question.clo;

                // Find CLO ID if it's a string name (like "CLO1")
                let cloId = null;
                if (clo) {
                    try {
                        // If it's already a UUID, use it directly
                        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clo)) {
                            cloId = clo;
                        } else {
                            // Try to find CLO by name (like "CLO1")
                            const cloEntity = await queryRunner.manager.query(
                                `SELECT "MaCLO" FROM "CLO" WHERE "TenCLO" = $1 LIMIT 1`,
                                [clo]
                            );

                            if (cloEntity && cloEntity.length > 0) {
                                cloId = cloEntity[0].MaCLO;
                            }
                        }
                    } catch (err) {
                        this.logger.warn(`Could not find CLO with name ${clo}: ${err.message}`);
                    }
                }

                if (question.type === 'group' && question.childQuestions) {
                    // Create parent group question
                    const parentQuestion = await queryRunner.manager.create(CauHoi, {
                        MaCauHoi: uuidv4(),
                        NoiDung: question.content || '',
                        MaPhan: maPhan,
                        MaCLO: cloId, // Use resolved CLO ID
                        SoCauHoiCon: question.childQuestions.length,
                        HoanVi: true, // Default to true for group questions
                        MaCauHoiCha: null,
                        XoaTamCauHoi: false,
                        NgayTao: new Date(),
                        DoPhanCachCauHoi: question.groupContent || ''
                    } as any);

                    const savedParent = await queryRunner.manager.save(parentQuestion);
                    savedCount++;

                    // Process child questions
                    for (const childQuestion of question.childQuestions) {
                        // Check if child has metadata
                        const childMeta = questionMetadata?.find(meta =>
                            meta.childQuestions?.some(child => child.id === childQuestion.id)
                        )?.childQuestions?.find(child => child.id === childQuestion.id);

                        const childClo = childMeta?.clo || childQuestion.clo;

                        // Find CLO ID for child question
                        let childCloId = null;
                        if (childClo) {
                            try {
                                // If it's already a UUID, use it directly
                                if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(childClo)) {
                                    childCloId = childClo;
                                } else {
                                    // Try to find CLO by name (like "CLO1")
                                    const cloEntity = await queryRunner.manager.query(
                                        `SELECT "MaCLO" FROM "CLO" WHERE "TenCLO" = $1 LIMIT 1`,
                                        [childClo]
                                    );

                                    if (cloEntity && cloEntity.length > 0) {
                                        childCloId = cloEntity[0].MaCLO;
                                    }
                                }
                            } catch (err) {
                                this.logger.warn(`Could not find CLO with name ${childClo}: ${err.message}`);
                            }
                        }

                        // Create child question
                        const childQuestionEntity = await queryRunner.manager.create(CauHoi, {
                            MaCauHoi: uuidv4(),
                            NoiDung: childQuestion.content || '',
                            MaPhan: maPhan,
                            MaCLO: childCloId, // Use resolved CLO ID
                            HoanVi: true, // Default to true
                            MaCauHoiCha: savedParent.MaCauHoi,
                            XoaTamCauHoi: false,
                            NgayTao: new Date()
                        } as any);

                        const savedChild = await queryRunner.manager.save(childQuestionEntity);

                        // Create answers for child question
                        if (childQuestion.answers && childQuestion.answers.length > 0) {
                            for (const answer of childQuestion.answers) {
                                const answerEntity = await queryRunner.manager.create(CauTraLoi, {
                                    MaCauTraLoi: uuidv4(),
                                    MaCauHoi: savedChild.MaCauHoi,
                                    NoiDung: answer.content || '',
                                    ThuTu: answer.order || 0,
                                    LaDapAn: answer.isCorrect || false
                                } as any);

                                await queryRunner.manager.save(answerEntity);
                            }
                        }
                    }
                } else {
                    // Create regular question
                    const regularQuestion = await queryRunner.manager.create(CauHoi, {
                        MaCauHoi: uuidv4(),
                        NoiDung: question.content || '',
                        MaPhan: maPhan,
                        MaCLO: cloId, // Use resolved CLO ID
                        HoanVi: true, // Default to true
                        XoaTamCauHoi: false,
                        NgayTao: new Date()
                    } as any);

                    const savedQuestion = await queryRunner.manager.save(regularQuestion);
                    savedCount++;

                    // Create answers
                    if (question.answers && question.answers.length > 0) {
                        for (const answer of question.answers) {
                            const answerEntity = await queryRunner.manager.create(CauTraLoi, {
                                MaCauTraLoi: uuidv4(),
                                MaCauHoi: savedQuestion.MaCauHoi,
                                NoiDung: answer.content || '',
                                ThuTu: answer.order || 0,
                                LaDapAn: answer.isCorrect || false
                            } as any);

                            await queryRunner.manager.save(answerEntity);
                        }
                    }
                }
            }

            await queryRunner.commitTransaction();
            return { success: true, savedCount };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error saving questions: ${error.message}`, error.stack);
            throw error;
        } finally {
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
