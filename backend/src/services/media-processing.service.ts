import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import * as sharp from 'sharp';
import * as mime from 'mime-types';
import {
    ExtractedMediaFile,
    MediaFileType,
    MediaProcessingOptions
} from '../interfaces/exam-package.interface';

@Injectable()
export class MediaProcessingService {
    private readonly logger = new Logger(MediaProcessingService.name);

    private readonly defaultOptions: MediaProcessingOptions = {
        convertImagesToWebP: true,
        webpQuality: 85,
        maxImageWidth: 1200,
        maxImageHeight: 800,
        audioFormats: ['.mp3', '.wav', '.m4a', '.ogg'],
        imageFormats: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    };

    constructor(private readonly spacesService: SpacesService) { }

    async processMediaFiles(
        mediaFiles: ExtractedMediaFile[],
        options: Partial<MediaProcessingOptions> = {}
    ): Promise<ExtractedMediaFile[]> {
        const processingOptions = { ...this.defaultOptions, ...options };
        const processedFiles: ExtractedMediaFile[] = [];

        for (const mediaFile of mediaFiles) {
            try {
                let processedFile: ExtractedMediaFile;

                if (mediaFile.fileType === MediaFileType.IMAGE) {
                    processedFile = await this.processImageFile(mediaFile, processingOptions);
                } else if (mediaFile.fileType === MediaFileType.AUDIO) {
                    processedFile = await this.processAudioFile(mediaFile, processingOptions);
                } else {
                    this.logger.warn(`Unsupported media file type: ${mediaFile.fileType}`);
                    continue;
                }

                processedFiles.push(processedFile);
                this.logger.log(`Successfully processed: ${mediaFile.fileName}`);

            } catch (error) {
                this.logger.error(`Failed to process ${mediaFile.fileName}: ${error.message}`);
                throw new BadRequestException(`Failed to process media file ${mediaFile.fileName}: ${error.message}`);
            }
        }

        return processedFiles;
    }

    private async processImageFile(
        imageFile: ExtractedMediaFile,
        options: MediaProcessingOptions
    ): Promise<ExtractedMediaFile> {
        const fileData = imageFile.data || imageFile.buffer;
        let processedBuffer = fileData;
        let processedMimeType = imageFile.mimeType;
        let fileName = imageFile.name || imageFile.fileName;

        if (!fileName || !fileData) {
            throw new Error('Invalid image file: missing fileName or data');
        }

        if (options.convertImagesToWebP && !fileName.endsWith('.webp')) {
            try {
                processedBuffer = await sharp(fileData)
                    .resize(options.maxImageWidth, options.maxImageHeight, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .webp({ quality: options.webpQuality })
                    .toBuffer();

                processedMimeType = 'image/webp';
                fileName = fileName.replace(/\.[^/.]+$/, '.webp');

                this.logger.log(`Converted ${fileName} to WebP format`);
            } catch (error) {
                this.logger.warn(`Failed to convert ${fileName} to WebP, using original: ${error.message}`);
                processedBuffer = fileData;
                processedMimeType = imageFile.mimeType;
            }
        }

        if (!processedBuffer || !processedMimeType) {
            throw new Error('Failed to process image file');
        }

        const spacesKey = this.generateSpacesKey(fileName, 'images');
        const uploadResult = await this.spacesService.uploadFile(
            processedBuffer,
            spacesKey,
            processedMimeType,
            true
        );

        const uploadedUrl = await this.spacesService.getFileUrl(spacesKey);

        return {
            ...imageFile,
            name: fileName,
            fileName, // Backward compatibility
            convertedBuffer: processedBuffer,
            convertedMimeType: processedMimeType,
            spacesKey,
            uploadedUrl
        };
    }

    private async processAudioFile(
        audioFile: ExtractedMediaFile,
        options: MediaProcessingOptions
    ): Promise<ExtractedMediaFile> {
        const fileName = audioFile.name || audioFile.fileName;
        const fileData = audioFile.data || audioFile.buffer;
        const mimeType = audioFile.mimeType;

        if (!fileName || !fileData || !mimeType) {
            throw new Error('Invalid audio file: missing fileName, data, or mimeType');
        }

        const spacesKey = this.generateSpacesKey(fileName, 'audio');

        const uploadResult = await this.spacesService.uploadFile(
            fileData,
            spacesKey,
            mimeType,
            true
        );

        const uploadedUrl = await this.spacesService.getFileUrl(spacesKey);

        return {
            ...audioFile,
            name: fileName,
            fileName, // Backward compatibility
            spacesKey,
            uploadedUrl
        };
    }

    private generateSpacesKey(fileName: string, folder: 'audio' | 'images'): string {
        const timestamp = Date.now();
        const extension = fileName.split('.').pop();
        const baseName = fileName.replace(/\.[^/.]+$/, '');

        return `${folder}/${timestamp}_${baseName}.${extension}`;
    }

    classifyMediaFile(fileName: string, mimeType: string): MediaFileType | null {
        const extension = fileName.toLowerCase().split('.').pop();

        if (mimeType.startsWith('audio/') || this.defaultOptions.audioFormats.includes(`.${extension}`)) {
            return MediaFileType.AUDIO;
        }

        if (mimeType.startsWith('image/') || this.defaultOptions.imageFormats.includes(`.${extension}`)) {
            return MediaFileType.IMAGE;
        }

        return null;
    }

    validateMediaFile(fileName: string, buffer: Buffer, maxSize: number = 10 * 1024 * 1024): boolean {
        if (buffer.length > maxSize) {
            throw new BadRequestException(`File ${fileName} exceeds maximum size of ${maxSize} bytes`);
        }

        const mimeType = mime.lookup(fileName);
        if (!mimeType) {
            throw new BadRequestException(`Unable to determine MIME type for file: ${fileName}`);
        }

        const fileType = this.classifyMediaFile(fileName, mimeType);
        if (!fileType) {
            throw new BadRequestException(`Unsupported file type: ${fileName}`);
        }

        return true;
    }

    async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
        try {
            const metadata = await sharp(buffer).metadata();
            return {
                width: metadata.width || 0,
                height: metadata.height || 0
            };
        } catch (error) {
            this.logger.warn(`Failed to get image dimensions: ${error.message}`);
            return { width: 0, height: 0 };
        }
    }

    generateMediaUrl(fileName: string, fileType: MediaFileType): string {
        const folder = fileType === MediaFileType.AUDIO ? 'audio' : 'images';
        return `https://datauploads.sgp1.digitaloceanspaces.com/${folder}/${fileName}`;
    }
}
