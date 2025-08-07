import axios, { AxiosResponse } from 'axios';
import { ZipUploadResult, Question, DocxParseOptions, ZipPackageOptions, QuestionData } from '../types/question-parser.types';
import * as JSZip from 'jszip';
import { API_BASE_URL } from '../config';

// Extend JSZipObject interface to add uncompressedSize property
declare module 'jszip' {
    interface JSZipObject {
        uncompressedSize?: number;
    }
}

export interface QuestionStatistics {
    totalQuestions: number;
    questionsWithMedia: number;
    mediaFilesFound: number;
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

class QuestionParserService {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    async parseText(content: string, options: DocxParseOptions = {}): Promise<{ questions: Question[], errors: string[], warnings: string[] }> {
        try {
            const response = await axios.post(`${this.baseURL}/docx-parser/parse-text`, {
                content,
                uploadMedia: options.uploadMedia,
                generateThumbnails: options.generateThumbnails,
                saveToDatabase: options.saveToDatabase,
                chapterId: options.chapterId,
                uploadToSpaces: options.uploadToSpaces
            });

            return {
                questions: response.data.questions || [],
                errors: response.data.errors || [],
                warnings: response.data.warnings || []
            };
        } catch (error) {
            throw this.handleError(error, 'Failed to parse text content');
        }
    }

    async parseDocx(
        file: File,
        options: DocxParseOptions = {}
    ): Promise<ZipUploadResult> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            if (options.uploadMedia !== undefined) {
                formData.append('uploadMedia', options.uploadMedia.toString());
            }

            if (options.generateThumbnails !== undefined) {
                formData.append('generateThumbnails', options.generateThumbnails.toString());
            }

            if (options.uploadToSpaces !== undefined) {
                formData.append('uploadToSpaces', options.uploadToSpaces.toString());
            }

            if (options.saveToDatabase !== undefined) {
                formData.append('saveToDatabase', options.saveToDatabase.toString());
            }

            const response = await axios.post(
                `${this.baseURL}/question-parser/parse-docx`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 60000 // 60 second timeout for file uploads
                }
            );

