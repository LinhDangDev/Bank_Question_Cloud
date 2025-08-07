import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MulterFile } from '../interfaces/multer-file.interface';

export interface PythonProcessingResult {
    success: boolean;
    text_content: string;
    html_content: string;
    questions: any[];
    images: any[];
    errors: string[];
    warnings: string[];
    statistics: {
        total_questions: number;
        single_questions: number;
        group_questions: number;
        fill_blank_questions: number;
        total_images: number;
        questions_with_media: number;
        total_media_references: number;
    };
}

@Injectable()
export class PythonWordProcessorService {
    private readonly logger = new Logger(PythonWordProcessorService.name);
    private readonly scriptsDir = path.join(process.cwd(), 'scripts');
    private readonly tempDir = path.join(process.cwd(), 'temp');
    private readonly pythonScript = path.join(this.scriptsDir, 'word_processor.py');

    constructor() {
        this.ensureDirectories();
    }

    private async ensureDirectories(): Promise<void> {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            this.logger.error('Error creating temp directory', error);
        }
    }

    async processWordDocument(
        file: MulterFile,
        options: {
            extractImages?: boolean;
            verbose?: boolean;
        } = {}
    ): Promise<PythonProcessingResult> {
        const { extractImages = true, verbose = false } = options;
        
        // Save uploaded file to temp directory
        const tempFileName = `${uuidv4()}_${file.originalname}`;
        const tempFilePath = path.join(this.tempDir, tempFileName);
        const outputFilePath = path.join(this.tempDir, `${uuidv4()}_output.json`);

        try {
            // Write file to disk
            await fs.writeFile(tempFilePath, file.buffer);
            this.logger.log(`Saved file to: ${tempFilePath}`);

            // Prepare Python command arguments
            const args = [
                this.pythonScript,
                tempFilePath,
                '--output', outputFilePath
            ];

            if (extractImages) {
                args.push('--extract-images');
            }

            if (verbose) {
                args.push('--verbose');
            }

            // Execute Python script
            const result = await this.executePythonScript(args);

            if (!result.success) {
                throw new Error(`Python script failed: ${result.error}`);
            }

            // Read output file
            const outputData = await this.readOutputFile(outputFilePath);

            // Cleanup temp files
            await this.cleanupTempFiles([tempFilePath, outputFilePath]);

            return outputData;

        } catch (error) {
            this.logger.error('Error processing Word document with Python', error);
            
            // Cleanup on error
            await this.cleanupTempFiles([tempFilePath, outputFilePath]);
            
            return {
                success: false,
                text_content: '',
                html_content: '',
                questions: [],
                images: [],
                errors: [error.message],
                warnings: [],
                statistics: {
                    total_questions: 0,
                    single_questions: 0,
                    group_questions: 0,
                    fill_blank_questions: 0,
                    total_images: 0,
                    questions_with_media: 0,
                    total_media_references: 0
                }
            };
        }
    }

    private async executePythonScript(args: string[]): Promise<{ success: boolean; error?: string }> {
        return new Promise((resolve) => {
            const pythonProcess = spawn('python3', args, {
                cwd: process.cwd(),
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
                    this.logger.error(`stderr: ${stderr}`);
                    resolve({ success: false, error: stderr || `Process exited with code ${code}` });
                }
            });

            pythonProcess.on('error', (error) => {
                this.logger.error('Error spawning Python process', error);
                resolve({ success: false, error: error.message });
            });
        });
    }

    private async readOutputFile(filePath: string): Promise<PythonProcessingResult> {
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            
            // Validate the structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid output format from Python script');
            }

            return {
                success: data.success || false,
                text_content: data.text_content || '',
                html_content: data.html_content || '',
                questions: data.questions || [],
                images: data.images || [],
                errors: data.errors || [],
                warnings: data.warnings || [],
                statistics: {
                    total_questions: data.statistics?.total_questions || 0,
                    single_questions: data.statistics?.single_questions || 0,
                    group_questions: data.statistics?.group_questions || 0,
                    fill_blank_questions: data.statistics?.fill_blank_questions || 0,
                    total_images: data.statistics?.total_images || 0,
                    questions_with_media: data.statistics?.questions_with_media || 0,
                    total_media_references: data.statistics?.total_media_references || 0
                }
            };

        } catch (error) {
            this.logger.error('Error reading Python output file', error);
            throw new Error(`Failed to read Python output: ${error.message}`);
        }
    }

    private async cleanupTempFiles(filePaths: string[]): Promise<void> {
        for (const filePath of filePaths) {
            try {
                await fs.unlink(filePath);
                this.logger.log(`Cleaned up temp file: ${filePath}`);
            } catch (error) {
                // Ignore cleanup errors
                this.logger.warn(`Failed to cleanup temp file ${filePath}:`, error.message);
            }
        }
    }

    async checkPythonEnvironment(): Promise<{ available: boolean; version?: string; error?: string }> {
        return new Promise((resolve) => {
            const pythonProcess = spawn('python3', ['--version'], {
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
                    const version = stdout.trim() || stderr.trim();
                    resolve({ available: true, version });
                } else {
                    resolve({ available: false, error: stderr || 'Python3 not found' });
                }
            });

            pythonProcess.on('error', (error) => {
                resolve({ available: false, error: error.message });
            });
        });
    }

    async installPythonDependencies(): Promise<{ success: boolean; error?: string }> {
        const requirementsPath = path.join(this.scriptsDir, 'requirements.txt');
        
        return new Promise((resolve) => {
            const pipProcess = spawn('pip3', ['install', '-r', requirementsPath], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            pipProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pipProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pipProcess.on('close', (code) => {
                if (code === 0) {
                    this.logger.log('Python dependencies installed successfully');
                    resolve({ success: true });
                } else {
                    this.logger.error(`pip install failed with code ${code}`);
                    this.logger.error(`stderr: ${stderr}`);
                    resolve({ success: false, error: stderr || `Process exited with code ${code}` });
                }
            });

            pipProcess.on('error', (error) => {
                this.logger.error('Error spawning pip process', error);
                resolve({ success: false, error: error.message });
            });
        });
    }

    async validatePythonScript(): Promise<{ valid: boolean; error?: string }> {
        try {
            await fs.access(this.pythonScript);
            return { valid: true };
        } catch (error) {
            return { valid: false, error: `Python script not found: ${this.pythonScript}` };
        }
    }
}
