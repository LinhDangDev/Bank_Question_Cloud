import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import {
    CreateNotificationDto,
    UpdateNotificationDto,
    NotificationResponseDto,
    MarkAsReadDto,
} from '../../dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new notification' })
    @ApiResponse({
        status: 201,
        description: 'Notification created successfully',
        type: NotificationResponseDto,
    })
    async create(@Body() createNotificationDto: CreateNotificationDto) {
        return await this.notificationService.create(createNotificationDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all notifications' })
    @ApiResponse({
        status: 200,
        description: 'List of all notifications',
        type: [NotificationResponseDto],
    })
    async findAll() {
        return await this.notificationService.findAll();
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Get notifications for a specific user' })
    @ApiResponse({
        status: 200,
        description: 'List of user notifications',
        type: [NotificationResponseDto],
    })
    async findByUserId(@Param('userId') userId: string) {
        return await this.notificationService.findByUserId(userId);
    }

    @Get('user/:userId/unread')
    @ApiOperation({ summary: 'Get unread notifications for a specific user' })
    @ApiResponse({
        status: 200,
        description: 'List of unread user notifications',
        type: [NotificationResponseDto],
    })
    async findUnreadByUserId(@Param('userId') userId: string) {
        return await this.notificationService.findUnreadByUserId(userId);
    }

    @Get('user/:userId/count')
    @ApiOperation({ summary: 'Get unread notification count for a user' })
    @ApiResponse({
        status: 200,
        description: 'Unread notification count',
    })
    async getUnreadCount(@Param('userId') userId: string) {
        const count = await this.notificationService.getUnreadCount(userId);
        return { count };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a notification by ID' })
    @ApiResponse({
        status: 200,
        description: 'Notification details',
        type: NotificationResponseDto,
    })
    async findOne(@Param('id') id: string) {
        return await this.notificationService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a notification' })
    @ApiResponse({
        status: 200,
        description: 'Notification updated successfully',
        type: NotificationResponseDto,
    })
    async update(
        @Param('id') id: string,
        @Body() updateNotificationDto: UpdateNotificationDto,
    ) {
        return await this.notificationService.update(id, updateNotificationDto);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read/unread' })
    @ApiResponse({
        status: 200,
        description: 'Notification read status updated',
        type: NotificationResponseDto,
    })
    async markAsRead(@Param('id') id: string, @Body() markAsReadDto: MarkAsReadDto) {
        return await this.notificationService.markAsRead(id, markAsReadDto);
    }

    @Patch('user/:userId/mark-all-read')
    @ApiOperation({ summary: 'Mark all notifications as read for a user' })
    @ApiResponse({
        status: 200,
        description: 'All notifications marked as read',
    })
    async markAllAsReadForUser(@Param('userId') userId: string) {
        await this.notificationService.markAllAsReadForUser(userId);
        return { message: 'All notifications marked as read' };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a notification' })
    @ApiResponse({
        status: 200,
        description: 'Notification deleted successfully',
    })
    async remove(@Param('id') id: string) {
        await this.notificationService.remove(id);
        return { message: 'Notification deleted successfully' };
    }
}