            return {
                success: response.data.success,
                questions: response.data.questions || [],
                errors: response.data.errors || [],
                warnings: response.data.warnings || [],
                stats: response.data.stats || {
                    totalQuestions: response.data.questions?.length || 0,
                    totalMedia: 0,
                    processedMedia: 0,
                    uploadedToSpaces: 0,
                    savedToDatabase: 0
                }
            };
        } catch (error) {
            throw this.handleError(error, 'Failed to parse DOCX file');
        }
    }

    async previewText(options: {
        text: string;
        includeMedia?: boolean;
        maxImageWidth?: number;
        maxImageHeight?: number;
    }): Promise<QuestionPreviewResult> {
        try {
            const response = await axios.post(`${this.baseURL}/question-preview/preview-text`, {
                text: options.text,
                includeMedia: options.includeMedia,
                maxImageWidth: options.maxImageWidth,
                maxImageHeight: options.maxImageHeight
            });

            return {
                questions: response.data.questions || [],
                errors: response.data.errors || [],
                warnings: response.data.warnings || [],
                html: response.data.html || '',
                css: response.data.css || '',
                success: response.data.success,
                statistics: response.data.statistics || {
                    totalQuestions: 0,
                    questionsWithMedia: 0,
                    mediaFilesFound: 0,
                    questionsByType: {},
                    questionsByDifficulty: {},
                    questionsByCLO: {},
                    questionsByChapter: {},
                    mediaStats: {
                        totalMedia: 0,
                        imageCount: 0,
                        audioCount: 0,
                        videoCount: 0
                    },
                    singleQuestions: 0,
                    groupQuestions: 0,
                    fillInBlankQuestions: 0,
                    totalMediaFiles: 0,
                    cloDistribution: {},
                    difficultyDistribution: {}
                }
            };
        } catch (error) {
            throw this.handleError(error, 'Failed to preview text content');
        }
    }

    async previewZipContents(file: File): Promise<{
        success: boolean;
        errors: string[];
        contents: {
            wordDocuments: string[];
            mediaFiles: string[];
            estimatedQuestions: number;
            totalSize: number;
        };
    }> {
        try {
            // Extract ZIP contents in the browser
            const zip = await JSZip.loadAsync(file);
            const wordDocuments: string[] = [];
            const mediaFiles: string[] = [];
            let totalSize = 0;

            // Process files in the ZIP
            for (const [path, zipEntry] of Object.entries(zip.files)) {
                if (zipEntry.dir) continue;

                // Use optional chaining to safely access uncompressedSize
                totalSize += (zipEntry as any).uncompressedSize || 0;

                if (path.toLowerCase().endsWith('.docx') || path.toLowerCase().endsWith('.doc')) {
                    wordDocuments.push(path);
                } else if (this.isMediaFile(path)) {
                    mediaFiles.push(path);
                }
            }

            // Estimate number of questions based on DOCX files
            // This is a very rough estimate - 10 questions per DOCX file
            const estimatedQuestions = wordDocuments.length * 10;

            return {
                success: true,
                errors: wordDocuments.length === 0 ? ['Không tìm thấy file Word (.docx) trong gói đề thi'] : [],
                contents: {
                    wordDocuments,
                    mediaFiles,
                    estimatedQuestions,
                    totalSize
                }
            };
        } catch (error: any) {
            return {
                success: false,
                errors: [error.message || 'Failed to preview ZIP contents'],
                contents: {
                    wordDocuments: [],
                    mediaFiles: [],
                    estimatedQuestions: 0,
                    totalSize: 0
                }
            };
        }
    }

    async uploadZipPackage(
        file: File,
        chapterId?: string,
        options: ZipPackageOptions = {}
    ): Promise<ZipUploadResult> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            if (chapterId) {
                formData.append('chapterId', chapterId);
            }

            if (options.processImages !== undefined) {
                formData.append('processImages', options.processImages.toString());
            }

            if (options.processAudio !== undefined) {
                formData.append('processAudio', options.processAudio.toString());
            }

            if (options.saveToDatabase !== undefined) {
                formData.append('saveToDatabase', options.saveToDatabase.toString());
            }

            if (options.uploadToSpaces !== undefined) {
                formData.append('uploadToSpaces', options.uploadToSpaces.toString());
            }

            if (options.limit !== undefined) {
                formData.append('limit', options.limit.toString());
            }

            // Create an upload progress handler
            const onUploadProgress = (progressEvent: any) => {
                if (options.onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    options.onProgress(percentCompleted);
                }
            };

            const response: AxiosResponse<ZipUploadResult> = await axios.post(
                `${API_BASE_URL}/exam-package/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress,
                    timeout: 300000 // 5 minute timeout for larger uploads
                }
            );

            return response.data;
        } catch (error) {
            throw this.handleError(error, 'Failed to upload ZIP package');
        }
    }

    // Helper method to validate file before upload
    validateFile(file: File, type: 'docx' | 'zip'): { isValid: boolean; error?: string } {
        const maxSizes = {
            docx: 50 * 1024 * 1024, // 50MB
            zip: 100 * 1024 * 1024 // 100MB
        };

        const allowedExtensions = {
            docx: ['.docx', '.doc'],
            zip: ['.zip']
        };

        // Check file size
        if (file.size > maxSizes[type]) {
            return {
                isValid: false,
                error: `File quá lớn. Kích thước tối đa là ${maxSizes[type] / (1024 * 1024)}MB.`
            };
        }

        // Check file extension
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowedExtensions[type].includes(extension)) {
            return {
                isValid: false,
                error: `Định dạng file không được hỗ trợ. Chỉ hỗ trợ ${allowedExtensions[type].join(', ')}.`
            };
        }

        return { isValid: true };
    }

    private isMediaFile(filename: string): boolean {
        const mediaExtensions = [
            // Images
            '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
            // Audio
            '.mp3', '.wav', '.ogg', '.m4a', '.aac',
            // Video
            '.mp4', '.webm', '.avi', '.mov', '.mkv'
        ];

        const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
        return mediaExtensions.includes(extension);
    }

    private handleError(error: any, defaultMessage: string): Error {
        console.error(error);

        if (axios.isAxiosError(error)) {
            const serverError = error.response?.data?.message || error.response?.data?.error;
            if (serverError) {
                return new Error(serverError);
            }

            if (error.message) {
                return new Error(error.message);
            }
        }

        return new Error(defaultMessage);
    }
}

export const questionParserService = new QuestionParserService();
