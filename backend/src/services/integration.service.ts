import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DeThi } from '../entities/de-thi.entity';
import { CauHoi } from '../entities/cau-hoi.entity';
import { CauTraLoi } from '../entities/cau-tra-loi.entity';
import { Phan } from '../entities/phan.entity';
import { ChiTietDeThi } from '../entities/chi-tiet-de-thi.entity';
import { MonHoc } from '../entities/mon-hoc.entity';
import { Files } from '../entities/files.entity';
import { SpacesUrlBuilder } from '../config/spaces.config';
import {
    ExamDetailsResponseDto,
    ExamStatusResponseDto,
    PhanIntegrationDto,
    CauHoiIntegrationDto,
    CauTraLoiIntegrationDto,
    ApiResponseDto
} from '../dto/integration.dto';

@Injectable()
export class IntegrationService {
    private readonly logger = new Logger(IntegrationService.name);

    constructor(
        @InjectRepository(DeThi)
        private readonly deThiRepository: Repository<DeThi>,
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
        @InjectRepository(CauTraLoi)
        private readonly cauTraLoiRepository: Repository<CauTraLoi>,
        @InjectRepository(Phan)
        private readonly phanRepository: Repository<Phan>,
        @InjectRepository(ChiTietDeThi)
        private readonly chiTietDeThiRepository: Repository<ChiTietDeThi>,
        @InjectRepository(MonHoc)
        private readonly monHocRepository: Repository<MonHoc>,
        @InjectRepository(Files)
        private readonly filesRepository: Repository<Files>,
    ) { }

    async getExamDetails(maDeThi: string): Promise<ApiResponseDto<ExamDetailsResponseDto>> {
        try {
            this.logger.log(`Getting exam details for: ${maDeThi}`);

            // 1. Lấy thông tin đề thi (chỉ đề thi đã duyệt)
            const deThi = await this.deThiRepository.findOne({
                where: {
                    MaDeThi: maDeThi,
                    DaDuyet: true  // Chỉ lấy đề thi đã duyệt
                },
                relations: ['MonHoc']
            });

            if (!deThi) {
                throw new NotFoundException(`Không tìm thấy đề thi đã duyệt với mã: ${maDeThi}`);
            }

            // 2. Lấy chi tiết đề thi (danh sách câu hỏi)
            const chiTietDeThi = await this.chiTietDeThiRepository.find({
                where: { MaDeThi: maDeThi },
                order: { ThuTu: 'ASC' }
            });

            if (chiTietDeThi.length === 0) {
                this.logger.warn(`No questions found for exam: ${maDeThi}`);
                return {
                    success: false,
                    message: `Đề thi ${maDeThi} chưa có câu hỏi`,
                    error: 'NO_QUESTIONS_FOUND'
                };
            }

            // 3. Lấy danh sách mã phần và mã câu hỏi
            const maPhanList = [...new Set(chiTietDeThi.map(item => item.MaPhan))];
            const maCauHoiList = chiTietDeThi.map(item => item.MaCauHoi);

            // 4. Lấy thông tin các phần
            const phans = await this.phanRepository.find({
                where: { MaPhan: In(maPhanList) }
            });

            // 5. Lấy thông tin câu hỏi
            const cauHois = await this.cauHoiRepository.find({
                where: { MaCauHoi: In(maCauHoiList) }
            });

            // 6. Lấy câu trả lời cho tất cả câu hỏi
            const cauTraLois = await this.cauTraLoiRepository.find({
                where: { MaCauHoi: In(maCauHoiList) },
                order: { ThuTu: 'ASC' }
            });

            // 7. Lấy multimedia files cho tất cả câu hỏi và câu trả lời
            const allFiles = await this.getMultimediaFiles(maCauHoiList, cauTraLois.map(ctl => ctl.MaCauTraLoi));

            // 8. Transform data theo format yêu cầu
            const examDetails = await this.transformToExamDetails(deThi, phans, cauHois, cauTraLois, chiTietDeThi, allFiles);

            this.logger.log(`Successfully retrieved exam details for: ${maDeThi}`);
            return {
                success: true,
                data: examDetails
            };

        } catch (error) {
            this.logger.error(`Error getting exam details for ${maDeThi}:`, error);

            if (error instanceof NotFoundException) {
                return {
                    success: false,
                    message: error.message,
                    error: 'EXAM_NOT_FOUND'
                };
            }

            return {
                success: false,
                message: 'Lỗi hệ thống khi lấy thông tin đề thi',
                error: 'INTERNAL_SERVER_ERROR'
            };
        }
    }

