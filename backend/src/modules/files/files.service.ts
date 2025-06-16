import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Files } from '../../entities/files.entity';
import { randomUUID } from 'crypto';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Define the file type for Express.Multer.File since it's not recognized
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

@Injectable()
export class FilesService {
    constructor(
        @InjectRepository(Files)
        private readonly filesRepository: Repository<Files>,
    ) { }

    async create(file: MulterFile, maCauHoi?: string, maCauTraLoi?: string): Promise<Files> {
        // Create directory structure if it doesn't exist
        const uploadDir = 'uploads';
        const fileDir = maCauHoi
            ? join(uploadDir, 'questions', maCauHoi)
            : (maCauTraLoi ? join(uploadDir, 'answers', maCauTraLoi) : uploadDir);

        if (!existsSync(fileDir)) {
            mkdirSync(fileDir, { recursive: true });
        }

        // Save the file to disk
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${randomUUID()}.${fileExtension}`;
        const filePath = join(fileDir, fileName);

        const fileStream = createWriteStream(join(process.cwd(), filePath));
        fileStream.write(file.buffer);
        fileStream.end();

        // Save file metadata to the database
        const fileEntity = new Files();
        fileEntity.MaFile = randomUUID();

        // Use type assertion to handle potential null values
        if (maCauHoi) {
            fileEntity.MaCauHoi = maCauHoi;
        }

        if (maCauTraLoi) {
            fileEntity.MaCauTraLoi = maCauTraLoi;
        }

        fileEntity.TenFile = filePath;
        fileEntity.LoaiFile = this.getFileType(fileExtension || '');

        return this.filesRepository.save(fileEntity);
    }

    async findByCauHoi(maCauHoi: string): Promise<Files[]> {
        return this.filesRepository.find({
            where: { MaCauHoi: maCauHoi }
        });
    }

    async findByCauTraLoi(maCauTraLoi: string): Promise<Files[]> {
        return this.filesRepository.find({
            where: { MaCauTraLoi: maCauTraLoi }
        });
    }

    async delete(maFile: string): Promise<void> {
        await this.filesRepository.delete(maFile);
    }

    // Helper method to determine file type
    private getFileType(extension: string): number {
        const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a'];
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];

        if (audioExtensions.includes(extension.toLowerCase())) {
            return 1; // Audio file
        } else if (imageExtensions.includes(extension.toLowerCase())) {
            return 2; // Image file
        }
        return 0; // Other file type
    }
}
