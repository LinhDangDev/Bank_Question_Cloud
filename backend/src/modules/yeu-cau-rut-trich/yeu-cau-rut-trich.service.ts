import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { YeuCauRutTrich } from '../../entities/yeu-cau-rut-trich.entity';
import { CreateYeuCauRutTrichDto, UpdateYeuCauRutTrichDto } from '../../dto/yeu-cau-rut-trich.dto';
import { PaginationDto } from '../../dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class YeuCauRutTrichService {
    constructor(
        @InjectRepository(YeuCauRutTrich)
        private readonly yeuCauRutTrichRepository: Repository<YeuCauRutTrich>,
    ) { }

    async create(createYeuCauRutTrichDto: CreateYeuCauRutTrichDto): Promise<YeuCauRutTrich> {
        const yeuCauRutTrich = this.yeuCauRutTrichRepository.create({
            MaYeuCau: uuidv4(),
            HoTenGiaoVien: createYeuCauRutTrichDto.NguoiTao,
            NoiDungRutTrich: createYeuCauRutTrichDto.NoiDung,
            NgayLay: new Date(),
        });

        // Save the request and queue the job for processing
        const savedRequest = await this.yeuCauRutTrichRepository.save(yeuCauRutTrich);

        // TODO: Add to queue for processing
        // this.extractionQueue.add('extract-exam', { requestId: savedRequest.MaYeuCau });

        return savedRequest;
    }

    async findAll(paginationDto: PaginationDto) {
        const { page = 1, limit = 10 } = paginationDto;
        const [items, total] = await this.yeuCauRutTrichRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: {
                NgayLay: 'DESC',
            },
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string): Promise<YeuCauRutTrich> {
        const yeuCauRutTrich = await this.yeuCauRutTrichRepository.findOne({
            where: { MaYeuCau: id },
        });

        if (!yeuCauRutTrich) {
            throw new NotFoundException(`Yêu cầu rút trích với ID ${id} không tìm thấy`);
        }

        return yeuCauRutTrich;
    }

    async getStatus(id: string): Promise<any> {
        const yeuCauRutTrich = await this.findOne(id);

        // TODO: Get status from queue or database
        // For now, return a mock status
        return {
            id: yeuCauRutTrich.MaYeuCau,
            status: 'processing', // 'pending', 'processing', 'completed', 'failed'
            progress: 50, // 0-100
            createdAt: yeuCauRutTrich.NgayLay,
        };
    }
}