    async getExamStatus(maDeThi: string): Promise<ApiResponseDto<ExamStatusResponseDto>> {
        try {
            this.logger.log(`Getting exam status for: ${maDeThi}`);

            const deThi = await this.deThiRepository.findOne({
                where: { MaDeThi: maDeThi },
                relations: ['MonHoc']
            });

            if (!deThi) {
                return {
                    success: false,
                    message: `Không tìm thấy đề thi với mã: ${maDeThi}`,
                    error: 'EXAM_NOT_FOUND'
                };
            }

            // Đếm số câu hỏi
            const questionCount = await this.chiTietDeThiRepository.count({
                where: { MaDeThi: maDeThi }
            });

            const examStatus: ExamStatusResponseDto = {
                maDeThi: deThi.MaDeThi,
                trangThai: questionCount > 0 ? 'ready' : 'processing',
                daDuyet: deThi.DaDuyet,
                ngayTao: this.formatDate(deThi.NgayTao),
                soCauHoi: questionCount.toString(),
                tenDeThi: deThi.TenDeThi,
                tenMonHoc: deThi.MonHoc?.TenMonHoc || 'N/A'
            };

            return {
                success: true,
                data: examStatus
            };

        } catch (error) {
            this.logger.error(`Error getting exam status for ${maDeThi}:`, error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi kiểm tra trạng thái đề thi',
                error: 'INTERNAL_SERVER_ERROR'
            };
        }
    }

    /**
     * Lấy tất cả multimedia files cho câu hỏi và câu trả lời
     */
    private async getMultimediaFiles(maCauHoiList: string[], maCauTraLoiList: string[]): Promise<Files[]> {
        const questionFiles = await this.filesRepository.find({
            where: { MaCauHoi: In(maCauHoiList) }
        });

        const answerFiles = await this.filesRepository.find({
            where: { MaCauTraLoi: In(maCauTraLoiList) }
        });

        return [...questionFiles, ...answerFiles];
    }

