export interface ExamPackageStructure {
    wordDocument: ExtractedFile;
    mediaFiles: ExtractedMediaFile[];
    audioFiles: ExtractedMediaFile[];
    imageFiles: ExtractedMediaFile[];
}

export interface ExtractedFile {
    fileName: string;
    originalName: string;
    buffer: Buffer;
    mimeType: string;
    relativePath: string;
}

export interface ExtractedMediaFile extends ExtractedFile {
    fileType: MediaFileType;
    targetFolder: 'audio' | 'images';
    convertedBuffer?: Buffer;
    convertedMimeType?: string;
    uploadedUrl?: string;
    spacesKey?: string;
}

export interface ProcessedQuestion {
    id: string;
    content: string;
    answers: ProcessedAnswer[];
    hoanVi: boolean;
    mediaReferences: MediaReference[];
    originalContent: string;
    processedContent: string;
}

export interface ProcessedAnswer {
    content: string;
    isCorrect: boolean;
    hasUnderline: boolean;
    order: number;
}

export interface MediaReference {
    type: 'audio' | 'image';
    originalPath: string;
    fileName: string;
    newUrl: string;
    tagContent: string;
    replacementTag: string;
}

export interface PackageProcessingResult {
    packageId: string;
    extractedStructure: ExamPackageStructure;
    processedQuestions: ProcessedQuestion[];
    uploadedMedia: ExtractedMediaFile[];
    mediaReplacements: MediaReference[];
    statistics: ProcessingStatistics;
    errors: string[];
    warnings: string[];
}

export interface ProcessingStatistics {
    totalQuestions: number;
    questionsWithMedia: number;
    totalMediaFiles: number;
    audioFilesProcessed: number;
    imageFilesProcessed: number;
    imageFilesConverted: number;
    mediaReplacementsMade: number;
    questionsWithHoanVi0: number;
    questionsWithHoanVi1: number;
}

export enum MediaFileType {
    AUDIO = 1,
    IMAGE = 2,
    DOCUMENT = 3,
    VIDEO = 4
}

export interface ZipExtractionOptions {
    maxFileSize: number;
    allowedExtensions: string[];
    requiredStructure: {
        wordDocument: boolean;
        audioFolder: boolean;
        imageFolder: boolean;
    };
}

export interface MediaProcessingOptions {
    convertImagesToWebP: boolean;
    webpQuality: number;
    maxImageWidth: number;
    maxImageHeight: number;
    audioFormats: string[];
    imageFormats: string[];
}
