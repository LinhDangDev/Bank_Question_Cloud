import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Khoa } from '../../entities/khoa.entity';
import { CreateKhoaDto, UpdateKhoaDto } from '../../dto/khoa.dto';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../entities/user.entity';

@Injectable()
export class KhoaService {
    constructor(
        @InjectRepository(Khoa)
        private khoaRepository: Repository<Khoa>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async findAll() {
        return this.khoaRepository.find({
            order: {
                TenKhoa: 'ASC'
            }
        });
    }

    async findByTeacher(teacherId: string) {
        // Fetch the teacher details to get their assigned khoa
        const teacher = await this.userRepository.findOne({
            where: { UserId: teacherId },
            relations: ['Khoa']
        });

        if (!teacher) {
            throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
        }

        if (!teacher.MaKhoa) {
            // If teacher is not assigned to any khoa, return empty array
            return [];
        }

        // Return only the khoa that the teacher is assigned to
        const khoa = await this.khoaRepository.findOne({
            where: { MaKhoa: teacher.MaKhoa }
        });

        return khoa ? [khoa] : [];
    }

    async findOne(MaKhoa: string) {
        const khoa = await this.khoaRepository.findOne({
            where: { MaKhoa }
        });

        if (!khoa) {
            throw new NotFoundException(`Khoa with ID ${MaKhoa} not found`);
        }

        return khoa;
    }

    async create(khoa: CreateKhoaDto) {
        // Check for duplicate faculty name
        const existingKhoa = await this.khoaRepository.findOne({
            where: { TenKhoa: khoa.TenKhoa }
        });

        if (existingKhoa) {
            if (existingKhoa.XoaTamKhoa) {
                // If the faculty exists but is soft deleted, restore it
                existingKhoa.XoaTamKhoa = false;
                return this.khoaRepository.save(existingKhoa);
            }
            throw new ConflictException(`Khoa with name ${khoa.TenKhoa} already exists`);
        }

        const newKhoa = this.khoaRepository.create({
            ...khoa,
            MaKhoa: uuidv4(),
            XoaTamKhoa: false
        });
        return this.khoaRepository.save(newKhoa);
    }

    async update(MaKhoa: string, khoa: UpdateKhoaDto) {
        const existingKhoa = await this.findOne(MaKhoa);

        if (khoa.TenKhoa && khoa.TenKhoa !== existingKhoa.TenKhoa) {
            // Check for duplicate name if name is being changed
            const duplicateKhoa = await this.khoaRepository.findOne({
                where: { TenKhoa: khoa.TenKhoa }
            });

            if (duplicateKhoa && duplicateKhoa.MaKhoa !== MaKhoa) {
                throw new ConflictException(`Khoa with name ${khoa.TenKhoa} already exists`);
            }
        }

        Object.assign(existingKhoa, khoa);
        return this.khoaRepository.save(existingKhoa);
    }

    async remove(MaKhoa: string) {
        const result = await this.khoaRepository.delete(MaKhoa);
        if (result.affected === 0) {
            throw new NotFoundException(`Khoa with ID ${MaKhoa} not found`);
        }
    }

    async softDelete(MaKhoa: string) {
        const khoa = await this.findOne(MaKhoa);

        if (khoa.XoaTamKhoa) {
            throw new BadRequestException(`Khoa with ID ${MaKhoa} is already soft deleted`);
        }

        khoa.XoaTamKhoa = true;
        return this.khoaRepository.save(khoa);
    }

    async restore(MaKhoa: string) {
        const khoa = await this.findOne(MaKhoa);

        if (!khoa.XoaTamKhoa) {
            throw new BadRequestException(`Khoa with ID ${MaKhoa} is not soft deleted`);
        }

        khoa.XoaTamKhoa = false;
        return this.khoaRepository.save(khoa);
    }
}
