import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/base.service';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { CreateChiTietDeThiDto, UpdateChiTietDeThiDto } from '../../dto';

@Injectable()
export class ChiTietDeThiService extends BaseService<ChiTietDeThi> {
    constructor(
        @InjectRepository(ChiTietDeThi)
        private readonly chiTietDeThiRepository: Repository<ChiTietDeThi>,
    ) {
        super(chiTietDeThiRepository);
    }

    async findByMaDeThi(maDeThi: string): Promise<ChiTietDeThi[]> {
        return await this.chiTietDeThiRepository.find({
            where: { MaDeThi: maDeThi },
            relations: ['CauHoi', 'Phan'],
            order: { ThuTu: 'ASC' },
        });
    }

    async findByMaPhan(maPhan: string): Promise<ChiTietDeThi[]> {
        return await this.chiTietDeThiRepository.find({
            where: { MaPhan: maPhan },
            relations: ['CauHoi', 'DeThi'],
            order: { ThuTu: 'ASC' },
        });
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
