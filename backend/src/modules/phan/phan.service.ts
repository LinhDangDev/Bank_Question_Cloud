import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phan } from '../../entities/phan.entity';
import { v4 as uuidv4 } from 'uuid';
import { CreatePhanDto, UpdatePhanDto } from '../../dto/phan.dto';

@Injectable()
export class PhanService {
    constructor(
        @InjectRepository(Phan)
        private readonly phanRepository: Repository<Phan>,
    ) { }

    async findAll(): Promise<Phan[]> {
        return await this.phanRepository.find({
            where: { XoaTamPhan: false },
            order: { ThuTu: 'ASC' },
            relations: ['MonHoc', 'MonHoc.Khoa']
        });
    }

    async findOne(id: string): Promise<Phan> {
        const phan = await this.phanRepository.findOne({
            where: { MaPhan: id },
            relations: ['MonHoc', 'MonHoc.Khoa', 'CauHoi']
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
            order: { ThuTu: 'ASC' },
            relations: ['MonHoc', 'MonHoc.Khoa']
        });
    }

    async create(phan: CreatePhanDto): Promise<Phan> {
        if (!phan.TenPhan) {
            throw new BadRequestException('TenPhan is required');
        }

        if (!phan.MaMonHoc) {
            throw new BadRequestException('MaMonHoc is required');
        }

        if (!phan.ThuTu) {
            throw new BadRequestException('ThuTu is required');
        }

        if (!phan.SoLuongCauHoi) {
            throw new BadRequestException('SoLuongCauHoi is required');
        }

        const existingPhan = await this.phanRepository.findOne({
            where: {
                TenPhan: phan.TenPhan,
                MaMonHoc: phan.MaMonHoc
            }
        });

        if (existingPhan) {
            throw new BadRequestException('Phần với tên này đã tồn tại trong môn học');
        }

        const newPhan = this.phanRepository.create({
            ...phan,
            MaPhan: uuidv4(),
            XoaTamPhan: false,
            LaCauHoiNhom: phan.LaCauHoiNhom || false,
            NgayTao: new Date(),
            NgaySua: new Date()
        });

        return await this.phanRepository.save(newPhan);
    }

    async update(maPhan: string, phan: UpdatePhanDto): Promise<Phan> {
        const existingPhan = await this.findOne(maPhan);

        if (phan.TenPhan && phan.TenPhan !== existingPhan.TenPhan) {
            const duplicatePhan = await this.phanRepository.findOne({
                where: {
                    TenPhan: phan.TenPhan,
                    MaMonHoc: existingPhan.MaMonHoc
                }
            });

            if (duplicatePhan) {
                throw new BadRequestException('Phần với tên này đã tồn tại trong môn học');
            }
        }

        const updateData = {
            ...phan,
            NgaySua: new Date()
        };

        await this.phanRepository.update(maPhan, updateData);
        return await this.findOne(maPhan);
    }

    async remove(maPhan: string): Promise<void> {
        const phan = await this.findOne(maPhan);
        await this.phanRepository.delete(maPhan);
    }

    async softDelete(maPhan: string): Promise<Phan> {
        const phan = await this.findOne(maPhan);
        phan.XoaTamPhan = true;
        phan.NgaySua = new Date();
        return await this.phanRepository.save(phan);
    }

    async restore(maPhan: string): Promise<Phan> {
        const phan = await this.findOne(maPhan);
        phan.XoaTamPhan = false;
        phan.NgaySua = new Date();
        return await this.phanRepository.save(phan);
    }
}
