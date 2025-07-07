import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PizZip from 'pizzip';
import * as Docxtemplater from 'docxtemplater';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DocxTemplateService {
    private readonly logger = new Logger(DocxTemplateService.name);
    private readonly templatesDir = path.join(process.cwd(), 'template');
    private readonly outputDir = path.join(process.cwd(), 'output');

    constructor() {
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async generateDocx(templateName: string, data: any, customTemplatePath?: string): Promise<string> {
        try {
            this.logger.log(`Generating DOCX using template: ${templateName}`);

            // Determine template path - use custom path if provided, otherwise use from templates directory
            let templatePath = customTemplatePath;

            if (!templatePath) {
                // Try to use the specified template name
                templatePath = path.join(this.templatesDir, templateName);
                this.logger.log(`Looking for template: ${templatePath}`);

                // Check if template exists
                if (!fs.existsSync(templatePath)) {
                    this.logger.warn(`Template not found: ${templatePath}`);

                    // Try TemplateHutech.dotx as first fallback
                    templatePath = path.join(this.templatesDir, 'TemplateHutech.dotx');
                    this.logger.log(`Trying Hutech template: ${templatePath}`);

                    if (!fs.existsSync(templatePath)) {
                        // Try DefaultTemplate.dotx as second fallback
                        templatePath = path.join(this.templatesDir, 'DefaultTemplate.dotx');
                        this.logger.log(`Trying default template: ${templatePath}`);

                        if (!fs.existsSync(templatePath)) {
                            throw new Error(`No suitable template found in ${this.templatesDir}`);
                        }
                    }
                }
            }

            // Read the template
            const content = fs.readFileSync(templatePath, 'binary');
            this.logger.log(`Template file read successfully: ${templatePath}`);

            // Create zip of the template
            const zip = new PizZip(content);

            // Create a new instance of Docxtemplater with error reporting
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                nullGetter: function () {
                    return "";
                }
            });

            // Validate and prepare data for the template
            const preparedData = this.prepareTemplateData(data);

            // Log data structure for debugging
            this.logger.log(`Rendering template with ${preparedData.questions.length} questions`);
            this.logger.log(`Template data includes: ${Object.keys(preparedData).join(', ')}`);

            // Set the data
            doc.render(preparedData);
            this.logger.log(`Template rendered successfully`);

            // Get the binary content of the output
            const buffer = doc.getZip().generate({
                type: 'nodebuffer',
                compression: 'DEFLATE',
            });

            // Generate unique filename
            const outputFilename = `${uuidv4()}.docx`;
            const outputPath = path.join(this.outputDir, outputFilename);

            // Write the file
            fs.writeFileSync(outputPath, buffer);
            this.logger.log(`DOCX generated successfully: ${outputPath}`);

            return outputPath;
        } catch (error) {
            this.logger.error(`Error generating DOCX: ${error.message}`, error.stack);
            throw new Error(`Failed to generate DOCX: ${error.message}`);
        }
    }

    /**
     * Prepare and validate data for the template
     */
    private prepareTemplateData(data: any): any {
        // Make sure we have required fields
        const preparedData = {
            title: data.title || 'Đề thi',
            subject: data.subject || 'Môn học',
            date: data.date || new Date().toLocaleDateString('vi-VN'),
            instructions: data.instructions || 'Thời gian làm bài: 90 phút',
            hasAnswers: typeof data.hasAnswers === 'boolean' ? data.hasAnswers : true,
            hideChapterStructure: data.hideChapterStructure || false,
            questions: []
        };

        // Process questions if available
        if (Array.isArray(data.questions)) {
            preparedData.questions = data.questions.map((q, index) => {
                return {
                    number: q.number || index + 1,
                    text: q.text || q.content || 'Nội dung câu hỏi',
                    answers: Array.isArray(q.answers) ? q.answers.map(a => ({
                        label: a.label || '',
                        text: a.text || a.content || '',
                        isCorrect: a.isCorrect || false
                    })) : [],
                    correctAnswer: q.correctAnswer || '',
                    clo: q.clo || '',
                    difficulty: q.difficulty || 1,
                    // Include chapter info only if not hiding chapter structure
                    chapter: data.hideChapterStructure ? null : q.chapter
                };
            });
        }

        // Add flag to control chapter structure display in template
        // preparedData.hideChapterStructure = data.hideChapterStructure || false;

        return preparedData;
    }
}
