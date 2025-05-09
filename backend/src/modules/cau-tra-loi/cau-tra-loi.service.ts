import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/base.service';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { CreateCauTraLoiDto, UpdateCauTraLoiDto } from '../../dto';

@Injectable()
export class CauTraLoiService extends BaseService<CauTraLoi> {
    constructor(
        @InjectRepository(CauTraLoi)
        private readonly cauTraLoiRepository: Repository<CauTraLoi>,
    ) {
        super(cauTraLoiRepository);
    }

    async findByMaCauHoi(maCauHoi: string): Promise<CauTraLoi[]> {
        return await this.cauTraLoiRepository.find({
            where: { MaCauHoi: maCauHoi },
            relations: ['Files'],
            order: { ThuTu: 'ASC' },
        });
    }

    async createCauTraLoi(createCauTraLoiDto: CreateCauTraLoiDto): Promise<CauTraLoi> {
        const cauTraLoi = this.cauTraLoiRepository.create(createCauTraLoiDto);
        return await this.cauTraLoiRepository.save(cauTraLoi);
    }

    async updateCauTraLoi(maCauTraLoi: string, updateCauTraLoiDto: UpdateCauTraLoiDto): Promise<CauTraLoi> {
        await this.cauTraLoiRepository.update(maCauTraLoi, updateCauTraLoiDto);
        return await this.findOne(maCauTraLoi);
    }
}
