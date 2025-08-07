import { Injectable, Logger } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import * as fs from 'fs';
import * as path from 'path';
import * as AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';
import { MulterFile } from '../interfaces/multer-file.interface';
import * as PizZip from 'pizzip';
// import { DOMParser } from 'xmldom';

/**
 * Enhanced Word Document Parser using docx-wasm
 * Optimized for group questions and fill-in-blank questions
 */

export interface ParsedQuestion {
    id: string;
    content: string;
    answers?: ParsedAnswer[];
    type?: 'single' | 'group' | 'fill-in-blank' | 'multi-choice';
    childQuestions?: ParsedQuestion[];
    files?: ExtractedFile[];
    inGroup?: boolean;
    groupId?: string;
    has_latex?: boolean;
    clo?: string;
    hoanVi?: boolean;
    questionNumber?: number;
    hasFillInBlanks?: boolean;
    blankMarkers?: string[];
    groupContent?: string;
}

export interface ParsedAnswer {
    id: string;
    content: string;
    isCorrect: boolean;
    order: number;
    hasUnderline?: boolean;
}

export interface ExtractedFile {
    id: string;
    fileName: string;
    originalName: string;
    buffer: Buffer;
    mimeType: string;
    fileType: number; // 1=audio, 2=image, 3=document, 4=video
    size: number;
    spacesUrl?: string; // URL on Digital Ocean Spaces
    cdnUrl?: string; // CDN URL for faster access
}

interface ParseOptions {
    processImages?: boolean;
    extractStyles?: boolean;
    preserveLatex?: boolean;
    maxQuestions?: number;
}

