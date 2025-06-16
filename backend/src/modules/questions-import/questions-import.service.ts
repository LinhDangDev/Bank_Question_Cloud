import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { DocxParserService } from '../../services/docx-parser.service';
import { PaginationDto } from '../../dto/pagination.dto';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { MulterFile } from '../../interfaces/multer-file.interface';

export interface ImportedQuestion {
    id: string;
    content: string;
    type: string;
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
        // Clean up expired sessions periodically
        setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000); // Every 5 minutes
    }

    /**
     * Parse questions from uploaded file and temporarily store them
     */
    async parseAndSaveQuestions(file: MulterFile, maPhan?: string): Promise<{ fileId: string; count: number }> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        // Check file type
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.docx') {
            throw new BadRequestException('Only DOCX files are supported');
        }

        try {
            // Parse the file
            const { questions, filePath } = await this.docxParserService.processUploadedFile(file);

            // Generate a unique ID for this import session
            const fileId = randomUUID();

            // Convert parsed questions to our internal format
            const importedQuestions: ImportedQuestion[] = questions.map(q => ({
                id: randomUUID(),
                content: q.content,
                type: this.mapQuestionType(q.type),
                answers: q.answers?.map(a => ({
                    id: randomUUID(),
                    content: a.content,
                    isCorrect: a.isCorrect,
                    order: a.order
                })),
                files: q.files
            }));

            // Store in memory (in production, you'd want to use Redis or similar)
            this.importSessions.set(fileId, {
                fileId,
                filePath,
                questions: importedQuestions,
                maPhan,
                createdAt: new Date()
            });

            return {
                fileId,
                count: importedQuestions.length
            };
        } catch (error) {
            this.logger.error(`Error parsing questions from file: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to parse questions: ${error.message}`);
        }
    }

    /**
     * Get imported questions with pagination
     */
    async getImportedQuestions(fileId: string, paginationDto: PaginationDto) {
        const session = this.importSessions.get(fileId);
        if (!session) {
            throw new NotFoundException('Import session not found or has expired');
        }

        const { page = 1, limit = 10 } = paginationDto;
        const startIdx = (page - 1) * limit;
        const endIdx = startIdx + limit;

        const items = session.questions.slice(startIdx, endIdx);
        const total = session.questions.length;

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Save selected questions to the database
     */
    async saveQuestionsToDatabase(
        fileId: string,
        questionIds: string[],
        maPhan?: string,
    ): Promise<{ success: boolean; savedCount: number }> {
        const session = this.importSessions.get(fileId);
        if (!session) {
            throw new NotFoundException('Import session not found or has expired');
        }

        // Use the maPhan from the request, or fall back to the one provided during upload
        const sectionId = maPhan || session.maPhan;
        if (!sectionId) {
            throw new BadRequestException('Section ID (maPhan) is required to save questions');
        }

        // Filter questions by the provided IDs
        const questionsToSave = session.questions.filter(q => questionIds.includes(q.id));

        if (questionsToSave.length === 0) {
            throw new BadRequestException('No valid questions to save');
        }

        let savedCount = 0;

        try {
            // Use a transaction to ensure data consistency
            await this.cauHoiRepository.manager.transaction(async transactionalEntityManager => {
                for (const question of questionsToSave) {
                    // Create the question
                    const cauHoi = new CauHoi();
                    cauHoi.MaCauHoi = randomUUID();
                    cauHoi.NoiDung = question.content;
                    cauHoi.MaPhan = sectionId;
                    cauHoi.CapDo = 1; // Default to easy
                    cauHoi.HoanVi = true; // Default to shuffle
                    cauHoi.XoaTamCauHoi = false;
                    cauHoi.NgayTao = new Date();

                    // Assign a random question number if not provided
                    cauHoi.MaSoCauHoi = Math.floor(Math.random() * 9000) + 1000;

                    // Save the question
                    await transactionalEntityManager.save(cauHoi);

                    // Save answers if they exist
                    if (question.answers && question.answers.length > 0) {
                        for (const answer of question.answers) {
                            const cauTraLoi = new CauTraLoi();
                            cauTraLoi.MaCauTraLoi = randomUUID();
                            cauTraLoi.MaCauHoi = cauHoi.MaCauHoi;
                            cauTraLoi.NoiDung = answer.content;
                            cauTraLoi.LaDapAn = answer.isCorrect;
                            cauTraLoi.ThuTu = answer.order;
                            cauTraLoi.HoanVi = cauHoi.HoanVi;

                            await transactionalEntityManager.save(cauTraLoi);
                        }
                    }

                    savedCount++;
                }
            });

            return {
                success: true,
                savedCount
            };
        } catch (error) {
            this.logger.error(`Error saving questions: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to save questions: ${error.message}`);
        }
    }

    /**
     * Map question types from parsed format to database format
     */
    private mapQuestionType(type: string): string {
        switch (type) {
            case 'fill-blank':
                return 'fill-blank';
            case 'multi-choice':
                return 'multi-choice';
            default:
                return 'single-choice';
        }
    }

    /**
     * Clean up expired import sessions
     */
    private cleanupExpiredSessions() {
        const now = Date.now();
        for (const [id, session] of this.importSessions.entries()) {
            const sessionAge = now - session.createdAt.getTime();
            if (sessionAge > this.sessionExpiryMs) {
                // Delete the temporary file if it exists
                if (session.filePath && fs.existsSync(session.filePath)) {
                    try {
                        fs.unlinkSync(session.filePath);
                    } catch (error) {
                        this.logger.error(`Error deleting file ${session.filePath}: ${error.message}`);
                    }
                }

                // Remove the session
                this.importSessions.delete(id);
                this.logger.log(`Cleaned up expired import session: ${id}`);
            }
        }
    }
}
