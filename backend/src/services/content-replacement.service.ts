import { Injectable, Logger } from '@nestjs/common';
import { 
    MediaReference, 
    ExtractedMediaFile, 
    ProcessedQuestion 
} from '../interfaces/exam-package.interface';

@Injectable()
export class ContentReplacementService {
    private readonly logger = new Logger(ContentReplacementService.name);

    replaceMediaPaths(
        content: string, 
        uploadedMediaFiles: ExtractedMediaFile[]
    ): { processedContent: string; mediaReferences: MediaReference[] } {
        let processedContent = content;
        const mediaReferences: MediaReference[] = [];

        for (const mediaFile of uploadedMediaFiles) {
            const references = this.findAndReplaceMediaReferences(
                processedContent, 
                mediaFile
            );

            for (const reference of references) {
                processedContent = processedContent.replace(
                    reference.tagContent, 
                    reference.replacementTag
                );
                mediaReferences.push(reference);
            }
        }

        return { processedContent, mediaReferences };
    }

    private findAndReplaceMediaReferences(
        content: string, 
        mediaFile: ExtractedMediaFile
    ): MediaReference[] {
        const references: MediaReference[] = [];
        const fileName = mediaFile.originalName;
        const uploadedUrl = mediaFile.uploadedUrl;

        if (!uploadedUrl) {
            this.logger.warn(`No uploaded URL found for media file: ${fileName}`);
            return references;
        }

        if (mediaFile.targetFolder === 'audio') {
            const audioReferences = this.replaceAudioReferences(content, fileName, uploadedUrl);
            references.push(...audioReferences);
        } else if (mediaFile.targetFolder === 'images') {
            const imageReferences = this.replaceImageReferences(content, fileName, uploadedUrl);
            references.push(...imageReferences);
        }

        return references;
    }

    private replaceAudioReferences(
        content: string, 
        fileName: string, 
        uploadedUrl: string
    ): MediaReference[] {
        const references: MediaReference[] = [];

        const audioPatterns = [
            new RegExp(`<audio\\s+src=["']\\./audio/${fileName}["'][^>]*>`, 'gi'),
            new RegExp(`<audio\\s+src=["']audio/${fileName}["'][^>]*>`, 'gi'),
            new RegExp(`<audio[^>]*src=["']\\./audio/${fileName}["'][^>]*>`, 'gi'),
            new RegExp(`<audio[^>]*src=["']audio/${fileName}["'][^>]*>`, 'gi')
        ];

        for (const pattern of audioPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const replacementTag = `<audio src="${uploadedUrl}" controls></audio>`;
                    
                    references.push({
                        type: 'audio',
                        originalPath: `./audio/${fileName}`,
                        fileName,
                        newUrl: uploadedUrl,
                        tagContent: match,
                        replacementTag
                    });

                    this.logger.log(`Found audio reference: ${fileName} -> ${uploadedUrl}`);
                }
            }
        }

        return references;
    }

    private replaceImageReferences(
        content: string, 
        fileName: string, 
        uploadedUrl: string
    ): MediaReference[] {
        const references: MediaReference[] = [];

        const originalFileName = fileName;
        const webpFileName = fileName.replace(/\.[^/.]+$/, '.webp');

        const imagePatterns = [
            new RegExp(`<img\\s+src=["']\\./images/${originalFileName}["'][^>]*>`, 'gi'),
            new RegExp(`<img\\s+src=["']images/${originalFileName}["'][^>]*>`, 'gi'),
            new RegExp(`<img[^>]*src=["']\\./images/${originalFileName}["'][^>]*>`, 'gi'),
            new RegExp(`<img[^>]*src=["']images/${originalFileName}["'][^>]*>`, 'gi'),
            new RegExp(`<img\\s+src=["']\\./images/${webpFileName}["'][^>]*>`, 'gi'),
            new RegExp(`<img\\s+src=["']images/${webpFileName}["'][^>]*>`, 'gi')
        ];

        for (const pattern of imagePatterns) {
            const matches = content.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const replacementTag = `<img src="${uploadedUrl}" style="max-width: 400px; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">`;
                    
                    references.push({
                        type: 'image',
                        originalPath: `./images/${originalFileName}`,
                        fileName: originalFileName,
                        newUrl: uploadedUrl,
                        tagContent: match,
                        replacementTag
                    });

                    this.logger.log(`Found image reference: ${originalFileName} -> ${uploadedUrl}`);
                }
            }
        }

        return references;
    }

    processQuestionContent(
        questions: any[], 
        uploadedMediaFiles: ExtractedMediaFile[]
    ): ProcessedQuestion[] {
        const processedQuestions: ProcessedQuestion[] = [];

        for (const question of questions) {
            const originalContent = question.content || '';
            const { processedContent, mediaReferences } = this.replaceMediaPaths(
                originalContent, 
                uploadedMediaFiles
            );

            const processedQuestion: ProcessedQuestion = {
                id: question.id,
                content: processedContent,
                answers: question.answers || [],
                hoanVi: question.hoanVi || false,
                mediaReferences,
                originalContent,
                processedContent
            };

            processedQuestions.push(processedQuestion);
        }

        return processedQuestions;
    }

    validateMediaReferences(content: string): { 
        hasUnreplacedReferences: boolean; 
        unreplacedReferences: string[] 
    } {
        const unreplacedReferences: string[] = [];

        const localAudioPattern = /<audio[^>]*src=["']\.\/audio\/[^"']+["'][^>]*>/gi;
        const localImagePattern = /<img[^>]*src=["']\.\/images\/[^"']+["'][^>]*>/gi;

        const audioMatches = content.match(localAudioPattern);
        const imageMatches = content.match(localImagePattern);

        if (audioMatches) {
            unreplacedReferences.push(...audioMatches);
        }

        if (imageMatches) {
            unreplacedReferences.push(...imageMatches);
        }

        return {
            hasUnreplacedReferences: unreplacedReferences.length > 0,
            unreplacedReferences
        };
    }

    generateMediaStatistics(mediaReferences: MediaReference[]): {
        totalReplacements: number;
        audioReplacements: number;
        imageReplacements: number;
        uniqueFiles: number;
    } {
        const audioReplacements = mediaReferences.filter(ref => ref.type === 'audio').length;
        const imageReplacements = mediaReferences.filter(ref => ref.type === 'image').length;
        const uniqueFiles = new Set(mediaReferences.map(ref => ref.fileName)).size;

        return {
            totalReplacements: mediaReferences.length,
            audioReplacements,
            imageReplacements,
            uniqueFiles
        };
    }

    cleanupTempContent(content: string): string {
        let cleanedContent = content;

        cleanedContent = cleanedContent.replace(/\r\n/g, '\n');
        cleanedContent = cleanedContent.replace(/\r/g, '\n');
        cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n');
        cleanedContent = cleanedContent.trim();

        return cleanedContent;
    }
}
