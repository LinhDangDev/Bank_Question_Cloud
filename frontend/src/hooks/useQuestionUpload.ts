import { useState, useCallback } from 'react';
import { DocxParseOptions, ZipPackageOptions, ZipUploadResult, QuestionUploadState } from '../types/question-parser.types';
import { questionParserService } from '../services/questionParserService';
import { useToast } from '../components/ui/toast';

export interface UseQuestionUploadOptions {
    saveToDatabase?: boolean;
    uploadToSpaces?: boolean;
    chapterId?: string;
}

export const useQuestionUpload = (options: UseQuestionUploadOptions = {}) => {
    const { toast } = useToast();

    const initialState: QuestionUploadState = {
        isLoading: false,
        success: false,
        error: null,
        progress: 0,
        questions: [],
        warnings: [],
        stats: {
            totalQuestions: 0,
            totalMedia: 0,
            processedMedia: 0,
            uploadedToSpaces: 0,
            savedToDatabase: 0,
        },
    };

    const [state, setState] = useState<QuestionUploadState>(initialState);

    const updateState = useCallback((updates: Partial<QuestionUploadState>) => {
        setState((prev) => ({
            ...prev,
            ...updates,
        }));
    }, []);

    const resetState = useCallback(() => {
        setState(initialState);
    }, [initialState]);

    const showProgress = useCallback((progress: number) => {
        updateState({ progress });
    }, [updateState]);

    const showError = useCallback((error: string) => {
        updateState({
            isLoading: false,
            error,
            success: false,
        });

        toast({
            title: "Lỗi",
            description: error,
            variant: "destructive",
        });
    }, [updateState, toast]);

    const showSuccess = useCallback((message: string) => {
        updateState({
            isLoading: false,
            success: true,
            error: null,
        });

        toast({
            title: "Thành công",
            description: message,
            variant: "default",
        });
    }, [updateState, toast]);

    const handleResponse = useCallback((result: ZipUploadResult) => {
        updateState({
            isLoading: false,
            success: result.success,
            error: result.success ? null : result.errors.join(', '),
            questions: result.questions,
            warnings: result.warnings,
            stats: result.stats,
            progress: 100,
        });

        if (result.success) {
            showSuccess(`Đã xử lý ${result.questions.length} câu hỏi thành công.`);
        } else {
            showError(result.errors.join(', '));
        }

        return result;
    }, [updateState, showSuccess, showError]);

    const parseDocxContent = useCallback(async (
        content: string,
        options: DocxParseOptions = {}
    ) => {
        try {
            updateState({
                isLoading: true,
                error: null,
                progress: 0,
            });

            const result = await questionParserService.parseText(content, {
                uploadMedia: options.uploadMedia || false,
                generateThumbnails: options.generateThumbnails,
            });

            return handleResponse({
                success: true,
                questions: result.questions,
                errors: result.errors || [],
                warnings: result.warnings || [],
                stats: {
                    totalQuestions: result.questions.length,
                    totalMedia: 0, // Would need to calculate from questions
                    processedMedia: 0,
                    uploadedToSpaces: 0,
                    savedToDatabase: 0,
                },
            });
        } catch (error: any) {
            showError(error.message || 'Failed to parse content');
            return null;
        }
    }, [updateState, handleResponse, showError]);

    const uploadDocxFile = useCallback(async (
        file: File,
        options: DocxParseOptions = {}
    ) => {
        try {
            updateState({
                isLoading: true,
                error: null,
                progress: 0,
            });

            const validation = questionParserService.validateFile(file, 'docx');
            if (!validation.isValid) {
                throw new Error(validation.error || 'Invalid DOCX file');
            }

            const result = await questionParserService.parseDocx(file, {
                uploadMedia: options.uploadMedia || true,
                generateThumbnails: options.generateThumbnails,
                saveToDatabase: options.saveToDatabase,
                uploadToSpaces: options.uploadToSpaces,
            });

            if (result.errors && result.errors.length > 0) {
                toast({
                    title: "Lỗi xử lý",
                    description: `File DOCX xử lý với ${result.errors.length} lỗi`,
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Thành công",
                    description: `Đã xử lý thành công ${result.questions.length} câu hỏi từ DOCX`,
                    variant: "success"
                });
            }

            return handleResponse(result);
        } catch (error: any) {
            const errorMessage = error.message || 'Lỗi khi xử lý file DOCX';
            showError(errorMessage);
            return null;
        }
    }, [updateState, handleResponse, showError, toast]);

    const uploadZipPackage = useCallback(async (
        file: File,
        packageOptions: ZipPackageOptions = {}
    ): Promise<ZipUploadResult | null> => {
        try {
            updateState({
                isLoading: true,
                error: null,
                progress: 0,
            });

            const validation = questionParserService.validateFile(file, 'zip');
            if (!validation.isValid) {
                throw new Error(validation.error || 'Invalid ZIP file');
            }

            const onProgress = packageOptions.onProgress || showProgress;

            const result = await questionParserService.uploadZipPackage(
                file,
                options.chapterId,
                {
                    processImages: true,
                    processAudio: true,
                    saveToDatabase: packageOptions.saveToDatabase !== undefined ? packageOptions.saveToDatabase : options.saveToDatabase,
                    uploadToSpaces: packageOptions.uploadToSpaces !== undefined ? packageOptions.uploadToSpaces : options.uploadToSpaces,
                    onProgress,
                }
            );

            return handleResponse(result);
        } catch (error: any) {
            showError(error.message || 'Failed to process ZIP package');
            return null;
        }
    }, [updateState, options, handleResponse, showProgress, showError]);

    return {
        state,
        parseDocxContent,
        uploadDocxFile,
        uploadZipPackage,
        resetState,
        showProgress,
        showError,
        showSuccess,
    };
};
