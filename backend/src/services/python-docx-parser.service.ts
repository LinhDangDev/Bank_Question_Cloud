import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { MulterFile } from '../interfaces/multer-file.interface';
import { EnhancedDocxParserService } from './enhanced-docx-parser.service';

/**
 * Python-based DOCX Parser Service
 * Uses Python for better answer recognition while reusing mammoth/docx-wasm for image processing
 * Author: Linh Dang Dev
 */

interface PythonParseResult {
    success: boolean;
    questions: any[];
    answers: any[];
    errors?: string[];
}

@Injectable()
export class PythonDocxParserService {
    private readonly logger = new Logger(PythonDocxParserService.name);
    private readonly uploadsDir: string;
    private readonly pythonScriptPath: string;
    private readonly testScriptPath: string;
    private readonly pythonCommand: string;

    constructor(
        private readonly enhancedDocxParserService: EnhancedDocxParserService
    ) {
        // Set paths
        this.uploadsDir = path.join(process.cwd(), 'uploads', 'questions');

        // Find the scripts directory - could be at project root or one level up
        let scriptsDir = path.join(process.cwd(), 'scripts');
        if (!fs.existsSync(scriptsDir)) {
            scriptsDir = path.join(process.cwd(), '..', 'scripts');
        }

        this.pythonScriptPath = path.join(scriptsDir, 'docx_parser.py');
        this.testScriptPath = path.join(scriptsDir, 'test_python.py');

        // Detect python command based on platform
        this.pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

        // Ensure directories exist
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
            this.logger.log(`Created uploads directory: ${this.uploadsDir}`);
        }

        // Log paths for debugging
        this.logger.log(`Python scripts directory: ${scriptsDir}`);
        this.logger.log(`Python script path: ${this.pythonScriptPath}`);
        this.logger.log(`Test script path: ${this.testScriptPath}`);
        this.logger.log(`Python command: ${this.pythonCommand}`);

        // Check if Python script exists
        if (!fs.existsSync(this.pythonScriptPath)) {
            this.logger.warn(`Python script not found at: ${this.pythonScriptPath}`);
        }

        // Verify Python execution on startup
        this.testPythonExecution();
    }

    /**
     * Test Python execution to verify the setup works
     */
    public async testPythonExecution(): Promise<any> {
        try {
            if (!fs.existsSync(this.testScriptPath)) {
                this.logger.warn(`Test script not found at: ${this.testScriptPath}`);
                return {
                    success: false,
                    error: `Test script not found at: ${this.testScriptPath}`
                };
            }

            const result = await this.runPythonScript(this.testScriptPath, ['test-arg']);
            this.logger.log(`Python test execution result: ${JSON.stringify(result)}`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to execute Python test script: ${error.message}`);
            throw error;
        }
    }

    /**
     * Process uploaded file using both Python (for answer recognition) and Node.js (for images)
     */
    async processUploadedFile(file: MulterFile, options: any = {}): Promise<any> {
        try {
            this.logger.log(`Processing file with Python parser: ${file.originalname}`);

            // Step 1: Save the file
            const fileId = uuidv4();
            const filename = `${fileId}${path.extname(file.originalname)}`;
            const filePath = path.join(this.uploadsDir, filename);

            fs.writeFileSync(filePath, file.buffer);
            this.logger.log(`File saved to: ${filePath}`);

            // Step 2: Use Node.js to extract images
            const nodeResult = await this.enhancedDocxParserService.parseUploadedFile(file, {
                ...options,
                processImages: true,
                skipQuestionParsing: true // Only extract images
            });

            // Step 3: Use Python to parse questions and answers
            const pythonResult = await this.runPythonScript(this.pythonScriptPath, [filePath]);

            if (!pythonResult.success) {
                throw new Error(`Python parser failed: ${pythonResult.errors?.join(', ')}`);
            }

            // Step 4: Merge results
            const mergedQuestions = this.mergeResults(pythonResult, nodeResult);

            return {
                questions: mergedQuestions,
                filePath,
                extractedFiles: nodeResult.extractedFiles,
                stats: {
                    totalQuestions: mergedQuestions.length,
                    groupQuestions: mergedQuestions.filter(q => q.type === 'group').length,
                    singleQuestions: mergedQuestions.filter(q => q.type === 'single').length,
                    fillInBlankQuestions: mergedQuestions.filter(q => q.type === 'fill-in-blank').length,
                    extractedImages: nodeResult.extractedFiles.length,
                    hasLatex: mergedQuestions.filter(q => q.has_latex).length
                }
            };
        } catch (error) {
            this.logger.error(`Error in Python parser: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Run Python script with arguments
     */
    private async runPythonScript(scriptPath: string, args: string[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.logger.log(`Running Python script: ${scriptPath} with args: ${args.join(', ')}`);

            // Make file executable on non-Windows platforms
            if (process.platform !== 'win32') {
                try {
                    fs.chmodSync(scriptPath, '755');
                } catch (error) {
                    this.logger.warn(`Failed to make script executable: ${error.message}`);
                }
            }

            const python = spawn(this.pythonCommand, [scriptPath, ...args]);

            let stdout = '';
            let stderr = '';

            python.stdout.on('data', (data) => {
                stdout += data.toString();
                this.logger.debug(`Python stdout: ${data.toString()}`);
            });

            python.stderr.on('data', (data) => {
                stderr += data.toString();
                this.logger.error(`Python stderr: ${data.toString()}`);
            });

            python.on('close', (code) => {
                this.logger.log(`Python process exited with code ${code}`);

                if (code !== 0) {
                    this.logger.error(`Python process error: ${stderr}`);
                    resolve({
                        success: false,
                        questions: [],
                        answers: [],
                        errors: [stderr || `Process exited with code ${code}`]
                    });
                    return;
                }

                try {
                    if (!stdout.trim()) {
                        throw new Error('No output from Python script');
                    }

                    const result = JSON.parse(stdout);
                    resolve({
                        success: true,
                        ...(result || {}),
                        questions: result.questions || [],
                        answers: result.answers || []
                    });
                } catch (error) {
                    this.logger.error(`Failed to parse Python output: ${error.message}`);
                    this.logger.error(`Raw output: ${stdout}`);
                    resolve({
                        success: false,
                        questions: [],
                        answers: [],
                        errors: [`Failed to parse Python output: ${error.message}`]
                    });
                }
            });

            python.on('error', (error) => {
                this.logger.error(`Failed to start Python process: ${error.message}`);
                resolve({
                    success: false,
                    questions: [],
                    answers: [],
                    errors: [`Failed to start Python process: ${error.message}`]
                });
            });
        });
    }

    /**
     * Merge Python parsing results with Node.js image extraction
     */
    private mergeResults(pythonResult: PythonParseResult, nodeResult: any): any[] {
        // Start with the Python-parsed questions
        const mergedQuestions = [...pythonResult.questions];

        // Map extracted images to questions based on their position or references
        if (nodeResult.extractedFiles?.length > 0) {
            for (const question of mergedQuestions) {
                // If the question has image references, try to match them with extracted images
                if (question.imageReferences?.length > 0) {
                    question.files = question.imageReferences.map(ref => {
                        const matchedImage = nodeResult.extractedFiles.find(file =>
                            file.originalName.includes(ref) || file.id.includes(ref)
                        );
                        return matchedImage || null;
                    }).filter(Boolean);
                }
            }
        }

        return mergedQuestions;
    }
}
