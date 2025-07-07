/**
 * Media Content Processor
 * Author: Linh Dang Dev
 * 
 * Utility to handle both existing HTML media tags and new markup format
 * Ensures backward compatibility with existing database content
 */

import { convertMediaMarkupToHtml, hasMediaMarkup } from './mediaMarkup';

/**
 * Check if content contains HTML media tags (existing format)
 * @param content Content to check
 * @returns True if content contains HTML media tags
 */
export const hasHtmlMediaTags = (content: string): boolean => {
    if (!content) return false;
    
    // Check for audio tags
    const hasAudioTags = /<audio[^>]*src\s*=\s*["'][^"']*["'][^>]*>/i.test(content);
    
    // Check for img tags with CDN URLs
    const hasImageTags = /<img[^>]*src\s*=\s*["']https:\/\/datauploads\.sgp1\.[^"']*["'][^>]*>/i.test(content);
    
    return hasAudioTags || hasImageTags;
};

/**
 * Check if content contains media markup format [AUDIO: filename] or [IMAGE: filename]
 * @param content Content to check
 * @returns True if content contains media markup
 */
export const hasMediaMarkupFormat = (content: string): boolean => {
    return hasMediaMarkup(content);
};

/**
 * Detect the media format type in content
 * @param content Content to analyze
 * @returns Object indicating which formats are present
 */
export const detectMediaFormat = (content: string): {
    hasHtmlTags: boolean;
    hasMarkup: boolean;
    formatType: 'html' | 'markup' | 'mixed' | 'none';
} => {
    const hasHtmlTags = hasHtmlMediaTags(content);
    const hasMarkup = hasMediaMarkupFormat(content);
    
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
};

/**
 * Process media content regardless of format
 * Handles both existing HTML tags and new markup format
 * @param content Content to process
 * @returns Processed content with proper HTML media tags
 */
export const processMediaContent = (content: string): string => {
    if (!content) return content;
    
    const mediaFormat = detectMediaFormat(content);
    
    switch (mediaFormat.formatType) {
        case 'html':
            // Content already has HTML tags, return as-is
            return content;
            
        case 'markup':
            // Convert markup to HTML
            return convertMediaMarkupToHtml(content);
            
        case 'mixed':
            // Handle mixed format - convert markup but preserve existing HTML
            return convertMediaMarkupToHtml(content);
            
        case 'none':
        default:
            // No media content, return as-is
            return content;
    }
};

/**
 * Extract media information from content regardless of format
 * @param content Content to analyze
 * @returns Object with media information
 */
export const extractMediaInfo = (content: string): {
    audioFiles: string[];
    imageFiles: string[];
    htmlAudioTags: string[];
    htmlImageTags: string[];
    totalMediaCount: number;
} => {
    if (!content) {
        return {
            audioFiles: [],
            imageFiles: [],
            htmlAudioTags: [],
            htmlImageTags: [],
            totalMediaCount: 0
        };
    }
    
    const audioFiles: string[] = [];
    const imageFiles: string[] = [];
    const htmlAudioTags: string[] = [];
    const htmlImageTags: string[] = [];
    
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
            htmlAudioTags.push(tag);
            // Extract filename from URL
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
            htmlImageTags.push(tag);
            // Extract filename from URL
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
        htmlAudioTags,
        htmlImageTags,
        totalMediaCount
    };
};

/**
 * Normalize media content to ensure consistent format
 * Converts HTML tags back to markup format for storage
 * @param content Content to normalize
 * @returns Content with markup format
 */
export const normalizeToMarkupFormat = (content: string): string => {
    if (!content) return content;
    
    let normalizedContent = content;
    
    // Convert HTML audio tags to markup
    normalizedContent = normalizedContent.replace(
        /<audio[^>]*src\s*=\s*["']https:\/\/datauploads\.sgp1\.[^"']*\/audio\/([^"'\/]+)["'][^>]*>.*?<\/audio>/gi,
        (match, filename) => `[AUDIO: ${filename}]`
    );
    
    // Convert HTML img tags to markup
    normalizedContent = normalizedContent.replace(
        /<img[^>]*src\s*=\s*["']https:\/\/datauploads\.sgp1\.[^"']*\/images\/([^"'\/]+)["'][^>]*>/gi,
        (match, filename) => `[IMAGE: ${filename}]`
    );
    
    return normalizedContent;
};

/**
 * Validate media content format
 * @param content Content to validate
 * @returns Validation result with details
 */
export const validateMediaContent = (content: string): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
} => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!content) {
        return { isValid: true, issues, recommendations };
    }
    
    const mediaFormat = detectMediaFormat(content);
    
    // Check for mixed format
    if (mediaFormat.formatType === 'mixed') {
        issues.push('Content contains both HTML tags and markup format');
        recommendations.push('Consider normalizing to a single format');
    }
    
    // Check for malformed markup
    const malformedMarkup = content.match(/\[(?:AUDIO|IMAGE):[^\]]*$/gi);
    if (malformedMarkup) {
        issues.push('Found malformed media markup (missing closing bracket)');
        recommendations.push('Fix malformed markup syntax');
    }
    
    // Check for broken HTML tags
    const unclosedTags = content.match(/<(?:audio|img)[^>]*(?<!\/|<\/(?:audio|img))$/gi);
    if (unclosedTags) {
        issues.push('Found unclosed HTML media tags');
        recommendations.push('Ensure all HTML tags are properly closed');
    }
    
    const isValid = issues.length === 0;
    
    return {
        isValid,
        issues,
        recommendations
    };
};
