import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Files } from '../../entities/files.entity';
import { SpacesUrlBuilder } from '../../config/spaces.config';

export interface FileUrlResponse {
    MaFile: string;
    TenFile: string;
    LoaiFile: number;
    SpacesKey?: string;
    PublicUrl?: string;
    CDNUrl?: string;
    IsOnSpaces: boolean;
    ResolvedUrl: string;
    UrlType: 'CDN' | 'PUBLIC' | 'LEGACY';
}

@Injectable()
export class FilesUrlService {

    constructor(
        @InjectRepository(Files)
        private readonly filesRepository: Repository<Files>,
    ) { }

    /**
     * Lấy URL của file theo MaFile
     */
    async getFileUrl(maFile: string): Promise<FileUrlResponse> {
        const file = await this.filesRepository.findOne({
            where: { MaFile: maFile }
        });

        if (!file) {
            throw new NotFoundException(`File not found: ${maFile}`);
        }

        return this.resolveFileUrl(file);
    }

    /**
     * Lấy URLs của nhiều files theo MaCauHoi
     */
    async getQuestionFiles(maCauHoi: string): Promise<FileUrlResponse[]> {
        const files = await this.filesRepository.find({
            where: { MaCauHoi: maCauHoi },
            order: { LoaiFile: 'ASC', TenFile: 'ASC' }
        });

        return files.map(file => this.resolveFileUrl(file));
    }

    /**
     * Lấy URLs của files theo MaCauTraLoi
     */
    async getAnswerFiles(maCauTraLoi: string): Promise<FileUrlResponse[]> {
        const files = await this.filesRepository.find({
            where: { MaCauTraLoi: maCauTraLoi },
            order: { LoaiFile: 'ASC', TenFile: 'ASC' }
        });

        return files.map(file => this.resolveFileUrl(file));
    }

    /**
     * Resolve URL cho một file - KHÔNG CẦN MODIFY DATABASE
     */
    private resolveFileUrl(file: Files): FileUrlResponse {
        // Sử dụng SpacesUrlBuilder để build URLs dynamically
        const spacesKey = SpacesUrlBuilder.buildSpacesKey(file.TenFile, file.LoaiFile);
        const cdnUrl = SpacesUrlBuilder.buildCdnUrl(file.TenFile, file.LoaiFile);
        const publicUrl = SpacesUrlBuilder.buildPublicUrl(file.TenFile, file.LoaiFile);

        return {
            MaFile: file.MaFile,
            TenFile: file.TenFile,
            LoaiFile: file.LoaiFile,
            SpacesKey: spacesKey,
            PublicUrl: publicUrl,
            CDNUrl: cdnUrl,
            IsOnSpaces: true, // Assume all files are on Spaces
            ResolvedUrl: cdnUrl, // Use CDN for best performance
            UrlType: 'CDN'
        };
    }



    /**
     * Kiểm tra file có tồn tại trên Spaces không (optional)
     */
    async checkFileExists(maFile: string): Promise<boolean> {
        const fileUrl = await this.getFileUrl(maFile);

        try {
            // Simple HEAD request để check file existence
            const response = await fetch(fileUrl.ResolvedUrl, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Lấy thống kê files (simplified - không cần IsOnSpaces column)
     */
    async getFilesStats(): Promise<{
        total: number;
        byType: Record<number, number>;
    }> {
        const total = await this.filesRepository.count();

        const byTypeQuery = await this.filesRepository
            .createQueryBuilder('f')
            .select('f.LoaiFile', 'loaiFile')
            .addSelect('COUNT(*)', 'count')
            .groupBy('f.LoaiFile')
            .getRawMany();

        const byType = byTypeQuery.reduce((acc, item) => {
            acc[item.loaiFile] = parseInt(item.count);
            return acc;
        }, {});

        return {
            total,
            byType
        };
    }
}
