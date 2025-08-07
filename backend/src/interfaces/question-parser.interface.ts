import { QuestionType, MediaType } from '../enums/question-type.enum';

export interface ParsedAnswer {
    letter: string;
    content: string;
    isCorrect: boolean;
    order: number;
}

export interface MediaReference {
    type: MediaType;
    originalPath: string;
    fileName: string;
    tempPath?: string;
    uploadedUrl?: string;
    spacesKey?: string;
}

export interface ParsedQuestion {
    type: QuestionType;
    clo?: string;
    content: string;
    answers: ParsedAnswer[];
    mediaReferences: MediaReference[];
    parentId?: string;
    childQuestions?: ParsedQuestion[];
    order?: number;
    placeholderNumber?: number;
    isParent?: boolean;
    childCount?: number;
    hasFillInBlanks?: boolean;
}

export interface GroupQuestionStructure {
    parentContent: string;
    childQuestions: ParsedQuestion[];
    mediaReferences: MediaReference[];
    isFillInBlank: boolean;
    placeholderCount: number;
}

export interface QuestionParsingResult {
    questions: ParsedQuestion[];
    mediaFiles: MediaReference[];
    errors: string[];
    warnings: string[];
    statistics: {
        totalQuestions: number;
        singleQuestions: number;
        groupQuestions: number;
        fillInBlankQuestions: number;
        questionsWithMedia: number;
        totalMediaFiles: number;
    };
}

export interface MediaProcessingOptions {
    uploadToSpaces?: boolean;
    generateThumbnails?: boolean;
    convertImages?: boolean;
    targetImageFormat?: 'webp' | 'png' | 'jpg';
    maxImageWidth?: number;
    maxImageHeight?: number;
    audioFormats?: string[];
    imageFormats?: string[];
}

export interface QuestionValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    question: ParsedQuestion;
}

export interface ParsedQuestionForDatabase {
    MaSoCauHoi: number;
    NoiDung: string;
    HoanVi: boolean;
    CapDo: number;
    SoCauHoiCon: number;
    MaCauHoiCha?: string;
    MaCLO?: string;
    answers: {
        NoiDung: string;
        ThuTu: number;
        LaDapAn: boolean;
        HoanVi: boolean;
    }[];
    mediaFiles: {
        TenFile: string;
        LoaiFile: number;
        KichThuocFile?: number;
        MimeType?: string;
        TenFileGoc?: string;
        DuongDanCongKhai?: string;
    }[];
}
