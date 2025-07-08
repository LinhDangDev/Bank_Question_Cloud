import { Test, TestingModule } from '@nestjs/testing';
import { ContentReplacementService } from '../content-replacement.service';
import { MediaFileType } from '../../interfaces/exam-package.interface';

describe('ContentReplacementService', () => {
    let service: ContentReplacementService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ContentReplacementService],
        }).compile();

        service = module.get<ContentReplacementService>(ContentReplacementService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('replaceMediaPaths', () => {
        it('should replace audio references correctly', () => {
            const content = 'Question content <audio src="./audio/test.mp3"> more content';
            const mediaFiles = [{
                fileName: 'test.mp3',
                originalName: 'test.mp3',
                buffer: Buffer.alloc(1024),
                mimeType: 'audio/mpeg',
                relativePath: 'audio/test.mp3',
                fileType: MediaFileType.AUDIO,
                targetFolder: 'audio' as const,
                uploadedUrl: 'https://datauploads.sgp1.digitaloceanspaces.com/audio/123_test.mp3'
            }];

            const result = service.replaceMediaPaths(content, mediaFiles);

            expect(result.processedContent).toContain('https://datauploads.sgp1.digitaloceanspaces.com/audio/123_test.mp3');
            expect(result.processedContent).toContain('controls></audio>');
            expect(result.mediaReferences).toHaveLength(1);
            expect(result.mediaReferences[0].type).toBe('audio');
        });

        it('should replace image references correctly', () => {
            const content = 'Question content <img src="./images/test.jpg"> more content';
            const mediaFiles = [{
                fileName: 'test.webp',
                originalName: 'test.jpg',
                buffer: Buffer.alloc(1024),
                mimeType: 'image/webp',
                relativePath: 'images/test.jpg',
                fileType: MediaFileType.IMAGE,
                targetFolder: 'images' as const,
                uploadedUrl: 'https://datauploads.sgp1.digitaloceanspaces.com/images/123_test.webp'
            }];

            const result = service.replaceMediaPaths(content, mediaFiles);

            expect(result.processedContent).toContain('https://datauploads.sgp1.digitaloceanspaces.com/images/123_test.webp');
            expect(result.processedContent).toContain('max-width: 400px');
            expect(result.mediaReferences).toHaveLength(1);
            expect(result.mediaReferences[0].type).toBe('image');
        });

        it('should handle multiple media references', () => {
            const content = `
                Question content 
                <audio src="./audio/test.mp3">
                <img src="./images/test.jpg">
                More content
            `;
            const mediaFiles = [
                {
                    fileName: 'test.mp3',
                    originalName: 'test.mp3',
                    buffer: Buffer.alloc(1024),
                    mimeType: 'audio/mpeg',
                    relativePath: 'audio/test.mp3',
                    fileType: MediaFileType.AUDIO,
                    targetFolder: 'audio' as const,
                    uploadedUrl: 'https://datauploads.sgp1.digitaloceanspaces.com/audio/123_test.mp3'
                },
                {
                    fileName: 'test.webp',
                    originalName: 'test.jpg',
                    buffer: Buffer.alloc(1024),
                    mimeType: 'image/webp',
                    relativePath: 'images/test.jpg',
                    fileType: MediaFileType.IMAGE,
                    targetFolder: 'images' as const,
                    uploadedUrl: 'https://datauploads.sgp1.digitaloceanspaces.com/images/123_test.webp'
                }
            ];

            const result = service.replaceMediaPaths(content, mediaFiles);

            expect(result.mediaReferences).toHaveLength(2);
            expect(result.processedContent).toContain('datauploads.sgp1.digitaloceanspaces.com/audio/');
            expect(result.processedContent).toContain('datauploads.sgp1.digitaloceanspaces.com/images/');
        });

        it('should handle content without media references', () => {
            const content = 'Simple question content without media';
            const mediaFiles: any[] = [];

            const result = service.replaceMediaPaths(content, mediaFiles);

            expect(result.processedContent).toBe(content);
            expect(result.mediaReferences).toHaveLength(0);
        });
    });

    describe('validateMediaReferences', () => {
        it('should detect unreplaced audio references', () => {
            const content = 'Content with <audio src="./audio/test.mp3"> unreplaced reference';
            
            const result = service.validateMediaReferences(content);

            expect(result.hasUnreplacedReferences).toBe(true);
            expect(result.unreplacedReferences).toHaveLength(1);
            expect(result.unreplacedReferences[0]).toContain('./audio/test.mp3');
        });

        it('should detect unreplaced image references', () => {
            const content = 'Content with <img src="./images/test.jpg"> unreplaced reference';
            
            const result = service.validateMediaReferences(content);

            expect(result.hasUnreplacedReferences).toBe(true);
            expect(result.unreplacedReferences).toHaveLength(1);
            expect(result.unreplacedReferences[0]).toContain('./images/test.jpg');
        });

        it('should return false for fully processed content', () => {
            const content = 'Content with <audio src="https://datauploads.sgp1.digitaloceanspaces.com/audio/test.mp3"> replaced reference';
            
            const result = service.validateMediaReferences(content);

            expect(result.hasUnreplacedReferences).toBe(false);
            expect(result.unreplacedReferences).toHaveLength(0);
        });
    });

    describe('generateMediaStatistics', () => {
        it('should generate correct statistics', () => {
            const mediaReferences = [
                { type: 'audio' as const, fileName: 'test1.mp3', originalPath: '', newUrl: '', tagContent: '', replacementTag: '' },
                { type: 'audio' as const, fileName: 'test2.mp3', originalPath: '', newUrl: '', tagContent: '', replacementTag: '' },
                { type: 'image' as const, fileName: 'test1.jpg', originalPath: '', newUrl: '', tagContent: '', replacementTag: '' },
                { type: 'image' as const, fileName: 'test1.jpg', originalPath: '', newUrl: '', tagContent: '', replacementTag: '' }, // Duplicate
            ];

            const stats = service.generateMediaStatistics(mediaReferences);

            expect(stats.totalReplacements).toBe(4);
            expect(stats.audioReplacements).toBe(2);
            expect(stats.imageReplacements).toBe(2);
            expect(stats.uniqueFiles).toBe(3); // test1.mp3, test2.mp3, test1.jpg
        });
    });

    describe('cleanupTempContent', () => {
        it('should clean up content formatting', () => {
            const messyContent = 'Content\r\nwith\r\nmixed\nline\n\n\nendings';
            
            const cleaned = service.cleanupTempContent(messyContent);

            expect(cleaned).not.toContain('\r');
            expect(cleaned).not.toMatch(/\n{3,}/);
            expect(cleaned.trim()).toBe(cleaned);
        });
    });
});
