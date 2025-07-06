import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeThi } from '../../entities/de-thi.entity';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { Phan } from '../../entities/phan.entity';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { Files } from '../../entities/files.entity';
import { SpacesUrlBuilder } from '../../config/spaces.config';

export interface MultimediaExamResponse {
    MaDeThi: string;
    TenDeThi: string;
    NgayTao: string;
    Phans: PhanResponse[];
}

export interface PhanResponse {
    MaPhan: string;
    MaPhanCha: string | null;
    TenPhan: string;
    KieuNoiDung: string;
    NoiDung: string;
    SoLuongCauHoi: string;
    LaCauHoiNhom: string;
    CauHois: CauHoiResponse[];
}

export interface CauHoiResponse {
    MaCauHoi: string;
    NoiDung: string;
    CauTraLois: CauTraLoiResponse[];
    MultimediaFiles?: MultimediaFileResponse[];
}

export interface CauTraLoiResponse {
    MaCauTraLoi: string;
    NoiDung: string;
    LaDapAn: string;
    MultimediaFiles?: MultimediaFileResponse[];
}

export interface MultimediaFileResponse {
    MaFile: string;
    TenFile: string;
    LoaiFile: number;
    CDNUrl: string;
    PublicUrl: string;
}

@Injectable()
export class MultimediaExamService {
    constructor(
        @InjectRepository(DeThi)
        private readonly deThiRepository: Repository<DeThi>,
        @InjectRepository(ChiTietDeThi)
        private readonly chiTietDeThiRepository: Repository<ChiTietDeThi>,
        @InjectRepository(Phan)
        private readonly phanRepository: Repository<Phan>,
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
        @InjectRepository(CauTraLoi)
        private readonly cauTraLoiRepository: Repository<CauTraLoi>,
        @InjectRepository(Files)
        private readonly filesRepository: Repository<Files>,
    ) {}

    /**
     * Lấy đề thi đã duyệt với multimedia theo format yêu cầu
     */
    async getApprovedExamWithMultimedia(maDeThi: string): Promise<MultimediaExamResponse> {
        // 1. Lấy thông tin đề thi đã duyệt
        const exam = await this.deThiRepository.findOne({
            where: { MaDeThi: maDeThi, DaDuyet: true },
            relations: ['MonHoc']
        });

        if (!exam) {
            throw new NotFoundException('Exam not found or not approved');
        }

        // 2. Lấy chi tiết đề thi với relationships
        const examDetails = await this.chiTietDeThiRepository.find({
            where: { MaDeThi: maDeThi },
            relations: ['Phan', 'CauHoi', 'CauHoi.CauTraLoi'],
            order: { ThuTu: 'ASC' }
        });

        // 3. Group theo Phan và build response
        const phanMap = new Map<string, PhanResponse>();

        for (const detail of examDetails) {
            const phan = detail.Phan;
            const cauHoi = detail.CauHoi;

            // Build Phan nếu chưa có
            if (!phanMap.has(phan.MaPhan)) {
                phanMap.set(phan.MaPhan, {
                    MaPhan: phan.MaPhan,
                    MaPhanCha: phan.MaPhanCha,
                    TenPhan: phan.TenPhan,
                    KieuNoiDung: this.determineKieuNoiDung(phan),
                    NoiDung: phan.NoiDung || '',
                    SoLuongCauHoi: phan.SoLuongCauHoi.toString(),
                    LaCauHoiNhom: phan.LaCauHoiNhom.toString(),
                    CauHois: []
                });
            }

            // Build CauHoi với multimedia
            const cauHoiResponse: CauHoiResponse = {
                MaCauHoi: cauHoi.MaCauHoi,
                NoiDung: cauHoi.NoiDung || '',
                CauTraLois: [],
                MultimediaFiles: await this.getQuestionMultimedia(cauHoi.MaCauHoi)
            };

            // Build CauTraLoi với multimedia
            for (const cauTraLoi of cauHoi.CauTraLoi || []) {
                cauHoiResponse.CauTraLois.push({
                    MaCauTraLoi: cauTraLoi.MaCauTraLoi,
                    NoiDung: cauTraLoi.NoiDung || '',
                    LaDapAn: cauTraLoi.LaDapAn.toString(),
                    MultimediaFiles: await this.getAnswerMultimedia(cauTraLoi.MaCauTraLoi)
                });
            }

            phanMap.get(phan.MaPhan)!.CauHois.push(cauHoiResponse);
        }

        // 4. Build final response
        return {
            MaDeThi: exam.MaDeThi,
            TenDeThi: exam.TenDeThi,
            NgayTao: this.formatDate(exam.NgayTao),
            Phans: Array.from(phanMap.values())
        };
    }

    /**
     * Lấy danh sách đề thi đã duyệt
     */
    async getApprovedExams(): Promise<{ MaDeThi: string; TenDeThi: string; NgayTao: string }[]> {
        const exams = await this.deThiRepository.find({
            where: { DaDuyet: true },
            select: ['MaDeThi', 'TenDeThi', 'NgayTao'],
            order: { NgayTao: 'DESC' }
        });

        return exams.map(exam => ({
            MaDeThi: exam.MaDeThi,
            TenDeThi: exam.TenDeThi,
            NgayTao: this.formatDate(exam.NgayTao)
        }));
    }

    /**
     * Lấy multimedia files cho câu hỏi
     */
    private async getQuestionMultimedia(maCauHoi: string): Promise<MultimediaFileResponse[]> {
        const files = await this.filesRepository.find({
            where: { MaCauHoi: maCauHoi },
            order: { LoaiFile: 'ASC', TenFile: 'ASC' }
        });

        return files.map(file => this.buildMultimediaResponse(file));
    }

    /**
     * Lấy multimedia files cho câu trả lời
     */
    private async getAnswerMultimedia(maCauTraLoi: string): Promise<MultimediaFileResponse[]> {
        const files = await this.filesRepository.find({
            where: { MaCauTraLoi: maCauTraLoi },
            order: { LoaiFile: 'ASC', TenFile: 'ASC' }
        });

        return files.map(file => this.buildMultimediaResponse(file));
    }

    /**
     * Build multimedia file response với DigitalOcean URLs
     */
    private buildMultimediaResponse(file: Files): MultimediaFileResponse {
        return {
            MaFile: file.MaFile,
            TenFile: file.TenFile,
            LoaiFile: file.LoaiFile,
            CDNUrl: SpacesUrlBuilder.buildCdnUrl(file.TenFile, file.LoaiFile),
            PublicUrl: SpacesUrlBuilder.buildPublicUrl(file.TenFile, file.LoaiFile)
        };
    }

    /**
     * Xác định KieuNoiDung theo business rules
     */
    private determineKieuNoiDung(phan: Phan): string {
        // Business logic để xác định KieuNoiDung
        if (phan.LaCauHoiNhom) {
            return '-1'; // Normal group
        }
        
        // Check nếu có audio files trong phan này
        // TODO: Implement logic check audio content
        // if (hasAudioContent) return '2';
        
        // Check nếu có fill-in-blank questions
        // TODO: Implement logic check fill-in-blank
        // if (hasFillInBlank) return '1';
        
        return '-1'; // Default: normal group
    }

    /**
     * Format date theo DD/MM/YYYY H:mm:ss
     */
    private formatDate(date: Date): string {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const seconds = d.getSeconds().toString().padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }
}
