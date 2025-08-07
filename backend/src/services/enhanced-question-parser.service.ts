import { Injectable, Logger } from '@nestjs/common';
import { QuestionType, MediaType, QUESTION_MARKERS } from '../enums/question-type.enum';
import {
    ParsedQuestion,
    ParsedAnswer,
    MediaReference,
    QuestionParsingResult,
    GroupQuestionStructure,
    QuestionValidationResult
} from '../interfaces/question-parser.interface';

@Injectable()
export class EnhancedQuestionParserService {
    private readonly logger = new Logger(EnhancedQuestionParserService.name);

    async parseQuestionsFromText(text: string): Promise<QuestionParsingResult> {
        const result: QuestionParsingResult = {
            questions: [],
            mediaFiles: [],
            errors: [],
            warnings: [],
            statistics: {
                totalQuestions: 0,
                singleQuestions: 0,
                groupQuestions: 0,
                fillInBlankQuestions: 0,
                questionsWithMedia: 0,
                totalMediaFiles: 0
            }
        };

        try {
            const cleanText = this.cleanText(text);
            const questionBlocks = this.splitIntoQuestionBlocks(cleanText);

            for (let i = 0; i < questionBlocks.length; i++) {
                const block = questionBlocks[i];
                if (!block.trim()) continue;

                try {
                    let questions: ParsedQuestion[] = [];

                    if (this.isSingleQuestion(block)) {
                        const question = await this.parseSingleQuestion(block, i + 1);
                        if (question) {
                            questions.push(question);
                            result.statistics.singleQuestions++;
                        }
                    } else if (this.isGroupQuestion(block)) {
                        questions = await this.parseGroupQuestion(block, i + 1);
                        result.statistics.groupQuestions += questions.length;
                    } else if (this.isFillInBlankQuestion(block)) {
                        questions = await this.parseFillInBlankQuestion(block, i + 1);
                        result.statistics.fillInBlankQuestions += questions.length;
                    }

                    // Add questions to result
                    result.questions.push(...questions);

                    // Count media references
                    questions.forEach(question => {
                        if (question.mediaReferences && question.mediaReferences.length > 0) {
                            result.statistics.questionsWithMedia++;
                            result.statistics.totalMediaFiles += question.mediaReferences.length;
                            result.mediaFiles.push(...question.mediaReferences);
                        }
                    });

                } catch (error) {
                    result.errors.push(`Error parsing question block ${i + 1}: ${error.message}`);
                    this.logger.error(`Error parsing question block ${i + 1}`, error);
                }
            }

            result.statistics.totalQuestions = result.questions.length;

        } catch (error) {
            result.errors.push(`Fatal parsing error: ${error.message}`);
            this.logger.error('Fatal parsing error', error);
        }

        return result;
    }

    private cleanText(text: string): string {
        return text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    private splitIntoQuestionBlocks(text: string): string[] {
        const blocks: string[] = [];
        const lines = text.split('\n');
        let currentBlock = '';
        let inGroupQuestion = false;
        let inFillInBlank = false;

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Check for question type markers
            if (this.containsQuestionTypeMarker(trimmedLine)) {
                if (currentBlock.trim()) {
                    blocks.push(currentBlock.trim());
                    currentBlock = '';
                }
                currentBlock += line + '\n';
            }
            // Handle group question boundaries
            else if (trimmedLine === QUESTION_MARKERS.GROUP_START) {
                inGroupQuestion = true;
                currentBlock += line + '\n';
            } else if (trimmedLine === QUESTION_MARKERS.GROUP_END) {
                currentBlock += line + '\n';
                inGroupQuestion = false;
            }
            // Handle fill-in-blank boundaries
            else if (trimmedLine === QUESTION_MARKERS.GROUP_END_MARKER) {
                currentBlock += line + '\n';
                blocks.push(currentBlock.trim());
                currentBlock = '';
                inGroupQuestion = false;
            } else if (trimmedLine === QUESTION_MARKERS.FILL_BLANK_END_MARKER) {
                currentBlock += line + '\n';
                blocks.push(currentBlock.trim());
                currentBlock = '';
                inFillInBlank = false;
            }
            // Handle question separators
            else if (trimmedLine === QUESTION_MARKERS.QUESTION_SEPARATOR && !inGroupQuestion && !inFillInBlank) {
                if (currentBlock.trim()) {
                    blocks.push(currentBlock.trim());
                    currentBlock = '';
                }
            } else {
                currentBlock += line + '\n';
            }
        }

        if (currentBlock.trim()) {
            blocks.push(currentBlock.trim());
        }

        return blocks.filter(block => block.length > 0);
    }

