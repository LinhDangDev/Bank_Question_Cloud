import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PizZip from 'pizzip';
import * as Docxtemplater from 'docxtemplater';
import * as mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { MulterFile } from '../interfaces/multer-file.interface';

interface ParsedQuestion {
    content: string;
    type: string;
    answers: Array<{
        content: string;
        isCorrect: boolean;
        order: number;
    }>;
    files?: Array<{
        type: string; // audio, image
        path: string;
    }>;
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
     * Parse DOCX file to extract questions
     */
    async parseDocxToQuestions(filePath: string): Promise<ParsedQuestion[]> {
        try {
            this.logger.log(`Parsing DOCX file: ${filePath}`);

            // Extract HTML content from DOCX
            const { value: htmlContent } = await mammoth.convertToHtml({ path: filePath });

            // Process HTML to extract questions
            const questions = this.extractQuestionsFromHtml(htmlContent);

            this.logger.log(`Successfully parsed ${questions.length} questions from DOCX file`);
            return questions;
        } catch (error) {
            this.logger.error(`Error parsing DOCX file: ${error.message}`, error.stack);
            throw new Error(`Failed to parse DOCX file: ${error.message}`);
        }
    }

    /**
     * Process uploaded file: save to uploads directory and parse
     */
    async processUploadedFile(file: MulterFile): Promise<{ questions: ParsedQuestion[], filePath: string }> {
        try {
            // Generate unique filename
            const fileId = uuidv4();
            const ext = path.extname(file.originalname);
            const filename = `${fileId}${ext}`;
            const uploadPath = path.join(this.uploadsDir, filename);

            // Save file to disk
            fs.writeFileSync(uploadPath, file.buffer);
            this.logger.log(`File saved to: ${uploadPath}`);

            // Parse the file
            const questions = await this.parseDocxToQuestions(uploadPath);

            return {
                questions,
                filePath: uploadPath
            };
        } catch (error) {
            this.logger.error(`Error processing uploaded file: ${error.message}`, error.stack);
            throw new Error(`Failed to process uploaded file: ${error.message}`);
        }
    }

    /**
     * Extract questions from HTML content
     * This is a simplified implementation - you will need to enhance based on your specific document format
     */
    private extractQuestionsFromHtml(html: string): ParsedQuestion[] {
        const questions: ParsedQuestion[] = [];

        try {
            // Split HTML into sections using appropriate delimiters
            // This is highly dependent on your document structure
            const sections = html.split('<p><strong>Question');

            // Skip first section if it's empty or contains header info
            for (let i = 1; i < sections.length; i++) {
                const section = sections[i];

                // Parse question number and content
                const questionRegex = /(\d+):<\/strong>(.*?)(?:<p>A\.|<p>Options:|$)/s;
                const questionMatch = section.match(questionRegex);

                if (!questionMatch) continue;

                const questionContent = questionMatch[2].trim();

                // Determine question type based on content
                let questionType = 'single-choice';
                if (questionContent.includes('___')) {
                    questionType = 'fill-blank';
                }

                // Extract answers for multiple choice questions
                const answers: Array<{
                    content: string;
                    isCorrect: boolean;
                    order: number;
                }> = [];

                if (questionType === 'single-choice') {
                    // Find answers with patterns like "A. Answer text"
                    const answerRegex = /<p>([A-D])\.\s*(.*?)(?=<p>[A-D]\.|<p>|$)/gs;
                    let answerMatch;

                    while ((answerMatch = answerRegex.exec(section)) !== null) {
                        const letter = answerMatch[1];
                        const content = answerMatch[2].trim();

                        // Check if this answer is marked as correct (usually with * or other marker)
                        // This depends on your document format
                        const isCorrect = content.includes('*');
                        const cleanContent = content.replace('*', '').trim();

                        answers.push({
                            content: cleanContent,
                            isCorrect,
                            order: letter.charCodeAt(0) - 'A'.charCodeAt(0)
                        });
                    }
                }

                questions.push({
                    content: questionContent,
                    type: questionType,
                    answers: answers
                });
            }

            return questions;
        } catch (error) {
            this.logger.error(`Error extracting questions from HTML: ${error.message}`, error.stack);
            return [];
        }
    }
}
