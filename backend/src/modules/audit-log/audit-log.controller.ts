import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import {
    CreateAuditLogDto,
    AuditLogResponseDto,
    AuditLogFilterDto,
} from '../../dto/audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new audit log entry' })
    @ApiResponse({
        status: 201,
        description: 'Audit log created successfully',
        type: AuditLogResponseDto,
    })
    async create(@Body() createAuditLogDto: CreateAuditLogDto) {
        return await this.auditLogService.create(createAuditLogDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all audit logs with optional filtering' })
    @ApiQuery({ name: 'tableName', required: false, description: 'Filter by table name' })
    @ApiQuery({ name: 'recordId', required: false, description: 'Filter by record ID' })
    @ApiQuery({ name: 'action', required: false, description: 'Filter by action' })
    @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
    @ApiQuery({ name: 'userName', required: false, description: 'Filter by username' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filtering' })
    @ApiQuery({ name: 'endDate', required: false, description: 'End date for filtering' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
    @ApiResponse({
        status: 200,
        description: 'List of audit logs',
        type: [AuditLogResponseDto],
    })
    async findAll(@Query() filterDto: AuditLogFilterDto) {
        return await this.auditLogService.findAll(filterDto);
    }

    @Get('statistics')
    @ApiOperation({ summary: 'Get audit log statistics' })
    @ApiResponse({
        status: 200,
        description: 'Audit log statistics',
    })
    async getStatistics() {
        return await this.auditLogService.getStatistics();
    }

    @Get('table/:tableName/record/:recordId')
    @ApiOperation({ summary: 'Get audit logs for a specific table and record' })
    @ApiResponse({
        status: 200,
        description: 'Audit logs for the specified table and record',
        type: [AuditLogResponseDto],
    })
    async findByTableAndRecord(
        @Param('tableName') tableName: string,
        @Param('recordId') recordId: string,
    ) {
        return await this.auditLogService.findByTableAndRecord(tableName, recordId);
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Get audit logs for a specific user' })
    @ApiResponse({
        status: 200,
        description: 'Audit logs for the specified user',
        type: [AuditLogResponseDto],
    })
    async findByUser(@Param('userId') userId: string) {
        return await this.auditLogService.findByUser(userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an audit log by ID' })
    @ApiResponse({
        status: 200,
        description: 'Audit log details',
        type: AuditLogResponseDto,
    })
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return await this.auditLogService.findOne(id);
    }
}