    private containsQuestionTypeMarker(line: string): boolean {
        return line.includes(QUESTION_MARKERS.SINGLE_QUESTION_MARKER) ||
            line.includes(QUESTION_MARKERS.GROUP_QUESTION_MARKER) ||
            line.includes(QUESTION_MARKERS.FILL_IN_BLANK_MARKER);
    }

    private isSingleQuestion(block: string): boolean {
        return block.includes(QUESTION_MARKERS.SINGLE_QUESTION_MARKER);
    }

    private isGroupQuestion(block: string): boolean {
        return block.includes(QUESTION_MARKERS.GROUP_QUESTION_MARKER) &&
            block.includes(QUESTION_MARKERS.GROUP_START);
    }

    private isFillInBlankQuestion(block: string): boolean {
        return block.includes(QUESTION_MARKERS.FILL_IN_BLANK_MARKER) &&
            block.includes(QUESTION_MARKERS.GROUP_START);
    }

    async parseSingleQuestion(block: string, questionNumber: number): Promise<ParsedQuestion | null> {
        try {
            const lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (lines.length === 0) return null;

            let contentLines: string[] = [];
            let answerLines: string[] = [];
            let clo: string | undefined;
            let inAnswers = false;

            for (const line of lines) {
                // Skip question type marker
                if (line.includes(QUESTION_MARKERS.SINGLE_QUESTION_MARKER)) {
                    continue;
                }

                if (QUESTION_MARKERS.ANSWER_PATTERN.test(line)) {
                    inAnswers = true;
                    answerLines.push(line);
                } else if (inAnswers) {
                    answerLines.push(line);
                } else {
                    // Extract CLO information
                    const cloMatch = line.match(QUESTION_MARKERS.CLO_PATTERN);
                    if (cloMatch) {
                        clo = cloMatch[1];
                        const cleanLine = line.replace(QUESTION_MARKERS.CLO_PATTERN, '').trim();
                        if (cleanLine) {
                            contentLines.push(cleanLine);
                        }
                    } else {
                        contentLines.push(line);
                    }
                }
            }

            const content = contentLines.join(' ').trim();
            const answers = this.parseAnswers(answerLines);
            const mediaReferences = this.extractMediaReferences(content);

            return {
                type: QuestionType.SINGLE,
                clo,
                content: this.processMediaInContent(content, mediaReferences),
                answers,
                mediaReferences,
                order: questionNumber
            };

        } catch (error) {
            this.logger.error(`Error parsing single question ${questionNumber}`, error);
            return null;
        }
    }

    async parseGroupQuestion(block: string, questionNumber: number): Promise<ParsedQuestion[]> {
        try {
            const questions: ParsedQuestion[] = [];
            const structure = this.parseGroupStructure(block);

            if (!structure) {
                return questions;
            }

            // Create parent question
            const parentQuestion: ParsedQuestion = {
                type: QuestionType.PARENT,
                content: structure.parentContent,
                answers: [],
                mediaReferences: structure.mediaReferences,
                order: questionNumber,
                childQuestions: []
            };

            // Parse child questions
            structure.childQuestions.forEach((childQ, index) => {
                const childQuestion: ParsedQuestion = {
                    type: QuestionType.GROUP,
                    content: childQ.content,
                    answers: childQ.answers,
                    mediaReferences: childQ.mediaReferences,
                    order: index + 1,
                    placeholderNumber: childQ.placeholderNumber,
                    clo: this.extractCLOFromContent(childQ.content)
                };
                parentQuestion.childQuestions!.push(childQuestion);
            });

            questions.push(parentQuestion);
            return questions;

        } catch (error) {
            this.logger.error(`Error parsing group question ${questionNumber}`, error);
            return [];
        }
    }

