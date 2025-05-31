import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/base.service';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CreateCauHoiDto, UpdateCauHoiDto } from '../../dto';
import { PaginationDto } from '../../dto/pagination.dto';

@Injectable()
export class CauHoiService extends BaseService<CauHoi> {
    constructor(
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
    ) {
        super(cauHoiRepository, 'MaCauHoi');
    }

    async findAll(paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const [items, total] = await this.cauHoiRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            }
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findOne(id: string): Promise<CauHoi> {
        const cauHoi = await this.cauHoiRepository.findOne({ where: { MaCauHoi: id } });
        if (!cauHoi) {
            throw new NotFoundException(`CauHoi with ID ${id} not found`);
        }
        return cauHoi;
    }

    async findByMaPhan(maPhan: string, paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const [items, total] = await this.cauHoiRepository.findAndCount({
            where: { MaPhan: maPhan },
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            }
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findByMaCLO(maCLO: string, paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const [items, total] = await this.cauHoiRepository.findAndCount({
            where: { MaCLO: maCLO },
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            }
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async findByCauHoiCha(maCauHoiCha: string, paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const [items, total] = await this.cauHoiRepository.findAndCount({
            where: { MaCauHoiCha: maCauHoiCha },
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayTao: 'DESC'
            }
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async createCauHoi(createCauHoiDto: CreateCauHoiDto): Promise<CauHoi> {
        const cauHoi = this.cauHoiRepository.create(createCauHoiDto);
        return await this.cauHoiRepository.save(cauHoi);
    }

    async updateCauHoi(id: string, updateCauHoiDto: UpdateCauHoiDto): Promise<CauHoi> {
        await this.findOne(id);
        await this.cauHoiRepository.update(id, updateCauHoiDto);
        return await this.findOne(id);
    }

    async delete(id: string): Promise<void> {
        const cauHoi = await this.findOne(id);
        await this.cauHoiRepository.remove(cauHoi);
    }

    async softDeleteCauHoi(id: string): Promise<void> {
        const cauHoi = await this.findOne(id);
        cauHoi.XoaTamCauHoi = true;
        await this.cauHoiRepository.save(cauHoi);
    }

    async restoreCauHoi(maCauHoi: string): Promise<void> {
        await this.cauHoiRepository.update(maCauHoi, {
            XoaTamCauHoi: false,
            NgaySua: new Date(),
        });
    }
}
