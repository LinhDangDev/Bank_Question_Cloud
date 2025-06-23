import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { YeuCauRutTrich } from '../../entities/yeu-cau-rut-trich.entity';
import { CreateYeuCauRutTrichDto, UpdateYeuCauRutTrichDto } from '../../dto/yeu-cau-rut-trich.dto';
import { PaginationDto } from '../../dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class YeuCauRutTrichService {
    constructor(
        @InjectRepository(YeuCauRutTrich)
        private readonly yeuCauRutTrichRepository: Repository<YeuCauRutTrich>,
        @InjectQueue('extraction')
        private readonly extractionQueue: Queue,
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

        // Add the extraction job to the queue
        await this.extractionQueue.add('extract-exam', { requestId: savedRequest.MaYeuCau });

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

        // Get job status from queue
        const jobs = await this.extractionQueue.getJobs(['active', 'waiting', 'delayed', 'completed', 'failed']);
        const job = jobs.find(j => j.data && j.data.requestId === id);

        let status = 'pending';
        let progress = 0;

        if (job) {
            if (job.finishedOn) {
                status = job.failedReason ? 'failed' : 'completed';
                progress = 100;
            } else if (job.processedOn) {
                status = 'processing';
                progress = 50; // Could implement more precise progress tracking
            }
        }

        // Try to parse result from NoiDungRutTrich
        let result = null;
        try {
            const data = JSON.parse(yeuCauRutTrich.NoiDungRutTrich || '{}');
            if (data.result) {
                result = data.result;
                status = data.result.status || status;
            }
        } catch (e) {
            // Ignore parsing errors
        }

        return {
            id: yeuCauRutTrich.MaYeuCau,
            status,
            progress,
            createdAt: yeuCauRutTrich.NgayLay,
            result,
        };
    }
}
