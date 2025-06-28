import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CauHoiChoDuyet } from '../../entities/cau-hoi-cho-duyet.entity';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { User } from '../../entities/user.entity';
import { CreateCauHoiChoDuyetDto, UpdateCauHoiChoDuyetDto, DuyetCauHoiDto } from '../../dto/cau-hoi-cho-duyet.dto';
import { PaginationDto } from '../../dto/pagination.dto';
import { NotificationHelperService } from '../../common/services/notification-helper.service';

@Injectable()
export class CauHoiChoDuyetService {
    constructor(
        @InjectRepository(CauHoiChoDuyet)
        private readonly cauHoiChoDuyetRepository: Repository<CauHoiChoDuyet>,
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
        @InjectRepository(CauTraLoi)
        private readonly cauTraLoiRepository: Repository<CauTraLoi>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly dataSource: DataSource,
        private readonly notificationHelper: NotificationHelperService,
    ) { }

    async findAll(paginationDto: PaginationDto, trangThai?: number, nguoiTao?: string) {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.cauHoiChoDuyetRepository
            .createQueryBuilder('chd')
            .leftJoinAndSelect('chd.Teacher', 'teacher')
            .leftJoinAndSelect('chd.Admin', 'admin')
            .leftJoinAndSelect('chd.Phan', 'phan')
            .leftJoinAndSelect('chd.CLO', 'clo');

        if (trangThai !== undefined) {
            queryBuilder.andWhere('chd.TrangThai = :trangThai', { trangThai });
        }

        if (nguoiTao) {
            queryBuilder.andWhere('chd.NguoiTao = :nguoiTao', { nguoiTao });
        }

        queryBuilder
            .orderBy('chd.NgayTao', 'DESC')
            .skip(skip)
            .take(limit);

        const [items, total] = await queryBuilder.getManyAndCount();

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: string): Promise<CauHoiChoDuyet> {
        const cauHoi = await this.cauHoiChoDuyetRepository.findOne({
            where: { MaCauHoiChoDuyet: id },
            relations: ['Teacher', 'Admin', 'Phan', 'CLO'],
        });

        if (!cauHoi) {
            throw new NotFoundException(`Câu hỏi chờ duyệt với ID ${id} không tìm thấy`);
        }

        return cauHoi;
    }

    async create(createDto: CreateCauHoiChoDuyetDto): Promise<CauHoiChoDuyet> {
        const cauHoi = this.cauHoiChoDuyetRepository.create({
            ...createDto,
            NgayTao: new Date(),
            TrangThai: 0, // Chờ duyệt
        });

        const savedCauHoi = await this.cauHoiChoDuyetRepository.save(cauHoi);

        // Gửi thông báo cho teacher
        try {
            await this.notificationHelper.notifyQuestionSubmitted(
                createDto.NguoiTao,
                savedCauHoi.MaCauHoiChoDuyet
            );

            // Gửi thông báo cho admin
            const admins = await this.userRepository.find({
                where: { IsBuildInUser: true }, // Assuming admins are built-in users
            });

            if (admins.length > 0) {
                const teacher = await this.userRepository.findOne({
                    where: { UserId: createDto.NguoiTao }
                });

                const adminIds = admins.map(admin => admin.UserId);
                await this.notificationHelper.notifyAdminsNewQuestionSubmission(
                    adminIds,
                    teacher?.Name || 'Unknown Teacher',
                    savedCauHoi.MaCauHoiChoDuyet
                );
            }
        } catch (error) {
            console.error('Failed to send notifications:', error);
        }

        return savedCauHoi;
    }

    async update(id: string, updateDto: UpdateCauHoiChoDuyetDto): Promise<CauHoiChoDuyet> {
        const cauHoi = await this.findOne(id);
        Object.assign(cauHoi, updateDto);
        return await this.cauHoiChoDuyetRepository.save(cauHoi);
    }

    async duyetCauHoi(duyetDto: DuyetCauHoiDto, nguoiDuyet: string): Promise<CauHoi | null> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const cauHoiChoDuyet = await this.findOne(duyetDto.MaCauHoiChoDuyet);

