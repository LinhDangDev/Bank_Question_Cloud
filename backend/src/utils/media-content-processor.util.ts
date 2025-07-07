/**
 * Media Content Processor for Backend
 * Author: Linh Dang Dev
 * 
 * Utility to handle both existing HTML media tags and new markup format
 * Ensures backward compatibility with existing database content
 */

export class MediaContentProcessor {
    // Digital Ocean Spaces endpoints
    private static readonly AUDIO_CDN_BASE = 'https://datauploads.sgp1.digitaloceanspaces.com/audio/';
    private static readonly IMAGE_CDN_BASE = 'https://datauploads.sgp1.digitaloceanspaces.com/images/';

    /**
     * Check if content contains HTML media tags (existing format)
     * @param content Content to check
     * @returns True if content contains HTML media tags
     */
    static hasHtmlMediaTags(content: string): boolean {
        if (!content) return false;
        
        // Check for audio tags
        const hasAudioTags = /<audio[^>]*src\s*=\s*["'][^"']*["'][^>]*>/i.test(content);
        
        // Check for img tags with CDN URLs
        const hasImageTags = /<img[^>]*src\s*=\s*["']https:\/\/datauploads\.sgp1\.[^"']*["'][^>]*>/i.test(content);
        
        return hasAudioTags || hasImageTags;
    }

