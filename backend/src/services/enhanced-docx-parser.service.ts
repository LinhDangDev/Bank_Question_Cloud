import { Injectable, Logger } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import * as fs from 'fs';
import * as path from 'path';
import * as AdmZip from 'adm-zip';
import * as mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { MulterFile } from '../interfaces/multer-file.interface';
import * as cheerio from 'cheerio';
import * as JSZip from 'jszip';
import * as util from 'util';

/**
 * Enhanced Word Document Parser - Pure Node.js Implementation
 * Author: Linh Dang Dev
 *
 * Thay thế Python parser bằng giải pháp thuần Node.js với:
 * - Mammoth.js cho HTML conversion
 * - AdmZip cho image extraction
 * - Custom parsing logic cho questions/answers
 * - LaTeX preservation
 * - Better error handling
 */

export interface ParsedQuestion {
    id: string;
    content: string;
    answers?: ParsedAnswer[];
    type?: 'single' | 'group' | 'fill-in-blank';
    childQuestions?: ParsedQuestion[];
    files?: ExtractedFile[];
    inGroup?: boolean;
    groupId?: string;
    has_latex?: boolean;
    clo?: string;
    hoanVi?: boolean;
    questionNumber?: number;
    hasFillInBlank?: boolean; // New property for fill-in-blank questions
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
    skipQuestionParsing?: boolean;
}

