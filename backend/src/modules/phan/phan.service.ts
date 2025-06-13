import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phan } from '../../entities/phan.entity';

@Injectable()
export class PhanService {
    constructor(
        @InjectRepository(Phan)
        private readonly phanRepository: Repository<Phan>,
    ) { }

    async findAll(): Promise<Phan[]> {
        return await this.phanRepository.find({
            where: { XoaTamPhan: false },
            order: { ThuTu: 'ASC' }
        });
    }

    async findOne(id: string): Promise<Phan> {
        const phan = await this.phanRepository.findOne({
            where: { MaPhan: id }
        });

        if (!phan) {
            throw new NotFoundException(`Phần với ID ${id} không tìm thấy`);
        }

        return phan;
    }

    async findByMaMonHoc(maMonHoc: string): Promise<Phan[]> {
        return await this.phanRepository.find({
            where: {
                MaMonHoc: maMonHoc,
                XoaTamPhan: false
            },
            order: { ThuTu: 'ASC' }
        });
    }
}