    private transformToExamDetails(
        deThi: DeThi,
        phans: Phan[],
        cauHois: CauHoi[],
        cauTraLois: CauTraLoi[],
        chiTietDeThi: ChiTietDeThi[],
        allFiles: Files[]
    ): ExamDetailsResponseDto {

        // Group files theo câu hỏi và câu trả lời
        const questionFilesMap = new Map<string, Files[]>();
        const answerFilesMap = new Map<string, Files[]>();

        allFiles.forEach(file => {
            if (file.MaCauHoi) {
                if (!questionFilesMap.has(file.MaCauHoi)) {
                    questionFilesMap.set(file.MaCauHoi, []);
                }
                questionFilesMap.get(file.MaCauHoi)!.push(file);
            }
            if (file.MaCauTraLoi) {
                if (!answerFilesMap.has(file.MaCauTraLoi)) {
                    answerFilesMap.set(file.MaCauTraLoi, []);
                }
                answerFilesMap.get(file.MaCauTraLoi)!.push(file);
            }
        });

        // Group câu trả lời theo câu hỏi
        const cauTraLoiMap = new Map<string, CauTraLoi[]>();
        cauTraLois.forEach(ctl => {
            if (!cauTraLoiMap.has(ctl.MaCauHoi)) {
                cauTraLoiMap.set(ctl.MaCauHoi, []);
            }
            cauTraLoiMap.get(ctl.MaCauHoi)!.push(ctl);
        });

        // Group câu hỏi theo phần
        const cauHoiMap = new Map<string, CauHoi[]>();
        chiTietDeThi.forEach(ctdt => {
            const cauHoi = cauHois.find(ch => ch.MaCauHoi === ctdt.MaCauHoi);
            if (cauHoi) {
                if (!cauHoiMap.has(ctdt.MaPhan)) {
                    cauHoiMap.set(ctdt.MaPhan, []);
                }
                cauHoiMap.get(ctdt.MaPhan)!.push(cauHoi);
            }
        });

        // Transform phần
        const transformedPhans: PhanIntegrationDto[] = [];

        if (deThi.LoaiBoChuongPhan) {
            // Nếu loại bỏ chương phần, gộp tất cả câu hỏi vào một phần duy nhất
            const allCauHois: CauHoiIntegrationDto[] = [];

            phans.forEach(phan => {
                const cauHoisOfPhan = cauHoiMap.get(phan.MaPhan) || [];
                cauHoisOfPhan.forEach(cauHoi => {
                    const cauTraLoisOfCauHoi = cauTraLoiMap.get(cauHoi.MaCauHoi) || [];

                    const transformedCauTraLois: CauTraLoiIntegrationDto[] = cauTraLoisOfCauHoi.map(ctl => {
                        const answerFiles = answerFilesMap.get(ctl.MaCauTraLoi) || [];
                        const multimedia = answerFiles.map(file => this.buildFileUrl(file));

                        return {
                            MaCauTraLoi: ctl.MaCauTraLoi,
                            NoiDung: ctl.NoiDung || '',
                            LaDapAn: ctl.LaDapAn.toString(),
                            ...(multimedia.length > 0 && { MultimediaFiles: multimedia })
                        };
                    });

                    // Lấy multimedia files cho câu hỏi
                    const questionFiles = questionFilesMap.get(cauHoi.MaCauHoi) || [];
                    const questionMultimedia = questionFiles.map(file => this.buildFileUrl(file));

                    allCauHois.push({
                        MaCauHoi: cauHoi.MaCauHoi,
                        NoiDung: cauHoi.NoiDung || '',
                        CauTraLois: transformedCauTraLois,
                        ...(questionMultimedia.length > 0 && { MultimediaFiles: questionMultimedia })
                    });
                });
            });

            // Tạo một phần duy nhất không có tên chương phần
            transformedPhans.push({
                MaPhan: 'combined-section',
                MaPhanCha: null,
                TenPhan: '', // Không hiển thị tên phần
                KieuNoiDung: '(-1) nhom thuong',
                NoiDung: '',
                SoLuongCauHoi: allCauHois.length.toString(),
                LaCauHoiNhom: 'false',
                CauHois: allCauHois
            });
        } else {
            // Giữ nguyên cấu trúc phần như cũ
            phans.forEach(phan => {
                const cauHoisOfPhan = cauHoiMap.get(phan.MaPhan) || [];

                const transformedCauHois: CauHoiIntegrationDto[] = cauHoisOfPhan.map(cauHoi => {
                    const cauTraLoisOfCauHoi = cauTraLoiMap.get(cauHoi.MaCauHoi) || [];

                    const transformedCauTraLois: CauTraLoiIntegrationDto[] = cauTraLoisOfCauHoi.map(ctl => {
                        const answerFiles = answerFilesMap.get(ctl.MaCauTraLoi) || [];
                        const multimedia = answerFiles.map(file => this.buildFileUrl(file));

                        return {
                            MaCauTraLoi: ctl.MaCauTraLoi,
                            NoiDung: ctl.NoiDung || '',
                            LaDapAn: ctl.LaDapAn.toString(),
                            ...(multimedia.length > 0 && { MultimediaFiles: multimedia })
                        };
                    });

                    // Lấy multimedia files cho câu hỏi
                    const questionFiles = questionFilesMap.get(cauHoi.MaCauHoi) || [];
                    const questionMultimedia = questionFiles.map(file => this.buildFileUrl(file));

                    return {
                        MaCauHoi: cauHoi.MaCauHoi,
                        NoiDung: cauHoi.NoiDung || '',
                        CauTraLois: transformedCauTraLois,
                        ...(questionMultimedia.length > 0 && { MultimediaFiles: questionMultimedia })
                    };
                });

                transformedPhans.push({
                    MaPhan: phan.MaPhan,
                    MaPhanCha: phan.MaPhanCha || undefined,
                    TenPhan: phan.TenPhan,
                    KieuNoiDung: this.determineContentType(phan),
                    NoiDung: phan.NoiDung || '',
                    SoLuongCauHoi: cauHoisOfPhan.length.toString(),
                    LaCauHoiNhom: phan.LaCauHoiNhom.toString(),
                    CauHois: transformedCauHois
                });
            });
        }

        return {
            MaDeThi: deThi.MaDeThi,
            TenDeThi: deThi.TenDeThi,
            NgayTao: this.formatDate(deThi.NgayTao),
            Phans: transformedPhans
        };
    }

    /**
     * Build multimedia file URL với DigitalOcean Spaces
     */
    private buildFileUrl(file: Files): any {
        return {
            MaFile: file.MaFile,
            TenFile: file.TenFile,
            LoaiFile: file.LoaiFile,
            CDNUrl: SpacesUrlBuilder.buildCdnUrl(file.TenFile, file.LoaiFile),
            PublicUrl: SpacesUrlBuilder.buildPublicUrl(file.TenFile, file.LoaiFile)
        };
    }

    /**
     * Xác định KieuNoiDung theo yêu cầu: -1 (normal group), 1 (fill-in-blank), 2 (audio content)
     */
    private determineContentType(phan: Phan): string {
        if (phan.LaCauHoiNhom) {
            return '-1'; // Normal group
        }

        // TODO: Implement logic để detect audio content và fill-in-blank
        // Có thể check NoiDung có chứa audio tags hoặc _____ patterns

        return '-1'; // Default: normal group
    }

    /**
     * Format date theo DD/MM/YYYY H:mm:ss
     */
    private formatDate(date: Date): string {
        if (!date) return '';

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
