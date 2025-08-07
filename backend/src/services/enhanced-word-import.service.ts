import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CauHoi } from '../entities/cau-hoi.entity';
import { CauTraLoi } from '../entities/cau-tra-loi.entity';
import { Files } from '../entities/files.entity';
import { Phan } from '../entities/phan.entity';
import { QuestionParserService } from './question-parser.service';
import { MediaContentProcessorService } from './media-content-processor.service';
import { QuestionType } from '../enums/question-type.enum';
import { FileType } from '../enums/file-type.enum';
import {
    ParsedQuestion,
    ParsedQuestionForDatabase,
    MediaProcessingOptions
} from '../interfaces/question-parser.interface';
import { MulterFile } from '../interfaces/multer-file.interface';
import { v4 as uuidv4 } from 'uuid';
import * as mammoth from 'mammoth';

export interface WordImportResult {
    success: boolean;
    questionsImported: number;
    mediaFilesUploaded: number;
    errors: string[];
    warnings: string[];
    importedQuestions: CauHoi[];
    statistics: {
        totalQuestions: number;
        singleQuestions: number;
        groupQuestions: number;
        fillInBlankQuestions: number;
        questionsWithMedia: number;
    };
}

@Injectable()
export class EnhancedWordImportService {
    private readonly logger = new Logger(EnhancedWordImportService.name);

    constructor(
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
        @InjectRepository(CauTraLoi)
        private readonly cauTraLoiRepository: Repository<CauTraLoi>,
        @InjectRepository(Files)
        private readonly filesRepository: Repository<Files>,
        @InjectRepository(Phan)
        private readonly phanRepository: Repository<Phan>,
        private readonly dataSource: DataSource,
        private readonly questionParser: QuestionParserService,
        private readonly mediaProcessor: MediaContentProcessorService
    ) { }

    async importQuestionsFromDocx(
        file: MulterFile,
        maPhan: string,
        nguoiTao?: string,
        options: MediaProcessingOptions = {}
    ): Promise<WordImportResult> {

        const result: WordImportResult = {
            success: false,
            questionsImported: 0,
            mediaFilesUploaded: 0,
            errors: [],
            warnings: [],
            importedQuestions: [],
            statistics: {
                totalQuestions: 0,
                singleQuestions: 0,
                groupQuestions: 0,
                fillInBlankQuestions: 0,
                questionsWithMedia: 0
            }
        };

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verify section exists
            const phan = await this.phanRepository.findOne({ where: { MaPhan: maPhan } });
            if (!phan) {
                throw new BadRequestException(`Section with ID ${maPhan} not found`);
            }

            // Extract text from DOCX
            const textContent = await this.extractTextFromDocx(file);

            // Parse questions
            const parsingResult = await this.questionParser.parseQuestionsFromText(textContent);

            if (parsingResult.errors.length > 0) {
                result.errors.push(...parsingResult.errors);
            }

            if (parsingResult.warnings.length > 0) {
                result.warnings.push(...parsingResult.warnings);
            }

            // Convert parsed questions to database format
            const questionsForDb = await this.convertToDbFormat(
                parsingResult.questions,
                maPhan,
                nguoiTao,
                options
            );

            // Save questions to database
            const savedQuestions = await this.saveQuestionsToDatabase(
                questionsForDb,
                queryRunner
            );

            result.importedQuestions = savedQuestions;
            result.questionsImported = savedQuestions.length;
            result.statistics = parsingResult.statistics;
            result.success = true;

            await queryRunner.commitTransaction();

            this.logger.log(`Successfully imported ${result.questionsImported} questions from DOCX`);

        } catch (error) {
            await queryRunner.rollbackTransaction();
            result.errors.push(`Import failed: ${error.message}`);
            this.logger.error('Failed to import questions from DOCX', error);
        } finally {
            await queryRunner.release();
        }

