import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PizZip from 'pizzip';
import * as Docxtemplater from 'docxtemplater';
import * as mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { MulterFile } from '../interfaces/multer-file.interface';
import { randomUUID } from 'crypto';
import { promisify } from 'util';
import { exec } from 'child_process';
import * as os from 'os';

const execPromise = promisify(exec);

export interface ParsedQuestion {
    id: string;
    content: string;
    answers?: ParsedAnswer[];
    type?: string;
    childQuestions?: ParsedQuestion[];
    files?: any[];
    inGroup?: boolean;
    groupId?: string;
    has_latex?: boolean;
    clo?: string;
}

export interface ParsedAnswer {
    id: string;
    content: string;
    isCorrect: boolean;
    order: number;
}

interface ParseOptions {
    processImages?: boolean;
    extractStyles?: boolean;
    preserveLatex?: boolean;
}

@Injectable()
export class DocxParserService {
    private readonly logger = new Logger(DocxParserService.name);
    private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'questions');

    constructor() {
        // Ensure uploads directory exists
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    /**
     * Process uploaded file: save to uploads directory and parse
     */
    async processUploadedFile(file: MulterFile): Promise<{ questions: ParsedQuestion[], filePath: string }> {
        try {
            this.logger.log(`Processing uploaded file: ${file?.originalname || 'unknown'}`);

            // Check if file exists
            if (!file) {
                this.logger.error('File object is missing');
                throw new Error("Invalid file or missing buffer");
            }

            // Check if buffer exists
            if (!file.buffer || file.buffer.length === 0) {
                this.logger.error(`File buffer is missing or empty for file: ${file.originalname}`);
                throw new Error("Invalid file or missing buffer");
            }

            // Check file type
            const ext = path.extname(file.originalname).toLowerCase();
            if (ext !== '.docx') {
                this.logger.error(`Invalid file type: ${ext}. Only .docx files are supported`);
                throw new Error(`Invalid file type: ${ext}. Only .docx files are supported`);
            }

            this.logger.log(`File validation passed for ${file.originalname} (${file.size} bytes)`);

            // Generate unique filename
            const fileId = uuidv4();
            const filename = `${fileId}${ext}`;
            const uploadPath = path.join(this.uploadsDir, filename);

            // Ensure directory exists
            if (!fs.existsSync(this.uploadsDir)) {
                this.logger.log(`Creating uploads directory: ${this.uploadsDir}`);
                fs.mkdirSync(this.uploadsDir, { recursive: true });
            }

            // Save file to disk
            fs.writeFileSync(uploadPath, file.buffer);
            this.logger.log(`File saved to: ${uploadPath}`);

            try {
                // Use the Python parser to get better results with underline detection and LaTeX preservation
                const questions = await this.parseDocx(uploadPath, {
                    processImages: true,
                    extractStyles: true,
                    preserveLatex: true
                });
                return {
                    questions,
                    filePath: uploadPath
                };
            } catch (pythonError) {
                this.logger.warn(`Python parsing failed: ${pythonError.message}, falling back to mammoth`);

                // Fallback to Mammoth.js with enhanced options for LaTeX
                const { value: html } = await mammoth.convertToHtml({
                    path: uploadPath,
                    ...(({
                        styleMap: [
                            "u => u", // Preserve underline
                            "strong => strong",
                            "b => strong",
                            "i => em",
                            "strike => s",
                            "p[style-name='Heading 1'] => h1:fresh",
                            "p[style-name='Heading 2'] => h2:fresh",
                            "p[style-name='Heading 3'] => h3:fresh",
                            // Handle all types of underlined text - Word has multiple ways to apply underline
                            "w:rPr/w:u => u",  // Word's native underline
                            'w:rPr[w:u] => u', // Another Word underline format
                            "span[style-text-decoration='underline'] => u"  // Style-based underline
                        ],
                        preserveStyles: true
                    }) as any)
                });

                this.logger.log(`Processed DOCX with Mammoth, HTML size ${html.length}`);

                // Simple parsing for questions and answers with LaTeX preservation
                const questions = this.parseSimpleStructure(html);

                return {
                    questions,
                    filePath: uploadPath
                };
            }
        } catch (error) {
            this.logger.error(`Error processing uploaded file: ${error.message}`, error.stack);
            throw new Error(`Failed to process uploaded file: ${error.message}`);
        }
    }

    /**
     * Simple fallback parser that extracts questions from HTML
     */
    private parseSimpleStructure(html: string): ParsedQuestion[] {
        const questions: ParsedQuestion[] = [];

        // Very basic parsing - split by <p> tags and look for patterns
        const paragraphs = html.split('<p>').map(p => p.replace('</p>', '').trim()).filter(p => p);

        let currentQuestion: ParsedQuestion | null = null;

        for (const paragraph of paragraphs) {
            // Remove HTML tags for processing, but preserve LaTeX expressions
            let text = paragraph;

            // Check for LaTeX expressions ($ or \begin{...})
            const hasLatex = /\$|\\\(|\\\[|\\begin\{/.test(text);

            // Remove HTML tags but preserve LaTeX
            text = this.preserveLatexWhileRemovingHtml(text);

            // Check if this is a question (starting with number)
            if (/^\d+\./.test(text)) {
                // If we have a current question, save it
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }

                // Start new question
                currentQuestion = {
                    id: randomUUID(),
                    content: text,
                    type: 'single-choice',
                    answers: [],
                    has_latex: hasLatex
                };
            }
            // Check if this is an answer (starting with A., B., etc.)
            else if (currentQuestion && /^[A-D]\./.test(text)) {
                const isCorrect = paragraph.includes('<u>') ||
                    paragraph.includes('underline') ||
                    paragraph.includes('text-decoration');

                if (!currentQuestion.answers) {
                    currentQuestion.answers = [];
                }

                currentQuestion.answers.push({
                    id: randomUUID(),
                    content: text.substring(2).trim(), // Remove the A., B., etc.
                    isCorrect,
                    order: currentQuestion.answers.length
                });

                // If this answer has LaTeX, mark the question as having LaTeX
                if (hasLatex) {
                    currentQuestion.has_latex = true;
                }
            }
            // Otherwise, it's additional content for the current question
            else if (currentQuestion && text) {
                currentQuestion.content += ' ' + text;

                // If this content has LaTeX, mark the question as having LaTeX
                if (hasLatex) {
                    currentQuestion.has_latex = true;
                }
            }
        }

        // Don't forget the last question
        if (currentQuestion) {
            questions.push(currentQuestion);
        }

        return questions;
    }

    /**
     * Helper method to preserve LaTeX expressions while removing HTML tags
     */
    private preserveLatexWhileRemovingHtml(html: string): string {
        if (!html) return '';

        // Replace LaTeX expressions with placeholders
        const latexExpressions: string[] = [];

        // Replace $...$ expressions
        let modifiedHtml = html.replace(/\$(.*?)\$/g, (match) => {
            latexExpressions.push(match);
            return `__LATEX_${latexExpressions.length - 1}__`;
        });

        // Replace \begin{...}...\end{...} expressions
        modifiedHtml = modifiedHtml.replace(/\\begin\{.*?\}[\s\S]*?\\end\{.*?\}/g, (match) => {
            latexExpressions.push(match);
            return `__LATEX_${latexExpressions.length - 1}__`;
        });

        // Remove HTML tags
        modifiedHtml = modifiedHtml.replace(/<[^>]+>/g, '').trim();

        // Restore LaTeX expressions
        latexExpressions.forEach((expr, index) => {
            modifiedHtml = modifiedHtml.replace(`__LATEX_${index}__`, expr);
        });

        return modifiedHtml;
    }

    // Parse a DOCX file and extract questions, answers, and correct answers
    async parseDocx(filePath: string, options: ParseOptions = {}): Promise<any> {
        try {
            // First try using Python for better parsing
            try {
                return await this.parseDOCXWithPython(filePath, options);
            } catch (pythonError) {
                this.logger.warn(`Python parsing failed, falling back to default parser: ${pythonError.message}`);
                throw pythonError; // Let the calling function handle the fallback
            }
        } catch (error) {
            this.logger.error(`Failed to parse DOCX: ${error.message}`, error.stack);
            throw new Error(`Failed to parse DOCX: ${error.message}`);
        }
    }

    // Use Python for better DOCX parsing with python-docx
    private async parseDOCXWithPython(filePath: string, options: ParseOptions = {}): Promise<any> {
        const tempDir = path.join(os.tmpdir(), 'docx_parser');

        // Create temp directory if it doesn't exist
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputFile = path.join(tempDir, `${uuidv4()}.json`);

        // Look for the Python script in several possible locations
        const possiblePaths = [
            path.join(process.cwd(), 'docx_parser.py'),
            path.join(process.cwd(), 'backend', 'docx_parser.py'),
            path.join(__dirname, '..', '..', 'docx_parser.py'),
            path.join(__dirname, '..', '..', '..', 'docx_parser.py')
        ];

        let scriptPath = '';
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                scriptPath = p;
                break;
            }
        }

        if (!scriptPath) {
            // If the script doesn't exist in any of the expected locations, create it
            scriptPath = path.join(process.cwd(), 'docx_parser.py');
            await this.createParserScript(scriptPath);
        }

        // Run Python script
        // Check which Python command to use (python3 or python)
        const pythonCmd = os.platform() === 'win32' ? 'python' : 'python3';

        // Prepare command options
        const cmdOptions: string[] = [];
        if (options.processImages) cmdOptions.push('--process-images');
        if (options.extractStyles) cmdOptions.push('--extract-styles');
        if (options.preserveLatex) cmdOptions.push('--preserve-latex');

        const command = `${pythonCmd} "${scriptPath}" "${filePath}" "${outputFile}" ${cmdOptions.join(' ')}`;

        try {
            this.logger.log(`Running command: ${command}`);

            const { stdout, stderr } = await execPromise(command);

            if (stderr && !stderr.includes('DEBUG:')) {
                this.logger.warn(`Python parser warning: ${stderr}`);
            }

            if (stdout) {
                this.logger.log(`Python parser output: ${stdout}`);
            }

            if (!fs.existsSync(outputFile)) {
                throw new Error('Python parsing failed: No output file generated');
            }

            // Read and parse the output file
            const jsonData = fs.readFileSync(outputFile, 'utf8');
            let result;

            try {
                result = JSON.parse(jsonData);
                this.logger.log(`Successfully parsed ${result.length} questions from Python parser`);

                // Post-process to ensure LaTeX expressions are properly formatted
                result = this.postProcessLatex(result);
            } catch (jsonError) {
                this.logger.error(`Failed to parse JSON output: ${jsonError.message}`);
                throw new Error('Failed to parse output from Python parser');
            }

            // Clean up temp file
            try {
                fs.unlinkSync(outputFile);
            } catch (unlinkError) {
                this.logger.warn(`Could not delete temporary file: ${unlinkError.message}`);
            }

            return result;
        } catch (error) {
            this.logger.error(`Python parsing failed: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Post-process questions to ensure LaTeX expressions are properly formatted
     */
    private postProcessLatex(questions: ParsedQuestion[]): ParsedQuestion[] {
        return questions.map(question => {
            // Process content
            if (question.content) {
                question.content = this.ensureLatexDelimiters(question.content);
            }

            // Process answers
            if (question.answers) {
                question.answers = question.answers.map(answer => {
                    if (answer.content) {
                        answer.content = this.ensureLatexDelimiters(answer.content);
                    }
                    return answer;
                });
            }

            // Process child questions recursively
            if (question.childQuestions) {
                question.childQuestions = this.postProcessLatex(question.childQuestions);
            }

            return question;
        });
    }

    /**
     * Ensure LaTeX expressions have proper delimiters
     */
    private ensureLatexDelimiters(text: string): string {
        if (!text) return text;

        // Already processed by Python parser, just return
        return text;
    }

    // Create Python parser script if it doesn't exist
    private async createParserScript(scriptPath: string): Promise<void> {
        // First check if the script already exists but just needs permissions
        if (fs.existsSync(scriptPath)) {
            try {
                // On non-Windows platforms, make the script executable
                if (os.platform() !== 'win32') {
                    fs.chmodSync(scriptPath, '755');
                }
                this.logger.log(`Set permissions for existing parser script at ${scriptPath}`);
                return;
            } catch (permError) {
                this.logger.warn(`Failed to set permissions: ${permError.message}`);
            }
        }

        // Find the source script from possible locations
        const possibleSourcePaths = [
            path.join(process.cwd(), 'docx_parser.py'),
            path.join(process.cwd(), '..', 'docx_parser.py'),
            path.join(process.cwd(), 'backend', 'docx_parser.py')
        ];

        let sourceScriptPath = '';
        for (const sourcePath of possibleSourcePaths) {
            if (fs.existsSync(sourcePath)) {
                sourceScriptPath = sourcePath;
                break;
            }
        }

        if (!sourceScriptPath) {
            throw new Error('Could not find source docx_parser.py script in any expected location');
        }

        // If we get here, we need to create the script
        try {
            // Copy the script from the source location
            const scriptContent = fs.readFileSync(sourceScriptPath, 'utf8');
            fs.writeFileSync(scriptPath, scriptContent);

            // On non-Windows platforms, make the script executable
            if (os.platform() !== 'win32') {
                fs.chmodSync(scriptPath, '755');
            }

            this.logger.log(`Created parser script at ${scriptPath} from source ${sourceScriptPath}`);
        } catch (createError) {
            this.logger.error(`Failed to create parser script: ${createError.message}`);
            throw new Error(`Could not create Python parser script: ${createError.message}`);
        }
    }
}
