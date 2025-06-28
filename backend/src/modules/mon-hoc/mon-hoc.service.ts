import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonHoc } from '../../entities/mon-hoc.entity';
import { v4 as uuidv4 } from 'uuid';
import { CreateMonHocDto, UpdateMonHocDto } from '../../dto/mon-hoc.dto';

@Injectable()
export class MonHocService {
    constructor(
        @InjectRepository(MonHoc)
        private readonly monHocRepository: Repository<MonHoc>,
    ) { }

    async findAll(): Promise<MonHoc[]> {
        return await this.monHocRepository.find({
            where: { XoaTamMonHoc: false },
            order: { TenMonHoc: 'ASC' },
            relations: ['Khoa']
        });
    }

    async findOne(id: string): Promise<MonHoc> {
        const monHoc = await this.monHocRepository.findOne({
            where: { MaMonHoc: id },
            relations: ['Khoa', 'Phan']
        });

        if (!monHoc) {
            throw new NotFoundException(`Môn học với ID ${id} không tìm thấy`);
        }

        return monHoc;
    }

    async findByMaKhoa(maKhoa: string): Promise<MonHoc[]> {
        // Check if maKhoa is undefined, null, or not a valid UUID
        if (!maKhoa || maKhoa === 'undefined' || maKhoa === 'null') {
            console.log(`Invalid maKhoa value: ${maKhoa}, returning empty array`);
            return [];
        }

        try {
            return await this.monHocRepository.find({
                where: {
                    MaKhoa: maKhoa,
                    XoaTamMonHoc: false
                },
                order: { TenMonHoc: 'ASC' },
                relations: ['Khoa']
            });
        } catch (error) {
            console.error(`Error in findByMaKhoa: ${error.message}`);
            if (error.code === 'EPARAM' && error.message.includes('Invalid GUID')) {
                console.log(`Invalid GUID format for maKhoa: ${maKhoa}, returning empty array`);
                return [];
            }
            throw error;
        }
    }

    async create(monHoc: CreateMonHocDto): Promise<MonHoc> {
        if (!monHoc.TenMonHoc) {
            throw new BadRequestException('TenMonHoc is required');
        }

        if (!monHoc.MaKhoa) {
            throw new BadRequestException('MaKhoa is required');
        }

        if (!monHoc.MaSoMonHoc) {
            throw new BadRequestException('MaSoMonHoc is required');
        }

        const existingMonHoc = await this.monHocRepository.findOne({
            where: [
                { TenMonHoc: monHoc.TenMonHoc },
                { MaSoMonHoc: monHoc.MaSoMonHoc }
            ]
        });

        if (existingMonHoc) {
            throw new BadRequestException('Môn học với tên hoặc mã số này đã tồn tại');
        }

        const newMonHoc = this.monHocRepository.create({
            MaMonHoc: uuidv4(),
            MaKhoa: monHoc.MaKhoa,
            MaSoMonHoc: monHoc.MaSoMonHoc,
            TenMonHoc: monHoc.TenMonHoc,
            XoaTamMonHoc: false,
            NgayTao: new Date(),
            NgaySua: new Date()
        });

        return await this.monHocRepository.save(newMonHoc);
    }

    async update(maMonHoc: string, monHoc: UpdateMonHocDto): Promise<MonHoc> {
        const existingMonHoc = await this.findOne(maMonHoc);

        if (monHoc.TenMonHoc && monHoc.TenMonHoc !== existingMonHoc.TenMonHoc) {
            const duplicateMonHoc = await this.monHocRepository.findOne({
                where: { TenMonHoc: monHoc.TenMonHoc }
            });

            if (duplicateMonHoc) {
                throw new BadRequestException('Môn học với tên này đã tồn tại');
            }
        }

        if (monHoc.MaSoMonHoc && monHoc.MaSoMonHoc !== existingMonHoc.MaSoMonHoc) {
            const duplicateMonHoc = await this.monHocRepository.findOne({
                where: { MaSoMonHoc: monHoc.MaSoMonHoc }
            });

            if (duplicateMonHoc) {
                throw new BadRequestException('Môn học với mã số này đã tồn tại');
            }
        }

        const updateData = {
            ...monHoc,
            NgaySua: new Date()
        };

        await this.monHocRepository.update(maMonHoc, updateData);
        return await this.findOne(maMonHoc);
    }

    async remove(maMonHoc: string): Promise<void> {
        const monHoc = await this.findOne(maMonHoc);
        await this.monHocRepository.delete(maMonHoc);
    }

    async softDelete(maMonHoc: string): Promise<MonHoc> {
        const monHoc = await this.findOne(maMonHoc);
        monHoc.XoaTamMonHoc = true;
        monHoc.NgaySua = new Date();
        return await this.monHocRepository.save(monHoc);
    }

    async restore(maMonHoc: string): Promise<MonHoc> {
        const monHoc = await this.findOne(maMonHoc);
        monHoc.XoaTamMonHoc = false;
        monHoc.NgaySua = new Date();
        return await this.monHocRepository.save(monHoc);
    }
}
