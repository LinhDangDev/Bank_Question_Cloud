import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonHoc } from '../../entities/mon-hoc.entity';

@Injectable()
export class MonHocService {
    constructor(
        @InjectRepository(MonHoc)
        private readonly monHocRepository: Repository<MonHoc>,
    ) { }

    async findAll(): Promise<MonHoc[]> {
        return await this.monHocRepository.find({
            where: { XoaTamMonHoc: false },
            order: { TenMonHoc: 'ASC' }
        });
    }

    async findOne(id: string): Promise<MonHoc> {
        const monHoc = await this.monHocRepository.findOne({
            where: { MaMonHoc: id }
        });

        if (!monHoc) {
            throw new NotFoundException(`Môn học với ID ${id} không tìm thấy`);
        }

        return monHoc;
    }

    async findByMaKhoa(maKhoa: string): Promise<MonHoc[]> {
        return await this.monHocRepository.find({
            where: {
                MaKhoa: maKhoa,
                XoaTamMonHoc: false
            },
            order: { TenMonHoc: 'ASC' }
        });
    }
}
