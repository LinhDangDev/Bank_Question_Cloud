import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/base.service';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CreateCauHoiDto, UpdateCauHoiDto } from '../../dto';

@Injectable()
export class CauHoiService extends BaseService<CauHoi> {
    constructor(
        @InjectRepository(CauHoi)
        private readonly cauHoiRepository: Repository<CauHoi>,
    ) {
        super(cauHoiRepository, 'MaCauHoi');
    }

    async findByMaPhan(maPhan: string): Promise<CauHoi[]> {
        return await this.cauHoiRepository.find({
            where: { MaPhan: maPhan },
            relations: ['CauTraLoi', 'Files'],
        });
    }

    async findByMaCLO(maCLO: string): Promise<CauHoi[]> {
        return await this.cauHoiRepository.find({
            where: { MaCLO: maCLO },
            relations: ['CauTraLoi', 'Files'],
        });
    }

    async findByCauHoiCha(maCauHoiCha: string): Promise<CauHoi[]> {
        return await this.cauHoiRepository.find({
            where: { MaCauHoiCha: maCauHoiCha },
            relations: ['CauTraLoi', 'Files'],
        });
    }

    async createCauHoi(createCauHoiDto: CreateCauHoiDto): Promise<CauHoi> {
        const cauHoi = this.cauHoiRepository.create({
            ...createCauHoiDto,
            NgayTao: new Date(),
        });
        return await this.cauHoiRepository.save(cauHoi);
    }

    async updateCauHoi(maCauHoi: string, updateCauHoiDto: UpdateCauHoiDto): Promise<CauHoi> {
        await this.cauHoiRepository.update(maCauHoi, {
            ...updateCauHoiDto,
            NgaySua: new Date(),
        });
        return await this.findOne(maCauHoi);
    }

    async softDeleteCauHoi(maCauHoi: string): Promise<void> {
        await this.cauHoiRepository.update(maCauHoi, {
            XoaTamCauHoi: true,
            NgaySua: new Date(),
        });
    }

    async restoreCauHoi(maCauHoi: string): Promise<void> {
        await this.cauHoiRepository.update(maCauHoi, {
            XoaTamCauHoi: false,
            NgaySua: new Date(),
        });
    }
}
