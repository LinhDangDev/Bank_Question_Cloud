import { Injectable, Logger } from '@nestjs/common';
import { QuestionParserService } from './question-parser.service';
import { MediaContentProcessorService } from './media-content-processor.service';
import { QuestionType } from '../enums/question-type.enum';
import { 
    ParsedQuestion, 
    QuestionParsingResult,
    MediaProcessingOptions 
} from '../interfaces/question-parser.interface';

export interface QuestionPreviewResult {
    success: boolean;
    html: string;
    css: string;
    questions: ParsedQuestion[];
    errors: string[];
    warnings: string[];
    statistics: {
        totalQuestions: number;
        questionsWithMedia: number;
        mediaFilesFound: number;
    };
}

@Injectable()
export class QuestionPreviewService {
    private readonly logger = new Logger(QuestionPreviewService.name);

    constructor(
        private readonly questionParser: QuestionParserService,
        private readonly mediaProcessor: MediaContentProcessorService
    ) {}

    async previewQuestionsFromText(
        text: string, 
        options: MediaProcessingOptions = {}
    ): Promise<QuestionPreviewResult> {
        
        const result: QuestionPreviewResult = {
            success: false,
            html: '',
            css: '',
            questions: [],
            errors: [],
            warnings: [],
            statistics: {
                totalQuestions: 0,
                questionsWithMedia: 0,
                mediaFilesFound: 0
            }
        };

        try {
            // Parse questions from text
            const parsingResult = await this.questionParser.parseQuestionsFromText(text);
            
            result.questions = parsingResult.questions;
            result.errors = parsingResult.errors;
            result.warnings = parsingResult.warnings;
            result.statistics.totalQuestions = parsingResult.statistics.totalQuestions;
            result.statistics.questionsWithMedia = parsingResult.statistics.questionsWithMedia;
            result.statistics.mediaFilesFound = parsingResult.statistics.totalMediaFiles;

            if (parsingResult.errors.length > 0) {
                this.logger.warn('Parsing completed with errors', parsingResult.errors);
            }

            // Generate HTML preview
            result.html = await this.generatePreviewHtml(parsingResult, options);
            result.css = this.mediaProcessor.generateQuestionPreviewCss();
            result.success = true;

        } catch (error) {
            result.errors.push(`Preview generation failed: ${error.message}`);
            this.logger.error('Failed to generate question preview', error);
        }

        return result;
    }

    private async generatePreviewHtml(
        parsingResult: QuestionParsingResult, 
        options: MediaProcessingOptions
    ): Promise<string> {
        
        let html = '<div class="questions-preview-container">';
        
        // Add header with statistics
        html += this.generatePreviewHeader(parsingResult);

        // Group questions by parent-child relationships
        const questionGroups = this.groupQuestions(parsingResult.questions);

        let questionCounter = 1;

        for (const group of questionGroups) {
            if (group.parent) {
                // Render group question
                html += await this.renderGroupQuestion(group, questionCounter, options);
                questionCounter += group.children.length;
            } else if (group.children.length === 1) {
                // Render single question
                html += await this.renderSingleQuestion(group.children[0], questionCounter, options);
                questionCounter++;
            }
        }

        // Add errors and warnings if any
        if (parsingResult.errors.length > 0 || parsingResult.warnings.length > 0) {
            html += this.generateErrorsAndWarnings(parsingResult.errors, parsingResult.warnings);
        }

        html += '</div>';
        
        return html;
    }

    private generatePreviewHeader(parsingResult: QuestionParsingResult): string {
        const stats = parsingResult.statistics;
        
        return `
        <div class="preview-header">
            <h2>Question Preview</h2>
            <div class="preview-stats">
                <span class="stat-item">Total Questions: <strong>${stats.totalQuestions}</strong></span>
                <span class="stat-item">Single: <strong>${stats.singleQuestions}</strong></span>
                <span class="stat-item">Group: <strong>${stats.groupQuestions}</strong></span>
                <span class="stat-item">Fill-in-Blank: <strong>${stats.fillInBlankQuestions}</strong></span>
                <span class="stat-item">With Media: <strong>${stats.questionsWithMedia}</strong></span>
            </div>
        </div>
        `;
    }

    private groupQuestions(questions: ParsedQuestion[]): Array<{parent?: ParsedQuestion, children: ParsedQuestion[]}> {
        const groups: Array<{parent?: ParsedQuestion, children: ParsedQuestion[]}> = [];
        const parentQuestions = questions.filter(q => q.type === QuestionType.PARENT);
        const childQuestions = questions.filter(q => q.type !== QuestionType.PARENT);
        const singleQuestions = childQuestions.filter(q => !q.parentId);

        // Process parent-child groups
        for (const parent of parentQuestions) {
            const children = childQuestions.filter(q => q.parentId === `parent_${parent.order}`);
            groups.push({ parent, children });
        }

        // Process single questions
        for (const single of singleQuestions) {
            groups.push({ children: [single] });
        }

        return groups;
    }

