// Enhanced Question Preview Components
// Author: Linh Dang Dev

export { default as EnhancedQuestionPreview } from './EnhancedQuestionPreview';
export { default as QuestionPreviewDemo } from './QuestionPreviewDemo';
export { default as MediaRenderer } from './MediaRenderer';
export { default as NewQuestionPreview } from './NewQuestionPreview';
export { default as NewQuestionPreviewDemo } from './NewQuestionPreviewDemo';

export {
    SingleChoiceRenderer,
    GroupQuestionRenderer,
    FillInBlankRenderer,
    MultiChoiceRenderer,
    renderQuestionContent
} from './QuestionTypeRenderers';

// Type definitions for question preview components
export interface QuestionPreviewAnswer {
    id: string;
    content: string;
    isCorrect: boolean;
    order: number;
    letter?: string;
}

export interface QuestionPreviewMediaReference {
    type: 'audio' | 'image';
    fileName: string;
    originalPath?: string;
    uploadedUrl?: string;
    spacesKey?: string;
    tempPath?: string;
}

export interface QuestionPreviewData {
    id: string;
    content: string;
    type: 'single' | 'group' | 'fill-in-blank' | 'multi-choice';
    answers?: QuestionPreviewAnswer[];
    childQuestions?: QuestionPreviewData[];
    groupContent?: string;
    clo?: string;
    hasFillInBlanks?: boolean;
    blankMarkers?: string[];
    questionNumber?: number;
    mediaReferences?: QuestionPreviewMediaReference[];
}

export interface EnhancedQuestionPreviewProps {
    question: QuestionPreviewData;
    showExpanded?: boolean;
    className?: string;
}
