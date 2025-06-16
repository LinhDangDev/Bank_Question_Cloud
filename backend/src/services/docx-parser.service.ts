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
            // Check if file and buffer exist
            if (!file || !file.buffer) {
                throw new Error("Invalid file or missing buffer");
            }

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
            // Xử lý đặc biệt cho các phần LaTeX
            html = this.preprocessLatex(html);

            // Tách nội dung theo ký hiệu [<br>]
            const questionBlocks = html.split('[<br>]');

            for (const block of questionBlocks) {
                if (!block.trim()) continue;

                // Phân tích các câu hỏi và các câu trả lời
                const question = this.parseQuestionBlock(block);
                if (question) {
                    questions.push(question);
                }
            }

            // Xử lý các câu hỏi nhóm
            questions.push(...this.parseGroupQuestions(html));

            return questions;
        } catch (error) {
            this.logger.error(`Error extracting questions from HTML: ${error.message}`, error.stack);
            return [];
        }
    }

    /**
     * Tiền xử lý nội dung LaTeX trong HTML
     */
    private preprocessLatex(html: string): string {
        // Giữ nguyên các công thức LaTeX
        return html.replace(/<span class="latex">(.*?)<\/span>/g, (match, formula) => {
            return `$$${formula}$$`;
        });
    }

    /**
     * Phân tích một khối câu hỏi
     */
    private parseQuestionBlock(block: string): ParsedQuestion | null {
        try {
            // Tìm nội dung câu hỏi - giả sử nội dung câu hỏi là từ đầu đến dòng đầu tiên bắt đầu bằng "A."
            const questionContentMatch = block.match(/^(.*?)(?=<p>A\.|$)/s);
            if (!questionContentMatch) return null;

            let content = questionContentMatch[1].trim();

            // Xóa tiền tố CLO nếu có
            content = content.replace(/\(CLO\d+\)\s*/, '');

            // Xác định loại câu hỏi
            let type = 'single-choice';
            if (content.includes('___') || content.includes('...')) {
                type = 'fill-blank';
            }

            // Tìm các câu trả lời
            const answers: Array<{ content: string, isCorrect: boolean, order: number }> = [];
            const answerMatches = block.matchAll(/<p>([A-D])\.?\s*(.*?)(?=<p>[A-D]\.|<p>\(|$)/gs);

            for (const match of answerMatches) {
                const letter = match[1];
                let answerContent = match[2].trim();

                // Kiểm tra đáp án đúng (gạch chân hoặc đánh dấu)
                const isCorrect = answerContent.includes('<u>') || answerContent.includes('<strong>') || answerContent.includes('*');

                // Làm sạch nội dung
                answerContent = answerContent
                    .replace(/<u>(.*?)<\/u>/g, '$1')
                    .replace(/<strong>(.*?)<\/strong>/g, '$1')
                    .replace(/\*/g, '')
                    .trim();

                answers.push({
                    content: answerContent,
                    isCorrect,
                    order: letter.charCodeAt(0) - 'A'.charCodeAt(0)
                });
            }

            return {
                content,
                type,
                answers
            };
        } catch (error) {
            this.logger.error(`Error parsing question block: ${error.message}`);
            return null;
        }
    }

    /**
     * Phân tích câu hỏi nhóm
     */
    private parseGroupQuestions(html: string): ParsedQuestion[] {
        const questions: ParsedQuestion[] = [];

        try {
            // Tìm tất cả các nhóm câu hỏi [<sg>]...[</sg>]
            const groupMatches = html.matchAll(/\[<sg>\](.*?)\[<\/sg>\]/gs);

            for (const groupMatch of groupMatches) {
                const groupContent = groupMatch[1];

                // Tìm nội dung chung của nhóm
                const commonContentMatch = groupContent.match(/(.*?)\[<egc>\]/s);
                if (!commonContentMatch) continue;

                const commonContent = commonContentMatch[1].trim();

                // Tìm các câu hỏi con trong nhóm
                const subQuestionMatches = groupContent.matchAll(/\(<(\d+)>\)(.*?)(?=\(<\d+>\)|$)/gs);

                for (const subQuestionMatch of subQuestionMatches) {
                    const number = subQuestionMatch[1];
                    const subQuestionContent = subQuestionMatch[2];

                    // Xử lý tương tự như câu hỏi đơn
                    const question = this.parseQuestionBlock(subQuestionContent);

                    if (question) {
                        // Thêm nội dung chung vào nội dung câu hỏi
                        question.content = `${commonContent}\n\nQuestion ${number}: ${question.content}`;
                        questions.push(question);
                    }
                }
            }

            return questions;
        } catch (error) {
            this.logger.error(`Error parsing group questions: ${error.message}`);
            return [];
        }
    }
}