    private async renderGroupQuestion(
        group: {parent?: ParsedQuestion, children: ParsedQuestion[]}, 
        startingNumber: number,
        options: MediaProcessingOptions
    ): Promise<string> {
        
        let html = '<div class="group-question">';
        
        if (group.parent) {
            // Render parent content
            const { processedContent } = await this.mediaProcessor.processMediaContent(
                group.parent.content,
                group.parent.mediaReferences,
                options
            );

            // Process placeholders with actual question numbers
            const contentWithNumbers = this.mediaProcessor.processPlaceholders(
                processedContent, 
                startingNumber
            );

            html += `
            <div class="parent-question">
                <div class="question-header">
                    <span class="question-type-badge group">Group Question</span>
                    <span class="question-range">Questions ${startingNumber} - ${startingNumber + group.children.length - 1}</span>
                </div>
                <div class="parent-content">${contentWithNumbers}</div>
            </div>
            `;
        }

        // Render child questions
        html += '<div class="child-questions">';
        
        for (let i = 0; i < group.children.length; i++) {
            const child = group.children[i];
            const questionNumber = startingNumber + i;
            
            html += await this.renderChildQuestion(child, questionNumber, options);
        }
        
        html += '</div>';
        html += '</div>';
        
        return html;
    }

    private async renderChildQuestion(
        question: ParsedQuestion, 
        questionNumber: number,
        options: MediaProcessingOptions
    ): Promise<string> {
        
        const { processedContent } = await this.mediaProcessor.processMediaContent(
            question.content,
            question.mediaReferences,
            options
        );

        const typeLabel = question.type === QuestionType.FILL_IN_BLANK ? 'Fill-in-Blank' : 'Group';
        
        let html = `
        <div class="child-question">
            <div class="question-header">
                <span class="question-number">${questionNumber}.</span>
                <span class="question-type-badge ${question.type}">${typeLabel}</span>
            </div>
            <div class="question-content">${processedContent}</div>
        `;

        // Render answers
        if (question.answers && question.answers.length > 0) {
            html += '<div class="question-answers">';
            
            for (const answer of question.answers) {
                const isCorrect = answer.isCorrect ? ' correct-answer' : '';
                html += `
                <div class="answer-option${isCorrect}">
                    <span class="answer-letter">${answer.letter}.</span>
                    <span class="answer-content">${answer.content}</span>
                </div>
                `;
            }
            
            html += '</div>';
        }

        html += '</div>';
        
        return html;
    }

    private async renderSingleQuestion(
        question: ParsedQuestion, 
        questionNumber: number,
        options: MediaProcessingOptions
    ): Promise<string> {
        
        const { processedContent } = await this.mediaProcessor.processMediaContent(
            question.content,
            question.mediaReferences,
            options
        );

        let html = `
        <div class="single-question">
            <div class="question-header">
                <span class="question-number">${questionNumber}.</span>
                <span class="question-type-badge single">Single Question</span>
                ${question.clo ? `<span class="clo-badge">CLO${question.clo}</span>` : ''}
            </div>
            <div class="question-content">${processedContent}</div>
        `;

        // Render answers
        if (question.answers && question.answers.length > 0) {
            html += '<div class="question-answers">';
            
            for (const answer of question.answers) {
                const isCorrect = answer.isCorrect ? ' correct-answer' : '';
                html += `
                <div class="answer-option${isCorrect}">
                    <span class="answer-letter">${answer.letter}.</span>
                    <span class="answer-content">${answer.content}</span>
                </div>
                `;
            }
            
            html += '</div>';
        }

        html += '</div>';
        
        return html;
    }

    private generateErrorsAndWarnings(errors: string[], warnings: string[]): string {
        let html = '';

        if (errors.length > 0) {
            html += '<div class="preview-errors">';
            html += '<h3>Errors</h3>';
            html += '<ul>';
            for (const error of errors) {
                html += `<li class="error-item">${error}</li>`;
            }
            html += '</ul>';
            html += '</div>';
        }

        if (warnings.length > 0) {
            html += '<div class="preview-warnings">';
            html += '<h3>Warnings</h3>';
            html += '<ul>';
            for (const warning of warnings) {
                html += `<li class="warning-item">${warning}</li>`;
            }
            html += '</ul>';
            html += '</div>';
        }

        return html;
    }

    async validateAndPreview(text: string): Promise<QuestionPreviewResult> {
        const result = await this.previewQuestionsFromText(text);
        
        // Additional validation
        for (const question of result.questions) {
            const validation = this.questionParser.validateQuestion(question);
            
            if (!validation.isValid) {
                result.errors.push(...validation.errors);
            }
            
            result.warnings.push(...validation.warnings);
        }

        return result;
    }
}
