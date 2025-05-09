import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/base.service';
import { DeThi } from '../../entities/de-thi.entity';
import { CreateDeThiDto, UpdateDeThiDto } from '../../dto';

@Injectable()
export class DeThiService extends BaseService<DeThi> {
    constructor(
        @InjectRepository(DeThi)
        private readonly deThiRepository: Repository<DeThi>,
    ) {
        super(deThiRepository);
    }

    async findByMaMonHoc(maMonHoc: string): Promise<DeThi[]> {
        return await this.deThiRepository.find({
            where: { MaMonHoc: maMonHoc },
            relations: ['ChiTietDeThi'],
            order: { NgayTao: 'DESC' },
        });
    }

    async createDeThi(createDeThiDto: CreateDeThiDto): Promise<DeThi> {
        const deThi = this.deThiRepository.create({
            ...createDeThiDto,
            NgayTao: new Date(),
        });
        return await this.deThiRepository.save(deThi);
    }

    async updateDeThi(maDeThi: string, updateDeThiDto: UpdateDeThiDto): Promise<DeThi> {
        await this.deThiRepository.update(maDeThi, updateDeThiDto);
        return await this.findOne(maDeThi);
    }

    async duyetDeThi(maDeThi: string): Promise<void> {
        await this.deThiRepository.update(maDeThi, { DaDuyet: true });
    }

    async huyDuyetDeThi(maDeThi: string): Promise<void> {
        await this.deThiRepository.update(maDeThi, { DaDuyet: false });
    }
}
