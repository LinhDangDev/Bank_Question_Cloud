import JSZip from 'jszip';
// Note: RAR support will be handled by backend, not frontend

export interface MediaFile {
    name: string;
    type: 'audio' | 'image' | 'document';
    url: string;
    size: number;
    mimeType: string;
    path: string;
}

export interface ArchivePreviewResult {
    wordDocument: MediaFile | null;
    audioFiles: MediaFile[];
    imageFiles: MediaFile[];
    allMediaFiles: MediaFile[];
    structure: {
        hasWordDocument: boolean;
        hasAudioFolder: boolean;
        hasImageFolder: boolean;
        totalFiles: number;
        archiveType: 'zip' | 'rar';
    };
    errors: string[];
}

// Keep backward compatibility
export type ZipPreviewResult = ArchivePreviewResult;

class ArchivePreviewService {
    private getMimeType(fileName: string): string {
        const extension = fileName.toLowerCase().split('.').pop();

        const mimeTypes: Record<string, string> = {
            // Audio
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'm4a': 'audio/m4a',
            'ogg': 'audio/ogg',
            'aac': 'audio/aac',

            // Images
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',

            // Documents
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc': 'application/msword',
            'pdf': 'application/pdf'
        };

        return mimeTypes[extension || ''] || 'application/octet-stream';
    }

    private getFileType(fileName: string): 'audio' | 'image' | 'document' | 'unknown' {
        const extension = fileName.toLowerCase().split('.').pop();

        const audioExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'aac'];
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        const documentExtensions = ['docx', 'doc', 'pdf'];

        if (audioExtensions.includes(extension || '')) return 'audio';
        if (imageExtensions.includes(extension || '')) return 'image';
        if (documentExtensions.includes(extension || '')) return 'document';

