import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Files } from '../../entities/files.entity';
import { SpacesService } from '../../services/spaces.service';
import { randomUUID } from 'crypto';

interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

@Injectable()
export class FilesSpacesService {
    constructor(
        @InjectRepository(Files)
        private readonly filesRepository: Repository<Files>,
        private readonly spacesService: SpacesService,
    ) {}

    async uploadFile(file: MulterFile, maCauHoi?: string, maCauTraLoi?: string): Promise<Files> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        // Validate file type
        const fileType = this.getFileTypeFromMimeType(file.mimetype);
        if (!fileType) {
            throw new BadRequestException('Unsupported file type');
        }

        // Generate unique file key for Spaces
        const fileKey = this.spacesService.generateFileKey(
            file.originalname,
            fileType,
            maCauHoi || maCauTraLoi
        );

        try {
            // Upload to DigitalOcean Spaces
            const uploadResult = await this.spacesService.uploadFile(
                file.buffer,
                fileKey,
                file.mimetype,
                true // public file
            );

            // Save file metadata to database
            const fileEntity = new Files();
            fileEntity.MaFile = randomUUID();
            fileEntity.TenFile = fileKey; // Store the Spaces key instead of local path
            fileEntity.LoaiFile = fileType;
            
            if (maCauHoi) {
                fileEntity.MaCauHoi = maCauHoi;
            }
            
            if (maCauTraLoi) {
                fileEntity.MaCauTraLoi = maCauTraLoi;
            }

            const savedFile = await this.filesRepository.save(fileEntity);
            
            return {
                ...savedFile,
                publicUrl: await this.spacesService.getFileUrl(fileKey)
            } as any;

        } catch (error) {
            throw new BadRequestException(`Failed to upload file: ${error.message}`);
        }
    }

    async getFileUrl(maFile: string): Promise<string> {
        const file = await this.filesRepository.findOne({
            where: { MaFile: maFile }
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        return await this.spacesService.getFileUrl(file.TenFile);
    }

    async getFilesByQuestion(maCauHoi: string): Promise<Array<Files & { publicUrl: string }>> {
        const files = await this.filesRepository.find({
            where: { MaCauHoi: maCauHoi }
        });

        const filesWithUrls = await Promise.all(
            files.map(async (file) => ({
                ...file,
                publicUrl: await this.spacesService.getFileUrl(file.TenFile)
            }))
        );

        return filesWithUrls;
    }

    async getFilesByAnswer(maCauTraLoi: string): Promise<Array<Files & { publicUrl: string }>> {
        const files = await this.filesRepository.find({
            where: { MaCauTraLoi: maCauTraLoi }
        });

        const filesWithUrls = await Promise.all(
            files.map(async (file) => ({
                ...file,
                publicUrl: await this.spacesService.getFileUrl(file.TenFile)
            }))
        );

        return filesWithUrls;
    }

    async deleteFile(maFile: string): Promise<void> {
        const file = await this.filesRepository.findOne({
            where: { MaFile: maFile }
        });

        if (!file) {
            throw new NotFoundException('File not found');
        }

        try {
            // Delete from Spaces
            await this.spacesService.deleteFile(file.TenFile);
            
            // Delete from database
            await this.filesRepository.remove(file);
        } catch (error) {
            throw new BadRequestException(`Failed to delete file: ${error.message}`);
        }
    }

    private getFileTypeFromMimeType(mimeType: string): number | null {
        if (mimeType.startsWith('audio/')) {
            return 1; // Audio
        }
        if (mimeType.startsWith('image/')) {
            return 2; // Image
        }
        if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) {
            return 3; // Document
        }
        return null;
    }

    async migrateExistingFiles(): Promise<{ success: number; failed: number; errors: string[] }> {
        const files = await this.filesRepository.find();
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const file of files) {
            try {
                // Check if file is already migrated (has Spaces key format)
                if (file.TenFile.includes('/')) {
                    success++;
                    continue;
                }

                // Generate new Spaces key
                const fileType = file.LoaiFile;
                const newKey = this.spacesService.generateFileKey(
                    file.TenFile,
                    fileType,
                    file.MaCauHoi || file.MaCauTraLoi
                );

                // Update database record
                file.TenFile = newKey;
                await this.filesRepository.save(file);
                
                success++;
            } catch (error) {
                failed++;
                errors.push(`File ${file.MaFile}: ${error.message}`);
            }
        }

        return { success, failed, errors };
    }
}
