import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Khoa } from '../../entities/khoa.entity';

@Injectable()
export class KhoaService {
    constructor(
        @InjectRepository(Khoa)
        private khoaRepository: Repository<Khoa>,
    ) { }

    findAll() {
        return this.khoaRepository.find();
    }

    async findOne(MaKhoa: string) {
        const khoa = await this.khoaRepository.findOne({ where: { MaKhoa } });
        if (!khoa) {
            throw new NotFoundException(`Khoa with ID ${MaKhoa} not found`);
        }
        return khoa;
    }

    create(khoa: Partial<Khoa>) {
        const newKhoa = this.khoaRepository.create(khoa);
        return this.khoaRepository.save(newKhoa);
    }

    async update(MaKhoa: string, khoa: Partial<Khoa>) {
        await this.findOne(MaKhoa);
        await this.khoaRepository.update(MaKhoa, khoa);
        return this.findOne(MaKhoa);
    }

    async remove(MaKhoa: string) {
        const khoa = await this.findOne(MaKhoa);
        return this.khoaRepository.remove(khoa);
    }

    async softDelete(MaKhoa: string) {
        const khoa = await this.findOne(MaKhoa);
        khoa.XoaTamKhoa = true;
        return this.khoaRepository.save(khoa);
    }

    async restore(MaKhoa: string) {
        const khoa = await this.khoaRepository.findOne({ where: { MaKhoa } });
        if (!khoa) {
            throw new NotFoundException(`Khoa with ID ${MaKhoa} not found`);
        }
        khoa.XoaTamKhoa = false;
        return this.khoaRepository.save(khoa);
    }
}
