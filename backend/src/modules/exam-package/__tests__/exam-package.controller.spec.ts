import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ExamPackageController } from '../exam-package.controller';
import { ExamPackageService } from '../../../services/exam-package.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';

describe('ExamPackageController', () => {
    let controller: ExamPackageController;
    let examPackageService: jest.Mocked<ExamPackageService>;

    beforeEach(async () => {
        const mockExamPackageService = {
            processExamPackage: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ExamPackageController],
            providers: [
                {
                    provide: ExamPackageService,
                    useValue: mockExamPackageService,
                },
            ],
        })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .compile();

        controller = module.get<ExamPackageController>(ExamPackageController);
        examPackageService = module.get(ExamPackageService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('uploadExamPackage', () => {
        const mockFile = {
            fieldname: 'file',
            originalname: 'test-package.zip',
            encoding: '7bit',
            mimetype: 'application/zip',
            size: 1024 * 1024, // 1MB
            path: '/tmp/test-package.zip',
        } as Express.Multer.File;

        beforeEach(() => {
            // Mock fs.readFileSync and fs.existsSync
            jest.doMock('fs', () => ({
                readFileSync: jest.fn().mockReturnValue(Buffer.alloc(1024)),
                existsSync: jest.fn().mockReturnValue(true),
                unlinkSync: jest.fn(),
            }));
        });

        it('should process exam package successfully', async () => {
            const mockResult = {
                packageId: 'test-package-id',
                extractedStructure: {
                    wordDocument: { fileName: 'test.docx' },
                    mediaFiles: [],
                    audioFiles: [],
                    imageFiles: []
                },
                processedQuestions: [
                    {
                        id: 'q1',
                        content: 'Test question',
                        answers: [],
                        hoanVi: true,
                        mediaReferences: []
                    }
                ],
                uploadedMedia: [],
                mediaReplacements: [],
                statistics: {
                    totalQuestions: 1,
                    questionsWithMedia: 0,
                    totalMediaFiles: 0,
                    audioFilesProcessed: 0,
                    imageFilesProcessed: 0,
                    imageFilesConverted: 0,
                    mediaReplacementsMade: 0,
                    questionsWithHoanVi0: 0,
                    questionsWithHoanVi1: 1
                },
                errors: [],
                warnings: []
            };

            examPackageService.processExamPackage.mockResolvedValue(mockResult);

            const result = await controller.uploadExamPackage(
                mockFile,
                'test-section-id',
                'true',
                'true',
                '100',
                'false'
            );

            expect(result).toEqual({
                packageId: 'test-package-id',
                questionCount: 1,
                mediaFileCount: 0,
                audioFileCount: 0,
                imageFileCount: 0,
                status: 'success'
            });

            expect(examPackageService.processExamPackage).toHaveBeenCalledWith(
                expect.objectContaining({
                    originalname: 'test-package.zip',
                    mimetype: 'application/zip'
                }),
                'test-section-id',
                {
                    processImages: true,
                    processAudio: true,
                    limit: 100,
                    saveToDatabase: false
                }
            );
        });

        it('should handle processing errors', async () => {
            examPackageService.processExamPackage.mockRejectedValue(
                new Error('Processing failed')
            );

            await expect(
                controller.uploadExamPackage(mockFile, 'test-section-id')
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw error when no file provided', async () => {
            await expect(
                controller.uploadExamPackage(null as any)
            ).rejects.toThrow(BadRequestException);
        });

        it('should validate file type', async () => {
            const invalidFile = {
                ...mockFile,
                originalname: 'test.txt'
            };

            await expect(
                controller.uploadExamPackage(invalidFile)
            ).rejects.toThrow(BadRequestException);
        });

        it('should validate file size', async () => {
            const largeFile = {
                ...mockFile,
                size: 200 * 1024 * 1024 // 200MB
            };

            await expect(
                controller.uploadExamPackage(largeFile)
            ).rejects.toThrow(BadRequestException);
        });

        it('should require maPhan when saveToDatabase is true', async () => {
            await expect(
                controller.uploadExamPackage(
                    mockFile,
                    undefined, // No maPhan
                    'true',
                    'true',
                    '100',
                    'true' // saveToDatabase = true
                )
            ).rejects.toThrow(BadRequestException);
        });

        it('should handle partial success with warnings', async () => {
            const mockResult = {
                packageId: 'test-package-id',
                extractedStructure: {
                    wordDocument: { fileName: 'test.docx' },
                    mediaFiles: [],
                    audioFiles: [],
                    imageFiles: []
                },
                processedQuestions: [],
                uploadedMedia: [],
                mediaReplacements: [],
                statistics: {
                    totalQuestions: 0,
                    questionsWithMedia: 0,
                    totalMediaFiles: 0,
                    audioFilesProcessed: 0,
                    imageFilesProcessed: 0,
                    imageFilesConverted: 0,
                    mediaReplacementsMade: 0,
                    questionsWithHoanVi0: 0,
                    questionsWithHoanVi1: 0
                },
                errors: [],
                warnings: ['Some media files could not be processed']
            };

            examPackageService.processExamPackage.mockResolvedValue(mockResult);

            const result = await controller.uploadExamPackage(mockFile);

            expect(result.status).toBe('partial');
            expect(result.warnings).toEqual(['Some media files could not be processed']);
        });
    });

    describe('validateExamPackage', () => {
        const mockFile = {
            fieldname: 'file',
            originalname: 'test-package.zip',
            encoding: '7bit',
            mimetype: 'application/zip',
            size: 1024 * 1024,
            path: '/tmp/test-package.zip',
        } as Express.Multer.File;

        beforeEach(() => {
            jest.doMock('fs', () => ({
                readFileSync: jest.fn().mockReturnValue(Buffer.alloc(1024)),
                existsSync: jest.fn().mockReturnValue(true),
                unlinkSync: jest.fn(),
            }));
        });

        it('should validate package structure', async () => {
            const result = await controller.validateExamPackage(mockFile);

            expect(result).toEqual({
                valid: true,
                structure: {
                    hasWordDocument: true,
                    wordDocumentName: 'example.docx',
                    audioFiles: [],
                    imageFiles: [],
                    totalFiles: 1
                },
                errors: [],
                warnings: []
            });
        });

        it('should throw error when no file provided', async () => {
            await expect(
                controller.validateExamPackage(null as any)
            ).rejects.toThrow(BadRequestException);
        });
    });
});
