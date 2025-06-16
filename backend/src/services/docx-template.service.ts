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

    async generateDocx(templateName: string, data: any): Promise<string> {
        try {
            // Default template path
            const templatePath = path.join(this.templatesDir, templateName);

            // Check if template exists
            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template not found: ${templatePath}`);
            }

            // Read the template
            const content = fs.readFileSync(templatePath, 'binary');

            // Create zip of the template
            const zip = new PizZip(content);

            // Create a new instance of Docxtemplater
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            // Set the template variables
            doc.setData(data);

            // Render the document
            doc.render();

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
}
