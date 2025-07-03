import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindManyOptions } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';
import { CreateAuditLogDto, AuditLogFilterDto } from '../../dto/audit-log.dto';

@Injectable()
export class AuditLogService {
    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) { }

    async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
        const auditLog = this.auditLogRepository.create({
            ...createAuditLogDto,
            ThoiGianThucHien: new Date(),
        });

        return await this.auditLogRepository.save(auditLog);
    }

    async findAll(filterDto?: AuditLogFilterDto): Promise<{ data: AuditLog[]; total: number }> {
        const { page = 1, limit = 50, ...filters } = filterDto || {};

        const whereConditions: any = {};

        if (filters.tableName) {
            whereConditions.TableName = filters.tableName;
        }

        if (filters.recordId) {
            whereConditions.RecordId = filters.recordId;
        }

        if (filters.action) {
            whereConditions.Action = filters.action;
        }

        if (filters.userId) {
            whereConditions.UserId = filters.userId;
        }

        if (filters.userName) {
            whereConditions.UserName = filters.userName;
        }

        if (filters.startDate && filters.endDate) {
            whereConditions.Timestamp = Between(filters.startDate, filters.endDate);
        }

        const options: FindManyOptions<AuditLog> = {
            where: whereConditions,
            relations: ['User'],
            order: { ThoiGianThucHien: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        };

        const [data, total] = await this.auditLogRepository.findAndCount(options);

        return { data, total };
    }

    async findOne(id: number): Promise<AuditLog> {
        const auditLog = await this.auditLogRepository.findOne({
            where: { MaNhatKy: id },
            relations: ['User'],
        });

        if (!auditLog) {
            throw new NotFoundException(`Audit log with ID ${id} not found`);
        }

        return auditLog;
    }

    async findByTableAndRecord(tableName: string, recordId: string): Promise<AuditLog[]> {
        return await this.auditLogRepository.find({
            where: { TenBang: tableName, MaBanGhi: recordId },
            relations: ['User'],
            order: { ThoiGianThucHien: 'DESC' },
        });
    }

    async findByUser(userId: string): Promise<AuditLog[]> {
        return await this.auditLogRepository.find({
            where: { MaNguoiDung: userId },
            relations: ['User'],
            order: { ThoiGianThucHien: 'DESC' },
        });
    }

    async logAction(
        tableName: string,
        recordId: string,
        action: 'INSERT' | 'UPDATE' | 'DELETE',
        userId?: string,
        userName?: string,
        oldValues?: any,
        newValues?: any,
        ipAddress?: string,
        userAgent?: string,
        notes?: string
    ): Promise<AuditLog> {
        return await this.create({
            TenBang: tableName,
            MaBanGhi: recordId,
            HanhDong: action,
            MaNguoiDung: userId,
            TenNguoiDung: userName,
            GiaTriCu: oldValues ? JSON.stringify(oldValues) : undefined,
            GiaTriMoi: newValues ? JSON.stringify(newValues) : undefined,
            DiaChiIP: ipAddress,
            UserAgent: userAgent,
            Notes: notes,
        });
    }

    async getStatistics(): Promise<{
        totalLogs: number;
        actionCounts: { action: string; count: number }[];
        tableCounts: { table: string; count: number }[];
        recentActivity: AuditLog[];
    }> {
        const totalLogs = await this.auditLogRepository.count();

        const actionCounts = await this.auditLogRepository
            .createQueryBuilder('audit')
            .select('audit.Action', 'action')
            .addSelect('COUNT(*)', 'count')
            .groupBy('audit.Action')
            .getRawMany();

        const tableCounts = await this.auditLogRepository
            .createQueryBuilder('audit')
            .select('audit.TableName', 'table')
            .addSelect('COUNT(*)', 'count')
            .groupBy('audit.TableName')
            .orderBy('count', 'DESC')
            .limit(10)
            .getRawMany();

        const recentActivity = await this.auditLogRepository.find({
            relations: ['User'],
            order: { ThoiGianThucHien: 'DESC' },
            take: 20,
        });

        return {
            totalLogs,
            actionCounts,
            tableCounts,
            recentActivity,
        };
    }
}
