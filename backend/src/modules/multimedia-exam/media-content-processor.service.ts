import { Injectable, Logger } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { MediaType } from '../enums/question-type.enum';
import { MediaReference, MediaProcessingOptions } from '../interfaces/question-parser.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class MediaContentProcessorService {
    private readonly logger = new Logger(MediaContentProcessorService.name);

    constructor(private readonly spacesService: SpacesService) { }

    async processMediaContent(
        content: string,
        mediaReferences: MediaReference[],
        options: MediaProcessingOptions = {}
    ): Promise<{ processedContent: string; uploadedMedia: MediaReference[] }> {

        let processedContent = content;
        const uploadedMedia: MediaReference[] = [];

        for (const media of mediaReferences) {
            try {
                if (options.uploadToSpaces && media.tempPath) {
                    const uploadedMediaItem = await this.uploadMediaToSpaces(media);
                    uploadedMedia.push(uploadedMediaItem);
                }

                // Convert placeholders to HTML
                processedContent = this.convertMediaPlaceholderToHtml(
                    processedContent,
                    media,
                    options
                );

            } catch (error) {
                this.logger.error(`Error processing media ${media.fileName}`, error);
            }
        }

        return { processedContent, uploadedMedia };
    }

    private convertMediaPlaceholderToHtml(
        content: string,
        media: MediaReference,
        options: MediaProcessingOptions
    ): string {
        const placeholder = media.type === MediaType.AUDIO
            ? `[AUDIO_PLACEHOLDER:${media.fileName}]`
            : `[IMAGE_PLACEHOLDER:${media.fileName}]`;

        const htmlTag = this.generateMediaHtmlTag(media, options);

        return content.replace(new RegExp(this.escapeRegExp(placeholder), 'g'), htmlTag);
    }

    private generateMediaHtmlTag(media: MediaReference, options: MediaProcessingOptions): string {
        const mediaUrl = media.uploadedUrl || media.originalPath;

        if (media.type === MediaType.AUDIO) {
            return this.generateAudioHtml(mediaUrl, media.fileName);
        } else if (media.type === MediaType.IMAGE) {
            return this.generateImageHtml(mediaUrl, media.fileName, options);
        }

        return `[UNKNOWN_MEDIA:${media.fileName}]`;
    }

    private generateAudioHtml(url: string, fileName: string): string {
        return `<audio src="${url}" controls style="width: 100%; max-width: 400px; margin: 10px 0;">
            Your browser does not support the audio element.
            <a href="${url}" target="_blank">${fileName}</a>
        </audio>`;
    }

    private generateImageHtml(url: string, fileName: string, options: MediaProcessingOptions): string {
        const maxWidth = options.maxImageWidth || 400;
        const maxHeight = options.maxImageHeight || 300;

        return `<img src="${url}" alt="${fileName}"
            style="max-width: ${maxWidth}px; max-height: ${maxHeight}px; height: auto;
                   border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                   margin: 10px 0; display: block;"
            loading="lazy" />`;
    }

    async uploadMediaToSpaces(media: MediaReference): Promise<MediaReference> {
        try {
            if (!media.tempPath || !fs.existsSync(media.tempPath)) {
                throw new Error(`Media file not found: ${media.tempPath}`);
            }

            const fileBuffer = fs.readFileSync(media.tempPath);
            const fileExtension = path.extname(media.fileName);
            const baseName = path.basename(media.fileName, fileExtension);

            // Generate unique filename with timestamp
            const timestamp = Date.now();
            const uniqueFileName = `${timestamp}_${baseName}${fileExtension}`;

            // Determine folder based on media type
            const folder = media.type === MediaType.AUDIO ? 'audio' : 'images';
            const spacesKey = `${folder}/${uniqueFileName}`;

            // Upload to Digital Ocean Spaces
            const uploadResult = await this.spacesService.uploadFile(
                fileBuffer,
                spacesKey,
                this.getMimeType(fileExtension),
                true // public file
            );

            // Get public URL
            const publicUrl = await this.spacesService.getFileUrl(spacesKey);

            return {
                ...media,
                spacesKey,
                uploadedUrl: publicUrl
            };

        } catch (error) {
            this.logger.error(`Failed to upload media ${media.fileName}`, error);
            throw error;
        }
    }

    private getMimeType(extension: string): string {
        const ext = extension.toLowerCase();

        // Audio MIME types
        if (ext === '.mp3') return 'audio/mpeg';
        if (ext === '.wav') return 'audio/wav';
        if (ext === '.m4a') return 'audio/mp4';
        if (ext === '.ogg') return 'audio/ogg';
        if (ext === '.aac') return 'audio/aac';
        if (ext === '.flac') return 'audio/flac';

        // Image MIME types
        if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
        if (ext === '.png') return 'image/png';
        if (ext === '.gif') return 'image/gif';
        if (ext === '.webp') return 'image/webp';
        if (ext === '.bmp') return 'image/bmp';
        if (ext === '.svg') return 'image/svg+xml';

        return 'application/octet-stream';
    }

    convertLegacyMediaMarkup(content: string): string {
        let processedContent = content;

        // Convert [audio: path] to HTML
        processedContent = processedContent.replace(
            /\[audio:\s*([^\]]+)\]/gi,
            (match, path) => {
                const fileName = this.extractFileName(path);
                const url = this.buildDigitalOceanUrl(path, 'audio');
                return this.generateAudioHtml(url, fileName);
            }
        );

        // Convert [image: path] to HTML
        processedContent = processedContent.replace(
            /\[image:\s*([^\]]+)\]/gi,
            (match, path) => {
                const fileName = this.extractFileName(path);
                const url = this.buildDigitalOceanUrl(path, 'images');
                return this.generateImageHtml(url, fileName, {});
            }
        );

        return processedContent;
    }

    private buildDigitalOceanUrl(originalPath: string, folder: string): string {
        const fileName = this.extractFileName(originalPath);
        return `https://datauploads.sgp1.cdn.digitaloceanspaces.com/${folder}/${fileName}`;
    }

    private extractFileName(path: string): string {
        return path.split('/').pop() || path.split('\\').pop() || path;
    }

    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    processPlaceholders(content: string, questionNumber: number): string {
        let processedContent = content;

        // Replace {<n>} with actual question numbers
        processedContent = processedContent.replace(
            /\{<(\d+)>\}/g,
            (match, num) => {
                const placeholderNum = parseInt(num);
                const actualQuestionNum = questionNumber + placeholderNum - 1;
                return actualQuestionNum.toString();
            }
        );

        // Replace {<n>}_____ with numbered blanks for fill-in-blank questions
        processedContent = processedContent.replace(
            /\{<(\d+)>\}_{5,}/g,
            (match, num) => {
                return `<span class="fill-blank" data-number="${num}">_____</span>`;
            }
        );

        return processedContent;
    }

    generateQuestionPreviewHtml(
        content: string,
        answers: any[],
        questionType: string,
        questionNumber?: number
    ): string {
        let html = '<div class="question-preview">';

        // Process content
        let processedContent = this.convertLegacyMediaMarkup(content);
        if (questionNumber) {
            processedContent = this.processPlaceholders(processedContent, questionNumber);
        }

        html += `<div class="question-content">${processedContent}</div>`;

        // Add answers if not a parent question
        if (answers && answers.length > 0) {
            html += '<div class="question-answers">';

            for (const answer of answers) {
                const isCorrect = answer.isCorrect ? ' correct-answer' : '';
                html += `<div class="answer-option${isCorrect}">
                    <strong>${answer.letter}.</strong> ${answer.content}
                </div>`;
            }

            html += '</div>';
        }

        html += '</div>';

        return html;
    }

    generateQuestionPreviewCss(): string {
        return `
        <style>
        .questions-preview-container {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }

        .preview-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .preview-header h2 {
            margin: 0 0 15px 0;
            font-size: 28px;
            font-weight: 600;
        }

        .preview-stats {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
        }

        .stat-item {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            backdrop-filter: blur(10px);
        }

        .single-question, .group-question {
            background: white;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            border-left: 4px solid #007bff;
        }

        .group-question {
            border-left-color: #28a745;
        }

        .question-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .question-number {
            background: #007bff;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
        }

        .question-type-badge {
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .question-type-badge.single {
            background: #e3f2fd;
            color: #1976d2;
        }

        .question-type-badge.group {
            background: #e8f5e9;
            color: #388e3c;
        }

        .question-type-badge.fill_in_blank {
            background: #fff3e0;
            color: #f57c00;
        }

        .clo-badge {
            background: #f3e5f5;
            color: #7b1fa2;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }

        .question-range {
            background: #f5f5f5;
            color: #666;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
        }

        .parent-question {
            background: #f8f9fa;
            border: 2px dashed #28a745;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .parent-content {
            font-size: 16px;
            line-height: 1.7;
            color: #333;
        }

        .child-questions {
            margin-left: 20px;
        }

        .child-question {
            background: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            margin-left: 20px;
            position: relative;
        }

        .child-question::before {
            content: '';
            position: absolute;
            left: -20px;
            top: 20px;
            width: 15px;
            height: 2px;
            background: #28a745;
        }

        .question-content {
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 20px;
            color: #333;
        }

        .question-answers {
            display: grid;
            gap: 10px;
        }

        .answer-option {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 8px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            transition: all 0.2s ease;
        }

        .answer-option:hover {
            background: #e9ecef;
        }

        .answer-option.correct-answer {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            border-color: #28a745;
            box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
        }

        .answer-letter {
            background: #6c757d;
            color: white;
            padding: 4px 8px;
            border-radius: 50%;
            font-weight: 600;
            font-size: 12px;
            min-width: 24px;
            text-align: center;
            flex-shrink: 0;
        }

        .correct-answer .answer-letter {
            background: #28a745;
        }

        .answer-content {
            flex: 1;
            line-height: 1.5;
        }

        .fill-blank {
            display: inline-block;
            min-width: 100px;
            padding: 4px 8px;
            border-bottom: 3px solid #007bff;
            margin: 0 4px;
            text-align: center;
            font-weight: 600;
            color: #007bff;
            background: rgba(0, 123, 255, 0.1);
            border-radius: 4px 4px 0 0;
        }

        audio {
            width: 100%;
            max-width: 500px;
            margin: 15px 0;
            border-radius: 8px;
        }

        img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            margin: 15px 0;
        }

        .preview-errors, .preview-warnings {
            margin-top: 30px;
            padding: 20px;
            border-radius: 8px;
        }

        .preview-errors {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }

        .preview-warnings {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
        }

        .preview-errors h3, .preview-warnings h3 {
            margin-top: 0;
            font-size: 18px;
        }

        .error-item, .warning-item {
            margin: 8px 0;
            padding: 8px 0;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        .error-item:last-child, .warning-item:last-child {
            border-bottom: none;
        }

        @media (max-width: 768px) {
            .questions-preview-container {
                padding: 15px;
            }

            .preview-stats {
                flex-direction: column;
                gap: 10px;
            }

            .question-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }

            .child-questions {
                margin-left: 10px;
            }

            .child-question {
                margin-left: 10px;
            }
        }
        </style>
        `;
    }
}
