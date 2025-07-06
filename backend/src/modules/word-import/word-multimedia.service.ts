import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Files } from '../../entities/files.entity';
import { SpacesService } from '../../services/spaces.service';
import * as AdmZip from 'adm-zip';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ExtractedMedia {
    fileName: string;
    originalName: string;
    buffer: Buffer;
    mimeType: string;
    fileType: number; // 1=audio, 2=image, 3=document, 4=video
    spacesKey?: string;
    uploadedUrl?: string;
}

export interface WordImportResult {
    extractedMedia: ExtractedMedia[];
    uploadedFiles: Files[];
    totalFiles: number;
    successCount: number;
    errors: string[];
}

@Injectable()
export class WordMultimediaService {
    constructor(
        @InjectRepository(Files)
        private readonly filesRepository: Repository<Files>,
        private readonly spacesService: SpacesService,
    ) { }

    /**
     * Extract multimedia từ Word file (.docx)
     */
    async extractMultimediaFromWord(wordBuffer: Buffer): Promise<ExtractedMedia[]> {
        const extractedMedia: ExtractedMedia[] = [];

        try {
            // Word file là zip archive
            const zip = new AdmZip(wordBuffer);
            const entries = zip.getEntries();

            for (const entry of entries) {
                // Check media folders trong Word structure
                if (this.isMediaFile(entry.entryName)) {
                    const buffer = entry.getData();
                    const fileName = path.basename(entry.entryName);
                    const ext = path.extname(fileName).toLowerCase();

                    const media: ExtractedMedia = {
                        fileName: this.generateUniqueFileName(fileName),
                        originalName: fileName,
                        buffer,
                        mimeType: this.getMimeType(ext),
                        fileType: this.getFileType(ext)
                    };

                    extractedMedia.push(media);
                }
            }

            return extractedMedia;

        } catch (error) {
            throw new BadRequestException(`Failed to extract media from Word file: ${error.message}`);
        }
    }

    /**
     * Upload extracted media lên DigitalOcean Spaces
     */
    async uploadExtractedMedia(extractedMedia: ExtractedMedia[]): Promise<ExtractedMedia[]> {
        const uploadedMedia: ExtractedMedia[] = [];

        for (const media of extractedMedia) {
            try {
                // Build spaces key
                const folder = this.getFolderByType(media.fileType);
                const spacesKey = `${folder}/${media.fileName}`;

                // Upload to Spaces
                const uploadResult = await this.spacesService.uploadFile(
                    media.buffer,
                    spacesKey,
                    media.mimeType,
                    true // public
                );

                media.spacesKey = spacesKey;
                media.uploadedUrl = uploadResult.Location || `https://datauploads.sgp1.cdn.digitaloceanspaces.com/${spacesKey}`;
                uploadedMedia.push(media);

            } catch (error) {
                console.error(`Failed to upload ${media.fileName}:`, error);
                // Continue với files khác
            }
        }

        return uploadedMedia;
    }

    /**
     * Save uploaded files vào database
     */
    async saveFilesToDatabase(
        uploadedMedia: ExtractedMedia[],
        maCauHoi?: string,
        maCauTraLoi?: string
    ): Promise<Files[]> {
        const savedFiles: Files[] = [];

        for (const media of uploadedMedia) {
            try {
                const fileData = {
                    MaCauHoi: maCauHoi || undefined,
                    MaCauTraLoi: maCauTraLoi || undefined,
                    TenFile: media.fileName,
                    LoaiFile: media.fileType
                };

                const file = this.filesRepository.create(fileData);
                const savedFile = await this.filesRepository.save(file);
                savedFiles.push(savedFile);

            } catch (error) {
                console.error(`Failed to save file ${media.fileName} to database:`, error);
            }
        }

        return savedFiles;
    }