    async parseFillInBlankQuestion(block: string, questionNumber: number): Promise<ParsedQuestion[]> {
        try {
            const questions: ParsedQuestion[] = [];
            const structure = this.parseGroupStructure(block);

            if (!structure) {
                return questions;
            }

            // Create parent question for fill-in-blank
            const parentQuestion: ParsedQuestion = {
                type: QuestionType.PARENT,
                content: structure.parentContent,
                answers: [],
                mediaReferences: structure.mediaReferences,
                order: questionNumber,
                childQuestions: [],
                hasFillInBlanks: true
            };

            // Parse child questions (fill-in-blank items)
            structure.childQuestions.forEach((childQ, index) => {
                const childQuestion: ParsedQuestion = {
                    type: QuestionType.FILL_IN_BLANK,
                    content: childQ.content,
                    answers: childQ.answers,
                    mediaReferences: childQ.mediaReferences,
                    order: index + 1,
                    placeholderNumber: childQ.placeholderNumber,
                    clo: this.extractCLOFromContent(childQ.content)
                };
                parentQuestion.childQuestions!.push(childQuestion);
            });

            questions.push(parentQuestion);
            return questions;

        } catch (error) {
            this.logger.error(`Error parsing fill-in-blank question ${questionNumber}`, error);
            return [];
        }
    }

    private parseGroupStructure(block: string): GroupQuestionStructure | null {
        try {
            const groupStartIndex = block.indexOf(QUESTION_MARKERS.GROUP_START);
            const groupContentEndIndex = block.indexOf(QUESTION_MARKERS.GROUP_CONTENT_END);
            const groupEndIndex = block.indexOf(QUESTION_MARKERS.GROUP_END);

            if (groupStartIndex === -1 || groupContentEndIndex === -1 || groupEndIndex === -1) {
                return null;
            }

            // Extract parent content
            let parentContent = block.substring(groupStartIndex + QUESTION_MARKERS.GROUP_START.length, groupContentEndIndex).trim();

            // Extract child questions content
            const childQuestionsText = block.substring(groupContentEndIndex + QUESTION_MARKERS.GROUP_CONTENT_END.length, groupEndIndex).trim();

            // Check if it's fill-in-blank type
            const isFillInBlank = block.includes(QUESTION_MARKERS.FILL_IN_BLANK_MARKER);
            const placeholderCount = (parentContent.match(QUESTION_MARKERS.PLACEHOLDER_PATTERN) || []).length;

            // Extract media references from parent content
            const mediaReferences = this.extractMediaReferences(parentContent);

            // Parse child questions
            const childQuestions = this.parseChildQuestions(childQuestionsText, isFillInBlank);

            return {
                parentContent: this.processMediaInContent(parentContent, mediaReferences),
                childQuestions,
                mediaReferences,
                isFillInBlank,
                placeholderCount
            };

        } catch (error) {
            this.logger.error('Error parsing group structure', error);
            return null;
        }
    }

    private parseChildQuestions(text: string, isFillInBlank: boolean): ParsedQuestion[] {
        const questions: ParsedQuestion[] = [];
        const questionBlocks = text.split(QUESTION_MARKERS.QUESTION_SEPARATOR);

        for (const block of questionBlocks) {
            const trimmedBlock = block.trim();
            if (!trimmedBlock) continue;

            const childQuestion = this.parseChildQuestion(trimmedBlock, isFillInBlank);
            if (childQuestion) {
                questions.push(childQuestion);
            }
        }

        return questions;
    }

