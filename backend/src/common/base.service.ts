import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, ObjectLiteral, DeepPartial, FindOptionsWhere } from 'typeorm';
import { PaginationDto } from '../dto/pagination.dto';

@Injectable()
export class BaseService<T extends ObjectLiteral> {
    constructor(
        private readonly repository: Repository<T>,
        private readonly primaryKeyField: string = 'id'
    ) { }

    async findOne(id: string): Promise<T> {
        const where = { [this.primaryKeyField]: id } as FindOptionsWhere<T>;
        const result = await this.repository.findOne({ where });
        if (!result) {
            throw new NotFoundException(`Entity with ${this.primaryKeyField}=${id} not found`);
        }
        return result;
    }

    async findAll(paginationDto?: PaginationDto) {
        if (!paginationDto) {
            return await this.repository.find();
        }

        const { page = 1, limit = 10 } = paginationDto;
        const [items, total] = await this.repository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async create(entity: DeepPartial<T>): Promise<T> {
        const newEntity = this.repository.create(entity);
        return await this.repository.save(newEntity);
    }

    async update(id: string, entity: DeepPartial<T>): Promise<T> {
        const where = { [this.primaryKeyField]: id } as FindOptionsWhere<T>;
        await this.repository.update(where, entity as any);
        return await this.findOne(id);
    }

    async delete(id: string): Promise<void> {
        const where = { [this.primaryKeyField]: id } as FindOptionsWhere<T>;
        await this.repository.delete(where);
    }

    async softDelete(id: string): Promise<void> {
        const where = { [this.primaryKeyField]: id } as FindOptionsWhere<T>;
        await this.repository.softDelete(where);
    }

    async restore(id: string): Promise<void> {
        const where = { [this.primaryKeyField]: id } as FindOptionsWhere<T>;
        await this.repository.restore(where);
    }
}