            if (cauHoiChoDuyet.TrangThai !== 0) {
                throw new BadRequestException('Câu hỏi này đã được xử lý');
            }

            // Cập nhật trạng thái câu hỏi chờ duyệt
            cauHoiChoDuyet.TrangThai = duyetDto.TrangThai;
            cauHoiChoDuyet.GhiChu = duyetDto.GhiChu || '';
            cauHoiChoDuyet.NguoiDuyet = nguoiDuyet;
            cauHoiChoDuyet.NgayDuyet = new Date();

            if (duyetDto.MaPhan) {
                cauHoiChoDuyet.MaPhan = duyetDto.MaPhan;
            }

            await queryRunner.manager.save(cauHoiChoDuyet);

            let cauHoiMoi: CauHoi | null = null;

            // Nếu duyệt (TrangThai = 1), tạo câu hỏi thật
            if (duyetDto.TrangThai === 1) {
                cauHoiMoi = await this.taoTuCauHoiChoDuyet(cauHoiChoDuyet, queryRunner);
            }

            await queryRunner.commitTransaction();

            // Gửi thông báo sau khi commit thành công
            try {
                const admin = await this.userRepository.findOne({
                    where: { UserId: nguoiDuyet }
                });

                if (duyetDto.TrangThai === 1) {
                    // Câu hỏi được duyệt
                    await this.notificationHelper.notifyQuestionApproved(
                        cauHoiChoDuyet.NguoiTao,
                        cauHoiMoi?.MaCauHoi || '',
                        admin?.Name || 'Admin'
                    );
                } else if (duyetDto.TrangThai === 2) {
                    // Câu hỏi bị từ chối
                    await this.notificationHelper.notifyQuestionRejected(
                        cauHoiChoDuyet.NguoiTao,
                        cauHoiChoDuyet.MaCauHoiChoDuyet,
                        admin?.Name || 'Admin',
                        duyetDto.GhiChu || 'Không có lý do cụ thể'
                    );
                }
            } catch (error) {
                console.error('Failed to send approval/rejection notifications:', error);
            }