    private parseChildQuestion(block: string, isFillInBlank: boolean): ParsedQuestion | null {
        try {
            const lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (lines.length === 0) return null;

            let questionContent = '';
            let answerLines: string[] = [];
            let placeholderNumber: number | undefined;
            let clo: string | undefined;
            let inAnswers = false;

            for (const line of lines) {
                if (QUESTION_MARKERS.ANSWER_PATTERN.test(line)) {
                    inAnswers = true;
                    answerLines.push(line);
                } else if (inAnswers) {
                    answerLines.push(line);
                } else {
                    // Extract placeholder number for fill-in-blank
                    if (isFillInBlank) {
                        const fillBlankMatch = line.match(QUESTION_MARKERS.FILL_BLANK_CHILD_PATTERN);
                        if (fillBlankMatch) {
                            placeholderNumber = parseInt(fillBlankMatch[1]);
                            continue;
                        }
                    } else {
                        // Extract child question number for group questions
                        const groupMatch = line.match(QUESTION_MARKERS.GROUP_CHILD_PATTERN);
                        if (groupMatch) {
                            placeholderNumber = parseInt(groupMatch[1]);
                        }
                    }

                    // Extract CLO information
                    const cloMatch = line.match(QUESTION_MARKERS.CLO_PATTERN);
                    if (cloMatch) {
                        clo = cloMatch[1];
                        const cleanLine = line.replace(QUESTION_MARKERS.CLO_PATTERN, '').trim();
                        if (cleanLine) {
                            questionContent += (questionContent ? ' ' : '') + cleanLine;
                        }
                    } else {
                        questionContent += (questionContent ? ' ' : '') + line;
                    }
                }
            }

            const answers = this.parseAnswers(answerLines);
            const mediaReferences = this.extractMediaReferences(questionContent);

            return {
                type: isFillInBlank ? QuestionType.FILL_IN_BLANK : QuestionType.GROUP,
                content: this.processMediaInContent(questionContent, mediaReferences),
                answers,
                mediaReferences,
                placeholderNumber,
                clo
            };

        } catch (error) {
            this.logger.error('Error parsing child question', error);
            return null;
        }
    }

    private parseAnswers(answerLines: string[]): ParsedAnswer[] {
        const answers: ParsedAnswer[] = [];
        let currentAnswer = '';
        let currentLetter = '';
        let order = 0;

        for (const line of answerLines) {
            const answerMatch = line.match(/^([A-Z])\.\s*(.*)$/);

            if (answerMatch) {
                // Save previous answer if exists
                if (currentAnswer && currentLetter) {
                    answers.push({
                        letter: currentLetter,
                        content: currentAnswer.trim(),
                        isCorrect: this.isCorrectAnswer(currentAnswer),
                        order: order++
                    });
                }

                currentLetter = answerMatch[1];
                currentAnswer = answerMatch[2];
            } else {
                // Continue multi-line answer
                currentAnswer += ' ' + line;
            }
        }

        // Save last answer
        if (currentAnswer && currentLetter) {
            answers.push({
                letter: currentLetter,
                content: currentAnswer.trim(),
                isCorrect: this.isCorrectAnswer(currentAnswer),
                order: order++
            });
        }

        return answers;
    }

    private isCorrectAnswer(content: string): boolean {
        // Check for underline formatting (correct answer indicator)
        return content.includes('<u>') || content.includes('</u>') ||
            content.includes('_') || content.includes('__') ||
            // Check for bold formatting as alternative
            content.includes('<b>') || content.includes('</b>') ||
            content.includes('<strong>') || content.includes('</strong>');
    }

    private extractCLOFromContent(content: string): string | undefined {
        const match = content.match(QUESTION_MARKERS.CLO_PATTERN);
        return match ? match[1] : undefined;
    }

    private extractMediaReferences(content: string): MediaReference[] {
        const mediaRefs: MediaReference[] = [];

        // Extract audio references
        const audioMatches = content.matchAll(QUESTION_MARKERS.AUDIO_PATTERN);
        for (const match of audioMatches) {
            const path = match[1].trim();
            mediaRefs.push({
                type: MediaType.AUDIO,
                originalPath: path,
                fileName: this.extractFileName(path)
            });
        }

        // Extract image references
        const imageMatches = content.matchAll(QUESTION_MARKERS.IMAGE_PATTERN);
        for (const match of imageMatches) {
            const path = match[1].trim();
            mediaRefs.push({
                type: MediaType.IMAGE,
                originalPath: path,
                fileName: this.extractFileName(path)
            });
        }

        return mediaRefs;
    }

    private extractFileName(path: string): string {
        return path.split('/').pop() || path.split('\\').pop() || path;
    }

    private processMediaInContent(content: string, mediaReferences: MediaReference[]): string {
        let processedContent = content;

        // Replace audio references with HTML audio tags
        processedContent = processedContent.replace(QUESTION_MARKERS.AUDIO_PATTERN, (match, path) => {
            return `<audio controls><source src="${path}" type="audio/mpeg">Your browser does not support the audio element.</audio>`;
        });

        // Replace image references with HTML img tags
        processedContent = processedContent.replace(QUESTION_MARKERS.IMAGE_PATTERN, (match, path) => {
            return `<img src="${path}" alt="Question Image" style="max-width: 100%; height: auto;" />`;
        });

        return processedContent;
    }
}