@Injectable()
export class EnhancedDocxParserService {
    private readonly logger = new Logger(EnhancedDocxParserService.name);
    private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'questions');
    private readonly tempDir = path.join(process.cwd(), 'temp', 'docx-parser');

    constructor(
        private readonly spacesService?: SpacesService
    ) {
        // Ensure directories exist
        [this.uploadsDir, this.tempDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
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
            extractedImages: number;
            hasLatex: number;
        };
    }> {
        const fileName = `${uuidv4()}_${file.originalname}`;
        const uploadPath = path.join(this.uploadsDir, fileName);

        try {
            // Save file to disk
            fs.writeFileSync(uploadPath, file.buffer);
            this.logger.log(`File saved to: ${uploadPath}`);

            // Extract images first
            const extractedFiles = options.processImages ?
                await this.extractImagesFromDocx(file.buffer) : [];

            // Skip question parsing if specified
            let questions: ParsedQuestion[] = [];
            if (!options.skipQuestionParsing) {
                // Parse content with enhanced mammoth
                questions = await this.parseDocxContent(uploadPath, options);

                // Map images to questions if available
                if (extractedFiles.length > 0) {
                    await this.mapImagesToQuestions(questions, extractedFiles);
                }
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
     * Extract images from DOCX file using AdmZip
     */
    private async extractImagesFromDocx(buffer: Buffer): Promise<ExtractedFile[]> {
        const extractedFiles: ExtractedFile[] = [];

        try {
            const zip = new AdmZip(buffer);
            const entries = zip.getEntries();

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
                    this.logger.log(`Extracted image: ${fileName} (${fileBuffer.length} bytes)`);
                }
            }

            this.logger.log(`Successfully extracted ${extractedFiles.length} media files`);
            return extractedFiles;

        } catch (error) {
            this.logger.error(`Error extracting images: ${error.message}`);
            return [];
        }
    }

    /**
     * Parse DOCX content using enhanced Mammoth.js
     */
    private async parseDocxContent(filePath: string, options: ParseOptions): Promise<ParsedQuestion[]> {
        try {
            // Enhanced mammoth options for better parsing
            const mammothOptions = {
                path: filePath,
                styleMap: [
                    "u => u", // Preserve underline for correct answers
                    "strong => strong",
                    "b => strong",
                    "i => em",
                    "strike => s",
                    // Word-specific underline formats
                    "w:rPr/w:u => u",
                    'w:rPr[w:u] => u',
                    "span[style-text-decoration='underline'] => u",
                    // Preserve headings
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Heading 3'] => h3:fresh",
                ],
                preserveStyles: true,
                includeEmbeddedStyleMap: true,
                ignoreEmptyParagraphs: false,
                // Convert images to data URLs if needed
                convertImage: mammoth.images.imgElement(function (image) {
                    return image.read("base64").then(function (imageBuffer) {
                        return {
                            src: "data:" + image.contentType + ";base64," + imageBuffer
                        };
                    });
                })
            };

            const result = await mammoth.convertToHtml(mammothOptions);
            const htmlContent = result.value;

            this.logger.log(`Converted DOCX to HTML (${htmlContent.length} chars)`);

            // Parse questions from HTML
            const questions = this.parseQuestionsFromHtml(htmlContent, options);

            return questions;

        } catch (error) {
            this.logger.error(`Error parsing DOCX content: ${error.message}`);
            throw error;
        }
    }

    /**
     * Detect and handle fill-in-the-blank questions (câu hỏi điền khuyết)
     */
    private processFillInBlankQuestions(questions: ParsedQuestion[]): void {
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];

            // Look for blank indicators in content
            const blankPatterns = [
                /_{2,}/g, // ____ (underscore blanks)
                /\.{3,}/g, // .... (dot blanks)
                /\(\s*\.\.\.\s*\)/g, // (...)
                /\[\s*\.\.\.\s*\]/g, // [...]
                /\<\s*\.\.\.\s*\>/g, // <...>
                /\(\s*\_+\s*\)/g, // (___)
                /\[\s*\_+\s*\]/g, // [___]
                /\<\s*\_+\s*\>/g, // <___>
                /\(\s*blank\s*\)/ig, // (blank)
                /\[\s*blank\s*\]/ig, // [blank]
                /\<\s*blank\s*\>/ig, // <blank>
                /\(\s*\d+\s*\)/ig, // Lines ending with (1), (2), etc.
                /\[\s*\d+\s*\]/ig, // Lines ending with [1], [2], etc.
                /\<\s*\d+\s*\>/ig, // Lines ending with <1>, <2>, etc.
                /\(\s*\w+\s*\)/ig, // Lines ending with (word), etc.

                // Vietnamese specific patterns
                /\(\s*điền\s*\)/ig, // (điền)
                /\[\s*điền\s*\]/ig, // [điền]
                /\<\s*điền\s*\>/ig, // <điền>
                /\(\s*ĐIỀN KHUYẾT\s*\)/ig, // (ĐIỀN KHUYẾT)
                /\[\s*ĐIỀN KHUYẾT\s*\]/ig, // [ĐIỀN KHUYẾT]
                /\<\s*ĐIỀN KHUYẾT\s*\>/ig // <ĐIỀN KHUYẾT>
            ];

            // Check if the question or passage contains blank patterns
            const hasBlanks = blankPatterns.some(pattern =>
                pattern && (pattern.test(question.content) ||
                    (question.childQuestions && question.childQuestions.some(child => pattern.test(child.content))) ||
                    (question.content.includes('[<br>]') && question.content.includes('[<br>]')))
            );

            if (hasBlanks ||
                /điền|khuyết|fill|blank|missing/i.test(question.content) ||
                (question.type === 'group' && /ĐIỀN KHUYẾT/i.test(question.content))) {

                // Mark as fill-in-blank type
                if (question.type !== 'group') {
                    question.type = 'fill-in-blank';
                } else {
                    // For group questions, add a flag to indicate it contains fill-in-blank questions
                    question['hasFillInBlank'] = true;

                    // Process child questions
                    if (question.childQuestions) {
                        for (const child of question.childQuestions) {
                            // Check if this specific child has blanks
                            const childHasBlanks = blankPatterns.some(pattern => pattern.test(child.content));
                            if (childHasBlanks) {
                                child.type = 'fill-in-blank';
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Parse questions from HTML with enhanced processing
     */
    private parseQuestionsFromHtml(html: string, options: ParseOptions): ParsedQuestion[] {
        const $ = cheerio.load(html);
        const questions: ParsedQuestion[] = [];

        // Remove Word-specific tags that might interfere
        $('style, meta, link').remove();

        // Get the document body text
        const bodyText = $('body').text();

        // Split into question blocks by looking for question indicators
        const questionBlocks = this.splitIntoQuestionBlocks(bodyText);

        // Process each question block
        questionBlocks.forEach((block, index) => {
            const questionNumber = index + 1;

            if (options.maxQuestions && questionNumber > options.maxQuestions) {
                return; // Skip if we've reached the maximum number of questions
            }

            // Check if this is a group question
            if (this.isGroupQuestion(block)) {
                questions.push(this.parseGroupQuestion(block, questionNumber));
            } else {
                questions.push(this.parseSingleQuestion(block, questionNumber));
            }
        });

        // Process fill-in-blank questions
        this.processFillInBlankQuestions(questions);

        // Process LaTeX in all questions
        questions.forEach(q => this.processLatexInQuestion(q));

        return questions;
    }

    /**
     * Check if content represents a group question
     */
    private isGroupQuestion(content: string): boolean {
        // Enhanced patterns for detecting group questions
        const groupPatterns = [
            // English patterns
            /Questions\s+(?:\d+[-\u2013]\d+|\<\d+\>[-\u2013]\<\d+\>|\[\d+\][-\u2013]\[\d+\]|\{\d+\}[-\u2013]\{\d+\})\s+refer\s+to/i,
            /Read the (?:following|passage|paragraph|text) and answer/i,
            /Based on the (?:passage|paragraph|text|following)/i,
            /According to the (?:passage|paragraph|text|following)/i,

            // Vietnamese patterns
            /Câu\s+(?:\d+[-\u2013]\d+|\<\d+\>[-\u2013]\<\d+\>|\[\d+\][-\u2013]\[\d+\]|\{\d+\}[-\u2013]\{\d+\})\s+(?:dựa|liên quan|đọc|theo|trả lời)/i,
            /Dựa vào (?:đoạn văn|bài đọc|hình ảnh|bảng|bài)/i,
            /Đọc (?:đoạn văn|bài|đoạn) (?:sau|dưới đây) và trả lời/i,

            // Pattern for section markers
            /\(NHÓM\)|\[NHÓM\]|\{NHÓM\}|\<NHÓM\>/i,
            /\(NHOM\)|\[NHOM\]|\{NHOM\}|\<NHOM\>/i,
            /\(PASSAGE\)|\[PASSAGE\]|\{PASSAGE\}|\<PASSAGE\>/i,
            /\(GROUP\)|\[GROUP\]|\{GROUP\}|\<GROUP\>/i,

            // Pattern for questions in a row with the same context
            /\(\<\d+\>\).*?\(\<\d+\>\)/s,
            /\(\[\d+\]\).*?\(\[\d+\]\)/s,
            /\(\{\d+\}\).*?\(\{\d+\}\)/s
        ];

        return groupPatterns.some(pattern => pattern.test(content));
    }

    /**
     * Parse group question with improved detection of question parts
     */
    private parseGroupQuestion(content: string, questionNumber: number): ParsedQuestion {
        // Find the passage part and questions part
        let passage = '';
        let questionsContent = '';

        // Try to detect passage and questions using various patterns
        const passageMatches = content.match(/(.*?)(?:Questions|Câu|Question|Câu hỏi)(?:\s+\d+|\s*\(\d+\)|\s*\[\d+\]|\s*\<\d+\>)/is);

        if (passageMatches) {
            passage = passageMatches[1].trim();
            questionsContent = content.substring(passageMatches[0].length).trim();
        } else {
            // If no clear separation, use a reasonable split point (first occurrence of question indicator)
            const splitPoints = [
                content.search(/\(\s*\d+\s*\)/), // (1)
                content.search(/\[\s*\d+\s*\]/), // [1]
                content.search(/\<\s*\d+\s*\>/), // <1>
                content.search(/\{\s*\d+\s*\}/), // {1}
                content.search(/[A-D]\s*\.\s*[A-Za-z]/), // A. Something
                content.search(/[A-D]\s*\)[A-Za-z]/)  // A) Something
            ].filter(pos => pos !== -1);

            if (splitPoints.length > 0) {
                const splitPoint = Math.min(...splitPoints);
                passage = content.substring(0, splitPoint).trim();
                questionsContent = content.substring(splitPoint).trim();
            } else {
                // Fallback: just use the first paragraph as passage
                const paragraphs = content.split(/\n\s*\n/);
                if (paragraphs.length > 1) {
                    passage = paragraphs[0].trim();
                    questionsContent = paragraphs.slice(1).join('\n\n').trim();
                } else {
                    passage = '';
                    questionsContent = content;
                }
            }
        }

        // Find child questions in the questions content
        const childQuestions: ParsedQuestion[] = [];

        // Various patterns for child questions
        const childQuestionPatterns = [
            /\(\s*(\d+)\s*\)\s*(.*?)(?=\(\s*\d+\s*\)|$)/gs,
            /\[\s*(\d+)\s*\]\s*(.*?)(?=\[\s*\d+\s*\]|$)/gs,
            /\<\s*(\d+)\s*\>\s*(.*?)(?=\<\s*\d+\s*\>|$)/gs,
            /\{\s*(\d+)\s*\}\s*(.*?)(?=\{\s*\d+\s*\}|$)/gs,
            /Question\s+(\d+)[.:]\s*(.*?)(?=Question\s+\d+|$)/gis,
            /Câu\s+(\d+)[.:]\s*(.*?)(?=Câu\s+\d+|$)/gis
        ];

        let foundChildQuestions = false;

        for (const pattern of childQuestionPatterns) {
            let match;
            while ((match = pattern.exec(questionsContent)) !== null) {
                const childNumber = parseInt(match[1], 10);
                const childContent = match[2].trim();

                // Parse this child as a single question
                const childQuestion = this.parseSingleQuestion(childContent, childNumber);
                childQuestion.inGroup = true;
                childQuestion.groupId = `group_${questionNumber}`;

                childQuestions.push(childQuestion);
                foundChildQuestions = true;
            }

            if (foundChildQuestions) break; // Stop after finding questions with one pattern
        }

        // If no child questions found with the patterns, try a simpler approach
        if (!foundChildQuestions) {
            // Split by double newlines and look for question indicators
            const paragraphs = questionsContent.split(/\n\s*\n/);
            let currentChild = 1;

            for (const paragraph of paragraphs) {
                if (paragraph.trim().length === 0) continue;

                // Check if this paragraph has question indicators
                if (/^[A-D][.)]\s/.test(paragraph) && childQuestions.length > 0) {
                    // This looks like an answer for the previous question
                    const lastChild = childQuestions[childQuestions.length - 1];
                    if (!lastChild.answers) lastChild.answers = [];

                    const option = paragraph.trim()[0];
                    lastChild.answers.push({
                        id: `${lastChild.id}_${option}`,
                        content: paragraph.trim().substring(3),
                        isCorrect: false,
                        order: 'ABCD'.indexOf(option)
                    });
                } else {
                    // Treat as a new child question
                    const childQuestion: ParsedQuestion = {
                        id: `q_${questionNumber}_${currentChild}`,
                        content: paragraph.trim(),
                        inGroup: true,
                        groupId: `group_${questionNumber}`,
                        type: 'single',
                        questionNumber: currentChild
                    };

                    childQuestions.push(childQuestion);
                    currentChild++;
                }
            }
        }

        return {
            id: `group_${questionNumber}`,
            content: passage,
            type: 'group',
            childQuestions,
            questionNumber
        };
    }

    /**
     * Parse a single question
     */
    private parseSingleQuestion(content: string, questionNumber: number): ParsedQuestion {
        const question: ParsedQuestion = {
            id: uuidv4(),
            content: '',
            answers: [],
            type: 'single',
            questionNumber,
            has_latex: false,
            hoanVi: true // Default to allow shuffling
        };

        // Split content into question and answers
        const lines = content.split(/\n|<br\s*\/?>/i).filter(line => line.trim());

        let questionContent = '';
        const answers: ParsedAnswer[] = [];
        let answerOrder = 0;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            // Check if it's an answer option (A., B., C., D., etc.)
            const answerMatch = trimmedLine.match(/^([A-Z])\.\s*(.+)$/);
            if (answerMatch) {
                const [, letter, answerText] = answerMatch;
                const isCorrect = this.hasUnderlineFormatting(answerText);

                answers.push({
                    id: uuidv4(),
                    content: this.cleanHtmlTags(answerText),
                    isCorrect,
                    order: answerOrder++,
                    hasUnderline: isCorrect
                });
            } else {
                // It's part of the question content
                questionContent += (questionContent ? ' ' : '') + trimmedLine;
            }
        }

        question.content = this.cleanHtmlTags(questionContent);
        question.answers = answers;

        // Determine HoanVi based on answer patterns
        question.hoanVi = this.determineHoanVi(answers);

        return question;
    }

    /**
     * Check if text has underline formatting (indicates correct answer)
     */
    private hasUnderlineFormatting(text: string): boolean {
        return text.includes('<u>') ||
            text.includes('text-decoration: underline') ||
            text.includes('text-decoration:underline');
    }

    /**
     * Clean HTML tags from text
     */
    private cleanHtmlTags(text: string): string {
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Determine HoanVi (shuffle) setting based on answers
     */
    private determineHoanVi(answers: ParsedAnswer[]): boolean {
        if (!answers || answers.length === 0) return true;

        // Check if last answer is "all of the above" or "none of the above"
        const lastAnswer = answers[answers.length - 1];
        const lastAnswerText = lastAnswer.content.toLowerCase();

        if (lastAnswerText.includes('all of the above') ||
            lastAnswerText.includes('none of the above') ||
            lastAnswerText.includes('tất cả đều đúng') ||
            lastAnswerText.includes('tất cả đều sai')) {
            return false; // Don't shuffle
        }

        return true; // Allow shuffling
    }

    /**
     * Process LaTeX and chemical formulas in question
     */
    private processLatexInQuestion(question: ParsedQuestion): void {
        // LaTeX patterns
        const latexPatterns = [
            /\$\$(.*?)\$\$/g,
            /\$(.*?)\$/g,
            /\\begin\{equation\}(.*?)\\end\{equation\}/g,
            /\\begin\{align\}(.*?)\\end\{align\}/g,
            /\\frac\{[^}]*\}\{[^}]*\}/g,
            /\\sqrt\{[^}]*\}/g,
            /\\sum_\{[^}]*\}/g,

            // Add chemistry formula patterns
            /\\ce\{(.*?)\}/g, // Chemistry equation syntax
            /H_\d+O/g, // Basic water variants
            /(H|C|O|N|P|S|Cl|Na|K|Ca|Fe|Mg)_\d+/g, // Common chemical elements with subscripts
            /\d+(H|C|O|N|P|S|Cl|Na|K|Ca|Fe|Mg)/g, // Chemical formulas with number prefixes
            /CH_\d+/g, // Methane variants
            /C\dH\d+/g // Carbon compounds
        ];

        let hasLatex = false;

        // Check question content
        for (const pattern of latexPatterns) {
            if (pattern.test(question.content)) {
                hasLatex = true;
                break;
            }
        }

        // Check answers
        if (question.answers) {
            for (const answer of question.answers) {
                for (const pattern of latexPatterns) {
                    if (pattern.test(answer.content)) {
                        hasLatex = true;
                        break;
                    }
                }
                if (hasLatex) break;
            }
        }

        // Check child questions
        if (question.childQuestions) {
            for (const child of question.childQuestions) {
                this.processLatexInQuestion(child);
                if (child.has_latex) {
                    hasLatex = true;
                }
            }
        }

        question.has_latex = hasLatex;
    }

    /**
     * Map extracted images to questions
     */
    private async mapImagesToQuestions(questions: ParsedQuestion[], extractedFiles: ExtractedFile[]): Promise<void> {
        // Use intelligent mapping for better image association
        await this.mapImagesIntelligently(questions, extractedFiles);
    }

    /**
     * Intelligently map extracted images to questions based on content analysis
     */
    private async mapImagesIntelligently(questions: ParsedQuestion[], extractedFiles: ExtractedFile[]): Promise<void> {
        // Only process image files
        const imageFiles = extractedFiles.filter(file => file.fileType === 2);
        if (imageFiles.length === 0) return;

        // Track images that have been assigned
        const assignedImages = new Set<string>();

        // First pass - look for image references in question content
        for (const question of questions) {
            // Get all image references from content
            const imageReferences = this.findImageReferences(question.content);

            if (imageReferences.length > 0) {
                if (!question.files) question.files = [];

                // Try to match references with unassigned images
                for (const ref of imageReferences) {
                    // Find an unassigned image
                    const imageFile = imageFiles.find(img => !assignedImages.has(img.id));
                    if (imageFile) {
                        question.files.push(imageFile);
                        assignedImages.add(imageFile.id);
                    }
                }
            }

            // Process child questions if any
            if (question.childQuestions) {
                for (const child of question.childQuestions) {
                    const childImageRefs = this.findImageReferences(child.content);

                    if (childImageRefs.length > 0) {
                        if (!child.files) child.files = [];

                        for (const ref of childImageRefs) {
                            // Find an unassigned image
                            const imageFile = imageFiles.find(img => !assignedImages.has(img.id));
                            if (imageFile) {
                                child.files.push(imageFile);
                                assignedImages.add(imageFile.id);
                            }
                        }
                    }
                }
            }
        }

        // Second pass - assign remaining images to questions that don't have images yet
        // Prioritize group questions first since they're more likely to have images
        const questionsWithoutImages = [
            ...questions.filter(q => q.type === 'group' && (!q.files || q.files.length === 0)),
            ...questions.filter(q => q.type !== 'group' && (!q.files || q.files.length === 0))
        ];

        for (const question of questionsWithoutImages) {
            // Find an unassigned image
            const imageFile = imageFiles.find(img => !assignedImages.has(img.id));
            if (imageFile) {
                if (!question.files) question.files = [];
                question.files.push(imageFile);
                assignedImages.add(imageFile.id);
            }
        }

        // Third pass - assign remaining images to child questions without images
        const allChildQuestionsWithoutImages = questions
            .filter(q => q.childQuestions && q.childQuestions.length > 0)
            .flatMap(q => q.childQuestions?.filter(child => !child.files || child.files.length === 0) || []);

        for (const child of allChildQuestionsWithoutImages) {
            // Find an unassigned image
            const imageFile = imageFiles.find(img => !assignedImages.has(img.id));
            if (imageFile) {
                if (!child.files) child.files = [];
                child.files.push(imageFile);
                assignedImages.add(imageFile.id);
            }
        }
    }

    /**
     * Find potential image references in content
     */
    private findImageReferences(content: string): string[] {
        const references: string[] = [];

        // Patterns that might indicate image references
        const patterns = [
            /figure\s+\d+/gi,
            /hình\s+\d+/gi,
            /hình ảnh/gi,
            /image\s+\d+/gi,
            /diagram/gi,
            /biểu đồ/gi,
            /graph/gi,
            /đồ thị/gi,
            /picture/gi,
            /photo/gi,
            /illustration/gi,
            /minh họa/gi
        ];

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                references.push(...matches);
            }
        });

        return references;
    }

    /**
     * Split document content into question blocks
     */
    private splitIntoQuestionBlocks(content: string): string[] {
        // Regular expressions to identify question starts
        const questionStartPatterns = [
            /(?:^|\n\s*\n)(?:Question|Câu)\s+\d+[.:]|(?:^|\n\s*\n)\d+[.]\s+(?=[A-Z])|(?:^|\n\s*\n)\(\s*\d+\s*\)|(?:^|\n\s*\n)\[\s*\d+\s*\]|(?:^|\n\s*\n)\<\s*\d+\s*\>/gi,
            /(?:^|\n\s*\n)(?:CLO\d+|CLO\s+\d+)/gi,
            /(?:^|\n\s*\n)(?:NHÓ|ĐIỀN KHUYẾT)/gi
        ];

        // Find all positions where questions might start
        let positions: number[] = [];

        questionStartPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                positions.push(match.index);
            }
        });

        // Sort positions in ascending order
        positions.sort((a, b) => a - b);

        // Split content into blocks based on positions
        const blocks: string[] = [];

        if (positions.length === 0) {
            // If no clear question markers, just return the whole content as one block
            blocks.push(content);
        } else {
            // Add the first block (everything before the first question marker)
            if (positions[0] > 0) {
                blocks.push(content.substring(0, positions[0]).trim());
            }

            // Add middle blocks
            for (let i = 0; i < positions.length; i++) {
                const start = positions[i];
                const end = i < positions.length - 1 ? positions[i + 1] : content.length;
                blocks.push(content.substring(start, end).trim());
            }
        }

        // Filter out empty blocks
        return blocks.filter(block => block.trim().length > 0);
    }

    /**
     * Generate parsing statistics
     */
    private generateStats(questions: ParsedQuestion[], extractedFiles: ExtractedFile[]) {
        let groupQuestions = 0;
        let singleQuestions = 0;
        let hasLatex = 0;

        for (const question of questions) {
            if (question.type === 'group' || question.type === 'fill-in-blank') {
                groupQuestions++;
            } else {
                singleQuestions++;
            }

            if (question.has_latex) {
                hasLatex++;
            }
        }

        return {
            totalQuestions: questions.length,
            groupQuestions,
            singleQuestions,
            extractedImages: extractedFiles.length,
            hasLatex
        };
    }

    /**
     * Check if file entry is a media file
     */
    private isMediaFile(entryName: string): boolean {
        const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.mp3', '.wav', '.mp4', '.avi'];
        const ext = path.extname(entryName).toLowerCase();
        return entryName.startsWith('word/media/') && mediaExtensions.includes(ext);
    }

    /**
     * Generate unique filename
     */
    private generateUniqueFileName(originalName: string): string {
        const ext = path.extname(originalName);
        const name = path.basename(originalName, ext);
        return `${name}_${uuidv4()}${ext}`;
    }

    /**
     * Get MIME type from extension
     */
    private getMimeType(ext: string): string {
        const mimeTypes: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.svg': 'image/svg+xml',
            '.webp': 'image/webp',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.avi': 'video/avi'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * Get file type number
     */
    private getFileType(ext: string): number {
        const audioExts = ['.mp3', '.wav', '.ogg', '.m4a'];
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
        const videoExts = ['.mp4', '.avi', '.mov', '.wmv'];

        if (audioExts.includes(ext)) return 1;
        if (imageExts.includes(ext)) return 2;
        if (videoExts.includes(ext)) return 4;
        return 3; // documents
    }

    /**
     * Upload extracted files to Digital Ocean Spaces
     */
    async uploadExtractedFilesToSpaces(extractedFiles: ExtractedFile[]): Promise<ExtractedFile[]> {
        if (!this.spacesService || extractedFiles.length === 0) {
            return extractedFiles;
        }

        const uploadedFiles: ExtractedFile[] = [];

        for (const file of extractedFiles) {
            try {
                // Upload to Spaces
                const folder = this.getFolderByFileType(file.fileType);
                const fileNameWithPath = `${folder}/${file.fileName}`;

                const uploadResult = await this.spacesService.uploadFile(
                    file.buffer,
                    fileNameWithPath,
                    file.mimeType,
                    true // isPublic parameter should be a boolean
                );

                // Update file with Spaces URL
                const uploadedFile: ExtractedFile = {
                    ...file,
                    // Add Spaces URL information
                    spacesUrl: uploadResult.Location,
                    cdnUrl: uploadResult.Location.replace('.digitaloceanspaces.com', '.cdn.digitaloceanspaces.com')
                };

                uploadedFiles.push(uploadedFile);
                this.logger.log(`Uploaded ${file.fileName} to Spaces: ${uploadResult.Location}`);

            } catch (error) {
                this.logger.error(`Failed to upload ${file.fileName} to Spaces: ${error.message}`);
                // Keep original file even if upload fails
                uploadedFiles.push(file);
            }
        }

        return uploadedFiles;
    }

    /**
     * Get folder name for file type (for Spaces upload)
     */
    private getFolderByFileType(fileType: number): string {
        switch (fileType) {
            case 1: return 'audio';
            case 2: return 'images';
            case 3: return 'documents';
            case 4: return 'videos';
            default: return 'files';
        }
    }
}
