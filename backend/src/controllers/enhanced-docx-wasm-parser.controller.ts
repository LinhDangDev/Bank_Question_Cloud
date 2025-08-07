import { Controller, Post, UploadedFile, UseInterceptors, Body, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnhancedDocxWasmParserService } from '../services/enhanced-docx-wasm-parser.service';

@Controller('docx-wasm-parser')
@ApiTags('Enhanced DOCX WASM Parser')
export class EnhancedDocxWasmParserController {
    private readonly logger = new Logger(EnhancedDocxWasmParserController.name);

    constructor(
        private readonly enhancedDocxWasmParserService: EnhancedDocxWasmParserService
    ) { }

    @Post('upload')
    @ApiOperation({ summary: 'Parse Word document with WASM technology' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('processImages') processImages: boolean = true,
        @Body('extractStyles') extractStyles: boolean = true,
        @Body('preserveLatex') preserveLatex: boolean = true,
        @Body('maxQuestions') maxQuestions: number = 100
    ) {
        this.logger.log(`Received file: ${file.originalname} (${file.size} bytes)`);

        const options = {
            processImages,
            extractStyles,
            preserveLatex,
            maxQuestions: maxQuestions ? parseInt(maxQuestions.toString()) : 100
        };

        try {
            const result = await this.enhancedDocxWasmParserService.parseUploadedFile(file, options);

            this.logger.log(`Successfully parsed document with ${result.questions.length} questions`);

            return {
                success: true,
                questions: result.questions,
                filePath: result.filePath,
                stats: result.stats,
                mediaFiles: result.extractedFiles.map(f => ({
                    id: f.id,
                    fileName: f.fileName,
                    originalName: f.originalName,
                    mimeType: f.mimeType,
                    fileType: f.fileType,
                    size: f.size,
                    spacesUrl: f.spacesUrl,
                    cdnUrl: f.cdnUrl
                }))
            };
        } catch (error) {
            this.logger.error(`Error parsing document: ${error.message}`, error.stack);
            return {
                success: false,
                error: error.message
            };
        }
    }

    @Post('upload-with-fallback')
    @ApiOperation({ summary: 'Parse Word document with WASM with Python fallback' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFileWithFallback(
        @UploadedFile() file: Express.Multer.File,
        @Body('processImages') processImages: boolean = true,
        @Body('extractStyles') extractStyles: boolean = true,
        @Body('preserveLatex') preserveLatex: boolean = true,
        @Body('maxQuestions') maxQuestions: number = 100
    ) {
        this.logger.log(`Received file for parsing with fallback: ${file.originalname}`);

        const options = {
            processImages,
            extractStyles,
            preserveLatex,
            maxQuestions: maxQuestions ? parseInt(maxQuestions.toString()) : 100
        };

        try {
            // First try with WASM parser
            const result = await this.enhancedDocxWasmParserService.parseUploadedFile(file, options);

            // Check if parsing was successful
            if (result.questions.length > 0) {
                this.logger.log(`Successfully parsed with WASM: ${result.questions.length} questions`);

                return {
                    success: true,
                    parsingEngine: 'wasm',
                    questions: result.questions,
                    filePath: result.filePath,
                    stats: result.stats,
                    mediaFiles: result.extractedFiles.map(f => ({
                        id: f.id,
                        fileName: f.fileName,
                        originalName: f.originalName,
                        mimeType: f.mimeType,
                        fileType: f.fileType,
                        size: f.size,
                        spacesUrl: f.spacesUrl,
                        cdnUrl: f.cdnUrl
                    }))
                };
            } else {
                throw new Error('WASM parser found no questions, trying fallback...');
            }
        } catch (error) {
            this.logger.warn(`WASM parsing failed: ${error.message}, would use fallback here`);

            // In a real implementation, this would call the Python parser instead
            // For now, we just return an error
            return {
                success: false,
                parsingEngine: 'fallback_not_implemented',
                error: `WASM parsing failed: ${error.message}`
            };
        }
    }
}
