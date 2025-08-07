import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StorageService } from './storage.service';
import { ContentReplacementService } from './content-replacement.service';
import { MediaProcessingService } from './media-processing.service';
import { QuestionType } from '../enums/question-type.enum';
import { MulterFile } from '../interfaces/multer-file.interface';

interface QuestionMedia {
    originalUrl: string;
    uploadedUrl?: string;
    type: 'image' | 'audio';
    fileName: string;
}

interface ProcessedQuestion {
    content: string;
    type: QuestionType;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    mediaFiles?: QuestionMedia[];
    childQuestions?: ProcessedQuestion[];
    parentId?: string;
    groupContent?: string;
    fillInBlankAnswers?: string[];
}

interface DocxParseOptions {
    uploadMedia?: boolean;
    generateThumbnails?: boolean;
    processImages?: boolean;
}

@Injectable()
export class DocxParserService {
    private readonly logger = new Logger(DocxParserService.name);

    constructor(
        private readonly storageService: StorageService,
        private readonly contentReplacementService: ContentReplacementService,
        private readonly mediaProcessingService: MediaProcessingService,
    ) { }

    async processUploadedFile(file: MulterFile, options: DocxParseOptions = {}) {
        try {
            const extractPath = path.join(process.cwd(), 'temp', 'docx-parser', Date.now().toString());
            await fs.promises.mkdir(extractPath, { recursive: true });

            if (!file.path) {
                // Nếu file.path không tồn tại, tạo file tạm từ buffer
                const tempFilePath = path.join(extractPath, `temp_${Date.now()}.docx`);
                await fs.promises.writeFile(tempFilePath, file.buffer);

                const result = await this.parseDocx(tempFilePath, {
                    uploadMedia: options.uploadMedia,
                    generateThumbnails: options.generateThumbnails,
                });

                // Xóa file tạm sau khi xử lý
                await fs.promises.unlink(tempFilePath);

                return {
                    questions: result.questions,
                    errors: result.errors,
                };
            }

            const result = await this.parseDocx(file.path, {
                uploadMedia: options.uploadMedia,
                generateThumbnails: options.generateThumbnails,
            });

            return {
                questions: result.questions,
                errors: result.errors,
            };
        } catch (error) {
            this.logger.error(`Error processing uploaded file: ${error.message}`, error.stack);
            throw error;
        }
    }

    async parseDocx(
        filePath: string,
        options: DocxParseOptions = {},
    ): Promise<{ questions: ProcessedQuestion[]; errors: string[] }> {
        try {
            // Đọc nội dung file DOCX (ví dụ bằng mammoth hoặc docx4js)
            // Chuyển đổi sang HTML hoặc text để xử lý
            const docContent = await this.readDocxContent(filePath);

            // Phân tích nội dung DOCX để xác định các câu hỏi
            const { questions, errors } = await this.parseQuestionsFromContent(docContent, options);

            return { questions, errors };
        } catch (error) {
            this.logger.error(`Error parsing DOCX: ${error.message}`, error.stack);
            throw error;
        }
    }

