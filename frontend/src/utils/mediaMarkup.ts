/**
 * Media Markup Utility for Frontend
 * Author: Linh Dang Dev
 *
 * Utility functions to convert media markup [AUDIO: filename] and [IMAGE: filename]
 * to HTML <audio> and <img> tags for frontend display
 */

// Digital Ocean Spaces endpoints
const AUDIO_CDN_BASE = 'https://datauploads.sgp1.digitaloceanspaces.com/audio/';
const IMAGE_CDN_BASE = 'https://datauploads.sgp1.digitaloceanspaces.com/images/';

/**
 * Convert media markup to HTML tags for frontend display
 * @param content Content with [AUDIO: filename] and [IMAGE: filename] markup
 * @returns Content with HTML <audio> and <img> tags
 */
export const convertMediaMarkupToHtml = (content: string): string => {
    if (!content) return content;

    let processedContent = content;

    // Convert [AUDIO: filename] to <audio> tags
    processedContent = processedContent.replace(
        /\[AUDIO:\s*([^\]]+)\]/gi,
        (match, filename) => {
            const cleanFilename = filename.trim();
            const audioUrl = buildAudioUrl(cleanFilename);
            return `<div class="media-container audio-container my-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <audio controls style="width: 100%; max-width: 400px; margin: 4px 0;">
          <source src="${audioUrl}" type="audio/mpeg">
          <source src="${audioUrl}" type="audio/wav">
          <source src="${audioUrl}" type="audio/ogg">
          Your browser does not support the audio element.
        </audio>
        <div class="media-filename text-xs text-gray-600 mt-2 flex items-center">
          <span class="mr-1">🔊</span>
          <span>${cleanFilename}</span>
        </div>
      </div>`;
        }
    );

    // Convert [IMAGE: filename] to <img> tags
    processedContent = processedContent.replace(
        /\[IMAGE:\s*([^\]]+)\]/gi,
        (match, filename) => {
            const cleanFilename = filename.trim();
            const imageUrl = buildImageUrl(cleanFilename);
            return `<div class="media-container image-container my-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <img
          src="${imageUrl}"
          alt="${cleanFilename}"
          style="max-width: 100%; height: auto; max-height: 400px; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
        >
        <div class="media-error text-sm text-red-500 italic hidden p-2 bg-red-50 rounded border border-red-200 mt-2">
          📷 Image not found: ${cleanFilename}
        </div>
        <div class="media-filename text-xs text-gray-600 mt-2 flex items-center">
          <span class="mr-1">📷</span>
          <span>${cleanFilename}</span>
        </div>
      </div>`;
        }
    );

    return processedContent;
};

/**
 * Build audio URL from filename
 * @param filename Audio filename
 * @returns Full CDN URL for audio file
 */
const buildAudioUrl = (filename: string): string => {
    // Remove any path separators and clean filename
    const cleanFilename = filename.replace(/[\\\/]/g, '').trim();

    // Ensure proper file extension
    if (!hasAudioExtension(cleanFilename)) {
        // Default to mp3 if no extension
        return AUDIO_CDN_BASE + cleanFilename + '.mp3';
    }

    return AUDIO_CDN_BASE + cleanFilename;
};

/**
 * Build image URL from filename
 * @param filename Image filename
 * @returns Full CDN URL for image file
 */
const buildImageUrl = (filename: string): string => {
    // Remove any path separators and clean filename
    const cleanFilename = filename.replace(/[\\\/]/g, '').trim();

    // Ensure proper file extension
    if (!hasImageExtension(cleanFilename)) {
        // Default to jpg if no extension
        return IMAGE_CDN_BASE + cleanFilename + '.jpg';
    }

    return IMAGE_CDN_BASE + cleanFilename;
};

/**
 * Check if filename has audio extension
 * @param filename Filename to check
 * @returns True if has audio extension
 */
const hasAudioExtension = (filename: string): boolean => {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
    const lowerFilename = filename.toLowerCase();
    return audioExtensions.some(ext => lowerFilename.endsWith(ext));
};

/**
 * Check if filename has image extension
 * @param filename Filename to check
 * @returns True if has image extension
 */
const hasImageExtension = (filename: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerFilename = filename.toLowerCase();
    return imageExtensions.some(ext => lowerFilename.endsWith(ext));
};

/**
 * Extract media filenames from content
 * @param content Content to analyze
 * @returns Object with arrays of audio and image filenames
 */
export const extractMediaFilenames = (content: string): { audioFiles: string[], imageFiles: string[] } => {
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
};

