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
}
