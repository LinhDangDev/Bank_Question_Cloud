/**
 * Media Markup Utility
 * Author: Linh Dang Dev
 * 
 * Utility functions to convert media markup [AUDIO: filename] and [IMAGE: filename]
 * to HTML <audio> and <img> tags with proper Digital Ocean Spaces URLs
 */

export class MediaMarkupUtil {
    // Digital Ocean Spaces endpoints
    private static readonly AUDIO_CDN_BASE = 'https://datauploads.sgp1.digitaloceanspaces.com/audio/';
    private static readonly IMAGE_CDN_BASE = 'https://datauploads.sgp1.digitaloceanspaces.com/images/';

    /**
     * Convert media markup to HTML tags
     * @param content Content with [AUDIO: filename] and [IMAGE: filename] markup
     * @returns Content with HTML <audio> and <img> tags
     */
    static convertMediaMarkupToHtml(content: string): string {
        if (!content) return content;

        let processedContent = content;

        // Convert [AUDIO: filename] to <audio> tags
        processedContent = processedContent.replace(
            /\[AUDIO:\s*([^\]]+)\]/gi,
            (match, filename) => {
                const cleanFilename = filename.trim();
                const audioUrl = this.buildAudioUrl(cleanFilename);
                return `<audio controls style="width: 100%; max-width: 400px; margin: 8px 0;">
                    <source src="${audioUrl}" type="audio/mpeg">
                    <source src="${audioUrl}" type="audio/wav">
                    <source src="${audioUrl}" type="audio/ogg">
                    Your browser does not support the audio element.
                    <a href="${audioUrl}" target="_blank">🔊 ${cleanFilename}</a>
                </audio>`;
            }
        );

        // Convert [IMAGE: filename] to <img> tags
        processedContent = processedContent.replace(
            /\[IMAGE:\s*([^\]]+)\]/gi,
            (match, filename) => {
                const cleanFilename = filename.trim();
                const imageUrl = this.buildImageUrl(cleanFilename);
                return `<img src="${imageUrl}" alt="${cleanFilename}" style="max-width: 100%; height: auto; margin: 8px 0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                <span style="display: none; color: #666; font-style: italic;">📷 ${cleanFilename}</span>`;
            }
        );

        return processedContent;
    }

    /**
     * Build audio URL from filename
     * @param filename Audio filename
     * @returns Full CDN URL for audio file
     */
    private static buildAudioUrl(filename: string): string {
        // Remove any path separators and clean filename
        const cleanFilename = filename.replace(/[\\\/]/g, '').trim();
        
        // Ensure proper file extension
        if (!this.hasAudioExtension(cleanFilename)) {
            // Try common audio extensions
            const extensions = ['.mp3', '.wav', '.ogg', '.m4a'];
            for (const ext of extensions) {
                // Return first extension - in practice, you might want to check which exists
                return this.AUDIO_CDN_BASE + cleanFilename + ext;
            }
        }
        
        return this.AUDIO_CDN_BASE + cleanFilename;
    }

    /**
     * Build image URL from filename
     * @param filename Image filename
     * @returns Full CDN URL for image file
     */
    private static buildImageUrl(filename: string): string {
        // Remove any path separators and clean filename
        const cleanFilename = filename.replace(/[\\\/]/g, '').trim();
        
        // Ensure proper file extension
        if (!this.hasImageExtension(cleanFilename)) {
            // Try common image extensions
            const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            for (const ext of extensions) {
                // Return first extension - in practice, you might want to check which exists
                return this.IMAGE_CDN_BASE + cleanFilename + ext;
            }
        }
        
        return this.IMAGE_CDN_BASE + cleanFilename;
    }

    /**
     * Check if filename has audio extension
     * @param filename Filename to check
     * @returns True if has audio extension
     */
    private static hasAudioExtension(filename: string): boolean {
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
        const lowerFilename = filename.toLowerCase();
        return audioExtensions.some(ext => lowerFilename.endsWith(ext));
    }

    /**
     * Check if filename has image extension
     * @param filename Filename to check
     * @returns True if has image extension
     */
    private static hasImageExtension(filename: string): boolean {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
        const lowerFilename = filename.toLowerCase();
        return imageExtensions.some(ext => lowerFilename.endsWith(ext));
    }

    /**
     * Extract media filenames from content
     * @param content Content to analyze
     * @returns Object with arrays of audio and image filenames
     */
    static extractMediaFilenames(content: string): { audioFiles: string[], imageFiles: string[] } {
        if (!content) return { audioFiles: [], imageFiles: [] };

        const audioFiles: string[] = [];
        const imageFiles: string[] = [];

        // Extract audio filenames
        const audioMatches = content.match(/\[AUDIO:\s*([^\]]+)\]/gi);
        if (audioMatches) {
            audioMatches.forEach(match => {
                const filename = match.replace(/\[AUDIO:\s*|\]/gi, '').trim();
                if (filename && !audioFiles.includes(filename)) {
                    audioFiles.push(filename);
                }
            });
        }

        // Extract image filenames
        const imageMatches = content.match(/\[IMAGE:\s*([^\]]+)\]/gi);
        if (imageMatches) {
            imageMatches.forEach(match => {
                const filename = match.replace(/\[IMAGE:\s*|\]/gi, '').trim();
                if (filename && !imageFiles.includes(filename)) {
                    imageFiles.push(filename);
                }
            });
        }

        return { audioFiles, imageFiles };
    }

    /**
     * Check if content has media markup
     * @param content Content to check
     * @returns True if content contains media markup
     */
    static hasMediaMarkup(content: string): boolean {
        if (!content) return false;
        return /\[(AUDIO|IMAGE):\s*[^\]]+\]/i.test(content);
    }

    /**
     * Convert media markup for DOCX/PDF generation (simplified version)
     * @param content Content with media markup
     * @returns Content with simplified media references for document generation
     */
    static convertMediaMarkupForDocument(content: string): string {
        if (!content) return content;

        let processedContent = content;

        // Convert [AUDIO: filename] to text reference for documents
        processedContent = processedContent.replace(
            /\[AUDIO:\s*([^\]]+)\]/gi,
            (match, filename) => {
                const cleanFilename = filename.trim();
                return `🔊 Audio: ${cleanFilename}`;
            }
        );

        // Convert [IMAGE: filename] to text reference for documents
        processedContent = processedContent.replace(
            /\[IMAGE:\s*([^\]]+)\]/gi,
            (match, filename) => {
                const cleanFilename = filename.trim();
                return `📷 Image: ${cleanFilename}`;
            }
        );

        return processedContent;
    }

    /**
     * Get media statistics from content
     * @param content Content to analyze
     * @returns Statistics about media usage
     */
    static getMediaStatistics(content: string): {
        hasMedia: boolean;
        audioCount: number;
        imageCount: number;
        totalMediaFiles: number;
        mediaFiles: { audioFiles: string[], imageFiles: string[] };
    } {
        const mediaFiles = this.extractMediaFilenames(content);
        const audioCount = mediaFiles.audioFiles.length;
        const imageCount = mediaFiles.imageFiles.length;
        const totalMediaFiles = audioCount + imageCount;

        return {
            hasMedia: totalMediaFiles > 0,
            audioCount,
            imageCount,
            totalMediaFiles,
            mediaFiles
        };
    }
}
