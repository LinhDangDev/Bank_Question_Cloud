import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { CauHoiChoDuyet } from '../../entities/cau-hoi-cho-duyet.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as JSZip from 'jszip';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { DocxParserService } from '../../services/docx-parser.service';
import { PythonEnhancedDocxParserService } from '../../services/python-enhanced-docx-parser.service';
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
    extractedFiles?: any[]; // Store extracted media files for preview
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
        private readonly pythonEnhancedDocxParserService: PythonEnhancedDocxParserService,
        private readonly dataSource: DataSource,
    ) {
        // Start a cleanup timer
        setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000); // Cleanup every 5 minutes
    }

    /**
     * Parse questions using the new Python enhanced parser
     */
    async parseAndSaveQuestionsWithPython(
        file: MulterFile,
        maPhan?: string,
        options: ParseOptions = { processImages: true, limit: 100 }
    ): Promise<{ fileId: string; count: number }> {
        // Create a unique ID for this import session
        const fileId = uuidv4();

        try {
            this.logger.log(`Using Python enhanced parser for file: ${file.originalname}`);

            // Use Python enhanced parser
            const result = await this.pythonEnhancedDocxParserService.parseUploadedFile(file, {
                processImages: options.processImages,
                extractStyles: true,
                preserveLatex: true,
                maxQuestions: options.limit
            });

            if (!result.success) {
                throw new Error(`Python parser failed: ${result.errors?.join(', ')}`);
            }

            this.logger.log(`Python parser returned ${result.questions.length} questions`);

            // Map Python questions to ImportedQuestion format
            const mappedQuestions = this.mapPythonQuestions(result.questions);

            // Apply any limits to the questions (if specified)
            const limitedQuestions = options.limit && mappedQuestions.length > options.limit
                ? mappedQuestions.slice(0, options.limit)
                : mappedQuestions;

            // Store the parsed questions in the import session
            this.importSessions.set(fileId, {
                fileId,
                filePath: result.filePath,
                questions: limitedQuestions,
                maPhan,
                createdAt: new Date(),
            });

            return {
                fileId,
                count: limitedQuestions.length,
            };

        } catch (error) {
            this.logger.error(`Error in Python parser: ${error.message}`, error.stack);
            throw error;
        }
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
            // Check if this is a compressed file (ZIP or RAR)
            const fileExt = path.extname(file.originalname).toLowerCase();
            if (fileExt === '.zip' || fileExt === '.rar') {
                this.logger.log(`Detected compressed file: ${fileExt}`);
                const { extractedPath, files } = await this.extractCompressedFile(file);

                // Filter for DOCX files
                const docxFiles = files.filter(f => path.extname(f).toLowerCase() === '.docx');

                if (docxFiles.length === 0) {
                    throw new BadRequestException('Không tìm thấy file Word (.docx) trong file nén.');
                }

                // Process the first DOCX file found
                const docxFile = docxFiles[0];
                this.logger.log(`Processing extracted DOCX: ${docxFile}`);

                // Create a MulterFile-like object for the extracted file
                const fileBuffer = await fs.promises.readFile(docxFile);
                const extractedFile: MulterFile = {
                    buffer: fileBuffer,
                    originalname: path.basename(docxFile),
                    fieldname: file.fieldname,
                    encoding: file.encoding,
                    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    size: fileBuffer.length,
                    path: docxFile
                };

                // Use the DocxParserService to parse the file
                const { questions } = await this.docxParserService.processUploadedFile(extractedFile);

                this.logger.log(`DocxParserService returned ${questions.length} questions from compressed file`);

                // Map ProcessedQuestion[] to ImportedQuestion[]
                const mappedQuestions = this.mapProcessedQuestions(questions);

                // Apply any limits to the questions (if specified)
                const limitedQuestions = options.limit && mappedQuestions.length > options.limit
                    ? mappedQuestions.slice(0, options.limit)
                    : mappedQuestions;

                // Store the parsed questions in the import session
                this.importSessions.set(fileId, {
                    fileId,
                    filePath,
                    questions: limitedQuestions,
                    maPhan,
                    createdAt: new Date(),
                });

                return {
                    fileId,
                    count: limitedQuestions.length,
                };
            } else {
                // Normal DOCX processing
                const { questions } = await this.docxParserService.processUploadedFile({
                    ...file,
                    path: filePath // Ensure path is available for direct file access
                });

                this.logger.log(`DocxParserService returned ${questions.length} questions`);

                // Map ProcessedQuestion[] to ImportedQuestion[]
                const mappedQuestions = this.mapProcessedQuestions(questions);

                // Apply any limits to the questions (if specified)
                const limitedQuestions = options.limit && mappedQuestions.length > options.limit
                    ? mappedQuestions.slice(0, options.limit)
                    : mappedQuestions;

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
            }
        } catch (error) {
            this.logger.error(`Error parsing file: ${error.message}`, error.stack);
            // Clean up the file if parsing failed
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            // Enhanced error handling with specific error types
            if (error.message.includes('corrupted') || error.message.includes('invalid')) {
                throw new BadRequestException('File bị hỏng hoặc không đúng định dạng. Vui lòng kiểm tra lại file.');
            } else if (error.message.includes('permission') || error.message.includes('access')) {
                throw new BadRequestException('Không thể truy cập file. File có thể đang được mở bởi ứng dụng khác.');
            } else if (error.message.includes('size') || error.message.includes('large')) {
                throw new BadRequestException('File quá lớn. Vui lòng giảm kích thước file xuống dưới 50MB.');
            } else if (error.message.includes('format') || error.message.includes('structure')) {
                throw new BadRequestException('Cấu trúc file không đúng định dạng. Vui lòng kiểm tra lại nội dung câu hỏi.');
            } else {
                throw new BadRequestException(`Lỗi xử lý file: ${error.message}`);
            }
        }
    }

    /**
     * Hỗ trợ import từ các file nén như RAR và ZIP
     */
    private async extractCompressedFile(file: MulterFile): Promise<{
        extractedPath: string;
        files: string[];
    }> {
        const extractDir = path.join(process.cwd(), 'temp', 'extracted', uuidv4());
        await fs.promises.mkdir(extractDir, { recursive: true });

        const fileExt = path.extname(file.originalname).toLowerCase();

        if (fileExt === '.zip') {
            return this.extractZipFile(file, extractDir);
        } else if (fileExt === '.rar') {
            return this.extractRarFile(file, extractDir);
        } else {
            throw new Error('Unsupported compressed file format. Supported formats: ZIP, RAR');
        }
    }

    /**
     * Extract ZIP file
     */
    private async extractZipFile(file: MulterFile, extractDir: string): Promise<{
        extractedPath: string;
        files: string[];
    }> {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file.buffer);
        const files: string[] = [];

        for (const [fileName, fileData] of Object.entries(contents.files)) {
            if (fileData.dir) continue;

            const content = await fileData.async('nodebuffer');
            const targetPath = path.join(extractDir, fileName);

            // Ensure directory exists
            await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });

            // Write file
            await fs.promises.writeFile(targetPath, content);
            files.push(targetPath);
        }

        return {
            extractedPath: extractDir,
            files
        };
    }

    /**
     * Extract RAR file
     */
    private async extractRarFile(file: MulterFile, extractDir: string): Promise<{
        extractedPath: string;
        files: string[];
    }> {
        // Save the RAR file temporarily
        const tempRarPath = path.join(extractDir, 'temp.rar');
        await fs.promises.writeFile(tempRarPath, file.buffer);

        // Use unrar command if available, otherwise use alternative libraries
        try {
            await this.executeCommand('unrar', ['x', '-y', tempRarPath, extractDir]);

            // Get the list of extracted files
            const files = await this.getAllFiles(extractDir, []);
            return {
                extractedPath: extractDir,
                files
            };
        } catch (error) {
            this.logger.error(`Failed to extract RAR file: ${error.message}`);
            throw new Error('Failed to extract RAR file. Make sure unrar is installed on the server or use ZIP format.');
        }
    }

    /**
     * Execute command as promise
     */
    private executeCommand(command: string, args: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const childProcess = spawn(command, args);

            childProcess.on('error', (error) => {
                reject(error);
            });

            childProcess.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Command exited with code ${code}`));
                }
            });
        });
    }

    /**
     * Recursively get all files in a directory
     */
    private async getAllFiles(dir: string, filelist: string[] = []): Promise<string[]> {
        const files = await fs.promises.readdir(dir);

        for (const file of files) {
            const filepath = path.join(dir, file);
            const stat = await fs.promises.stat(filepath);

            if (stat.isDirectory()) {
                filelist = await this.getAllFiles(filepath, filelist);
            } else {
                filelist.push(filepath);
            }
        }

        return filelist;
    }

    // Use our enhanced parser for better question detection
    private async parseDocxWithEnhancedParser(
        filePath: string,
        options: ParseOptions
    ): Promise<ImportedQuestion[]> {
        try {
            const result = await this.docxParserService.parseDocx(filePath, {
                uploadMedia: true,
                generateThumbnails: true,
                processImages: options.processImages,
            });

            this.logger.log(`Successfully parsed ${result.questions.length} questions from ${path.basename(filePath)}`);
            return this.mapProcessedQuestions(result.questions);
        } catch (error) {
            this.logger.error(`Error parsing DOCX with enhanced parser: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Maps ProcessedQuestion[] to ImportedQuestion[]
     */
    private mapProcessedQuestions(questions: any[]): ImportedQuestion[] {
        return questions.map(q => {
            const importedQuestion: ImportedQuestion = {
                id: uuidv4(),
                content: q.content,
                clo: q.clo || null,
                type: q.type,
                answers: q.options?.map((option: string, index: number) => ({
                    id: uuidv4(),
                    content: option,
                    isCorrect: q.correctAnswer === String.fromCharCode(65 + index), // A, B, C, D...
                    order: index
                })) || [],
                files: q.mediaFiles?.map((media: any) => ({
                    type: media.type,
                    path: media.uploadedUrl || media.originalUrl
                })) || []
            };

            // Handle child questions for group questions
            if (q.childQuestions && q.childQuestions.length > 0) {
                importedQuestion.childQuestions = this.mapProcessedQuestions(q.childQuestions);
                importedQuestion.groupContent = q.groupContent;
            }

            return importedQuestion;
        });
    }

    /**
     * Maps Python parsed questions to ImportedQuestion[]
     */
    private mapPythonQuestions(questions: any[]): ImportedQuestion[] {
        return questions.map(q => {
            const importedQuestion: ImportedQuestion = {
                id: uuidv4(),
                content: q.content,
                clo: q.clo || null,
                type: q.type || 'single-choice',
                questionNumber: undefined,
                answers: q.answers?.map((a: any) => ({
                    id: uuidv4(),
                    content: a.content,
                    isCorrect: a.isCorrect,
                    order: a.order
                })) || []
            };

            // Handle child questions for group questions
            if (q.childQuestions && q.childQuestions.length > 0) {
                importedQuestion.childQuestions = this.mapPythonQuestions(q.childQuestions);
                importedQuestion.groupContent = q.groupContent;
            }

            return importedQuestion;
        });
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

                // Chỉ gán MaCLO khi có giá trị hợp lệ
                if (question.cloId && question.cloId !== '') {
                    cauHoiChoDuyet.MaCLO = question.cloId;
                } else if (question.clo && question.clo !== '') {
                    cauHoiChoDuyet.MaCLO = question.clo;
                }

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
