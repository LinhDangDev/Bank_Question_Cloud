import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MonHocService } from './mon-hoc.service';
import { CreateMonHocDto, UpdateMonHocDto } from '../../dto/mon-hoc.dto';

@Controller('mon-hoc')
export class MonHocController {
    constructor(private readonly monHocService: MonHocService) { }

    @Get()
    async findAll() {
        return await this.monHocService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.monHocService.findOne(id);
    }

    @Get('khoa/:maKhoa')
    async findByMaKhoa(@Param('maKhoa') maKhoa: string) {
        return await this.monHocService.findByMaKhoa(maKhoa);
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
    async remove(@Param('id') id: string) {
        return await this.monHocService.remove(id);
    }

    @Patch(':id/soft-delete')
    async softDelete(@Param('id') id: string) {
        return await this.monHocService.softDelete(id);
    }

    @Patch(':id/restore')
    async restore(@Param('id') id: string) {
        return await this.monHocService.restore(id);
    }
}
