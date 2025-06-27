import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CLO } from '../../entities/clo.entity';
import { CreateCLODto, UpdateCLODto } from '../../dto/clo.dto';

@Injectable()
export class CLOService {
    constructor(
        @InjectRepository(CLO)
        private readonly cloRepository: Repository<CLO>,
    ) { }

    async findAll(): Promise<CLO[]> {
        return await this.cloRepository.find({
            relations: ['MonHoc'],
            order: { ThuTu: 'ASC' }
        });
    }

    async findByMonHoc(maMonHoc: string): Promise<CLO[]> {
        return await this.cloRepository.find({
            where: { MaMonHoc: maMonHoc },
            relations: ['MonHoc'],
            order: { ThuTu: 'ASC' }
        });
    }

    async findOne(id: string): Promise<CLO> {
        const clo = await this.cloRepository.findOne({
            where: { MaCLO: id },
            relations: ['MonHoc']
        });

        if (!clo) {
            throw new NotFoundException(`CLO với ID ${id} không tìm thấy`);
        }

        return clo;
    }

    async create(createCLODto: CreateCLODto): Promise<CLO> {
        const clo = this.cloRepository.create(createCLODto);
        return await this.cloRepository.save(clo);
    }

    async update(id: string, updateCLODto: UpdateCLODto): Promise<CLO> {
        const clo = await this.findOne(id);
        Object.assign(clo, updateCLODto);
        return await this.cloRepository.save(clo);
    }

    async remove(id: string): Promise<void> {
        const clo = await this.findOne(id);
        await this.cloRepository.remove(clo);
    }
}
