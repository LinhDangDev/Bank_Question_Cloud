import { Test, TestingModule } from '@nestjs/testing';
import { MediaProcessingService } from '../media-processing.service';
import { SpacesService } from '../spaces.service';
import { MediaFileType } from '../../interfaces/exam-package.interface';

describe('MediaProcessingService', () => {
    let service: MediaProcessingService;
    let spacesService: jest.Mocked<SpacesService>;

    beforeEach(async () => {
        const mockSpacesService = {
            uploadFile: jest.fn(),
            getFileUrl: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MediaProcessingService,
                {
                    provide: SpacesService,
                    useValue: mockSpacesService,
                },
            ],
        }).compile();

        service = module.get<MediaProcessingService>(MediaProcessingService);
        spacesService = module.get(SpacesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('classifyMediaFile', () => {
        it('should classify audio files correctly', () => {
            expect(service.classifyMediaFile('test.mp3', 'audio/mpeg')).toBe(MediaFileType.AUDIO);
            expect(service.classifyMediaFile('test.wav', 'audio/wav')).toBe(MediaFileType.AUDIO);
            expect(service.classifyMediaFile('test.m4a', 'audio/mp4')).toBe(MediaFileType.AUDIO);
        });

        it('should classify image files correctly', () => {
            expect(service.classifyMediaFile('test.jpg', 'image/jpeg')).toBe(MediaFileType.IMAGE);
            expect(service.classifyMediaFile('test.png', 'image/png')).toBe(MediaFileType.IMAGE);
            expect(service.classifyMediaFile('test.gif', 'image/gif')).toBe(MediaFileType.IMAGE);
        });

        it('should return null for unsupported files', () => {
            expect(service.classifyMediaFile('test.txt', 'text/plain')).toBeNull();
            expect(service.classifyMediaFile('test.pdf', 'application/pdf')).toBeNull();
        });
    });

    describe('validateMediaFile', () => {
        it('should validate file size', () => {
            const smallBuffer = Buffer.alloc(1024); // 1KB
            const largeBuffer = Buffer.alloc(20 * 1024 * 1024); // 20MB

            expect(() => service.validateMediaFile('test.jpg', smallBuffer)).not.toThrow();
            expect(() => service.validateMediaFile('test.jpg', largeBuffer, 10 * 1024 * 1024)).toThrow();
        });

        it('should validate supported file types', () => {
            const buffer = Buffer.alloc(1024);
            
            expect(() => service.validateMediaFile('test.jpg', buffer)).not.toThrow();
            expect(() => service.validateMediaFile('test.mp3', buffer)).not.toThrow();
            expect(() => service.validateMediaFile('test.txt', buffer)).toThrow();
        });
    });

    describe('generateMediaUrl', () => {
        it('should generate correct URLs for different file types', () => {
            const audioUrl = service.generateMediaUrl('test.mp3', MediaFileType.AUDIO);
            const imageUrl = service.generateMediaUrl('test.jpg', MediaFileType.IMAGE);

            expect(audioUrl).toBe('https://datauploads.sgp1.digitaloceanspaces.com/audio/test.mp3');
            expect(imageUrl).toBe('https://datauploads.sgp1.digitaloceanspaces.com/images/test.jpg');
        });
    });

    describe('processMediaFiles', () => {
        it('should process audio files', async () => {
            const mockMediaFile = {
                fileName: 'test.mp3',
                originalName: 'test.mp3',
                buffer: Buffer.alloc(1024),
                mimeType: 'audio/mpeg',
                relativePath: 'audio/test.mp3',
                fileType: MediaFileType.AUDIO,
                targetFolder: 'audio' as const
            };

            spacesService.uploadFile.mockResolvedValue({} as any);
            spacesService.getFileUrl.mockResolvedValue('https://example.com/test.mp3');

            const result = await service.processMediaFiles([mockMediaFile]);

            expect(result).toHaveLength(1);
            expect(result[0].uploadedUrl).toBe('https://example.com/test.mp3');
            expect(spacesService.uploadFile).toHaveBeenCalledWith(
                mockMediaFile.buffer,
                expect.stringContaining('audio/'),
                mockMediaFile.mimeType,
                true
            );
        });

        it('should handle processing errors gracefully', async () => {
            const mockMediaFile = {
                fileName: 'test.mp3',
                originalName: 'test.mp3',
                buffer: Buffer.alloc(1024),
                mimeType: 'audio/mpeg',
                relativePath: 'audio/test.mp3',
                fileType: MediaFileType.AUDIO,
                targetFolder: 'audio' as const
            };

            spacesService.uploadFile.mockRejectedValue(new Error('Upload failed'));

            await expect(service.processMediaFiles([mockMediaFile])).rejects.toThrow();
        });
    });
});
