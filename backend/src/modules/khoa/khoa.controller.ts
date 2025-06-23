import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { KhoaService } from './khoa.service';
import { CreateKhoaDto, UpdateKhoaDto, KhoaResponseDto } from '../../dto/khoa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Khoa')
@Controller('khoa')
export class KhoaController {
    constructor(private readonly khoaService: KhoaService) { }

    @Get()
    @ApiOperation({ summary: 'Get all faculties' })
    @ApiResponse({ status: 200, description: 'Return all faculties', type: [KhoaResponseDto] })
    findAll() {
        return this.khoaService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get faculty by ID' })
    @ApiParam({ name: 'id', description: 'Faculty ID' })
    @ApiResponse({ status: 200, description: 'Return faculty by ID', type: KhoaResponseDto })
    @ApiResponse({ status: 404, description: 'Faculty not found' })
    findOne(@Param('id') id: string) {
        return this.khoaService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create new faculty' })
    @ApiResponse({ status: 201, description: 'Faculty created successfully', type: KhoaResponseDto })
    @ApiResponse({ status: 409, description: 'Faculty name already exists' })
    create(@Body() createKhoaDto: CreateKhoaDto) {
        return this.khoaService.create(createKhoaDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update faculty' })
    @ApiParam({ name: 'id', description: 'Faculty ID' })
    @ApiResponse({ status: 200, description: 'Faculty updated successfully', type: KhoaResponseDto })
    @ApiResponse({ status: 404, description: 'Faculty not found' })
    @ApiResponse({ status: 409, description: 'Faculty name already exists' })
    update(@Param('id') id: string, @Body() updateKhoaDto: UpdateKhoaDto) {
        return this.khoaService.update(id, updateKhoaDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete faculty permanently' })
    @ApiParam({ name: 'id', description: 'Faculty ID' })
    @ApiResponse({ status: 204, description: 'Faculty deleted successfully' })
    @ApiResponse({ status: 404, description: 'Faculty not found' })
    remove(@Param('id') id: string) {
        return this.khoaService.remove(id);
    }

    @Patch(':id/soft-delete')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    @ApiOperation({ summary: 'Soft delete faculty' })
    @ApiParam({ name: 'id', description: 'Faculty ID' })
    @ApiResponse({ status: 200, description: 'Faculty soft deleted successfully', type: KhoaResponseDto })
    @ApiResponse({ status: 404, description: 'Faculty not found' })
    @ApiResponse({ status: 400, description: 'Faculty is already soft deleted' })
    softDelete(@Param('id') id: string) {
        return this.khoaService.softDelete(id);
    }

    @Patch(':id/restore')
    @ApiOperation({ summary: 'Restore soft deleted faculty' })
    @ApiParam({ name: 'id', description: 'Faculty ID' })
    @ApiResponse({ status: 200, description: 'Faculty restored successfully', type: KhoaResponseDto })
    @ApiResponse({ status: 404, description: 'Faculty not found' })
    @ApiResponse({ status: 400, description: 'Faculty is not soft deleted' })
    restore(@Param('id') id: string) {
        return this.khoaService.restore(id);
    }
}
