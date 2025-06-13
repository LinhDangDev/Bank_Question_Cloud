import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CLO } from '../../entities/clo.entity';

@Injectable()
export class CLOService {
    constructor(
        @InjectRepository(CLO)
        private readonly cloRepository: Repository<CLO>,
    ) { }

    async findAll(): Promise<CLO[]> {
        return await this.cloRepository.find({
            order: { TenCLO: 'ASC' }
        });
    }

    async findOne(id: string): Promise<CLO> {
        const clo = await this.cloRepository.findOne({
            where: { MaCLO: id }
        });

        if (!clo) {
            throw new NotFoundException(`CLO với ID ${id} không tìm thấy`);
        }

        return clo;
    }
}
