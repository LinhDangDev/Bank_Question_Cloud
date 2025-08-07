export enum QuestionType {
    SINGLE = 'SINGLE',
    SINGLE_CHOICE = 'SINGLE_CHOICE',
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
    TRUE_FALSE = 'TRUE_FALSE',
    ESSAY = 'ESSAY',
    GROUP = 'GROUP',
    PARENT = 'PARENT',
    FILL_IN_BLANK = 'FILL_IN_BLANK',
    MATCHING = 'MATCHING',
    ORDERING = 'ORDERING',
    AUDIO = 'AUDIO',
    VIDEO = 'VIDEO',
    IMAGE = 'IMAGE',
    MATH = 'MATH',
    CODE = 'CODE',
    MULTIMEDIA = 'MULTIMEDIA',
}

export interface MediaReference {
    id: string;
    type: MediaType;
    url: string;
    caption?: string;
    position?: string;
    fileName?: string;
    uploadedUrl?: string;
    originalPath?: string;
}

export enum MediaType {
    IMAGE = 'image',
    AUDIO = 'audio',
    VIDEO = 'video',
    DOCUMENT = 'document',
    OTHER = 'other'
}

export interface QuestionMedia {
    originalUrl: string;
    uploadedUrl?: string;
    type: 'image' | 'audio' | 'video';
    fileName: string;
}

export interface QuestionOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

export interface ChildQuestion {
    id?: string;
    content: string;
    options?: QuestionOption[];
    correctAnswer?: string;
    explanation?: string;
    type: QuestionType;
    mediaFiles?: QuestionMedia[];
    clo?: string;
    mediaReferences?: MediaReference[];
    answers?: {
        id: string;
        content: string;
        isCorrect: boolean;
        order: number;
        letter: string;
    }[];
}

export interface Question {
    id?: string;
    content: string;
    type: QuestionType;
    options?: QuestionOption[];
    correctAnswer?: string;
    explanation?: string;
    mediaFiles?: QuestionMedia[];
    childQuestions?: ChildQuestion[];
    parentId?: string;
    groupContent?: string;
    fillInBlankAnswers?: string[];
    clo?: string;
    difficultyLevel?: number;
    tags?: string[];
    uploadedUrl?: string;
    mediaReferences?: MediaReference[];
    answers?: {
        id: string;
        content: string;
        isCorrect: boolean;
        order: number;
        letter: string;
    }[];
    order?: number | string;
}

export interface ArchiveStructure {
    hasWordDocument: boolean;
    wordDocumentPath?: string;
    mediaFolderPath?: string;
    archiveType: 'zip' | 'rar' | 'unknown';
}

export interface ArchivePreviewResult {
    success: boolean;
    structure: ArchiveStructure;
    wordDocument?: {
        name: string;
        path: string;
        size: number;
    };
    audioFiles: MediaFile[];
    imageFiles: MediaFile[];
    otherFiles: MediaFile[];
    errors: string[];
}

export interface MediaFile {
    name: string;
    path: string;
    size: number;
    type: 'image' | 'audio' | 'video' | 'document' | 'other';
    previewUrl?: string;
}

export interface DocxParseOptions {
    uploadMedia?: boolean;
    generateThumbnails?: boolean;
    saveToDatabase?: boolean;
    chapterId?: string;
    uploadToSpaces?: boolean;
}

export interface ZipPackageOptions {
    processImages?: boolean;
    processAudio?: boolean;
    saveToDatabase?: boolean;
    limit?: number;
    uploadToSpaces?: boolean;
    onProgress?: (progress: number) => void;
}

export interface QuestionUploadState {
    isLoading: boolean;
    success: boolean;
    error: string | null;
    progress: number;
    questions: Question[];
    warnings: string[];
    stats: {
        totalQuestions: number;
        totalMedia: number;
        processedMedia: number;
        uploadedToSpaces: number;
        savedToDatabase: number;
    };
}

export interface ParsedQuestions {
    questions: Question[];
    errors: string[];
    warnings: string[];
}

export interface ZipUploadResult {
    success: boolean;
    questions: Question[];
    savedIds?: string[];
    errors: string[];
    warnings: string[];
    stats: {
        totalQuestions: number;
        totalMedia: number;
        processedMedia: number;
        uploadedToSpaces: number;
        savedToDatabase: number;
    };
}

export interface QuestionPreviewProps {
    questions: Question[];
    onSave?: (questions: Question[]) => void;
    onClose?: () => void;
    onView?: (questionId: string) => void;
    onQuestionSelect?: (questionId: string) => void;
    selectedQuestionIds?: string[];
    showStatistics?: boolean;
    showErrors?: boolean;
    errors?: string[];
    warnings?: string[];
    isLoading?: boolean;
    className?: string;
}

export interface QuestionData {
    id: string;
    type: QuestionType;
    clo?: string;
    content: string;
    mediaReferences?: MediaReference[];
    answers?: {
        id: string;
        content: string;
        isCorrect: boolean;
        order: number;
        letter: string;
    }[];
    childQuestions?: QuestionData[];
    order?: number | string;
}

export interface EnhancedQuestionPreviewProps {
    question?: QuestionData;
    questions?: QuestionData[];
    showAnswers?: boolean;
    onSelect?: (questionId: string) => void;
    selected?: boolean;
    showExpanded?: boolean;
    clos?: string[];
    types?: string[];
    onSave?: (selectedQuestionIds: string[]) => void;
    highlightCorrectAnswers?: boolean;
}

export interface QuestionPreviewResult {
    questions: QuestionData[];
    errors: string[];
    warnings: string[];
    html?: string;
    css?: string;
    success?: boolean;
    statistics?: QuestionStatistics;
}

export interface QuestionStatistics {
    totalQuestions: number;
    questionsByType: Record<string, number>;
    questionsByDifficulty: Record<string, number>;
    questionsByCLO: Record<string, number>;
    questionsByChapter: Record<string, number>;
    mediaStats: {
        totalMedia: number;
        imageCount: number;
        audioCount: number;
        videoCount: number;
    };
    singleQuestions: number;
    groupQuestions: number;
    fillInBlankQuestions: number;
    questionsWithMedia: number;
    totalMediaFiles: number;
    cloDistribution: Record<string, number>;
    difficultyDistribution: Record<string, number>;
}