            return cauHoiMoi;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async taoTuCauHoiChoDuyet(cauHoiChoDuyet: CauHoiChoDuyet, queryRunner: any): Promise<CauHoi> {
        // Tạo câu hỏi chính
        const cauHoi = new CauHoi();
        cauHoi.MaPhan = cauHoiChoDuyet.MaPhan;
        cauHoi.MaSoCauHoi = typeof cauHoiChoDuyet.MaSoCauHoi === 'string'
            ? parseInt(cauHoiChoDuyet.MaSoCauHoi)
            : cauHoiChoDuyet.MaSoCauHoi;
        cauHoi.NoiDung = cauHoiChoDuyet.NoiDung;
        cauHoi.HoanVi = cauHoiChoDuyet.HoanVi;
        cauHoi.CapDo = cauHoiChoDuyet.CapDo;
        cauHoi.SoCauHoiCon = cauHoiChoDuyet.SoCauHoiCon;
        cauHoi.DoPhanCachCauHoi = cauHoiChoDuyet.DoPhanCachCauHoi !== undefined && cauHoiChoDuyet.DoPhanCachCauHoi !== null
            ? (typeof cauHoiChoDuyet.DoPhanCachCauHoi === 'string'
                ? parseInt(cauHoiChoDuyet.DoPhanCachCauHoi)
                : cauHoiChoDuyet.DoPhanCachCauHoi)
            : 0;
        cauHoi.MaCauHoiCha = cauHoiChoDuyet.MaCauHoiCha;
        cauHoi.XoaTamCauHoi = false;
        cauHoi.SoLanDuocThi = 0;
        cauHoi.SoLanDung = 0;
        cauHoi.NgayTao = new Date();
        cauHoi.MaCLO = cauHoiChoDuyet.MaCLO;

        const cauHoiDaLuu = await queryRunner.manager.save(CauHoi, cauHoi);

        // Tạo câu trả lời nếu có
        if (cauHoiChoDuyet.DuLieuCauTraLoi) {
            try {
                const cauTraLoiData = JSON.parse(cauHoiChoDuyet.DuLieuCauTraLoi);
                if (Array.isArray(cauTraLoiData)) {
                    for (const traLoiData of cauTraLoiData) {
                        const cauTraLoi = new CauTraLoi();
                        cauTraLoi.MaCauHoi = cauHoiDaLuu.MaCauHoi;
                        cauTraLoi.NoiDung = traLoiData.NoiDung;
                        cauTraLoi.ThuTu = traLoiData.ThuTu;
                        cauTraLoi.LaDapAn = traLoiData.LaDapAn;
                        cauTraLoi.HoanVi = traLoiData.HoanVi || true;

                        await queryRunner.manager.save(CauTraLoi, cauTraLoi);
                    }
                }
            } catch (error) {
                console.error('Lỗi parse dữ liệu câu trả lời:', error);
            }
        }

        // Tạo câu hỏi con nếu có
        if (cauHoiChoDuyet.DuLieuCauHoiCon) {
            try {
                const cauHoiConData = JSON.parse(cauHoiChoDuyet.DuLieuCauHoiCon);
                if (Array.isArray(cauHoiConData)) {
                    for (const conData of cauHoiConData) {
                        const cauHoiCon = new CauHoi();
                        cauHoiCon.MaPhan = cauHoiDaLuu.MaPhan;
                        cauHoiCon.MaSoCauHoi = typeof conData.MaSoCauHoi === 'string'
                            ? parseInt(conData.MaSoCauHoi)
                            : conData.MaSoCauHoi;
                        cauHoiCon.NoiDung = conData.NoiDung;
                        cauHoiCon.HoanVi = conData.HoanVi;
                        cauHoiCon.CapDo = conData.CapDo;
                        cauHoiCon.SoCauHoiCon = 0;
                        cauHoiCon.MaCauHoiCha = cauHoiDaLuu.MaCauHoi;
                        cauHoiCon.XoaTamCauHoi = false;
                        cauHoiCon.SoLanDuocThi = 0;
                        cauHoiCon.SoLanDung = 0;
                        cauHoiCon.NgayTao = new Date();
                        cauHoiCon.MaCLO = conData.MaCLO;

                        const cauHoiConDaLuu = await queryRunner.manager.save(CauHoi, cauHoiCon);

                        // Tạo câu trả lời cho câu hỏi con
                        if (conData.CauTraLoi && Array.isArray(conData.CauTraLoi)) {
                            for (const traLoiData of conData.CauTraLoi) {
                                const cauTraLoi = new CauTraLoi();
                                cauTraLoi.MaCauHoi = cauHoiConDaLuu.MaCauHoi;
                                cauTraLoi.NoiDung = traLoiData.NoiDung;
                                cauTraLoi.ThuTu = traLoiData.ThuTu;
                                cauTraLoi.LaDapAn = traLoiData.LaDapAn;
                                cauTraLoi.HoanVi = traLoiData.HoanVi || true;

                                await queryRunner.manager.save(CauTraLoi, cauTraLoi);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Lỗi parse dữ liệu câu hỏi con:', error);
            }
        }

        return cauHoiDaLuu;
    }

    async remove(id: string): Promise<void> {
        const cauHoi = await this.findOne(id);
        await this.cauHoiChoDuyetRepository.remove(cauHoi);
    }

    async getStatistics(nguoiTao?: string) {
        const queryBuilder = this.cauHoiChoDuyetRepository.createQueryBuilder('chd');

        if (nguoiTao) {
            queryBuilder.where('chd.NguoiTao = :nguoiTao', { nguoiTao });
        }

        const [
            total,
            choDuyet,
            daDuyet,
            tuChoi
        ] = await Promise.all([
            queryBuilder.getCount(),
            queryBuilder.clone().andWhere('chd.TrangThai = 0').getCount(),
            queryBuilder.clone().andWhere('chd.TrangThai = 1').getCount(),
            queryBuilder.clone().andWhere('chd.TrangThai = 2').getCount(),
        ]);

        return {
            total,
            choDuyet,
            daDuyet,
            tuChoi
        };
    }
}
