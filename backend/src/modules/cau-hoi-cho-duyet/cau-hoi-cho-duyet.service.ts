import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
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
                where: { LaNguoiDungHeThong: true }, // Assuming admins are built-in users
            });

            if (admins.length > 0) {
                const teacher = await this.userRepository.findOne({
                    where: { MaNguoiDung: createDto.NguoiTao }
                });

                const adminIds = admins.map(admin => admin.MaNguoiDung);
                await this.notificationHelper.notifyAdminsNewQuestionSubmission(
                    adminIds,
                    teacher?.HoTen || 'Unknown Teacher',
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
                    where: { MaNguoiDung: nguoiDuyet }
                });

                if (duyetDto.TrangThai === 1) {
                    // Câu hỏi được duyệt
                    await this.notificationHelper.notifyQuestionApproved(
                        cauHoiChoDuyet.NguoiTao,
                        cauHoiMoi?.MaCauHoi || '',
                        admin?.HoTen || 'Admin'
                    );
                } else if (duyetDto.TrangThai === 2) {
                    // Câu hỏi bị từ chối
                    await this.notificationHelper.notifyQuestionRejected(
                        cauHoiChoDuyet.NguoiTao,
                        cauHoiChoDuyet.MaCauHoiChoDuyet,
                        admin?.HoTen || 'Admin',
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
        // Tạo câu hỏi chính với UUID được tạo thủ công
        const cauHoiUUID = uuidv4();

        // Thực hiện truy vấn SQL trực tiếp để có quyền kiểm soát tốt hơn
        await queryRunner.query(`
            INSERT INTO "CauHoi" (
                "MaCauHoi", "MaPhan", "MaSoCauHoi", "NoiDung",
                "HoanVi", "CapDo", "SoCauHoiCon", "DoPhanCachCauHoi",
                "MaCauHoiCha", "XoaTamCauHoi", "SoLanDuocThi", "SoLanDung",
                "NgayTao", "MaCLO", "NguoiTao"
            )
            VALUES (
                @0, @1, @2, @3,
                @4, @5, @6, @7,
                @8, @9, @10, @11,
                @12, @13, @14
            )
        `, [
            cauHoiUUID, // @0 - MaCauHoi
            cauHoiChoDuyet.MaPhan, // @1 - MaPhan
            typeof cauHoiChoDuyet.MaSoCauHoi === 'string' ? parseInt(cauHoiChoDuyet.MaSoCauHoi) : cauHoiChoDuyet.MaSoCauHoi, // @2 - MaSoCauHoi
            cauHoiChoDuyet.NoiDung, // @3 - NoiDung
            cauHoiChoDuyet.HoanVi ? 1 : 0, // @4 - HoanVi
            cauHoiChoDuyet.CapDo, // @5 - CapDo
            cauHoiChoDuyet.SoCauHoiCon || 0, // @6 - SoCauHoiCon
            cauHoiChoDuyet.DoPhanCachCauHoi !== undefined && cauHoiChoDuyet.DoPhanCachCauHoi !== null
                ? (typeof cauHoiChoDuyet.DoPhanCachCauHoi === 'string'
                    ? parseFloat(cauHoiChoDuyet.DoPhanCachCauHoi)
                    : cauHoiChoDuyet.DoPhanCachCauHoi)
                : 0, // @7 - DoPhanCachCauHoi
            cauHoiChoDuyet.MaCauHoiCha, // @8 - MaCauHoiCha
            0, // @9 - XoaTamCauHoi
            0, // @10 - SoLanDuocThi
            0, // @11 - SoLanDung
            new Date(), // @12 - NgayTao
            cauHoiChoDuyet.MaCLO, // @13 - MaCLO
            cauHoiChoDuyet.NguoiTao, // @14 - NguoiTao
        ]);

        // Truy vấn câu hỏi vừa tạo để có thông tin đầy đủ
        const cauHoiDaLuu = await queryRunner.manager.findOne(CauHoi, {
            where: { MaCauHoi: cauHoiUUID }
        });

        // Tạo câu trả lời nếu có
        if (cauHoiChoDuyet.DuLieuCauTraLoi) {
            try {
                const cauTraLoiData = JSON.parse(cauHoiChoDuyet.DuLieuCauTraLoi);
                if (Array.isArray(cauTraLoiData)) {
                    for (const traLoiData of cauTraLoiData) {
                        // Tạo UUID mới cho câu trả lời
                        const cauTraLoiUUID = uuidv4();

                        await queryRunner.query(`
                            INSERT INTO "CauTraLoi" (
                                "MaCauTraLoi", "MaCauHoi", "NoiDung",
                                "ThuTu", "LaDapAn", "HoanVi"
                            )
                            VALUES (
                                @0, @1, @2,
                                @3, @4, @5
                            )
                        `, [
                            cauTraLoiUUID, // @0 - MaCauTraLoi
                            cauHoiUUID, // @1 - MaCauHoi
                            traLoiData.NoiDung, // @2 - NoiDung
                            traLoiData.ThuTu, // @3 - ThuTu
                            traLoiData.LaDapAn ? 1 : 0, // @4 - LaDapAn
                            traLoiData.HoanVi !== undefined ? (traLoiData.HoanVi ? 1 : 0) : 1, // @5 - HoanVi
                        ]);
                    }
                }
            } catch (error) {
                console.error('Lỗi parse dữ liệu câu trả lời:', error);
                throw error;
            }
        }

        // Tạo câu hỏi con nếu có
        if (cauHoiChoDuyet.DuLieuCauHoiCon) {
            try {
                const cauHoiConData = JSON.parse(cauHoiChoDuyet.DuLieuCauHoiCon);
                if (Array.isArray(cauHoiConData)) {
                    for (const conData of cauHoiConData) {
                        // Tạo UUID mới cho câu hỏi con
                        const cauHoiConUUID = uuidv4();

                        await queryRunner.query(`
                            INSERT INTO "CauHoi" (
                                "MaCauHoi", "MaPhan", "MaSoCauHoi", "NoiDung",
                                "HoanVi", "CapDo", "SoCauHoiCon", "DoPhanCachCauHoi",
                                "MaCauHoiCha", "XoaTamCauHoi", "SoLanDuocThi", "SoLanDung",
                                "NgayTao", "MaCLO", "NguoiTao"
                            )
                            VALUES (
                                @0, @1, @2, @3,
                                @4, @5, @6, @7,
                                @8, @9, @10, @11,
                                @12, @13, @14
                            )
                        `, [
                            cauHoiConUUID, // @0 - MaCauHoi
                            cauHoiDaLuu.MaPhan, // @1 - MaPhan
                            typeof conData.MaSoCauHoi === 'string' ? parseInt(conData.MaSoCauHoi) : conData.MaSoCauHoi, // @2 - MaSoCauHoi
                            conData.NoiDung, // @3 - NoiDung
                            conData.HoanVi ? 1 : 0, // @4 - HoanVi
                            conData.CapDo, // @5 - CapDo
                            0, // @6 - SoCauHoiCon
                            0, // @7 - DoPhanCachCauHoi
                            cauHoiUUID, // @8 - MaCauHoiCha
                            0, // @9 - XoaTamCauHoi
                            0, // @10 - SoLanDuocThi
                            0, // @11 - SoLanDung
                            new Date(), // @12 - NgayTao
                            conData.MaCLO, // @13 - MaCLO
                            cauHoiChoDuyet.NguoiTao, // @14 - NguoiTao
                        ]);

                        // Tạo câu trả lời cho câu hỏi con
                        if (conData.CauTraLoi && Array.isArray(conData.CauTraLoi)) {
                            for (const traLoiData of conData.CauTraLoi) {
                                // Tạo UUID mới cho câu trả lời con
                                const cauTraLoiConUUID = uuidv4();

                                await queryRunner.query(`
                                    INSERT INTO "CauTraLoi" (
                                        "MaCauTraLoi", "MaCauHoi", "NoiDung",
                                        "ThuTu", "LaDapAn", "HoanVi"
                                    )
                                    VALUES (
                                        @0, @1, @2,
                                        @3, @4, @5
                                    )
                                `, [
                                    cauTraLoiConUUID, // @0 - MaCauTraLoi
                                    cauHoiConUUID, // @1 - MaCauHoi
                                    traLoiData.NoiDung, // @2 - NoiDung
                                    traLoiData.ThuTu, // @3 - ThuTu
                                    traLoiData.LaDapAn ? 1 : 0, // @4 - LaDapAn
                                    traLoiData.HoanVi !== undefined ? (traLoiData.HoanVi ? 1 : 0) : 1, // @5 - HoanVi
                                ]);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Lỗi parse dữ liệu câu hỏi con:', error);
                throw error;
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