/**
 * Xử lý media markup từ nội dung
 * Chuyển đổi các thẻ đặc biệt thành HTML
 */
export const processMediaMarkup = (content: string): string => {
    if (!content) return '';

    let processedContent = content;

    // Xử lý hình ảnh inline: [<img>image_path.jpg</img>]
    processedContent = processedContent.replace(
        /\[\<img\>(.*?)\<\/img\>\]/g,
        (_, src) => `<img src="${src}" alt="Embedded image" class="inline-image" />`
    );

    // Xử lý audio: [<audio>audio_path.mp3</audio>]
    processedContent = processedContent.replace(
        /\[\<audio\>(.*?)\<\/audio\>\]/g,
        (_, src) => `<audio controls src="${src}" class="embedded-audio"></audio>`
    );

    // Xử lý video: [<video>video_path.mp4</video>]
    processedContent = processedContent.replace(
        /\[\<video\>(.*?)\<\/video\>\]/g,
        (_, src) => `<video controls src="${src}" class="embedded-video"></video>`
    );

    // Xử lý line break: [<br>]
    processedContent = processedContent.replace(/\[\<br\>\]/g, '<br/>');

    return processedContent;
};

// Kiểm tra xem nội dung có chứa media markup không
export const hasMediaMarkup = (content: string): boolean => {
    if (!content) return false;

    const mediaPatterns = [
        /\[\<img\>(.*?)\<\/img\>\]/,
        /\[\<audio\>(.*?)\<\/audio\>\]/,
        /\[\<video\>(.*?)\<\/video\>\]/,
        /\[\<br\>\]/
    ];

    return mediaPatterns.some(pattern => pattern.test(content));
};

/**
 * Get media statistics from content
 * @param content Content to analyze
 * @returns Statistics about media usage
 */
export const getMediaStatistics = (content: string): {
    hasMedia: boolean;
    audioCount: number;
    imageCount: number;
    totalMediaFiles: number;
    mediaFiles: { audioFiles: string[], imageFiles: string[] };
} => {
    const mediaFiles = extractMediaFilenames(content);
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
};

/**
 * Convert media markup for display in different contexts
 * @param content Content with media markup
 * @param context Display context ('exam', 'preview', 'print')
 * @returns Processed content appropriate for the context
 */
export const convertMediaMarkupForContext = (content: string, context: 'exam' | 'preview' | 'print' = 'exam'): string => {
    if (!content) return content;

    switch (context) {
        case 'exam':
            return convertMediaMarkupToHtml(content);

        case 'preview':
            return convertMediaMarkupToHtml(content);

        case 'print':
            // For print, convert to text references
            let printContent = content;
            printContent = printContent.replace(
                /\[AUDIO:\s*([^\]]+)\]/gi,
                (match, filename) => `🔊 Audio: ${filename.trim()}`
            );
            printContent = printContent.replace(
                /\[IMAGE:\s*([^\]]+)\]/gi,
                (match, filename) => `📷 Image: ${filename.trim()}`
            );
            return printContent;

        default:
            return convertMediaMarkupToHtml(content);
    }
};

/**
 * Preload media files for better user experience
 * @param content Content with media markup
 * @returns Promise that resolves when media files are preloaded
 */
export const preloadMediaFiles = async (content: string): Promise<void> => {
    const { audioFiles, imageFiles } = extractMediaFilenames(content);

    const preloadPromises: Promise<void>[] = [];

    // Preload images
    imageFiles.forEach(filename => {
        const imageUrl = buildImageUrl(filename);
        const preloadPromise = new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Resolve even on error to not block
            img.src = imageUrl;
        });
        preloadPromises.push(preloadPromise);
    });

    // Note: Audio preloading is more complex and might not be necessary
    // as browsers handle audio loading on-demand quite well

    await Promise.all(preloadPromises);
};

/**
 * Clean content by removing media markup (for fallback scenarios)
 * @param content Content with media markup
 * @returns Content with media markup removed
 */
export const cleanMediaMarkup = (content: string): string => {
    if (!content) return content;

    let cleanContent = content;

    // Remove audio markup
    cleanContent = cleanContent.replace(/\[AUDIO:\s*[^\]]+\]/gi, '');

    // Remove image markup
    cleanContent = cleanContent.replace(/\[IMAGE:\s*[^\]]+\]/gi, '');

    // Clean up extra whitespace
    cleanContent = cleanContent.replace(/\s+/g, ' ').trim();

    return cleanContent;
};
