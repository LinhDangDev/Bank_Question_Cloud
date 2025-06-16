import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);
    private readonly outputDir = path.join(process.cwd(), 'output');

    constructor() {
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async convertToPdf(docxPath: string): Promise<string> {
        try {
            // Check if file exists
            if (!fs.existsSync(docxPath)) {
                throw new Error(`Source file not found: ${docxPath}`);
            }

            // Generate output filename
            const outputFilename = `${uuidv4()}.pdf`;
            const outputPath = path.join(this.outputDir, outputFilename);

            // Use LibreOffice to convert DOCX to PDF
            // Note: You need to have LibreOffice installed on the server
            const command = `soffice --headless --convert-to pdf --outdir "${this.outputDir}" "${docxPath}"`;

            this.logger.log(`Executing command: ${command}`);

            const { stdout, stderr } = await execAsync(command);

            if (stderr) {
                this.logger.warn(`Warning during PDF conversion: ${stderr}`);
            }

            this.logger.log(`PDF conversion output: ${stdout}`);

            // Check if the PDF was created
            if (!fs.existsSync(outputPath)) {
                // If the specific output path doesn't exist, try to find the converted file
                // LibreOffice might use the original filename with .pdf extension
                const docxFilename = path.basename(docxPath);
                const pdfFilename = docxFilename.replace('.docx', '.pdf');
                const alternativePath = path.join(this.outputDir, pdfFilename);

                if (fs.existsSync(alternativePath)) {
                    // Rename to our expected output name
                    fs.renameSync(alternativePath, outputPath);
                } else {
                    throw new Error('PDF conversion failed, output file not found');
                }
            }

            this.logger.log(`PDF generated successfully: ${outputPath}`);

            return outputPath;
        } catch (error) {
            this.logger.error(`Error converting to PDF: ${error.message}`, error.stack);
            throw new Error(`Failed to convert to PDF: ${error.message}`);
        }
    }
}