        return 'unknown';
    }

    private createObjectURL(data: Uint8Array, mimeType: string): string {
        const blob = new Blob([data], { type: mimeType });
        return URL.createObjectURL(blob);
    }

    private detectArchiveType(file: File): 'zip' | 'rar' | 'unknown' {
        const extension = file.name.toLowerCase().split('.').pop();
        if (extension === 'zip') return 'zip';
        if (extension === 'rar') return 'rar';
        return 'unknown';
    }

    private async extractRarFile(file: File, tempDir: string): Promise<{ files: any[], archiveType: 'rar' }> {
        // RAR extraction is handled by backend, not frontend
        throw new Error('RAR files must be processed by the backend. Please upload the RAR file directly to the server.');
    }

    async previewArchiveFile(file: File): Promise<ArchivePreviewResult> {
        const archiveType = this.detectArchiveType(file);

        if (archiveType === 'unknown') {
            throw new Error('Định dạng file không được hỗ trợ. Chỉ chấp nhận file .zip và .rar');
        }

        const result: ArchivePreviewResult = {
            wordDocument: null,
            audioFiles: [],
            imageFiles: [],
            allMediaFiles: [],
            structure: {
                hasWordDocument: false,
                hasAudioFolder: false,
                hasImageFolder: false,
                totalFiles: 0,
                archiveType
            },
            errors: []
        };

        try {
            let files: string[] = [];
            let fileEntries: any = {};

            if (archiveType === 'zip') {
                const zip = await JSZip.loadAsync(file);
                files = Object.keys(zip.files);
                fileEntries = zip.files;
            } else if (archiveType === 'rar') {
                // RAR files should be handled by backend
                throw new Error('RAR files are not supported for preview in browser. Please upload directly to server for processing.');
            }

            result.structure.totalFiles = files.length;

            // Check structure
            result.structure.hasAudioFolder = files.some(path => path.toLowerCase().includes('audio/'));
            result.structure.hasImageFolder = files.some(path => path.toLowerCase().includes('image'));
            result.structure.hasWordDocument = files.some(path =>
                path.toLowerCase().endsWith('.docx') || path.toLowerCase().endsWith('.doc')
            );

            // Process each file
            for (const relativePath of files) {
                const fileEntry = fileEntries[relativePath];

                // Skip directories
                if (fileEntry.dir) continue;

                const fileName = relativePath.split('/').pop() || '';
                const fileType = this.getFileType(fileName);

                // Skip unknown file types and system files
                if (fileType === 'unknown' || fileName.startsWith('.') || fileName.startsWith('__MACOSX')) {
                    continue;
                }

                try {
                    const data = await fileEntry.async('uint8array');
                    const mimeType = this.getMimeType(fileName);
                    const url = this.createObjectURL(data, mimeType);

                    const mediaFile: MediaFile = {
                        name: fileName,
                        type: fileType,
                        url,
                        size: data.length,
                        mimeType,
                        path: relativePath
                    };

                    // Categorize files
                    if (fileType === 'document') {
                        if (!result.wordDocument) {
                            result.wordDocument = mediaFile;
                        }
                    } else if (fileType === 'audio') {
                        result.audioFiles.push(mediaFile);
                    } else if (fileType === 'image') {
                        result.imageFiles.push(mediaFile);
                    }

                    result.allMediaFiles.push(mediaFile);

                } catch (error) {
                    result.errors.push(`Không thể đọc file ${fileName}: ${error}`);
                }
            }

            // Validation
            if (!result.wordDocument) {
                result.errors.push('Không tìm thấy file Word (.docx) trong gói đề thi');
            }

            if (result.audioFiles.length === 0 && result.imageFiles.length === 0) {
                result.errors.push('Không tìm thấy file media nào (audio/image) trong gói đề thi');
            }

        } catch (error) {
            result.errors.push(`Lỗi đọc file ZIP: ${error}`);
        }

        return result;
    }

    // Backward compatibility method
    async previewZipFile(file: File): Promise<ZipPreviewResult> {
        return this.previewArchiveFile(file);
    }

    // Clean up object URLs to prevent memory leaks
    cleanupPreview(result: ArchivePreviewResult): void {
        const allFiles = [
            ...(result.wordDocument ? [result.wordDocument] : []),
            ...result.audioFiles,
            ...result.imageFiles
        ];

        allFiles.forEach(file => {
            if (file.url.startsWith('blob:')) {
                URL.revokeObjectURL(file.url);
            }
        });
    }

    // Validate media references in Word document
    async validateMediaReferences(wordContent: string, mediaFiles: MediaFile[]): Promise<{
        validReferences: string[];
        missingReferences: string[];
        unusedFiles: MediaFile[];
    }> {
        const result = {
            validReferences: [] as string[],
            missingReferences: [] as string[],
            unusedFiles: [...mediaFiles]
        };

        // Extract media references from Word content
        const audioReferences = wordContent.match(/\[AUDIO:\s*([^\]]+)\]/gi) || [];
        const imageReferences = wordContent.match(/\[IMAGE:\s*([^\]]+)\]/gi) || [];

        const allReferences = [
            ...audioReferences.map(ref => ref.replace(/\[AUDIO:\s*([^\]]+)\]/i, '$1').trim()),
            ...imageReferences.map(ref => ref.replace(/\[IMAGE:\s*([^\]]+)\]/i, '$1').trim())
        ];

        // Check each reference
        allReferences.forEach(refFileName => {
            const matchingFile = mediaFiles.find(file =>
                file.name === refFileName ||
                file.path.endsWith(refFileName)
            );

            if (matchingFile) {
                result.validReferences.push(refFileName);
                // Remove from unused files
                const index = result.unusedFiles.findIndex(f => f.name === matchingFile.name);
                if (index > -1) {
                    result.unusedFiles.splice(index, 1);
                }
            } else {
                result.missingReferences.push(refFileName);
            }
        });

        return result;
    }

    // Get file statistics
    getStatistics(result: ArchivePreviewResult): {
        totalFiles: number;
        audioCount: number;
        imageCount: number;
        totalSize: string;
        averageFileSize: string;
    } {
        const totalSize = result.allMediaFiles.reduce((sum, file) => sum + file.size, 0);
        const averageSize = result.allMediaFiles.length > 0 ? totalSize / result.allMediaFiles.length : 0;

        return {
            totalFiles: result.allMediaFiles.length,
            audioCount: result.audioFiles.length,
            imageCount: result.imageFiles.length,
            totalSize: this.formatFileSize(totalSize),
            averageFileSize: this.formatFileSize(averageSize)
        };
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export const archivePreviewService = new ArchivePreviewService();
// Backward compatibility
export const zipPreviewService = archivePreviewService;