    /**
     * Check if content contains media markup format [AUDIO: filename] or [IMAGE: filename]
     * @param content Content to check
     * @returns True if content contains media markup
     */
    static hasMediaMarkupFormat(content: string): boolean {
        if (!content) return false;
        return /\[(AUDIO|IMAGE):\s*[^\]]+\]/i.test(content);
    }

    /**
     * Detect the media format type in content
     * @param content Content to analyze
     * @returns Object indicating which formats are present
     */
    static detectMediaFormat(content: string): {
        hasHtmlTags: boolean;
        hasMarkup: boolean;
        formatType: 'html' | 'markup' | 'mixed' | 'none';
    } {
        const hasHtmlTags = this.hasHtmlMediaTags(content);
        const hasMarkup = this.hasMediaMarkupFormat(content);
        
        let formatType: 'html' | 'markup' | 'mixed' | 'none';
        
        if (hasHtmlTags && hasMarkup) {
            formatType = 'mixed';
        } else if (hasHtmlTags) {
            formatType = 'html';
        } else if (hasMarkup) {
            formatType = 'markup';
        } else {
            formatType = 'none';
        }
        
        return {
            hasHtmlTags,
            hasMarkup,
            formatType
        };
    }

    /**
     * Process media content for document generation (DOCX/PDF)
     * Handles both HTML tags and markup format
     * @param content Content to process
     * @returns Content with simplified media references for documents
     */
    static processMediaContentForDocument(content: string): string {
        if (!content) return content;

        let processedContent = content;
        const mediaFormat = this.detectMediaFormat(content);

        // Handle existing HTML audio tags
        processedContent = processedContent.replace(
            /<audio[^>]*src\s*=\s*["']([^"']*)["'][^>]*>.*?<\/audio>/gi,
            (match, src) => {
                const filename = src.split('/').pop() || 'audio file';
                return `🔊 Audio: ${filename}`;
            }
        );

        // Handle existing HTML img tags
        processedContent = processedContent.replace(
            /<img[^>]*src\s*=\s*["']([^"']*)["'][^>]*>/gi,
            (match, src) => {
                const filename = src.split('/').pop() || 'image file';
                return `📷 Image: ${filename}`;
            }
        );

        // Handle markup format
        processedContent = processedContent.replace(
            /\[AUDIO:\s*([^\]]+)\]/gi,
            (match, filename) => {
                const cleanFilename = filename.trim();
                return `🔊 Audio: ${cleanFilename}`;
            }
        );

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
     * Process media content for web display
     * Converts both HTML tags and markup to proper HTML
     * @param content Content to process
     * @returns Content with proper HTML media tags
     */
    static processMediaContentForWeb(content: string): string {
        if (!content) return content;

        const mediaFormat = this.detectMediaFormat(content);
        
        switch (mediaFormat.formatType) {
            case 'html':
                // Content already has HTML tags, return as-is
                return content;
                
            case 'markup':
                // Convert markup to HTML
                return this.convertMarkupToHtml(content);
                
            case 'mixed':
                // Handle mixed format - convert markup but preserve existing HTML
                return this.convertMarkupToHtml(content);
                
            case 'none':
            default:
                // No media content, return as-is
                return content;
        }
    }

    /**
     * Convert markup format to HTML tags
     * @param content Content with markup
     * @returns Content with HTML tags
     */
    private static convertMarkupToHtml(content: string): string {
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
        const cleanFilename = filename.replace(/[\\\/]/g, '').trim();
        
        if (!this.hasAudioExtension(cleanFilename)) {
            const extensions = ['.mp3', '.wav', '.ogg', '.m4a'];
            for (const ext of extensions) {
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
        const cleanFilename = filename.replace(/[\\\/]/g, '').trim();
        
        if (!this.hasImageExtension(cleanFilename)) {
            const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            for (const ext of extensions) {
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
     * Extract all media information from content
     * @param content Content to analyze
     * @returns Object with media information
     */
    static extractMediaInfo(content: string): {
        audioFiles: string[];
        imageFiles: string[];
        totalMediaCount: number;
        formatType: 'html' | 'markup' | 'mixed' | 'none';
    } {
        if (!content) {
            return {
                audioFiles: [],
                imageFiles: [],
                totalMediaCount: 0,
                formatType: 'none'
            };
        }

        const audioFiles: string[] = [];
        const imageFiles: string[] = [];
        const mediaFormat = this.detectMediaFormat(content);

        // Extract from markup format
        const audioMarkupMatches = content.match(/\[AUDIO:\s*([^\]]+)\]/gi);
        if (audioMarkupMatches) {
            audioMarkupMatches.forEach(match => {
                const filename = match.replace(/\[AUDIO:\s*|\]/gi, '').trim();
                if (filename && !audioFiles.includes(filename)) {
                    audioFiles.push(filename);
                }
            });
        }

        const imageMarkupMatches = content.match(/\[IMAGE:\s*([^\]]+)\]/gi);
        if (imageMarkupMatches) {
            imageMarkupMatches.forEach(match => {
                const filename = match.replace(/\[IMAGE:\s*|\]/gi, '').trim();
                if (filename && !imageFiles.includes(filename)) {
                    imageFiles.push(filename);
                }
            });
        }

        // Extract from HTML tags
        const audioTagMatches = content.match(/<audio[^>]*src\s*=\s*["']([^"']*)["'][^>]*>/gi);
        if (audioTagMatches) {
            audioTagMatches.forEach(tag => {
                const srcMatch = tag.match(/src\s*=\s*["']([^"']*)["']/i);
                if (srcMatch && srcMatch[1]) {
                    const url = srcMatch[1];
                    const filename = url.split('/').pop() || '';
                    if (filename && !audioFiles.includes(filename)) {
                        audioFiles.push(filename);
                    }
                }
            });
        }

        const imageTagMatches = content.match(/<img[^>]*src\s*=\s*["']([^"']*)["'][^>]*>/gi);
        if (imageTagMatches) {
            imageTagMatches.forEach(tag => {
                const srcMatch = tag.match(/src\s*=\s*["']([^"']*)["']/i);
                if (srcMatch && srcMatch[1]) {
                    const url = srcMatch[1];
                    const filename = url.split('/').pop() || '';
                    if (filename && !imageFiles.includes(filename)) {
                        imageFiles.push(filename);
                    }
                }
            });
        }

        const totalMediaCount = audioFiles.length + imageFiles.length;

        return {
            audioFiles,
            imageFiles,
            totalMediaCount,
            formatType: mediaFormat.formatType
        };
    }
}