    private async readDocxContent(filePath: string): Promise<string> {
        // Use mammoth.js to extract both text and images from the DOCX file
        const mammoth = require('mammoth');
        const fs = require('fs');
        const path = require('path');

        try {
            // Create a temp directory for extracted images
            const tempImageDir = path.join(process.cwd(), 'temp', 'docx-parser', 'images', Date.now().toString());
            await fs.promises.mkdir(tempImageDir, { recursive: true });

            // Extract the document with images
            const result = await mammoth.extractRawText({
                path: filePath,
                convertImage: mammoth.images.imgElement(async (imageBuffer, imageType) => {
                    try {
                        // Generate a unique filename for the image
                        const imageExt = imageType.extension || 'png';
                        const imageName = `image_${Date.now()}_${Math.floor(Math.random() * 10000)}.${imageExt}`;
                        const imagePath = path.join(tempImageDir, imageName);

                        // Save the image to disk
                        await fs.promises.writeFile(imagePath, imageBuffer);

                        // Return an image tag with the reference
                        return {
                            src: `[image:${imageName}]`
                        };
                    } catch (error) {
                        this.logger.error(`Error saving extracted image: ${error.message}`);
                        return { src: '' };
                    }
                })
            });

            // Also look for inline audio references that might be present in Word files
            // Note: This is a simple approach. For complex audio extraction, a more sophisticated approach may be needed
            const audioPattern = /\[audio:([^\]]+)\]/gi;
            let contentWithAudio = result.value;

            // Add support for CLO markers: (CLO1), (CLO2), etc.
            const cloPattern = /\(CLO\d+\)/gi;
            let matches = contentWithAudio.match(cloPattern);

            if (matches) {
                for (const match of matches) {
                    // Make sure CLO markers stand out by ensuring they're on their own line
                    contentWithAudio = contentWithAudio.replace(match, `\n${match}\n`);
                }
            }

            return contentWithAudio;
        } catch (error) {
            this.logger.error(`Error extracting content from DOCX: ${error.message}`, error.stack);
            throw error;
        }
    }

    private async parseQuestionsFromContent(
        content: string,
        options: DocxParseOptions,
    ): Promise<{ questions: ProcessedQuestion[]; errors: string[] }> {
        const questions: ProcessedQuestion[] = [];
        const errors: string[] = [];

        try {
            // Tách nội dung thành các đoạn
            const paragraphs = content.split('\n').filter(p => p.trim().length > 0);

            let currentIndex = 0;

            while (currentIndex < paragraphs.length) {
                const paragraph = paragraphs[currentIndex];

                // Xác định loại câu hỏi dựa trên các marker
                if (paragraph.includes('(DON)')) {
                    // Xử lý câu hỏi đơn
                    const singleQuestion = this.parseSingleQuestion(paragraphs, currentIndex);
                    if (singleQuestion.question) {
                        questions.push(singleQuestion.question);
                        currentIndex = singleQuestion.nextIndex;
                    } else {
                        errors.push(`Không thể phân tích câu hỏi đơn tại vị trí ${currentIndex}`);
                        currentIndex++;
                    }
                } else if (paragraph.includes('(NHOM)')) {
                    // Xử lý câu hỏi nhóm
                    const groupQuestion = this.parseGroupQuestion(paragraphs, currentIndex);
                    if (groupQuestion.question) {
                        questions.push(groupQuestion.question);
                        currentIndex = groupQuestion.nextIndex;
                    } else {
                        errors.push(`Không thể phân tích câu hỏi nhóm tại vị trí ${currentIndex}`);
                        currentIndex++;
                    }
                } else if (paragraph.includes('(DIENKHUYET)')) {
                    // Xử lý câu hỏi điền khuyết
                    const fillInBlankQuestion = this.parseFillInBlankQuestion(paragraphs, currentIndex);
                    if (fillInBlankQuestion.question) {
                        questions.push(fillInBlankQuestion.question);
                        currentIndex = fillInBlankQuestion.nextIndex;
                    } else {
                        errors.push(`Không thể phân tích câu điền khuyết tại vị trí ${currentIndex}`);
                        currentIndex++;
                    }
                } else {
                    // Không nhận diện được loại câu hỏi, bỏ qua
                    currentIndex++;
                }
            }

            // Xử lý media nếu cần
            if (options.uploadMedia) {
                for (const question of questions) {
                    await this.processQuestionMedia(question);

                    if (question.childQuestions && question.childQuestions.length > 0) {
                        for (const childQuestion of question.childQuestions) {
                            await this.processQuestionMedia(childQuestion);
                        }
                    }
                }
            }

            return { questions, errors };
        } catch (error) {
            this.logger.error(`Error parsing questions: ${error.message}`, error.stack);
            errors.push(`Lỗi khi phân tích câu hỏi: ${error.message}`);
            return { questions, errors };
        }
    }

    private parseSingleQuestion(paragraphs: string[], startIndex: number): { question?: ProcessedQuestion; nextIndex: number } {
        try {
            let currentIndex = startIndex;
            const questionContent: string[] = [];
            const options: string[] = [];
            let correctAnswer = '';

            // Kiểm tra xem có phải câu hỏi đơn không
            if (!paragraphs[currentIndex].includes('(DON)')) {
                return { nextIndex: startIndex + 1 };
            }

            // Thu thập thông tin CLO nếu có
            let cloInfo = '';
            if (paragraphs[currentIndex + 1] && paragraphs[currentIndex + 1].includes('(CLO')) {
                cloInfo = paragraphs[currentIndex + 1];
                currentIndex++;
            }

            // Thu thập nội dung câu hỏi
            questionContent.push(cloInfo);
            currentIndex++;

            // Thu thập các lựa chọn
            while (currentIndex < paragraphs.length) {
                const line = paragraphs[currentIndex];

                // Nếu gặp marker kết thúc câu hỏi hoặc bắt đầu câu hỏi mới
                if (line.includes('[<br>]') || line.includes('(DON)') || line.includes('(NHOM)') || line.includes('(DIENKHUYET)')) {
                    if (line.includes('[<br>]')) {
                        currentIndex++;
                    }
                    break;
                }

                // Thu thập lựa chọn
                if (line.startsWith('A.') || line.startsWith('B.') || line.startsWith('C.') || line.startsWith('D.')) {
                    const option = line.trim();
                    options.push(option);

                    // Xác định đáp án đúng (dựa vào gạch chân hoặc định dạng)
                    if (line.includes('_') || line.includes('__')) {
                        correctAnswer = option.substring(0, 1); // Lấy ký tự đầu tiên (A, B, C, D)
                    }
                } else {
                    // Thu thập nội dung câu hỏi
                    questionContent.push(line);
                }

                currentIndex++;
            }

            const question: ProcessedQuestion = {
                content: questionContent.join('\n'),
                type: QuestionType.SINGLE_CHOICE,
                options: options,
                correctAnswer: correctAnswer,
            };

            return { question, nextIndex: currentIndex };
        } catch (error) {
            this.logger.error(`Error parsing single question: ${error.message}`, error.stack);
            return { nextIndex: startIndex + 1 };
        }
    }

    private parseGroupQuestion(paragraphs: string[], startIndex: number): { question?: ProcessedQuestion; nextIndex: number } {
        try {
            let currentIndex = startIndex;
            let groupContent = '';
            const childQuestions: ProcessedQuestion[] = [];

            // Kiểm tra xem có phải câu hỏi nhóm không
            if (!paragraphs[currentIndex].includes('(NHOM)')) {
                return { nextIndex: startIndex + 1 };
            }

            // Extract CLO information if present
            let cloInfo = '';
            currentIndex++;
            if (currentIndex < paragraphs.length && paragraphs[currentIndex].includes('(CLO')) {
                cloInfo = paragraphs[currentIndex];
                currentIndex++;
            }

            // Thu thập nội dung đoạn văn của câu hỏi nhóm
            let collectingGroupContent = false;

            while (currentIndex < paragraphs.length) {
                const line = paragraphs[currentIndex];

                // Xác định bắt đầu đoạn văn
                if (line.includes('[<sg>]')) {
                    collectingGroupContent = true;
                    currentIndex++;
                    continue;
                }

                // Xác định kết thúc đoạn văn
                if (line.includes('[<egc>]') || line.includes('[</sg>]')) {
                    collectingGroupContent = false;
                    currentIndex++;
                    break;
                }

                // Thu thập nội dung đoạn văn
                if (collectingGroupContent) {
                    groupContent += line + '\n';
                } else if (!line.trim()) {
                    // Skip empty lines
                    currentIndex++;
                    continue;
                } else {
                    // If we're not collecting content yet and this is not an empty line,
                    // it's probably part of the group content too
                    groupContent += line + '\n';
                }

                currentIndex++;
            }

            // Handle child questions - looking for (<1>), (<2>), etc. patterns or explicit (NHOM - X) markers
            const childQuestionPattern = /^\(<(\d+)>\)/;
            const groupQuestionMarker = /\(NHOM\s*[-–]\s*(\d+)\)/;

            while (currentIndex < paragraphs.length) {
                const line = paragraphs[currentIndex];

                // Stop if we encounter a new question type
                if (line.includes('(DON)') || (line.includes('(NHOM)') && !line.includes('(NHOM -') && !line.includes('(NHOM –'))
                    || line.includes('(DIENKHUYET)')) {
                    break;
                }

                // Check if it's a child question with explicit marker
                if (line.match(groupQuestionMarker)) {
                    const childQuestion = this.parseChildQuestion(paragraphs, currentIndex);
                    if (childQuestion.question) {
                        childQuestions.push(childQuestion.question);
                    }
                    currentIndex = childQuestion.nextIndex;
                    continue;
                }

                // Check if it's a child question with (<N>) pattern
                const childMatch = line.match(childQuestionPattern);
                if (childMatch) {
                    const childQuestion = this.parseChildQuestion(paragraphs, currentIndex);
                    if (childQuestion.question) {
                        childQuestions.push(childQuestion.question);
                    }
                    currentIndex = childQuestion.nextIndex;
                    continue;
                }

                // If it's a separator, skip it
                if (line.includes('[<br>]')) {
                    currentIndex++;
                    continue;
                }

                // Check if it could be a child question without explicit marker
                // (starts with A., B., etc. options nearby)
                if (currentIndex + 1 < paragraphs.length) {
                    const nextLine = paragraphs[currentIndex + 1];
                    if (nextLine.startsWith('A.') || nextLine.startsWith('a.')) {
                        // This is likely a child question, treat it as such
                        const childQuestion = this.parseChildQuestion(paragraphs, currentIndex);
                        if (childQuestion.question) {
                            childQuestions.push(childQuestion.question);
                        }
                        currentIndex = childQuestion.nextIndex;
                        continue;
                    }
                }

                // If we got here, just move to the next line
                currentIndex++;
            }

            // Add CLO info to the group content if present
            if (cloInfo) {
                groupContent = `${cloInfo}\n${groupContent}`;
            }

            const question: ProcessedQuestion = {
                content: cloInfo || 'Câu hỏi nhóm', // Use CLO info as content if available
                type: QuestionType.GROUP,
                groupContent: groupContent.trim(),
                childQuestions: childQuestions
            };

            return { question, nextIndex: currentIndex };
        } catch (error) {
            this.logger.error(`Error parsing group question: ${error.message}`, error.stack);
            return { nextIndex: startIndex + 1 };
        }
    }

    private parseChildQuestion(paragraphs: string[], startIndex: number): { question?: ProcessedQuestion; nextIndex: number } {
        try {
            let currentIndex = startIndex;
            const questionContent: string[] = [];
            const options: string[] = [];
            let correctAnswer = '';

            // Thu thập thông tin CLO và nội dung câu hỏi
            questionContent.push(paragraphs[currentIndex]);
            currentIndex++;

            // Thu thập các lựa chọn
            while (currentIndex < paragraphs.length) {
                const line = paragraphs[currentIndex];

                // Nếu gặp marker kết thúc câu hỏi con hoặc bắt đầu câu hỏi mới
                if (line.includes('[<br>]') || line.includes('(DON)') || line.includes('(NHOM)') ||
                    line.includes('(DIENKHUYET)') || line.includes('(NHOM – ')) {
                    if (line.includes('[<br>]')) {
                        currentIndex++;
                    }
                    break;
                }

                // Thu thập lựa chọn
                if (line.startsWith('A.') || line.startsWith('B.') || line.startsWith('C.') || line.startsWith('D.')) {
                    const option = line.trim();
                    options.push(option);

                    // Xác định đáp án đúng (dựa vào gạch chân hoặc định dạng)
                    if (line.includes('_') || line.includes('__')) {
                        correctAnswer = option.substring(0, 1); // Lấy ký tự đầu tiên (A, B, C, D)
                    }
                } else {
                    // Thu thập nội dung câu hỏi
                    questionContent.push(line);
                }

                currentIndex++;
            }

            const question: ProcessedQuestion = {
                content: questionContent.join('\n'),
                type: QuestionType.SINGLE_CHOICE,
                options: options,
                correctAnswer: correctAnswer,
            };

            return { question, nextIndex: currentIndex };
        } catch (error) {
            this.logger.error(`Error parsing child question: ${error.message}`, error.stack);
            return { nextIndex: startIndex + 1 };
        }
    }

    private parseFillInBlankQuestion(paragraphs: string[], startIndex: number): { question?: ProcessedQuestion; nextIndex: number } {
        try {
            let currentIndex = startIndex;
            let fillInBlankContent = '';
            const childQuestions: ProcessedQuestion[] = [];
            const fillInBlankAnswers: string[] = [];

            // Kiểm tra xem có phải câu hỏi điền khuyết không
            if (!paragraphs[currentIndex].includes('(DIENKHUYET)')) {
                return { nextIndex: startIndex + 1 };
            }

            currentIndex++;

            // Thu thập nội dung đoạn văn của câu hỏi điền khuyết
            let collectingContent = false;

            while (currentIndex < paragraphs.length) {
                const line = paragraphs[currentIndex];

                // Xác định bắt đầu đoạn văn
                if (line.includes('[<sg>]')) {
                    collectingContent = true;
                    currentIndex++;
                    continue;
                }

                // Xác định kết thúc đoạn văn
                if (line.includes('[<egc>]')) {
                    collectingContent = false;
                    currentIndex++;
                    break;
                }

                // Thu thập nội dung đoạn văn
                if (collectingContent) {
                    fillInBlankContent += line + '\n';
                }

                currentIndex++;
            }

            // Thu thập các câu hỏi con (các ô điền khuyết)
            while (currentIndex < paragraphs.length) {
                const line = paragraphs[currentIndex];

                // Nếu gặp marker kết thúc câu điền khuyết hoặc bắt đầu câu hỏi mới
                if (line.includes('(DON)') || line.includes('(NHOM)') || line.includes('(DIENKHUYET)') &&
                    !line.includes('(DIENKHUYET – ')) {
                    break;
                }

                // Xử lý câu hỏi con điền khuyết
                if (line.includes('(DIENKHUYET – ')) {
                    const childBlankQuestion = this.parseChildFillInBlankQuestion(paragraphs, currentIndex);
                    if (childBlankQuestion.question) {
                        childQuestions.push(childBlankQuestion.question);
                        if (childBlankQuestion.answer) {
                            fillInBlankAnswers.push(childBlankQuestion.answer);
                        }
                    }
                    currentIndex = childBlankQuestion.nextIndex;
                } else {
                    currentIndex++;
                }
            }

            const question: ProcessedQuestion = {
                content: fillInBlankContent.trim(),
                type: QuestionType.FILL_IN_BLANK,
                childQuestions: childQuestions,
                fillInBlankAnswers: fillInBlankAnswers
            };

            return { question, nextIndex: currentIndex };
        } catch (error) {
            this.logger.error(`Error parsing fill-in-blank question: ${error.message}`, error.stack);
            return { nextIndex: startIndex + 1 };
        }
    }

    private parseChildFillInBlankQuestion(
        paragraphs: string[],
        startIndex: number
    ): { question?: ProcessedQuestion; answer?: string; nextIndex: number } {
        try {
            let currentIndex = startIndex;
            const questionContent: string[] = [];
            const options: string[] = [];
            let correctAnswer = '';

            // Thu thập thông tin câu điền khuyết con
            questionContent.push(paragraphs[currentIndex]);
            currentIndex++;

            // Thu thập các lựa chọn
            while (currentIndex < paragraphs.length) {
                const line = paragraphs[currentIndex];

                // Nếu gặp marker kết thúc câu điền khuyết con hoặc bắt đầu câu hỏi mới
                if (line.includes('[<br>]') || line.includes('(DON)') || line.includes('(NHOM)') ||
                    line.includes('(DIENKHUYET)') || line.includes('(DIENKHUYET – ')) {
                    if (line.includes('[<br>]')) {
                        currentIndex++;
                    }
                    break;
                }

                // Thu thập lựa chọn
                if (line.startsWith('A.') || line.startsWith('B.') || line.startsWith('C.') || line.startsWith('D.')) {
                    const option = line.trim();
                    options.push(option);

                    // Xác định đáp án đúng (dựa vào gạch chân hoặc định dạng)
                    if (line.includes('_') || line.includes('__')) {
                        correctAnswer = option.substring(0, 1); // Lấy ký tự đầu tiên (A, B, C, D)
                    }
                } else {
                    // Thu thập nội dung câu hỏi
                    questionContent.push(line);
                }

                currentIndex++;
            }

            // Trích xuất đáp án dựa vào lựa chọn đúng
            let answer = '';
            if (correctAnswer && options.length > 0) {
                const correctOption = options.find(opt => opt.startsWith(correctAnswer));
                if (correctOption) {
                    answer = correctOption.substring(correctOption.indexOf('.') + 1).trim();
                }
            }

            const question: ProcessedQuestion = {
                content: questionContent.join('\n'),
                type: QuestionType.SINGLE_CHOICE,
                options: options,
                correctAnswer: correctAnswer,
            };

            return { question, answer, nextIndex: currentIndex };
        } catch (error) {
            this.logger.error(`Error parsing child fill-in-blank question: ${error.message}`, error.stack);
            return { nextIndex: startIndex + 1 };
        }
    }

    private async processQuestionMedia(question: ProcessedQuestion): Promise<void> {
        try {
            if (!question.content) {
                return;
            }

            // Initialize the mediaFiles array if it doesn't exist
            if (!question.mediaFiles) {
                question.mediaFiles = [];
            }

            // Process images
            const imagePattern = /\[image:\s*([^\]]+)\]/gi;
            let imageMatch;
            const processedImageUrls = new Set<string>();

            while ((imageMatch = imagePattern.exec(question.content)) !== null) {
                const fileName = imageMatch[1].trim();

                // Skip if we've already processed this image
                if (processedImageUrls.has(fileName)) {
                    continue;
                }

                processedImageUrls.add(fileName);

                // Add image to the question's media files
                question.mediaFiles.push({
                    originalUrl: fileName,
                    type: 'image',
                    fileName: fileName,
                });

                // Also replace the [image:...] tag with a proper HTML img tag in content
                // This will be further processed by the content replacement service
                question.content = question.content.replace(
                    new RegExp(`\\[image:\\s*${this.escapeRegExp(fileName)}\\]`, 'gi'),
                    `<img src="${fileName}" alt="${fileName}" class="question-image" />`
                );
            }

            // Process audio
            const audioPattern = /\[audio:\s*([^\]]+)\]/gi;
            let audioMatch;
            const processedAudioUrls = new Set<string>();

            while ((audioMatch = audioPattern.exec(question.content)) !== null) {
                const fileName = audioMatch[1].trim();

                // Skip if we've already processed this audio
                if (processedAudioUrls.has(fileName)) {
                    continue;
                }

                processedAudioUrls.add(fileName);

                // Add audio to the question's media files
                question.mediaFiles.push({
                    originalUrl: fileName,
                    type: 'audio',
                    fileName: fileName,
                });

                // Also replace the [audio:...] tag with a proper HTML audio control in content
                question.content = question.content.replace(
                    new RegExp(`\\[audio:\\s*${this.escapeRegExp(fileName)}\\]`, 'gi'),
                    `<audio controls src="${fileName}" class="question-audio"></audio>`
                );
            }

            // Also process media in options if available
            if (question.options && question.options.length > 0) {
                for (let i = 0; i < question.options.length; i++) {
                    const option = question.options[i];

                    // Process images in options
                    let optionImageMatch;
                    imagePattern.lastIndex = 0; // Reset regex index

                    while ((optionImageMatch = imagePattern.exec(option)) !== null) {
                        const fileName = optionImageMatch[1].trim();

                        if (!processedImageUrls.has(fileName)) {
                            processedImageUrls.add(fileName);

                            question.mediaFiles.push({
                                originalUrl: fileName,
                                type: 'image',
                                fileName: fileName,
                            });
                        }

                        // Replace the tag in the option
                        question.options[i] = option.replace(
                            new RegExp(`\\[image:\\s*${this.escapeRegExp(fileName)}\\]`, 'gi'),
                            `<img src="${fileName}" alt="${fileName}" class="option-image" />`
                        );
                    }

                    // Process audio in options
                    let optionAudioMatch;
                    audioPattern.lastIndex = 0; // Reset regex index

                    while ((optionAudioMatch = audioPattern.exec(option)) !== null) {
                        const fileName = optionAudioMatch[1].trim();

                        if (!processedAudioUrls.has(fileName)) {
                            processedAudioUrls.add(fileName);

                            question.mediaFiles.push({
                                originalUrl: fileName,
                                type: 'audio',
                                fileName: fileName,
                            });
                        }

                        // Replace the tag in the option
                        question.options[i] = option.replace(
                            new RegExp(`\\[audio:\\s*${this.escapeRegExp(fileName)}\\]`, 'gi'),
                            `<audio controls src="${fileName}" class="option-audio"></audio>`
                        );
                    }
                }
            }

            // Process group content if available
            if (question.groupContent) {
                // Process images in group content
                let groupContentImageMatch;
                imagePattern.lastIndex = 0; // Reset regex index

                while ((groupContentImageMatch = imagePattern.exec(question.groupContent)) !== null) {
                    const fileName = groupContentImageMatch[1].trim();

                    if (!processedImageUrls.has(fileName)) {
                        processedImageUrls.add(fileName);

                        question.mediaFiles.push({
                            originalUrl: fileName,
                            type: 'image',
                            fileName: fileName,
                        });
                    }

                    // Replace the tag in the group content
                    question.groupContent = question.groupContent.replace(
                        new RegExp(`\\[image:\\s*${this.escapeRegExp(fileName)}\\]`, 'gi'),
                        `<img src="${fileName}" alt="${fileName}" class="group-content-image" />`
                    );
                }

                // Process audio in group content
                let groupContentAudioMatch;
                audioPattern.lastIndex = 0; // Reset regex index

                while ((groupContentAudioMatch = audioPattern.exec(question.groupContent)) !== null) {
                    const fileName = groupContentAudioMatch[1].trim();

                    if (!processedAudioUrls.has(fileName)) {
                        processedAudioUrls.add(fileName);

                        question.mediaFiles.push({
                            originalUrl: fileName,
                            type: 'audio',
                            fileName: fileName,
                        });
                    }

                    // Replace the tag in the group content
                    question.groupContent = question.groupContent.replace(
                        new RegExp(`\\[audio:\\s*${this.escapeRegExp(fileName)}\\]`, 'gi'),
                        `<audio controls src="${fileName}" class="group-content-audio"></audio>`
                    );
                }
            }

            // Extract CLO information from content
            const cloPattern = /\(CLO(\d+)\)/i;
            const cloMatch = question.content.match(cloPattern);

            if (cloMatch) {
                // Add the CLO info to question content to make it more visible
                const cloNumber = cloMatch[1];
                const cloTag = `<span class="clo-tag">(CLO${cloNumber})</span>`;
                question.content = question.content.replace(cloPattern, cloTag);
            }
        } catch (error) {
            this.logger.error(`Error processing question media: ${error.message}`, error.stack);
        }
    }

    // Helper method to escape special characters in a string for use in a RegExp
    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