@Injectable()
export class EnhancedDocxWasmParserService {
    private readonly logger = new Logger(EnhancedDocxWasmParserService.name);
    private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'questions');
    private readonly tempDir = path.join(process.cwd(), 'temp', 'docx-parser');
    private docxWasm: any;
    private isWasmInitialized = false;

    constructor(
        private readonly spacesService?: SpacesService
    ) {
        // Ensure directories exist
        [this.uploadsDir, this.tempDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Initialize docx-wasm
        this.initializeDocxWasm();
    }

    /**
     * Initialize docx-wasm module
     */
    private async initializeDocxWasm() {
        try {
            // Use dynamic import for browser compatibility
            // const docxWasmModule = await import('@nativedocuments/docx-wasm');
            // this.docxWasm = docxWasmModule;

            // Initialize the WASM module
            // await docxWasmModule.NDInitialize({
            //     // Path to wasm file - adjust based on your project setup
            //     wasmBinary: path.join(__dirname, '../../node_modules/@nativedocuments/docx-wasm/dist/docx-wasm.wasm'),
            //     // Debugging level
            //     logLevel: 'info'
            // });

            this.isWasmInitialized = false; // Disabled for now
            this.logger.warn('docx-wasm is disabled - using fallback parser');
        } catch (error) {
            this.logger.error(`Failed to initialize docx-wasm: ${error.message}`);
            this.isWasmInitialized = false;
        }
    }

    /**
     * Main entry point - parse uploaded Word file
     */
    async parseUploadedFile(file: MulterFile, options: ParseOptions = {}): Promise<{
        questions: ParsedQuestion[];
        filePath: string;
        extractedFiles: ExtractedFile[];
        stats: {
            totalQuestions: number;
            groupQuestions: number;
            singleQuestions: number;
            fillInBlankQuestions: number;
            extractedImages: number;
            hasLatex: number;
        };
    }> {
        // Ensure docx-wasm is initialized
        if (!this.isWasmInitialized) {
            await this.initializeDocxWasm();

            if (!this.isWasmInitialized) {
                throw new Error('docx-wasm could not be initialized. Fallback to traditional parser.');
            }
        }

        const fileName = `${uuidv4()}_${file.originalname}`;
        const uploadPath = path.join(this.uploadsDir, fileName);

        try {
            // Save file to disk
            fs.writeFileSync(uploadPath, file.buffer);
            this.logger.log(`File saved to: ${uploadPath}`);

            // Extract images and other media files
            const extractedFiles = options.processImages ?
                await this.extractMediaFiles(file.buffer) : [];

            // Parse content with docx-wasm
            const questions = await this.parseDocxContent(uploadPath, options);

            // Map images to questions if available
            if (extractedFiles.length > 0) {
                await this.mapMediaToQuestions(questions, extractedFiles);
            }

            // Generate stats
            const stats = this.generateStats(questions, extractedFiles);

            return {
                questions,
                filePath: uploadPath,
                extractedFiles,
                stats
            };

        } catch (error) {
            this.logger.error(`Error processing uploaded file: ${error.message}`, error.stack);
            throw new Error(`Failed to process Word document: ${error.message}`);
        }
    }

    /**
     * Extract media files from DOCX
     */
    private async extractMediaFiles(buffer: Buffer): Promise<ExtractedFile[]> {
        const extractedFiles: ExtractedFile[] = [];

        try {
            const zip = new AdmZip(buffer);
            const entries = zip.getEntries();

            // Process media files
            for (const entry of entries) {
                // Check for media files in Word structure
                if (this.isMediaFile(entry.entryName)) {
                    const fileBuffer = entry.getData();
                    const fileName = path.basename(entry.entryName);
                    const ext = path.extname(fileName).toLowerCase();

                    const extractedFile: ExtractedFile = {
                        id: uuidv4(),
                        fileName: this.generateUniqueFileName(fileName),
                        originalName: fileName,
                        buffer: fileBuffer,
                        mimeType: this.getMimeType(ext),
                        fileType: this.getFileType(ext),
                        size: fileBuffer.length
                    };

                    extractedFiles.push(extractedFile);
                    this.logger.log(`Extracted media: ${fileName} (${fileBuffer.length} bytes)`);
                }
            }

            this.logger.log(`Successfully extracted ${extractedFiles.length} media files`);
            return extractedFiles;

        } catch (error) {
            this.logger.error(`Error extracting media files: ${error.message}`);
            return [];
        }
    }

    /**
     * Parse DOCX content using docx-wasm
     */
    private async parseDocxContent(filePath: string, options: ParseOptions): Promise<ParsedQuestion[]> {
        try {
            // Read file as buffer
            const fileBuffer = fs.readFileSync(filePath);

            // Create a new docx-wasm document from buffer
            const doc = await this.docxWasm.NDDocument.load(fileBuffer);

            // Extract text content with structure preserved
            const textContent = await doc.saveAsHTML();

            // Extract document XML directly for deeper analysis
            const docXml = await this.extractDocumentXml(fileBuffer);

            // Process the content to extract questions
            const questions = await this.parseQuestionsFromContent(textContent, docXml, options);

            // Cleanup
            doc.close();

            return questions;
        } catch (error) {
            this.logger.error(`Error in parseDocxContent: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Extract document XML for deeper analysis
     */
    private async extractDocumentXml(fileBuffer: Buffer): Promise<string> {
        try {
            const zip = new PizZip(fileBuffer);
            const documentXml = zip.file("word/document.xml");
            const stylesXml = zip.file("word/styles.xml");

            if (!documentXml) {
                throw new Error("Could not find document.xml in DOCX file");
            }

            return documentXml.asText();
        } catch (error) {
            this.logger.error(`Error extracting document XML: ${error.message}`);
            return "";
        }
    }

    /**
     * Parse questions from HTML and XML content
     */
    private async parseQuestionsFromContent(htmlContent: string, xmlContent: string, options: ParseOptions): Promise<ParsedQuestion[]> {
        const questions: ParsedQuestion[] = [];

        try {
            // Parse XML document to analyze structure
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

            // Enhanced detection for underlined text (correct answers)
            const underlinedElements = this.extractUnderlinedElementsFromXml(xmlDoc);

            // Find group question markers in XML
            const groupMarkers = this.findGroupMarkersInXml(xmlDoc);

            // Find fill-in-blank markers
            const fillInBlankMarkers = this.findFillInBlankMarkersInXml(xmlDoc);

            // Temporary DOM parser for HTML content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            // Split by [<br>] which indicates end of a question
            const questionBlocks = htmlContent.split(/\[\s*<\s*br\s*>\s*\]/i);
            this.logger.log(`Found ${questionBlocks.length} question blocks`);

            // Process each question block
            for (let i = 0; i < questionBlocks.length; i++) {
                const block = questionBlocks[i];
                if (!block.trim()) continue;

                // Check if it's a group question
                const isGroup = block.includes('[<sg>]');
                const isFillInBlank = this.detectFillInBlankQuestion(block, fillInBlankMarkers);

                // Create question object with proper type
                let questionType: 'single' | 'group' | 'fill-in-blank' | 'multi-choice' = 'single';
                if (isGroup) {
                    questionType = isFillInBlank ? 'fill-in-blank' : 'group';
                }

                const question: ParsedQuestion = {
                    id: uuidv4(),
                    content: block,
                    type: questionType,
                    answers: [],
                    hasFillInBlanks: isFillInBlank
                };

                // Process CLO information
                const cloMatch = block.match(/\(CLO\d+\)/);
                if (cloMatch) {
                    question.clo = cloMatch[0].replace(/[()]/g, '');
                }

                // Process group content and child questions
                if (isGroup) {
                    this.processGroupQuestion(question, block, underlinedElements, isFillInBlank);
                } else {
                    this.processSingleQuestion(question, block, underlinedElements);
                }

                // Add to questions array
                questions.push(question);
            }

            return questions;

        } catch (error) {
            this.logger.error(`Error parsing questions: ${error.message}`, error.stack);
            return [];
        }
    }

    /**
     * Process a group question
     */
    private processGroupQuestion(question: ParsedQuestion, content: string, underlinedElements: string[], isFillInBlank: boolean): void {
        // Extract group content (between [<sg>] and [<egc>])
        const sgMatch = content.match(/\[\s*<\s*sg\s*>\s*\]([\s\S]*?)\[\s*<\s*egc\s*>\s*\]/i);
        if (sgMatch) {
            question.groupContent = sgMatch[1].trim();

            // Find blank markers if it's a fill-in-blank question
            if (isFillInBlank) {
                const blankMarkers: string[] = [];
                const regex = /\{\s*<\s*(\d+)\s*>\s*\}/g;
                let match;
                while ((match = regex.exec(question.groupContent)) !== null) {
                    blankMarkers.push(match[0]);
                }
                question.blankMarkers = blankMarkers;
            }
        }

        // Extract child questions
        question.childQuestions = [];
        const childBlocksPattern = /\(\s*<\s*(\d+)\s*>\s*\)([\s\S]*?)(?=\(\s*<\s*\d+\s*>\s*\)|$)/g;
        let childMatch;

        while ((childMatch = childBlocksPattern.exec(content)) !== null) {
            const childNumber = childMatch[1];
            const childContent = childMatch[2].trim();

            const childQuestion: ParsedQuestion = {
                id: uuidv4(),
                content: childContent,
                type: 'single',
                answers: [],
                inGroup: true,
                groupId: question.id,
                questionNumber: parseInt(childNumber, 10)
            };

            // Extract CLO information for child question
            const childCloMatch = childContent.match(/\(CLO\d+\)/);
            if (childCloMatch) {
                childQuestion.clo = childCloMatch[0].replace(/[()]/g, '');
                childQuestion.content = childQuestion.content.replace(childCloMatch[0], '').trim();
            }

            // Extract answers with proper detection of correct answers
            this.extractAnswersFromContent(childQuestion, childContent, underlinedElements);

            // Add to child questions array
            question.childQuestions.push(childQuestion);
        }

        // Sort child questions by number
        if (question.childQuestions) {
            question.childQuestions.sort((a, b) =>
                (a.questionNumber || 0) - (b.questionNumber || 0)
            );
        }
    }

    /**
     * Process a single question
     */
    private processSingleQuestion(question: ParsedQuestion, content: string, underlinedElements: string[]): void {
        // Clean content and extract question text
        const contentLines = content.split(/<br\s*\/?>/i);
        const questionLines: string[] = [];
        const answerLines: string[] = [];

        let startedAnswers = false;

        for (const line of contentLines) {
            const trimmedLine = line.trim();

            // Detect when we've reached the answers section (lines starting with A., B., C., D.)
            if (!startedAnswers && /^[A-D]\./.test(trimmedLine)) {
                startedAnswers = true;
            }

            if (startedAnswers) {
                answerLines.push(trimmedLine);
            } else {
                questionLines.push(line);
            }
        }

        // Set question content
        question.content = questionLines.join(' ').trim();

        // Remove CLO from content if present
        const contentCloMatch = question.content.match(/\(CLO\d+\)/);
        if (contentCloMatch) {
            question.content = question.content.replace(contentCloMatch[0], '').trim();
        }

        // Extract answers
        this.extractAnswersFromContent(question, answerLines.join('<br>'), underlinedElements);
    }

    /**
     * Extract answers from content with correct detection
     */
    private extractAnswersFromContent(question: ParsedQuestion, content: string, underlinedElements: string[]): void {
        // Find all answer lines (A., B., C., D.)
        const answerLines = content.split(/<br\s*\/?>/i).filter(line => /^[A-D]\./.test(line.trim()));

        // Process each answer line
        answerLines.forEach((line, index) => {
            // Check if this answer is underlined (correct)
            const isCorrect = this.isAnswerCorrect(line, underlinedElements);

            // Clean up the content
            const cleanContent = line
                .replace(/^[A-D]\.\s*/, '') // Remove A., B., etc.
                .replace(/<\/?u>/g, '')    // Remove underline tags
                .trim();

            // Add to answers array
            question.answers?.push({
                id: uuidv4(),
                content: cleanContent,
                isCorrect: isCorrect,
                hasUnderline: isCorrect,
                order: index
            });
        });

        // If no answer is marked as correct, default to first answer
        if (question.answers && question.answers.length > 0 && !question.answers.some(a => a.isCorrect)) {
            question.answers[0].isCorrect = true;
        }

        // Determine question type based on answers
        if (question.answers && question.answers.filter(a => a.isCorrect).length > 1) {
            question.type = 'multi-choice';
        }

        // Set HoanVi value based on underline detection
        question.hoanVi = question.answers ? !question.answers.some(a => a.hasUnderline) : true;
    }

    /**
     * Check if an answer is correct (underlined)
     */
    private isAnswerCorrect(answerText: string, underlinedElements: string[]): boolean {
        // Check for explicit HTML underline
        if (answerText.includes('<u>') || answerText.includes('</u>')) {
            return true;
        }

        // Check for CSS-based underline
        if (answerText.includes('text-decoration:underline') ||
            answerText.includes('text-decoration: underline')) {
            return true;
        }

        // Check against list of underlined elements from XML
        for (const element of underlinedElements) {
            // Remove HTML tags for comparison
            const plainElement = element.replace(/<[^>]*>/g, '').trim();
            const plainAnswer = answerText.replace(/<[^>]*>/g, '').trim();

            if (plainAnswer.includes(plainElement) && plainElement.length > 2) {
                return true;
            }
        }

        return false;
    }

    /**
     * Extract underlined elements from XML
     */
    private extractUnderlinedElementsFromXml(xmlDoc: Document): string[] {
        const underlinedTexts: string[] = [];

        try {
            // Find all runs (text spans) in the XML
            const runs = xmlDoc.getElementsByTagName('w:r');

            for (let i = 0; i < runs.length; i++) {
                const run = runs[i];

                // Check for underline property
                const underlineElements = run.getElementsByTagName('w:u');

                if (underlineElements.length > 0) {
                    // Get the text content
                    const textElements = run.getElementsByTagName('w:t');
                    if (textElements.length > 0) {
                        for (let j = 0; j < textElements.length; j++) {
                            const text = textElements[j].textContent;
                            if (text) {
                                underlinedTexts.push(text);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error(`Error extracting underlined elements: ${error.message}`);
        }

        return underlinedTexts;
    }

    /**
     * Find group markers in XML
     */
    private findGroupMarkersInXml(xmlDoc: Document): any[] {
        const markers: any[] = [];

        try {
            // Find text with specific markers
            const textElements = xmlDoc.getElementsByTagName('w:t');

            for (let i = 0; i < textElements.length; i++) {
                const text = textElements[i].textContent || '';

                // Check for group markers
                if (text.includes('[<sg>]') || text.includes('[</sg>]') || text.includes('[<egc>]')) {
                    markers.push({
                        type: text.includes('[<sg>]') ? 'start' :
                            text.includes('[</sg>]') ? 'end' : 'content-end',
                        position: i
                    });
                }
            }
        } catch (error) {
            this.logger.error(`Error finding group markers: ${error.message}`);
        }

        return markers;
    }

    /**
     * Find fill-in-blank markers in XML
     */
    private findFillInBlankMarkersInXml(xmlDoc: Document): any[] {
        const markers: any[] = [];

        try {
            // Find text with blank markers {<n>}
            const textElements = xmlDoc.getElementsByTagName('w:t');

            for (let i = 0; i < textElements.length; i++) {
                const text = textElements[i].textContent || '';

                // Check for blank markers using regex
                const blankMatches = text.match(/\{\s*<\s*\d+\s*>\s*\}/g);

                if (blankMatches) {
                    markers.push({
                        text: text,
                        position: i,
                        matches: blankMatches
                    });
                }
            }
        } catch (error) {
            this.logger.error(`Error finding fill-in-blank markers: ${error.message}`);
        }

        return markers;
    }

    /**
     * Detect if a question is a fill-in-blank type
     */
    private detectFillInBlankQuestion(content: string, fillInBlankMarkers: any[]): boolean {
        // Check for blank markers in content
        if (/\{\s*<\s*\d+\s*>\s*\}/.test(content)) {
            return true;
        }

        // Check for consecutive underscores (common in fill-in-blanks)
        if (/__{2,}/.test(content)) {
            return true;
        }

        // Check for minimal content in child questions
        const childBlocks = content.match(/\(\s*<\s*\d+\s*>\s*\)([\s\S]*?)(?=\(\s*<\s*\d+\s*>\s*\)|$)/g);
        if (childBlocks) {
            // Check if child blocks are short (typical for fill-in-blank questions)
            const shortChildBlocks = childBlocks.filter(block =>
                block.replace(/\(\s*<\s*\d+\s*>\s*\)/, '').trim().length < 20
            );

            if (shortChildBlocks.length > 0 && shortChildBlocks.length === childBlocks.length) {
                return true;
            }
        }

        return false;
    }

    /**
     * Map media files to questions where they are referenced
     */
    private async mapMediaToQuestions(questions: ParsedQuestion[], mediaFiles: ExtractedFile[]): Promise<void> {
        // Implementation to associate media files with questions
    }

    /**
     * Generate statistics about parsed questions
     */
    private generateStats(questions: ParsedQuestion[], extractedFiles: ExtractedFile[]): any {
        const stats = {
            totalQuestions: questions.length,
            groupQuestions: 0,
            singleQuestions: 0,
            fillInBlankQuestions: 0,
            extractedImages: extractedFiles.filter(f => f.fileType === 2).length,
            hasLatex: 0
        };

        for (const question of questions) {
            if (question.type === 'group') {
                stats.groupQuestions++;
                if (question.hasFillInBlanks) {
                    stats.fillInBlankQuestions++;
                }
            } else {
                stats.singleQuestions++;
            }

            if (question.has_latex) {
                stats.hasLatex++;
            }
        }

        return stats;
    }

    /**
     * Utility methods for file handling
     */
    private isMediaFile(entryName: string): boolean {
        // Check if the entry is a media file in Word's structure
        return entryName.startsWith('word/media/') &&
            /\.(png|jpg|jpeg|gif|bmp|webp|mp3|mp4|wav|ogg|wmv)$/i.test(entryName);
    }

    private generateUniqueFileName(originalName: string): string {
        const ext = path.extname(originalName);
        const name = path.basename(originalName, ext);
        return `${name}_${uuidv4().substring(0, 8)}${ext}`;
    }

    private getMimeType(ext: string): string {
        // Determine MIME type based on file extension
        const mimeTypes: Record<string, string> = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.webp': 'image/webp',
            '.mp3': 'audio/mpeg',
            '.mp4': 'video/mp4',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.wmv': 'video/x-ms-wmv'
        };

        return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
    }

    private getFileType(ext: string): number {
        // File type: 1=audio, 2=image, 3=document, 4=video
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
        const audioExtensions = ['.mp3', '.wav', '.ogg'];
        const videoExtensions = ['.mp4', '.wmv', '.avi', '.mov'];
        const documentExtensions = ['.pdf', '.doc', '.docx', '.txt'];

        if (imageExtensions.includes(ext.toLowerCase())) return 2;
        if (audioExtensions.includes(ext.toLowerCase())) return 1;
        if (videoExtensions.includes(ext.toLowerCase())) return 4;
        if (documentExtensions.includes(ext.toLowerCase())) return 3;

        return 0; // unknown
    }
}