    /**
     * Complete workflow: Extract → Upload → Save
     */
    async processWordWithMultimedia(
        wordBuffer: Buffer,
        maCauHoi?: string,
        maCauTraLoi?: string
    ): Promise<WordImportResult> {
        const errors: string[] = [];

        try {
            // Step 1: Extract media
            const extractedMedia = await this.extractMultimediaFromWord(wordBuffer);

            if (extractedMedia.length === 0) {
                return {
                    extractedMedia: [],
                    uploadedFiles: [],
                    totalFiles: 0,
                    successCount: 0,
                    errors: ['No multimedia files found in Word document']
                };
            }

            // Step 2: Upload to Spaces
            const uploadedMedia = await this.uploadExtractedMedia(extractedMedia);

            if (uploadedMedia.length === 0) {
                errors.push('Failed to upload any files to Spaces');
            }

            // Step 3: Save to database
            const savedFiles = await this.saveFilesToDatabase(uploadedMedia, maCauHoi, maCauTraLoi);

            return {
                extractedMedia,
                uploadedFiles: savedFiles,
                totalFiles: extractedMedia.length,
                successCount: savedFiles.length,
                errors
            };

        } catch (error) {
            throw new BadRequestException(`Word multimedia processing failed: ${error.message}`);
        }
    }

    /**
     * Check if file path is media file trong Word structure
     */
    private isMediaFile(entryName: string): boolean {
        // Word media files thường ở: word/media/, word/embeddings/
        const mediaFolders = ['word/media/', 'word/embeddings/'];
        const isInMediaFolder = mediaFolders.some(folder => entryName.startsWith(folder));

        if (!isInMediaFolder) return false;

        // Check file extensions
        const ext = path.extname(entryName).toLowerCase();
        const mediaExtensions = [
            '.mp3', '.wav', '.m4a', '.ogg', // Audio
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', // Images
            '.mp4', '.avi', '.mov', '.wmv', // Video
            '.pdf', '.doc', '.docx' // Documents
        ];

        return mediaExtensions.includes(ext);
    }

    /**
     * Generate unique filename
     */
    private generateUniqueFileName(originalName: string): string {
        const ext = path.extname(originalName);
        const baseName = path.basename(originalName, ext);
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);

        return `${baseName}_${timestamp}_${random}${ext}`;
    }

    /**
     * Get MIME type từ extension
     */
    private getMimeType(ext: string): string {
        const mimeTypes: Record<string, string> = {
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.m4a': 'audio/mp4',
            '.ogg': 'audio/ogg',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.webp': 'image/webp',
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        return mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * Get file type number từ extension
     */
    private getFileType(ext: string): number {
        const audioExts = ['.mp3', '.wav', '.m4a', '.ogg'];
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const videoExts = ['.mp4', '.avi', '.mov', '.wmv'];
        const docExts = ['.pdf', '.doc', '.docx'];

        if (audioExts.includes(ext)) return 1; // Audio
        if (imageExts.includes(ext)) return 2; // Image
        if (docExts.includes(ext)) return 3;   // Document
        if (videoExts.includes(ext)) return 4; // Video

        return 0; // Other
    }

    /**
     * Get folder name theo file type
     */
    private getFolderByType(fileType: number): string {
        switch (fileType) {
            case 1: return 'audio';
            case 2: return 'images';
            case 3: return 'documents';
            case 4: return 'videos';
            default: return 'files';
        }
    }

    /**
     * Download audio từ URL và lưu vào Spaces
     */
    async downloadAndSaveAudio(
        audioUrl: string,
        fileName: string,
        maCauHoi?: string,
        maCauTraLoi?: string
    ): Promise<Files> {
        try {
            // Download file từ URL
            const response = await fetch(audioUrl);

            if (!response.ok) {
                throw new BadRequestException(`Failed to download from URL: ${response.status} ${response.statusText}`);
            }

            // Get content type
            const contentType = response.headers.get('content-type') || 'audio/mpeg';

            // Convert to Buffer
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Get file extension
            const ext = path.extname(fileName).toLowerCase() || '.mp3';

            // Create unique filename if none provided
            const finalFileName = fileName.includes('.') ? fileName : `${fileName}${ext}`;

            // Upload to Spaces
            const folder = this.getFolderByType(1); // 1 = Audio
            const spacesKey = `${folder}/${finalFileName}`;

            const uploadResult = await this.spacesService.uploadFile(
                buffer,
                spacesKey,
                contentType,
                true // public
            );

            // Save file to database
            const fileData = {
                MaCauHoi: maCauHoi || undefined,
                MaCauTraLoi: maCauTraLoi || undefined,
                TenFile: finalFileName,
                LoaiFile: 1 // Audio
            };

            const file = this.filesRepository.create(fileData);
            const savedFile = await this.filesRepository.save(file);

            return savedFile;

        } catch (error) {
            console.error('Failed to download and save audio:', error);
            throw new BadRequestException(`Failed to process audio: ${error.message}`);
        }
    }
}
