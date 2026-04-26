import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

    async convertDocxToPdf(docxPath: string): Promise<string> {
        this.logger.log(`Starting PDF conversion for: ${docxPath}`);
        const outputDir = path.dirname(docxPath);
        const pdfPath = path.join(outputDir, `${path.basename(docxPath, '.docx')}.pdf`);

        try {
            // 1. Convert DOCX to HTML using mammoth
            const docxBuffer = fs.readFileSync(docxPath);
            const { value: html } = await mammoth.convertToHtml({ buffer: docxBuffer });

            // 2. Launch Puppeteer to create a PDF from HTML
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();

            // Inject styles to better replicate Word's look and feel
            const styledHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Times New Roman', Times, serif;
                            font-size: 12pt;
                            margin: 1in;
                        }
                        p {
                            margin-bottom: 0;
                            margin-top: 0;
                            line-height: 1.5;
                        }
                        table {
                            border-collapse: collapse;
                            width: 100%;
                        }
                        td, th {
                            border: 1px solid black;
                            padding: 8px;
                        }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
                </html>
            `;

            await page.setContent(styledHtml, { waitUntil: 'networkidle0' });

            // 3. Generate PDF
            await page.pdf({
                path: pdfPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '1in',
                    right: '1in',
                    bottom: '1in',
                    left: '1in'
                }
            });

            await browser.close();
            this.logger.log(`Successfully converted to PDF: ${pdfPath}`);
            return pdfPath;
        } catch (error) {
            this.logger.error(`Error converting DOCX to PDF: ${error.message}`, error.stack);
            throw new Error(`Failed to convert ${docxPath} to PDF. Error: ${error.message}`);
        }
    }

    /**
     * Generate a custom PDF directly from data
     * @param pdfPath The output path for the PDF file
     * @param data Object containing title, instructions, and questions
     * @returns The path to the generated PDF file
     */
    async generateCustomPdf(pdfPath: string, data: any): Promise<string> {
        this.logger.log(`Generating custom PDF at: ${pdfPath}`);

        try {
            // Ensure the output directory exists
            const outputDir = path.dirname(pdfPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Launch Puppeteer
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();

            // Create HTML content for the PDF
            const htmlContent = this.generateHtmlForPdf(data);

            // Set the content and wait for it to load
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            // Generate the PDF
            await page.pdf({
                path: pdfPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0.5in',
                    right: '0.5in',
                    bottom: '0.5in',
                    left: '0.5in'
                }
            });

            await browser.close();
            this.logger.log(`Successfully generated custom PDF: ${pdfPath}`);
            return pdfPath;
        } catch (error) {
            this.logger.error(`Error generating custom PDF: ${error.message}`, error.stack);
            throw new Error(`Failed to generate custom PDF. Error: ${error.message}`);
        }
    }

    /**
     * Generate HTML content for the PDF
     * @param data Object containing title, instructions, and questions
     * @returns HTML string
     */
    private generateHtmlForPdf(data: any): string {
        const { title, instructions, questions, subject, date, hideChapterStructure } = data;

        // Default values
        const examDate = date || new Date().toLocaleDateString('vi-VN');
        const examSubject = subject || '';
        const showAnswers = data.hasAnswers !== false; // Show answers by default unless explicitly set to false
        const shouldHideChapters = hideChapterStructure || false;

        // Create HTML for each question
        const questionsHtml = questions.map((question: any, index: number) => {
            // Get options from question
            const options = question.options || [];

            // Generate options HTML
            const optionsHtml = options.map((option: any, optIndex: number) => {
                // Determine if this option is correct
                const isCorrect = typeof option === 'object'
                    ? !!option.isCorrect
                    : (question.correctAnswerIndex === optIndex);

                // Get option content
                const optionContent = typeof option === 'object' ? option.content : option;

                // Get option label (A, B, C, D...)
                const optionLabel = typeof option === 'object' && option.label
                    ? option.label
                    : String.fromCharCode(65 + optIndex);

                return `
                <tr class="${isCorrect && showAnswers ? 'correct-option' : ''}">
                    <td class="option-label">${optionLabel}</td>
                    <td class="option-content">${optionContent}</td>
                    <td class="option-mark">${isCorrect && showAnswers ? '✓' : ''}</td>
                </tr>
            `;
            }).join('');

            // Get question content
            const questionContent = question.content || question.text || '';
            const questionNumber = question.number || (index + 1);

            // Extract metadata
            const topic = question.topic || '';
            const clo = question.clo || '';
            const difficulty = question.difficulty ? `Độ khó: ${question.difficulty}` : '';
            const chapterName = question.chapter?.name || '';

            // Generate question HTML with table for answers
            return `
                <div class="question">
                    <div class="question-header">
                        <div class="question-number">Câu ${questionNumber}:</div>
                        <div class="question-meta">
                            ${!shouldHideChapters && chapterName ? `<span class="question-chapter">Chương: ${chapterName}</span>` : ''}
                            ${topic ? `<span class="question-topic">${topic}</span>` : ''}
                            ${clo ? `<span class="question-clo">CLO: ${clo}</span>` : ''}
                            ${difficulty ? `<span class="question-difficulty">${difficulty}</span>` : ''}
                        </div>
                    </div>
                    <div class="question-content">${questionContent}</div>
                    <div class="options">
                        <table class="options-table">
                            <tbody>
                                ${optionsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }).join('');

        // Create the complete HTML document with school branding
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    @page {
                        margin: 2cm;
                    }
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 12pt;
                        line-height: 1.5;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 30px;
                        border-bottom: 1px solid #333;
                        padding-bottom: 15px;
                    }
                    .school-info {
                        text-align: center;
                        text-transform: uppercase;
                        font-weight: bold;
                        font-size: 11pt;
                    }
                    .school-header {
                        margin-bottom: 5px;
                    }
                    .exam-title {
                        text-align: center;
                        font-weight: bold;
                        font-size: 14pt;
                        margin: 15px 0;
                        text-transform: uppercase;
                    }
                    .exam-info {
                        text-align: center;
                        font-style: italic;
                        margin-bottom: 10px;
                    }
                    .instructions {
                        margin-bottom: 30px;
                        padding: 10px;
                        background-color: #f9f9f9;
                        border-left: 3px solid #333;
                    }
                    .question {
                        margin-bottom: 20px;
                        page-break-inside: avoid;
                    }
                    .question-header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                    }
                    .question-number {
                        font-weight: bold;
                    }
                    .question-meta {
                        font-size: 10pt;
                        color: #666;
                    }
                    .question-chapter, .question-topic, .question-clo, .question-difficulty {
                        margin-left: 10px;
                    }
                    .question-chapter {
                        color: #0066cc;
                        font-weight: bold;
                    }
                    .question-content {
                        margin-bottom: 10px;
                    }
                    .options-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .options-table tr {
                        border-bottom: 1px solid #eee;
                    }
                    .options-table tr:last-child {
                        border-bottom: none;
                    }
                    .option-label {
                        width: 30px;
                        font-weight: bold;
                        vertical-align: top;
                        padding: 5px;
                    }
                    .option-content {
                        padding: 5px;
                    }
                    .option-mark {
                        width: 20px;
                        text-align: center;
                        color: #008000;
                        font-weight: bold;
                    }
                    .correct-option {
                        background-color: #f0fff0;
                    }
                    .page-break {
                        page-break-after: always;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        font-size: 10pt;
                        color: #666;
                        font-style: italic;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="school-info">
                        <div class="school-header">BỘ GIÁO DỤC VÀ ĐÀO TẠO</div>
                        <div>TRƯỜNG ĐẠI HỌC HUTECH</div>
                    </div>
                </div>

                <div class="exam-title">${title}</div>

                <div class="exam-info">
                    ${examSubject ? `<div>Môn: ${examSubject}</div>` : ''}
                    <div>Ngày: ${examDate}</div>
                </div>

                <div class="instructions">
                    ${instructions || 'Thời gian làm bài: 90 phút. Không được sử dụng tài liệu.'}
                </div>

                <div class="questions">
                    ${questionsHtml}
                </div>

                <div class="footer">
                    --- HẾT ---
                </div>
            </body>
            </html>
        `;
    }
}
