import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MonHocService } from './mon-hoc.service';
import { CreateMonHocDto, UpdateMonHocDto } from '../../dto/mon-hoc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('mon-hoc')
export class MonHocController {
    constructor(private readonly monHocService: MonHocService) { }

    @Get()
    async findAll() {
        return await this.monHocService.findAll();
    }

    @Get('khoa/:maKhoa')
    async findByMaKhoa(@Param('maKhoa') maKhoa: string) {
        return await this.monHocService.findByMaKhoa(maKhoa);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.monHocService.findOne(id);
    }

    @Post()
    async create(@Body() monHoc: CreateMonHocDto) {
        return await this.monHocService.create(monHoc);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() monHoc: UpdateMonHocDto) {
        return await this.monHocService.update(id, monHoc);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async remove(@Param('id') id: string) {
        return await this.monHocService.remove(id);
    }

    @Patch(':id/soft-delete')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async softDelete(@Param('id') id: string) {
        return await this.monHocService.softDelete(id);
    }

    @Patch(':id/restore')
    async restore(@Param('id') id: string) {
        return await this.monHocService.restore(id);
    }
}
