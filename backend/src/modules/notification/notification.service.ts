import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { CreateNotificationDto, UpdateNotificationDto, MarkAsReadDto } from '../../dto/notification.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
    ) { }

    async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
        const notification = this.notificationRepository.create({
            ...createNotificationDto,
            MaThongBao: uuidv4(),
            NgayTao: new Date(),
            DaDoc: createNotificationDto.DaDoc || false,
        });

        return await this.notificationRepository.save(notification);
    }

    async findAll(): Promise<Notification[]> {
        return await this.notificationRepository.find({
            relations: ['User'],
            order: { NgayTao: 'DESC' },
        });
    }

    async findByUserId(userId: string): Promise<Notification[]> {
        return await this.notificationRepository.find({
            where: { MaNguoiDung: userId },
            relations: ['User'],
            order: { NgayTao: 'DESC' },
        });
    }

    async findUnreadByUserId(userId: string): Promise<Notification[]> {
        return await this.notificationRepository.find({
            where: { MaNguoiDung: userId, DaDoc: false },
            relations: ['User'],
            order: { NgayTao: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Notification> {
        const notification = await this.notificationRepository.findOne({
            where: { MaThongBao: id },
            relations: ['User'],
        });

        if (!notification) {
            throw new NotFoundException(`Notification with ID ${id} not found`);
        }

        return notification;
    }

    async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
        const notification = await this.findOne(id);

        Object.assign(notification, updateNotificationDto);

        return await this.notificationRepository.save(notification);
    }

    async markAsRead(id: string, markAsReadDto: MarkAsReadDto): Promise<Notification> {
        const notification = await this.findOne(id);

        notification.DaDoc = markAsReadDto.DaDoc;
        if (markAsReadDto.DaDoc) {
            notification.NgayDoc = new Date();
        } else {
            notification.NgayDoc = null as unknown as Date;
        }

        return await this.notificationRepository.save(notification);
    }

    async markAllAsReadForUser(userId: string): Promise<void> {
        await this.notificationRepository.update(
            { MaNguoiDung: userId, DaDoc: false },
            { DaDoc: true, NgayDoc: new Date() }
        );
    }

    async remove(id: string): Promise<void> {
        const notification = await this.findOne(id);
        await this.notificationRepository.remove(notification);
    }

    async getUnreadCount(userId: string): Promise<number> {
        return await this.notificationRepository.count({
            where: { MaNguoiDung: userId, DaDoc: false },
        });
    }

    async createSystemNotification(
        userId: string,
        title: string,
        message: string,
        type: string = 'SYSTEM',
        relatedTable?: string,
        relatedId?: string
    ): Promise<Notification> {
        return await this.create({
            MaNguoiDung: userId,
            TieuDe: title,
            NoiDung: message,
            LoaiThongBao: type,
            BangLienQuan: relatedTable,
            MaLienQuan: relatedId,
        });
    }
}
