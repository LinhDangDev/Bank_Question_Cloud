import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/base.service';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { CreateChiTietDeThiDto, UpdateChiTietDeThiDto } from '../../dto';
import { PaginationDto } from '../../dto/pagination.dto';
import { PAGINATION_CONSTANTS } from '../../constants/pagination.constants';

@Injectable()
export class ChiTietDeThiService extends BaseService<ChiTietDeThi> {
    constructor(
        @InjectRepository(ChiTietDeThi)
        private readonly chiTietDeThiRepository: Repository<ChiTietDeThi>,
    ) {
        super(chiTietDeThiRepository);
    }

    async findByMaDeThi(maDeThi: string, paginationDto?: PaginationDto) {
        if (!paginationDto) {
            return await this.chiTietDeThiRepository.find({
                where: { MaDeThi: maDeThi },
                relations: ['CauHoi', 'Phan'],
                order: { ThuTu: 'ASC' },
            });
        }
        const { page = PAGINATION_CONSTANTS.DEFAULT_PAGE, limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT } = paginationDto;
        const [items, total] = await this.chiTietDeThiRepository.findAndCount({
            where: { MaDeThi: maDeThi },
            relations: ['CauHoi', 'Phan'],
            order: { ThuTu: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                availableLimits: PAGINATION_CONSTANTS.AVAILABLE_LIMITS
            }
        };
    }

    async findByMaPhan(maPhan: string, paginationDto?: PaginationDto) {
        if (!paginationDto) {
            return await this.chiTietDeThiRepository.find({
                where: { MaPhan: maPhan },
                relations: ['CauHoi', 'DeThi'],
                order: { ThuTu: 'ASC' },
            });
        }
        const { page = PAGINATION_CONSTANTS.DEFAULT_PAGE, limit = PAGINATION_CONSTANTS.DEFAULT_LIMIT } = paginationDto;
        const [items, total] = await this.chiTietDeThiRepository.findAndCount({
            where: { MaPhan: maPhan },
            relations: ['CauHoi', 'DeThi'],
            order: { ThuTu: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                availableLimits: PAGINATION_CONSTANTS.AVAILABLE_LIMITS
            }
        };
    }

    async createChiTietDeThi(createChiTietDeThiDto: CreateChiTietDeThiDto): Promise<ChiTietDeThi> {
        const chiTietDeThi = this.chiTietDeThiRepository.create(createChiTietDeThiDto);
        return await this.chiTietDeThiRepository.save(chiTietDeThi);
    }

    async updateChiTietDeThi(
        maDeThi: string,
        maPhan: string,
        maCauHoi: string,
        updateChiTietDeThiDto: UpdateChiTietDeThiDto,
    ): Promise<ChiTietDeThi> {
        await this.chiTietDeThiRepository.update(
            { MaDeThi: maDeThi, MaPhan: maPhan, MaCauHoi: maCauHoi },
            updateChiTietDeThiDto,
        );
        const result = await this.chiTietDeThiRepository.findOne({
            where: { MaDeThi: maDeThi, MaPhan: maPhan, MaCauHoi: maCauHoi },
        });
        if (!result) throw new NotFoundException('Không tìm thấy chi tiết đề thi');
        return result;
    }

    async deleteChiTietDeThi(maDeThi: string, maPhan: string, maCauHoi: string): Promise<void> {
        await this.chiTietDeThiRepository.delete({
            MaDeThi: maDeThi,
            MaPhan: maPhan,
            MaCauHoi: maCauHoi,
        });
    }
}
