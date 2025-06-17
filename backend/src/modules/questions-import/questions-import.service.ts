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
    async parseAndSaveQuestions(
        file: MulterFile,
        maPhan?: string,
        options: ParseOptions = { processImages: true, limit: 100 }
    ): Promise<{ fileId: string; count: number }> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        // Check file type
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.docx') {
            throw new BadRequestException('Only DOCX files are supported');
        }

        try {
            // Parse the file with options
            this.logger.log(`Processing DOCX file with options: ${JSON.stringify(options)}`);
            const { questions, filePath } = await this.docxParserService.processUploadedFile(file);

            // Generate a unique ID for this import session
            const fileId = randomUUID();

            // Add CLO information and process properly
            const processedQuestions: ImportedQuestion[] = questions.map(q => {
                // Extract CLO information from content using regex
                const cloRegex = /\((CLO\d+)\)/;
                const cloMatch = q.content?.match(cloRegex);
                const clo = cloMatch ? cloMatch[1] : null;

                // Process child questions for group questions
                const childQuestions = q.childQuestions?.map(child => {
                    // Extract CLO from child questions
                    const childCloMatch = child.content?.match(cloRegex);
                    const childClo = childCloMatch ? childCloMatch[1] : null;

                    return {
                        ...child,
                        clo: childClo
                    };
                });

                return {
                    ...q,
                    clo,
                    childQuestions: childQuestions || q.childQuestions
                };
            });

            // Apply limit if specified
            const limitedQuestions = options.limit ?
                processedQuestions.slice(0, options.limit) :
                processedQuestions;

            this.logger.log(`Successfully processed ${limitedQuestions.length} questions from total ${processedQuestions.length}`);

            // Store in memory (in production, you'd want to use Redis or similar)
            this.importSessions.set(fileId, {
                fileId,
                filePath,
                questions: limitedQuestions,
                maPhan,
                createdAt: new Date()
            });

            return {
                fileId,
                count: limitedQuestions.length
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

        const { page = 1, limit = 100 } = paginationDto;
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
        questionMetadata?: any[]
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
                    // Find metadata for this question if provided
                    const metadata = questionMetadata?.find(m => m.id === question.id);

                    // Create the question
                    const cauHoi = new CauHoi();
                    cauHoi.MaCauHoi = randomUUID();
                    cauHoi.NoiDung = question.content;
                    cauHoi.MaPhan = sectionId;

                    // Use CLO from metadata if available, otherwise from question
                    if (metadata?.clo) {
                        // Extract just the number from CLO string (e.g. "CLO1" -> "1")
                        const cloNumber = metadata.clo.replace(/\D/g, '');
                        // If a valid CLO number is found, use it
                        if (cloNumber) {
                            cauHoi.MaCLO = cloNumber;
                        }
                    } else if (question.clo) {
                        const cloNumber = question.clo.replace(/\D/g, '');
                        if (cloNumber) {
                            cauHoi.MaCLO = cloNumber;
                        }
                    }

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

                    // Process child questions if this is a group question
                    if (question.childQuestions && question.childQuestions.length > 0) {
                        for (const childQuestion of question.childQuestions) {
                            // Find metadata for this child question
                            const childMetadata = metadata?.childQuestions?.find(c => c.id === childQuestion.id);

                            const childCauHoi = new CauHoi();
                            childCauHoi.MaCauHoi = randomUUID();
                            childCauHoi.NoiDung = childQuestion.content;
                            childCauHoi.MaPhan = sectionId;
                            childCauHoi.MaCauHoiCha = cauHoi.MaCauHoi; // Link to parent question

                            // Use CLO from metadata if available, otherwise from question
                            if (childMetadata?.clo) {
                                const cloNumber = childMetadata.clo.replace(/\D/g, '');
                                if (cloNumber) {
                                    childCauHoi.MaCLO = cloNumber;
                                }
                            } else if (childQuestion.clo) {
                                const cloNumber = childQuestion.clo.replace(/\D/g, '');
                                if (cloNumber) {
                                    childCauHoi.MaCLO = cloNumber;
                                }
                            }

                            childCauHoi.CapDo = 1;
                            childCauHoi.HoanVi = true;
                            childCauHoi.XoaTamCauHoi = false;
                            childCauHoi.NgayTao = new Date();
                            childCauHoi.MaSoCauHoi = Math.floor(Math.random() * 9000) + 1000;

                            await transactionalEntityManager.save(childCauHoi);

                            // Save child answers
                            if (childQuestion.answers && childQuestion.answers.length > 0) {
                                for (const answer of childQuestion.answers) {
                                    const cauTraLoi = new CauTraLoi();
                                    cauTraLoi.MaCauTraLoi = randomUUID();
                                    cauTraLoi.MaCauHoi = childCauHoi.MaCauHoi;
                                    cauTraLoi.NoiDung = answer.content;
                                    cauTraLoi.LaDapAn = answer.isCorrect;
                                    cauTraLoi.ThuTu = answer.order;
                                    cauTraLoi.HoanVi = childCauHoi.HoanVi;

                                    await transactionalEntityManager.save(cauTraLoi);
                                }
                            }
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
