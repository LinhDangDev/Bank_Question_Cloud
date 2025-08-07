import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MulterFile } from '../interfaces/multer-file.interface';

export interface PythonParsedQuestion {
    id: string;
    content: string;
    answers: PythonParsedAnswer[];
    type: 'single-choice' | 'group' | 'fill-in-blank' | 'multi-choice';
    childQuestions?: PythonParsedQuestion[];
    has_latex: boolean;
    clo?: string;
    inGroup?: boolean;
    groupId?: string;
    groupContent?: string;
}

export interface PythonParsedAnswer {
    id: string;
    content: string;
    isCorrect: boolean;
    order: number;
}

export interface PythonParsingResult {
    success: boolean;
    questions: PythonParsedQuestion[];
    stats: {
        totalQuestions: number;
        groupQuestions: number;
        singleQuestions: number;
        fillInBlankQuestions: number;
        hasLatex: number;
        correctAnswersFound: number;
    };
    filePath: string;
    errors?: string[];
}

/**
 * Enhanced Python-based DOCX Parser Service
 * Uses the new Python parser with improved answer recognition
 * Author: Linh Dang Dev
 */
@Injectable()
export class PythonEnhancedDocxParserService {
    private readonly logger = new Logger(PythonEnhancedDocxParserService.name);
    private readonly uploadsDir: string;
    private readonly pythonScript: string;

    constructor() {
        this.uploadsDir = path.join(process.cwd(), 'uploads', 'temp');
        this.pythonScript = path.join(process.cwd(), 'scripts', 'docx_parser.py');
        this.ensureDirectoryExists();
    }

    private ensureDirectoryExists(): void {
        if (!require('fs').existsSync(this.uploadsDir)) {
            require('fs').mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    /**
     * Main entry point - parse uploaded Word file using Python
     */
    async parseUploadedFile(
        file: MulterFile,
        options: {
            processImages?: boolean;
            extractStyles?: boolean;
            preserveLatex?: boolean;
            maxQuestions?: number;
        } = {}
    ): Promise<PythonParsingResult> {
        const {
            processImages = true,
            extractStyles = true,
            preserveLatex = true,
            maxQuestions = 100
        } = options;

        // Save uploaded file to temp directory
        const tempFileName = `${uuidv4()}_${file.originalname}`;
        const tempFilePath = path.join(this.uploadsDir, tempFileName);
        const outputFilePath = path.join(this.uploadsDir, `${uuidv4()}_output.json`);

        try {
            // Write file to disk
            await fs.writeFile(tempFilePath, file.buffer);
            this.logger.log(`Saved file to: ${tempFilePath}`);

            // Prepare Python command arguments
            const args = [
                this.pythonScript,
                tempFilePath,
                outputFilePath
            ];

            if (processImages) {
                args.push('--process-images');
            }

            if (extractStyles) {
                args.push('--extract-styles');
            }

            if (preserveLatex) {
                args.push('--preserve-latex');
            }

            // Execute Python script
            const result = await this.executePythonScript(args);

            if (!result.success) {
                throw new Error(`Python script failed: ${result.error}`);
            }

            // Read output file
            const outputData = await this.readOutputFile(outputFilePath);

            // Apply maxQuestions limit if specified
            if (maxQuestions && outputData.questions.length > maxQuestions) {
                outputData.questions = outputData.questions.slice(0, maxQuestions);
                this.logger.log(`Limited questions to ${maxQuestions} as requested`);
            }

            // Generate enhanced stats
            const stats = this.generateStats(outputData.questions);

            // Cleanup temp files
            await this.cleanupTempFiles([tempFilePath, outputFilePath]);

            return {
                success: true,
                questions: outputData.questions,
                stats,
                filePath: tempFilePath
            };

        } catch (error) {
            this.logger.error('Error processing Word document with Python', error);
            
            // Cleanup on error
            await this.cleanupTempFiles([tempFilePath, outputFilePath]);
            
            return {
                success: false,
                questions: [],
                stats: {
                    totalQuestions: 0,
                    groupQuestions: 0,
                    singleQuestions: 0,
                    fillInBlankQuestions: 0,
                    hasLatex: 0,
                    correctAnswersFound: 0
                },
                filePath: tempFilePath,
                errors: [error.message]
            };
        }
    }

    /**
     * Execute Python script with arguments
     */
    private async executePythonScript(args: string[]): Promise<{ success: boolean; error?: string }> {
        return new Promise((resolve) => {
            this.logger.log(`Executing Python script: python3 ${args.join(' ')}`);
            
            const pythonProcess = spawn('python3', args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    this.logger.log('Python script executed successfully');
                    resolve({ success: true });
                } else {
                    this.logger.error(`Python script failed with code ${code}`);
                    this.logger.error(`STDERR: ${stderr}`);
                    resolve({ success: false, error: stderr || `Process exited with code ${code}` });
                }
            });

            pythonProcess.on('error', (error) => {
                this.logger.error(`Failed to start Python process: ${error.message}`);
                resolve({ success: false, error: error.message });
            });
        });
    }

    /**
     * Read and parse output JSON file
     */
    private async readOutputFile(outputFilePath: string): Promise<{ questions: PythonParsedQuestion[] }> {
        try {
            const outputContent = await fs.readFile(outputFilePath, 'utf-8');
            const parsedData = JSON.parse(outputContent);
            
            this.logger.log(`Successfully read output file with ${parsedData.length} questions`);
            
            return { questions: parsedData };
        } catch (error) {
            this.logger.error(`Error reading output file: ${error.message}`);
            throw new Error(`Failed to read Python parser output: ${error.message}`);
        }
    }

    /**
     * Generate statistics from parsed questions
     */
    private generateStats(questions: PythonParsedQuestion[]) {
        const stats = {
            totalQuestions: questions.length,
            groupQuestions: 0,
            singleQuestions: 0,
            fillInBlankQuestions: 0,
            hasLatex: 0,
            correctAnswersFound: 0
        };

        questions.forEach(question => {
            switch (question.type) {
                case 'group':
                    stats.groupQuestions++;
                    break;
                case 'fill-in-blank':
                    stats.fillInBlankQuestions++;
                    break;
                default:
                    stats.singleQuestions++;
            }

            if (question.has_latex) {
                stats.hasLatex++;
            }

            if (question.answers) {
                stats.correctAnswersFound += question.answers.filter(a => a.isCorrect).length;
            }

            // Count child questions
            if (question.childQuestions) {
                stats.totalQuestions += question.childQuestions.length;
                question.childQuestions.forEach(child => {
                    if (child.has_latex) {
                        stats.hasLatex++;
                    }
                    if (child.answers) {
                        stats.correctAnswersFound += child.answers.filter(a => a.isCorrect).length;
                    }
                });
            }
        });

        return stats;
    }

    /**
     * Cleanup temporary files
     */
    private async cleanupTempFiles(filePaths: string[]): Promise<void> {
        for (const filePath of filePaths) {
            try {
                await fs.unlink(filePath);
                this.logger.log(`Cleaned up temp file: ${filePath}`);
            } catch (error) {
                this.logger.warn(`Failed to cleanup temp file ${filePath}: ${error.message}`);
            }
        }
    }
}
