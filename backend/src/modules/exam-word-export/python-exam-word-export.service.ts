import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface PythonExportOptions {
    examTitle: string;
    subject: string;
    course: string;
    semester: string;
    academicYear: string;
    examDate: string;
    duration: string;
    instructions: string;
    allowMaterials: boolean;
    showAnswers: boolean;
    separateAnswerSheet: boolean;
    studentInfo: {
        studentId: string;
        studentName: string;
        className: string;
    };
}

export interface PythonExportResult {
    success: boolean;
    message: string;
    file_path?: string;
    total_questions?: number;
}

/**
 * Service for exporting exams to Word using Python
 * Author: Linh Dang Dev
 */
@Injectable()
export class PythonExamWordExportService {
    private readonly logger = new Logger(PythonExamWordExportService.name);
    private readonly pythonScriptPath: string;
    private readonly outputDir: string;

    constructor() {
        this.pythonScriptPath = path.join(process.cwd(), 'python', 'exam_word_exporter.py');
        this.outputDir = path.join(process.cwd(), 'exports');
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Export exam to Word using Python script
     */
    async exportExamToWord(examId: string, options: PythonExportOptions): Promise<Buffer> {
        try {
            this.logger.log(`Starting Python export for exam: ${examId}`);

            // Validate inputs
            if (!examId || !options.examTitle) {
                throw new BadRequestException('Exam ID and title are required');
            }

            // Generate output filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `exam_${examId}_${timestamp}.docx`;
            const outputPath = path.join(this.outputDir, filename);

            // Prepare export options for Python
            const pythonOptions = {
                ...options,
                outputPath: outputPath
            };

            // Run Python script
            const result = await this.runPythonScript(examId, pythonOptions);

            if (!result.success) {
                throw new BadRequestException(`Python export failed: ${result.message}`);
            }

            // Read the generated file
            if (!fs.existsSync(result.file_path!)) {
                throw new BadRequestException('Generated file not found');
            }

            const buffer = fs.readFileSync(result.file_path!);

            // Clean up the temporary file
            try {
                fs.unlinkSync(result.file_path!);
                this.logger.log(`Cleaned up temporary file: ${result.file_path}`);
            } catch (cleanupError) {
                this.logger.warn(`Failed to cleanup file: ${cleanupError.message}`);
            }

            this.logger.log(`Python export completed successfully for exam: ${examId}`);
            return buffer;

        } catch (error) {
            this.logger.error(`Python export error: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Run Python script and return result
     */
    private async runPythonScript(examId: string, options: any): Promise<PythonExportResult> {
        return new Promise((resolve, reject) => {
            try {
                // Prepare arguments
                const optionsJson = JSON.stringify(options);
                const args = [this.pythonScriptPath, examId, optionsJson];

                this.logger.log(`Running Python script: python3 ${args.join(' ')}`);

                // Spawn Python process
                const pythonProcess = spawn('python3', args, {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    cwd: process.cwd()
                });

                let stdout = '';
                let stderr = '';

                // Collect output
                pythonProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                // Handle process completion
                pythonProcess.on('close', (code) => {
                    this.logger.log(`Python process exited with code: ${code}`);
                    
                    if (code !== 0) {
                        this.logger.error(`Python script failed with code ${code}`);
                        this.logger.error(`STDERR: ${stderr}`);
                        reject(new Error(`Python script failed: ${stderr || 'Unknown error'}`));
                        return;
                    }

                    try {
                        // Parse JSON result from stdout
                        const result = JSON.parse(stdout.trim());
                        resolve(result);
                    } catch (parseError) {
                        this.logger.error(`Failed to parse Python output: ${parseError.message}`);
                        this.logger.error(`STDOUT: ${stdout}`);
                        this.logger.error(`STDERR: ${stderr}`);
                        reject(new Error(`Failed to parse Python output: ${parseError.message}`));
                    }
                });

                // Handle process errors
                pythonProcess.on('error', (error) => {
                    this.logger.error(`Python process error: ${error.message}`);
                    reject(new Error(`Failed to start Python process: ${error.message}`));
                });

                // Set timeout
                setTimeout(() => {
                    if (!pythonProcess.killed) {
                        pythonProcess.kill();
                        reject(new Error('Python script timeout'));
                    }
                }, 60000); // 60 seconds timeout

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Get default export options for an exam
     */
    async getDefaultOptions(examId: string): Promise<Partial<PythonExportOptions>> {
        // This could be enhanced to get actual exam data from database
        // For now, return sensible defaults
        return {
            examTitle: 'ĐỀ THI HỌC KỲ',
            subject: '',
            course: '',
            semester: 'Học kỳ 1',
            academicYear: new Date().getFullYear().toString(),
            examDate: new Date().toLocaleDateString('vi-VN'),
            duration: '90 phút',
            instructions: 'Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.',
            allowMaterials: false,
            showAnswers: false,
            separateAnswerSheet: false,
            studentInfo: {
                studentId: '',
                studentName: '',
                className: ''
            }
        };
    }

    /**
     * Check if Python and required packages are available
     */
    async checkPythonEnvironment(): Promise<boolean> {
        return new Promise((resolve) => {
            const pythonProcess = spawn('python3', ['-c', 'import docx, pyodbc; print("OK")'], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.on('close', (code) => {
                const isOk = code === 0 && output.trim() === 'OK';
                if (isOk) {
                    this.logger.log('Python environment check passed');
                } else {
                    this.logger.error('Python environment check failed');
                }
                resolve(isOk);
            });

            pythonProcess.on('error', () => {
                this.logger.error('Python not found');
                resolve(false);
            });
        });
    }

    /**
     * Install required Python packages
     */
    async installPythonPackages(): Promise<boolean> {
        return new Promise((resolve) => {
            this.logger.log('Installing Python packages...');
            
            const installProcess = spawn('pip3', ['install', 'python-docx', 'pyodbc'], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stderr = '';
            installProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            installProcess.on('close', (code) => {
                if (code === 0) {
                    this.logger.log('Python packages installed successfully');
                    resolve(true);
                } else {
                    this.logger.error(`Failed to install Python packages: ${stderr}`);
                    resolve(false);
                }
            });

            installProcess.on('error', (error) => {
                this.logger.error(`Package installation error: ${error.message}`);
                resolve(false);
            });
        });
    }
}
