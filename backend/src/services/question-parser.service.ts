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
export class QuestionParserService {
    private readonly logger = new Logger(QuestionParserService.name);

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

                try {
                    if (this.isGroupQuestion(block)) {
                        const groupQuestions = await this.parseGroupQuestion(block, i + 1);
                        result.questions.push(...groupQuestions);

                        const groupCount = groupQuestions.filter(q => q.type === QuestionType.GROUP).length;
                        const fillInBlankCount = groupQuestions.filter(q => q.type === QuestionType.FILL_IN_BLANK).length;

                        result.statistics.groupQuestions += groupCount;
                        result.statistics.fillInBlankQuestions += fillInBlankCount;
                    } else {
                        const singleQuestion = await this.parseSingleQuestion(block, i + 1);
                        if (singleQuestion) {
                            result.questions.push(singleQuestion);
                            result.statistics.singleQuestions++;
                        }
                    }
                } catch (error) {
                    result.errors.push(`Error parsing question block ${i + 1}: ${error.message}`);
                    this.logger.error(`Error parsing question block ${i + 1}`, error);
                }
            }

            // Collect all media references
            result.questions.forEach(question => {
                result.mediaFiles.push(...question.mediaReferences);
                if (question.mediaReferences.length > 0) {
                    result.statistics.questionsWithMedia++;
                }
            });

            result.statistics.totalQuestions = result.questions.length;
            result.statistics.totalMediaFiles = result.mediaFiles.length;

            this.logger.log(`Parsed ${result.statistics.totalQuestions} questions with ${result.statistics.totalMediaFiles} media files`);

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

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine === QUESTION_MARKERS.GROUP_START) {
                if (currentBlock.trim()) {
                    blocks.push(currentBlock.trim());
                    currentBlock = '';
                }
                inGroupQuestion = true;
                currentBlock += line + '\n';
            } else if (trimmedLine === QUESTION_MARKERS.GROUP_END) {
                currentBlock += line + '\n';
                blocks.push(currentBlock.trim());
                currentBlock = '';
                inGroupQuestion = false;
            } else if (trimmedLine === QUESTION_MARKERS.QUESTION_SEPARATOR && !inGroupQuestion) {
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

    private isGroupQuestion(block: string): boolean {
        return block.includes(QUESTION_MARKERS.GROUP_START) &&
            block.includes(QUESTION_MARKERS.GROUP_END);
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
                if (QUESTION_MARKERS.ANSWER_PATTERN.test(line)) {
                    inAnswers = true;
                    answerLines.push(line);
                } else if (inAnswers) {
                    answerLines.push(line);
                } else {
                    if (QUESTION_MARKERS.CLO_PATTERN.test(line)) {
                        clo = this.extractCLO(line);
                        contentLines.push(line.replace(QUESTION_MARKERS.CLO_PATTERN, '').trim());
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

    private extractCLO(line: string): string {
        const match = line.match(/\(CLO(\d+)\)/);
        return match ? match[1] : '';
    }

    private parseAnswers(answerLines: string[]): ParsedAnswer[] {
        const answers: ParsedAnswer[] = [];
        let currentAnswer = '';
        let currentLetter = '';
        let order = 0;

        for (const line of answerLines) {
            const answerMatch = line.match(/^([A-Z])\.\s*(.*)$/);

            if (answerMatch) {
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
                currentAnswer += ' ' + line;
            }
        }

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
        return content.includes('<u>') || content.includes('</u>') ||
            content.includes('_') || content.includes('__');
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

    private processMediaInContent(content: string, mediaRefs: MediaReference[]): string {
        let processedContent = content;

        for (const media of mediaRefs) {
            const pattern = media.type === MediaType.AUDIO
                ? new RegExp(`\\[audio:\\s*${this.escapeRegExp(media.originalPath)}\\]`, 'gi')
                : new RegExp(`\\[image:\\s*${this.escapeRegExp(media.originalPath)}\\]`, 'gi');

            const placeholder = media.type === MediaType.AUDIO
                ? `[AUDIO_PLACEHOLDER:${media.fileName}]`
                : `[IMAGE_PLACEHOLDER:${media.fileName}]`;

            processedContent = processedContent.replace(pattern, placeholder);
        }

        return processedContent;
    }

    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    async parseGroupQuestion(block: string, questionNumber: number): Promise<ParsedQuestion[]> {
        try {
            const groupStructure = this.extractGroupStructure(block);
            const questions: ParsedQuestion[] = [];

            // Create parent question
            const parentQuestion: ParsedQuestion = {
                type: QuestionType.PARENT,
                content: groupStructure.parentContent,
                answers: [],
                mediaReferences: groupStructure.mediaReferences,
                isParent: true,
                childCount: groupStructure.childQuestions.length,
                order: questionNumber
            };

            questions.push(parentQuestion);

            // Process child questions
            for (let i = 0; i < groupStructure.childQuestions.length; i++) {
                const childQuestion = groupStructure.childQuestions[i];
                childQuestion.parentId = `parent_${questionNumber}`;
                childQuestion.order = i + 1;
                childQuestion.type = groupStructure.isFillInBlank ?
                    QuestionType.FILL_IN_BLANK : QuestionType.GROUP;

                questions.push(childQuestion);
            }

            return questions;

        } catch (error) {
            this.logger.error(`Error parsing group question ${questionNumber}`, error);
            throw error;
        }
    }

    private extractGroupStructure(block: string): GroupQuestionStructure {
        const lines = block.split('\n').map(line => line.trim());

        let parentContent = '';
        let childQuestionsText = '';
        let inParentContent = false;
        let inChildQuestions = false;

        for (const line of lines) {
            if (line === QUESTION_MARKERS.GROUP_START) {
                inParentContent = true;
            } else if (line === QUESTION_MARKERS.GROUP_CONTENT_END) {
                inParentContent = false;
                inChildQuestions = true;
            } else if (line === QUESTION_MARKERS.GROUP_END) {
                inChildQuestions = false;
            } else if (inParentContent) {
                parentContent += line + '\n';
            } else if (inChildQuestions) {
                childQuestionsText += line + '\n';
            }
        }

        parentContent = parentContent.trim();
        childQuestionsText = childQuestionsText.trim();

        // Check if it's fill-in-blank type
        const isFillInBlank = QUESTION_MARKERS.FILL_IN_BLANK_PATTERN.test(parentContent);
        const placeholderCount = (parentContent.match(QUESTION_MARKERS.PLACEHOLDER_PATTERN) || []).length;

        // Extract media references from parent content
        const mediaReferences = this.extractMediaReferences(parentContent);

        // Parse child questions
        const childQuestions = this.parseChildQuestions(childQuestionsText);

        return {
            parentContent: this.processMediaInContent(parentContent, mediaReferences),
            childQuestions,
            mediaReferences,
            isFillInBlank,
            placeholderCount
        };
    }

    private parseChildQuestions(text: string): ParsedQuestion[] {
        const questions: ParsedQuestion[] = [];
        const questionBlocks = text.split(QUESTION_MARKERS.QUESTION_SEPARATOR);

        for (const block of questionBlocks) {
            const trimmedBlock = block.trim();
            if (!trimmedBlock) continue;

            const childQuestion = this.parseChildQuestion(trimmedBlock);
            if (childQuestion) {
                questions.push(childQuestion);
            }
        }

        return questions;
    }

    private parseChildQuestion(block: string): ParsedQuestion | null {
        try {
            const lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0);

            if (lines.length === 0) return null;

            let questionContent = '';
            let answerLines: string[] = [];
            let placeholderNumber: number | undefined;
            let inAnswers = false;

            for (const line of lines) {
                const childQuestionMatch = line.match(QUESTION_MARKERS.CHILD_QUESTION_PATTERN);

                if (childQuestionMatch) {
                    placeholderNumber = parseInt(childQuestionMatch[1]);
                    const remainingContent = line.replace(QUESTION_MARKERS.CHILD_QUESTION_PATTERN, '').trim();
                    if (remainingContent) {
                        questionContent = remainingContent;
                    }
                } else if (QUESTION_MARKERS.ANSWER_PATTERN.test(line)) {
                    inAnswers = true;
                    answerLines.push(line);
                } else if (inAnswers) {
                    answerLines.push(line);
                } else if (!questionContent) {
                    questionContent = line;
                }
            }

            const answers = this.parseAnswers(answerLines);
            const mediaReferences = this.extractMediaReferences(questionContent);

            return {
                type: QuestionType.GROUP, // Will be updated in parseGroupQuestion
                content: this.processMediaInContent(questionContent, mediaReferences),
                answers,
                mediaReferences,
                placeholderNumber
            };

        } catch (error) {
            this.logger.error('Error parsing child question', error);
            return null;
        }
    }

    validateQuestion(question: ParsedQuestion): QuestionValidationResult {
        const result: QuestionValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            question
        };

        // Basic validation
        if (!question.content || question.content.trim().length === 0) {
            result.errors.push('Question content is empty');
            result.isValid = false;
        }

        if (question.type !== QuestionType.PARENT && question.answers.length === 0) {
            result.errors.push('Question has no answers');
            result.isValid = false;
        }

        // Validate answers
        if (question.answers.length > 0) {
            const correctAnswers = question.answers.filter(a => a.isCorrect);

            if (correctAnswers.length === 0) {
                result.warnings.push('No correct answer marked');
            } else if (correctAnswers.length > 1) {
                result.warnings.push('Multiple correct answers marked');
            }

            // Check answer letters
            const expectedLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
            for (let i = 0; i < question.answers.length; i++) {
                if (question.answers[i].letter !== expectedLetters[i]) {
                    result.warnings.push(`Answer ${i + 1} has incorrect letter: expected ${expectedLetters[i]}, got ${question.answers[i].letter}`);
                }
            }
        }

        // Validate media references
        for (const media of question.mediaReferences) {
            if (!media.fileName || media.fileName.trim().length === 0) {
                result.errors.push('Media reference has empty filename');
                result.isValid = false;
            }
        }

        // Type-specific validation
        if (question.type === QuestionType.FILL_IN_BLANK) {
            if (!question.placeholderNumber) {
                result.errors.push('Fill-in-blank question missing placeholder number');
                result.isValid = false;
            }
        }

        if (question.type === QuestionType.PARENT) {
            if (!question.childCount || question.childCount === 0) {
                result.errors.push('Parent question has no child questions');
                result.isValid = false;
            }
        }

        return result;
    }
}
