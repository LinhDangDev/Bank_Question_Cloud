import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DocxParserService } from './docx-parser.service';
import { MediaProcessingService } from './media-processing.service';
import { ContentReplacementService } from './content-replacement.service';
import { CauHoi } from '../entities/cau-hoi.entity';
import { CauTraLoi } from '../entities/cau-tra-loi.entity';
import { Files } from '../entities/files.entity';
import * as yauzl from 'yauzl';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import { promisify } from 'util';
// @ts-ignore
import { createExtractorFromData } from 'node-unrar-js';
import { v4 as uuidv4 } from 'uuid';
import {
    ExamPackageStructure,
    ExtractedFile,
    ExtractedMediaFile,
    PackageProcessingResult,
    ProcessingStatistics,
    ZipExtractionOptions,
    MediaProcessingOptions,
    MediaFileType
} from '../interfaces/exam-package.interface';
import { MulterFile } from '../interfaces/multer-file.interface';

@Injectable()
export class ExamPackageService {
    private readonly logger = new Logger(ExamPackageService.name);

    private readonly defaultExtractionOptions: ZipExtractionOptions = {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedExtensions: ['.docx', '.mp3', '.wav', '.m4a', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
        requiredStructure: {
            wordDocument: true,
            audioFolder: false,
            imageFolder: false
        }
    };

    private readonly defaultMediaOptions: MediaProcessingOptions = {
        convertImagesToWebP: true,
        webpQuality: 85,
        maxImageWidth: 1200,
        maxImageHeight: 800,
        audioFormats: ['.mp3', '.wav', '.m4a', '.ogg'],
        imageFormats: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    };

    constructor(
        private readonly docxParserService: DocxParserService,
        private readonly mediaProcessingService: MediaProcessingService,
        private readonly contentReplacementService: ContentReplacementService,
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
        @InjectRepository(CauTraLoi)
        private readonly cauTraLoiRepository: Repository<CauTraLoi>,
        @InjectRepository(Files)
        private readonly filesRepository: Repository<Files>,
        private readonly dataSource: DataSource
    ) { }

    private detectArchiveType(fileName: string): 'zip' | 'rar' | 'unknown' {
        const extension = fileName.toLowerCase().split('.').pop();
        if (extension === 'zip') return 'zip';
        if (extension === 'rar') return 'rar';
        return 'unknown';
    }

    private async extractRarFile(filePath: string, tempDir: string): Promise<ExamPackageStructure> {
        // TODO: Implement RAR extraction properly
        // For now, throw an error to indicate RAR is not yet supported
        throw new BadRequestException('RAR file extraction is not yet implemented. Please use ZIP files for now.');
    }

    async processExamPackage(
        archiveFile: MulterFile,
        maPhan?: string,
        options: {
            processImages?: boolean;
            processAudio?: boolean;
            limit?: number;
            saveToDatabase?: boolean;
        } = {}
    ): Promise<PackageProcessingResult> {
        const packageId = uuidv4();
        const tempDir = path.join(process.cwd(), 'temp', packageId);

        try {
            // Create temp directory
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Detect archive type and extract accordingly
            const archiveType = this.detectArchiveType(archiveFile.originalname);
            this.logger.log(`Extracting ${archiveType.toUpperCase()} package: ${archiveFile.originalname}`);

            let extractedStructure: ExamPackageStructure;

            if (archiveType === 'zip') {
                extractedStructure = await this.extractZipFile(archiveFile, tempDir);
            } else if (archiveType === 'rar') {
                // Save RAR file to temp directory first
                const rarFilePath = path.join(tempDir, archiveFile.originalname);
                fs.writeFileSync(rarFilePath, archiveFile.buffer);
                extractedStructure = await this.extractRarFile(rarFilePath, tempDir);
            } else {
                throw new BadRequestException('Định dạng file không được hỗ trợ. Chỉ chấp nhận file ZIP và RAR.');
            }

            // Validate package structure
            this.validatePackageStructure(extractedStructure);

            // Parse Word document
            if (!extractedStructure.wordDocument) {
                throw new BadRequestException('Không tìm thấy file Word (.docx) trong gói đề thi');
            }

            this.logger.log('Parsing Word document for questions');
            const { questions } = await this.docxParserService.processUploadedFile(
                extractedStructure.wordDocument as any
            );

            // Process media files
            let uploadedMedia: ExtractedMediaFile[] = [];
            const errors: string[] = [];
            const warnings: string[] = [];

            if (extractedStructure.mediaFiles.length > 0) {
                this.logger.log(`Processing ${extractedStructure.mediaFiles.length} media files`);

                try {
                    uploadedMedia = await this.mediaProcessingService.processMediaFiles(
                        extractedStructure.mediaFiles,
                        this.defaultMediaOptions
                    );
                } catch (mediaError) {
                    const errorMessage = `Failed to process media files: ${mediaError.message}`;
                    this.logger.error(errorMessage);
                    errors.push(errorMessage);

                    // Continue processing without media files if processing fails
                    this.logger.warn('Continuing without media file processing');
                }
            }

            // Replace media paths in question content
            const processedQuestions = this.contentReplacementService.processQuestionContent(
                questions,
                uploadedMedia
            );

            // Save to database if requested
            if (options.saveToDatabase && maPhan) {
                this.logger.log('Saving processed questions to database');
                await this.saveQuestionsToDatabase(processedQuestions, uploadedMedia, maPhan);
            }

            // Generate statistics
            const statistics = this.generateProcessingStatistics(
                processedQuestions,
                uploadedMedia,
                extractedStructure
            );

            const result: PackageProcessingResult = {
                packageId,
                extractedStructure,
                processedQuestions,
                uploadedMedia,
                mediaReplacements: processedQuestions.flatMap(q => q.mediaReferences),
                statistics,
                errors,
                warnings
            };

            this.logger.log(`Successfully processed exam package: ${packageId}`);
            return result;

        } catch (error) {
            this.logger.error(`Failed to process exam package: ${error.message}`, error.stack);
            throw new BadRequestException(`Failed to process exam package: ${error.message}`);
        } finally {
            // Cleanup temp directory
            this.cleanupTempDirectory(tempDir);
        }
    }

    private async extractZipFile(
        zipFile: MulterFile,
        tempDir: string
    ): Promise<ExamPackageStructure> {
        return new Promise((resolve, reject) => {
            const zipPath = path.join(tempDir, 'package.zip');
            fs.writeFileSync(zipPath, zipFile.buffer);

            yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
                if (err) {
                    reject(new Error(`Failed to open ZIP file: ${err.message}`));
                    return;
                }

                const extractedFiles: ExtractedFile[] = [];
                const mediaFiles: ExtractedMediaFile[] = [];
                let wordDocument: ExtractedFile | null = null;

                zipfile.readEntry();

                zipfile.on('entry', (entry) => {
                    if (/\/$/.test(entry.fileName)) {
                        // Directory entry, skip
                        zipfile.readEntry();
                        return;
                    }

                    // Validate file size
                    if (entry.uncompressedSize > this.defaultExtractionOptions.maxFileSize) {
                        reject(new BadRequestException(`File ${entry.fileName} exceeds maximum size of ${this.defaultExtractionOptions.maxFileSize} bytes`));
                        return;
                    }

                    // Validate file extension
                    const extension = path.extname(entry.fileName).toLowerCase();
                    if (!this.defaultExtractionOptions.allowedExtensions.includes(extension)) {
                        this.logger.warn(`Skipping unsupported file: ${entry.fileName}`);
                        zipfile.readEntry();
                        return;
                    }

                    // Prevent directory traversal attacks
                    if (entry.fileName.includes('..') || entry.fileName.startsWith('/')) {
                        reject(new BadRequestException(`Suspicious file path detected: ${entry.fileName}`));
                        return;
                    }

                    zipfile.openReadStream(entry, (err, readStream) => {
                        if (err) {
                            reject(new Error(`Failed to read ${entry.fileName}: ${err.message}`));
                            return;
                        }

                        const chunks: Buffer[] = [];
                        readStream.on('data', (chunk) => chunks.push(chunk));
                        readStream.on('end', () => {
                            const buffer = Buffer.concat(chunks);
                            const mimeType = mime.lookup(entry.fileName) || 'application/octet-stream';

                            const extractedFile: ExtractedFile = {
                                name: path.basename(entry.fileName),
                                fileName: path.basename(entry.fileName), // Backward compatibility
                                originalName: path.basename(entry.fileName),
                                path: entry.fileName,
                                size: buffer.length,
                                data: buffer,
                                buffer, // Backward compatibility
                                mimeType,
                                relativePath: entry.fileName // Backward compatibility
                            };

                            // Categorize file
                            if (entry.fileName.endsWith('.docx')) {
                                wordDocument = extractedFile;
                            } else if (this.isMediaFile(entry.fileName)) {
                                const mediaFile = this.createMediaFile(extractedFile);
                                if (mediaFile) {
                                    mediaFiles.push(mediaFile);
                                }
                            }

                            extractedFiles.push(extractedFile);
                            zipfile.readEntry();
                        });
                    });
                });

                zipfile.on('end', () => {
                    if (!wordDocument) {
                        reject(new Error('No Word document found in ZIP package'));
                        return;
                    }

                    const structure: ExamPackageStructure = {
                        wordDocument,
                        mediaFiles,
                        audioFiles: mediaFiles.filter(f => f.fileType === MediaFileType.AUDIO),
                        imageFiles: mediaFiles.filter(f => f.fileType === MediaFileType.IMAGE)
                    };

                    resolve(structure);
                });

                zipfile.on('error', (err) => {
                    reject(new Error(`ZIP extraction error: ${err.message}`));
                });
            });
        });
    }

    private isMediaFile(fileName: string): boolean {
        const extension = path.extname(fileName).toLowerCase();
        return this.defaultExtractionOptions.allowedExtensions.includes(extension) &&
            !fileName.endsWith('.docx');
    }

    private createMediaFile(extractedFile: ExtractedFile): ExtractedMediaFile | null {
        const fileName = extractedFile.name || extractedFile.fileName;
        const mimeType = extractedFile.mimeType;

        if (!fileName || !mimeType) {
            return null;
        }

        const fileType = this.mediaProcessingService.classifyMediaFile(fileName, mimeType);

        if (!fileType) {
            return null;
        }

        const targetFolder = fileType === MediaFileType.AUDIO ? 'audio' : 'images';

        // Map MediaFileType to string type
        let type: 'audio' | 'image' | 'document' | 'unknown' = 'unknown';
        if (fileType === MediaFileType.AUDIO) type = 'audio';
        else if (fileType === MediaFileType.IMAGE) type = 'image';
        else if (fileType === MediaFileType.DOCUMENT) type = 'document';

        return {
            ...extractedFile,
            type,
            fileType, // Backward compatibility
            targetFolder
        };
    }

    private validatePackageStructure(structure: ExamPackageStructure): void {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check for required Word document
        if (!structure.wordDocument) {
            errors.push('Archive package must contain a Word document (.docx)');
        }

        // Validate Word document
        if (structure.wordDocument) {
            const docData = structure.wordDocument.data || structure.wordDocument.buffer;
            if (!docData || docData.length === 0) {
                errors.push('Word document is empty');
            }

            if (docData && docData.length > 50 * 1024 * 1024) {
                errors.push('Word document exceeds maximum size of 50MB');
            }
        }

        // Validate media files
        for (const mediaFile of structure.mediaFiles) {
            const fileData = mediaFile.data || mediaFile.buffer;
            const fileName = mediaFile.name || mediaFile.fileName;
            const mimeType = mediaFile.mimeType;

            // Check file size
            if (fileData && fileData.length > 10 * 1024 * 1024) {
                warnings.push(`Media file ${fileName} is larger than 10MB`);
            }

            // Check file type
            if (fileName && mimeType && !this.mediaProcessingService.classifyMediaFile(fileName, mimeType)) {
                warnings.push(`Unsupported media file type: ${fileName}`);
            }

            // Validate media file integrity
            if (fileName && fileData) {
                try {
                    this.mediaProcessingService.validateMediaFile(fileName, fileData);
                } catch (validationError) {
                    errors.push(`Invalid media file ${fileName}: ${validationError.message}`);
                }
            }
        }

        // Check for suspicious file patterns
        const suspiciousFiles = structure.mediaFiles.filter(file => {
            const fileName = file.name || file.fileName;
            return fileName && (
                fileName.includes('..') ||
                fileName.startsWith('/') ||
                fileName.includes('\\')
            );
        });

        if (suspiciousFiles.length > 0) {
            const suspiciousNames = suspiciousFiles.map(f => f.name || f.fileName).filter(Boolean);
            errors.push(`Suspicious file paths detected: ${suspiciousNames.join(', ')}`);
        }

        // Validate folder structure
        const audioFiles = structure.mediaFiles.filter(f => {
            const filePath = f.path || f.relativePath;
            return filePath && filePath.startsWith('audio/');
        });
        const imageFiles = structure.mediaFiles.filter(f => {
            const filePath = f.path || f.relativePath;
            return filePath && filePath.startsWith('images/');
        });
        const otherFiles = structure.mediaFiles.filter(f => {
            const filePath = f.path || f.relativePath;
            return filePath && (
                !filePath.startsWith('audio/') &&
                !filePath.startsWith('images/')
            );
        });

        if (otherFiles.length > 0) {
            warnings.push(`Media files found outside audio/ and images/ folders: ${otherFiles.map(f => f.fileName).join(', ')}`);
        }

        // Log validation results
        if (errors.length > 0) {
            this.logger.error(`Package validation failed: ${errors.join('; ')}`);
            throw new BadRequestException(`Package validation failed: ${errors.join('; ')}`);
        }

        if (warnings.length > 0) {
            this.logger.warn(`Package validation warnings: ${warnings.join('; ')}`);
        }

        this.logger.log(`Package validation passed: Word doc + ${structure.mediaFiles.length} media files (${audioFiles.length} audio, ${imageFiles.length} images)`);
    }

    private generateProcessingStatistics(
        processedQuestions: any[],
        uploadedMedia: ExtractedMediaFile[],
        structure: ExamPackageStructure
    ): ProcessingStatistics {
        const questionsWithMedia = processedQuestions.filter(q =>
            q.mediaReferences && q.mediaReferences.length > 0
        ).length;

        const questionsWithHoanVi0 = processedQuestions.filter(q => q.hoanVi === false).length;
        const questionsWithHoanVi1 = processedQuestions.filter(q => q.hoanVi === true).length;

        return {
            totalQuestions: processedQuestions.length,
            questionsWithMedia,
            totalMediaFiles: structure.mediaFiles.length,
            audioFilesProcessed: structure.audioFiles.length,
            imageFilesProcessed: structure.imageFiles.length,
            imageFilesConverted: uploadedMedia.filter(m =>
                m.fileType === MediaFileType.IMAGE && m.convertedBuffer
            ).length,
            mediaReplacementsMade: processedQuestions.reduce((sum, q) =>
                sum + (q.mediaReferences ? q.mediaReferences.length : 0), 0
            ),
            questionsWithHoanVi0,
            questionsWithHoanVi1
        };
    }

    private cleanupTempDirectory(tempDir: string): void {
        try {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                this.logger.log(`Cleaned up temp directory: ${tempDir}`);
            }
        } catch (error) {
            this.logger.warn(`Failed to cleanup temp directory: ${error.message}`);
        }
    }

    private async saveQuestionsToDatabase(
        processedQuestions: any[],
        uploadedMedia: ExtractedMediaFile[],
        maPhan: string
    ): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            for (const question of processedQuestions) {
                // Create question entity
                const cauHoi = new CauHoi();
                cauHoi.MaPhan = maPhan;
                cauHoi.NoiDung = question.processedContent || question.content;
                cauHoi.HoanVi = question.hoanVi || false;
                cauHoi.CapDo = 1; // Default difficulty level
                cauHoi.SoCauHoiCon = 0;
                cauHoi.NgayTao = new Date();
                cauHoi.MaSoCauHoi = await this.getNextQuestionNumber(maPhan);

                const savedQuestion = await queryRunner.manager.save(CauHoi, cauHoi);

                // Save answers
                if (question.answers && question.answers.length > 0) {
                    for (let i = 0; i < question.answers.length; i++) {
                        const answer = question.answers[i];
                        const cauTraLoi = new CauTraLoi();
                        cauTraLoi.MaCauHoi = savedQuestion.MaCauHoi;
                        cauTraLoi.NoiDung = answer.content;
                        cauTraLoi.ThuTu = i + 1;
                        cauTraLoi.LaDapAn = answer.isCorrect || false;
                        cauTraLoi.HoanVi = question.hoanVi || false;

                        await queryRunner.manager.save(CauTraLoi, cauTraLoi);
                    }
                }

                // Save media file references
                const questionMediaFiles = uploadedMedia.filter(media =>
                    question.mediaReferences?.some((ref: any) => ref.fileName === media.originalName)
                );

                for (const mediaFile of questionMediaFiles) {
                    const fileEntity = new Files();
                    fileEntity.MaCauHoi = savedQuestion.MaCauHoi;

                    // Handle file name
                    const fileName = mediaFile.spacesKey || mediaFile.fileName || mediaFile.name;
                    if (!fileName) continue;
                    fileEntity.TenFile = fileName;

                    // Handle file type
                    let fileType = 0;
                    if (mediaFile.fileType) {
                        fileType = mediaFile.fileType;
                    } else if (mediaFile.type) {
                        fileType = mediaFile.type === 'audio' ? 1 :
                            mediaFile.type === 'image' ? 2 :
                                mediaFile.type === 'document' ? 3 : 0;
                    }
                    fileEntity.LoaiFile = fileType;

                    await queryRunner.manager.save(Files, fileEntity);
                }
            }

            await queryRunner.commitTransaction();
            this.logger.log(`Successfully saved ${processedQuestions.length} questions to database`);

        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to save questions to database: ${error.message}`, error.stack);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async getNextQuestionNumber(maPhan: string): Promise<number> {
        const lastQuestion = await this.cauHoiRepository.findOne({
            where: { MaPhan: maPhan },
            order: { MaSoCauHoi: 'DESC' }
        });

        return lastQuestion ? lastQuestion.MaSoCauHoi + 1 : 1;
    }
}
