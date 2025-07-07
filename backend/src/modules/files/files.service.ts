import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Files } from '../../entities/files.entity';
import { randomUUID } from 'crypto';
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as puppeteer from 'puppeteer';
import * as PizZip from 'pizzip';
import * as Docxtemplater from 'docxtemplater';
import { DocxTemplateService } from '../../services/docx-template.service';
import { PdfService } from '../../services/pdf.service';
import { StorageService } from '../../services/storage.service';

// Define the file type for Express.Multer.File since it's not recognized
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

@Injectable()
export class FilesService {
    private readonly templatesDir = join(process.cwd(), '..', 'template');
    private readonly outputDir = join(process.cwd(), 'output');

    constructor(
        @InjectRepository(Files)
        private readonly filesRepository: Repository<Files>,
        private readonly docxTemplateService: DocxTemplateService,
        private readonly pdfService: PdfService,
    ) {
        // Ensure output directory exists
        if (!existsSync(this.outputDir)) {
            mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async create(file: MulterFile, maCauHoi?: string, maCauTraLoi?: string): Promise<Files> {
        // Create directory structure if it doesn't exist
        const uploadDir = 'uploads';
        const fileDir = maCauHoi
            ? join(uploadDir, 'questions', maCauHoi)
            : (maCauTraLoi ? join(uploadDir, 'answers', maCauTraLoi) : uploadDir);

        if (!existsSync(fileDir)) {
            mkdirSync(fileDir, { recursive: true });
        }

        // Save the file to disk
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${randomUUID()}.${fileExtension}`;
        const filePath = join(fileDir, fileName);

        const fileStream = createWriteStream(join(process.cwd(), filePath));
        fileStream.write(file.buffer);
        fileStream.end();

        // Save file metadata to the database
        const fileEntity = new Files();
        fileEntity.MaFile = randomUUID();

        // Use type assertion to handle potential null values
        if (maCauHoi) {
            fileEntity.MaCauHoi = maCauHoi;
        }

        if (maCauTraLoi) {
            fileEntity.MaCauTraLoi = maCauTraLoi;
        }

        fileEntity.TenFile = filePath;
        fileEntity.LoaiFile = this.getFileType(fileExtension || '');

        return this.filesRepository.save(fileEntity);
    }

    async findByCauHoi(maCauHoi: string): Promise<Files[]> {
        return this.filesRepository.find({
            where: { MaCauHoi: maCauHoi }
        });
    }

    async findByCauTraLoi(maCauTraLoi: string): Promise<Files[]> {
        return this.filesRepository.find({
            where: { MaCauTraLoi: maCauTraLoi }
        });
    }

    async delete(maFile: string): Promise<void> {
        await this.filesRepository.delete(maFile);
    }

    // Helper method to determine file type
    private getFileType(extension: string): number {
        const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a'];
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];

        if (audioExtensions.includes(extension.toLowerCase())) {
            return 1; // Audio file
        } else if (imageExtensions.includes(extension.toLowerCase())) {
            return 2; // Image file
        }
        return 0; // Other file type
    }

    async generatePdfFromContent(title: string, content: string, showAnswers: boolean = false): Promise<string> {
        try {
            // First generate a DOCX file
            const docxPath = await this.generateDocxFromContent(title, content, showAnswers);

            // Then convert it to PDF
            const pdfPath = await this.pdfService.convertDocxToPdf(docxPath);

            // Create file record in database
            const fileEntity = new Files();
            fileEntity.MaFile = randomUUID();
            fileEntity.TenFile = pdfPath;
            fileEntity.LoaiFile = 1; // PDF file
            await this.filesRepository.save(fileEntity);

            return pdfPath;
        } catch (error) {
            throw new Error(`Failed to generate PDF: ${error.message}`);
        }
    }

    async generateDocxFromContent(title: string, content: string, showAnswers: boolean = false): Promise<string> {
        try {
            // Parse content to extract questions
            const questions = this.parseQuestions(content);

            // Prepare template data
            const data = {
                title: title,
                subject: 'Generated Document',
                date: new Date().toLocaleDateString('vi-VN'),
                questions: questions,
                hasAnswers: showAnswers,
            };

            // Use DocxTemplateService to generate the DOCX file
            const docxPath = await this.docxTemplateService.generateDocx('TemplateHutech.dotx', data);

            // Create file record in database
            const fileEntity = new Files();
            fileEntity.MaFile = randomUUID();
            fileEntity.TenFile = docxPath;
            fileEntity.LoaiFile = 3; // DOCX file
            await this.filesRepository.save(fileEntity);

            return docxPath;
        } catch (error) {
            throw new Error(`Failed to generate DOCX: ${error.message}`);
        }
    }

    private parseQuestions(content: string): any[] {
        // Simple parsing logic - in a real app this would be more sophisticated
        // Format expected:
        // 1. Question text
        // A. Answer 1
        // B. Answer 2 (correct)
        // C. Answer 3

        interface QuestionItem {
            number: number;
            text: string;
            answers: AnswerItem[];
            correctAnswer?: string;
        }

        interface AnswerItem {
            label: string;
            text: string;
            isCorrect: boolean;
        }

        const questions: QuestionItem[] = [];
        const lines = content.split('\n');
        let currentQuestion: QuestionItem | null = null;
        let currentAnswers: AnswerItem[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Check if this is a question line (starts with a number and period)
            const questionMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
            if (questionMatch) {
                // If we have a previous question, add it to the list
                if (currentQuestion) {
                    questions.push({
                        number: currentQuestion.number,
                        text: currentQuestion.text,
                        answers: currentAnswers,
                        correctAnswer: currentAnswers
                            .filter(a => a.isCorrect)
                            .map(a => a.label)
                            .join(', '),
                    });
                }

                // Start a new question
                currentQuestion = {
                    number: parseInt(questionMatch[1], 10),
                    text: questionMatch[2],
                    answers: [],
                };
                currentAnswers = [];
                continue;
            }

            // Check if this is an answer line (starts with a letter and period)
            const answerMatch = trimmedLine.match(/^([A-Z])\.\s+(.+)$/);
            if (answerMatch && currentQuestion) {
                const isCorrect = answerMatch[2].includes('(correct)');
                const answerText = answerMatch[2].replace('(correct)', '').trim();

                currentAnswers.push({
                    label: answerMatch[1],
                    text: answerText,
                    isCorrect: isCorrect,
                });
            }
        }

        // Add the last question
        if (currentQuestion) {
            questions.push({
                number: currentQuestion.number,
                text: currentQuestion.text,
                answers: currentAnswers,
                correctAnswer: currentAnswers
                    .filter(a => a.isCorrect)
                    .map(a => a.label)
                    .join(', '),
            });
        }

        return questions;
    }
}