        return result;
    }

    private async extractTextFromDocx(file: MulterFile): Promise<string> {
        try {
            const result = await mammoth.extractRawText({ buffer: file.buffer });

            if (result.messages.length > 0) {
                this.logger.warn('DOCX extraction warnings', result.messages);
            }

            return result.value;

        } catch (error) {
            throw new BadRequestException(`Failed to extract text from DOCX: ${error.message}`);
        }
    }

    private async convertToDbFormat(
        questions: ParsedQuestion[],
        maPhan: string,
        nguoiTao?: string,
        options: MediaProcessingOptions = {}
    ): Promise<ParsedQuestionForDatabase[]> {

        const dbQuestions: ParsedQuestionForDatabase[] = [];
        let questionCounter = 1;

        for (const question of questions) {
            try {
                // Process media content if needed
                let processedContent = question.content;
                let mediaFiles: any[] = [];

                if (question.mediaReferences.length > 0 && options.uploadToSpaces) {
                    const { processedContent: newContent, uploadedMedia } =
                        await this.mediaProcessor.processMediaContent(
                            question.content,
                            question.mediaReferences,
                            options
                        );

                    processedContent = newContent;

                    // Convert media references to file entities
                    mediaFiles = uploadedMedia.map(media => ({
                        TenFile: media.spacesKey || media.fileName,
                        LoaiFile: media.type === 'audio' ? FileType.AUDIO : FileType.IMAGE,
                        // Non-persistent properties stored as extra metadata
                        _mimeType: this.getMimeTypeFromFileName(media.fileName),
                        _originalFileName: media.fileName,
                        _publicUrl: media.uploadedUrl
                    }));
                } else {
                    // Convert legacy markup for preview
                    processedContent = this.mediaProcessor.convertLegacyMediaMarkup(processedContent);
                }

                const dbQuestion: ParsedQuestionForDatabase = {
                    MaSoCauHoi: questionCounter++,
                    NoiDung: processedContent,
                    HoanVi: this.determineHoanVi(question),
                    CapDo: 1, // Default difficulty
                    SoCauHoiCon: this.getSoCauHoiCon(question),
                    MaCauHoiCha: question.parentId ? this.generateParentId(question.parentId) : undefined,
                    MaCLO: question.clo ? this.generateCLOId(question.clo) : undefined,
                    answers: question.answers.map((answer, index) => ({
                        NoiDung: answer.content,
                        ThuTu: index + 1,
                        LaDapAn: answer.isCorrect,
                        HoanVi: question.type !== QuestionType.PARENT
                    })),
                    mediaFiles
                };

                dbQuestions.push(dbQuestion);

            } catch (error) {
                this.logger.error(`Error converting question ${questionCounter}`, error);
                throw error;
            }
        }

        return dbQuestions;
    }

    private determineHoanVi(question: ParsedQuestion): boolean {
        // Parent questions and fill-in-blank questions should not be shuffled
        if (question.type === QuestionType.PARENT ||
            question.type === QuestionType.FILL_IN_BLANK) {
            return false;
        }

        // Check if last answer is "all answers correct/incorrect"
        if (question.answers.length > 0) {
            const lastAnswer = question.answers[question.answers.length - 1];
            const content = lastAnswer.content.toLowerCase();

            if (content.includes('all') &&
                (content.includes('correct') || content.includes('incorrect'))) {
                return false;
            }
        }

        return true; // Default: allow shuffling
    }

    private getSoCauHoiCon(question: ParsedQuestion): number {
        if (question.type === QuestionType.PARENT && question.childCount) {
            return question.childCount;
        }
        return 0;
    }

    private generateParentId(parentRef: string): string | undefined {
        // This would need to map to actual parent question IDs
        // For now, return undefined to indicate no parent
        return undefined;
    }

    private generateCLOId(cloNumber: string): string | undefined {
        // This would need to map to actual CLO IDs in the database
        // For now, return undefined
        return undefined;
    }

    private getMimeTypeFromFileName(fileName: string): string {
        const ext = fileName.toLowerCase().split('.').pop();

        switch (ext) {
            case 'mp3': return 'audio/mpeg';
            case 'wav': return 'audio/wav';
            case 'jpg':
            case 'jpeg': return 'image/jpeg';
            case 'png': return 'image/png';
            case 'webp': return 'image/webp';
            default: return 'application/octet-stream';
        }
    }

    private async saveQuestionsToDatabase(
        questions: ParsedQuestionForDatabase[],
        queryRunner: any
    ): Promise<CauHoi[]> {

        const savedQuestions: CauHoi[] = [];

        for (const questionData of questions) {
            try {
                // Create question entity
                const cauHoi = new CauHoi();
                cauHoi.MaCauHoi = uuidv4();
                cauHoi.MaSoCauHoi = questionData.MaSoCauHoi;
                cauHoi.NoiDung = questionData.NoiDung;
                cauHoi.HoanVi = questionData.HoanVi;
                cauHoi.CapDo = questionData.CapDo;
                cauHoi.SoCauHoiCon = questionData.SoCauHoiCon;
                if (questionData.MaCauHoiCha) {
                    cauHoi.MaCauHoiCha = questionData.MaCauHoiCha;
                }
                if (questionData.MaCLO) {
                    cauHoi.MaCLO = questionData.MaCLO;
                }
                cauHoi.NgayTao = new Date();

                const savedQuestion = await queryRunner.manager.save(CauHoi, cauHoi);

                // Save answers
                for (const answerData of questionData.answers) {
                    const cauTraLoi = new CauTraLoi();
                    cauTraLoi.MaCauTraLoi = uuidv4();
                    cauTraLoi.MaCauHoi = savedQuestion.MaCauHoi;
                    cauTraLoi.NoiDung = answerData.NoiDung;
                    cauTraLoi.ThuTu = answerData.ThuTu;
                    cauTraLoi.LaDapAn = answerData.LaDapAn;
                    cauTraLoi.HoanVi = answerData.HoanVi;

                    await queryRunner.manager.save(CauTraLoi, cauTraLoi);
                }

                // Save media files
                for (const fileData of questionData.mediaFiles) {
                    const file = new Files();
                    file.MaFile = uuidv4();
                    file.MaCauHoi = savedQuestion.MaCauHoi;
                    file.TenFile = fileData.TenFile;
                    file.LoaiFile = fileData.LoaiFile;
                    // KichThuocFile and other fields have been removed from the entity
                    // We store additional metadata as properties on the returned object
                    // but don't try to save them to the database

                    await queryRunner.manager.save(Files, file);
                }

                savedQuestions.push(savedQuestion);

            } catch (error) {
                this.logger.error(`Error saving question ${questionData.MaSoCauHoi}`, error);
                throw error;
            }
        }

        return savedQuestions;
    }
}
