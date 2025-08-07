export enum FileType {
    OTHER = 0,
    AUDIO = 1,
    IMAGE = 2,
    DOCUMENT = 3,
    VIDEO = 4
}

export const FileTypeLabels = {
    [FileType.OTHER]: 'Other',
    [FileType.AUDIO]: 'Audio',
    [FileType.IMAGE]: 'Image',
    [FileType.DOCUMENT]: 'Document',
    [FileType.VIDEO]: 'Video'
};

export const AudioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'];
export const ImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
export const DocumentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
export const VideoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.mkv', '.webm'];

export function getFileTypeFromExtension(extension: string): FileType {
    const ext = extension.toLowerCase();
    
    if (AudioExtensions.includes(ext)) {
        return FileType.AUDIO;
    }
    
    if (ImageExtensions.includes(ext)) {
        return FileType.IMAGE;
    }
    
    if (DocumentExtensions.includes(ext)) {
        return FileType.DOCUMENT;
    }
    
    if (VideoExtensions.includes(ext)) {
        return FileType.VIDEO;
    }
    
    return FileType.OTHER;
}

export function getFileTypeFromMimeType(mimeType: string): FileType {
    if (mimeType.startsWith('audio/')) {
        return FileType.AUDIO;
    }
    
    if (mimeType.startsWith('image/')) {
        return FileType.IMAGE;
    }
    
    if (mimeType.startsWith('video/')) {
        return FileType.VIDEO;
    }
    
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) {
        return FileType.DOCUMENT;
    }
    
    return FileType.OTHER;
}

export function getFolderByFileType(fileType: FileType): string {
    switch (fileType) {
        case FileType.AUDIO:
            return 'audio';
        case FileType.IMAGE:
            return 'images';
        case FileType.DOCUMENT:
            return 'documents';
        case FileType.VIDEO:
            return 'videos';
        default:
            return 'files';
    }
}
