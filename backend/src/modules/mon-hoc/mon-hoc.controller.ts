import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MonHocService } from './mon-hoc.service';
import { MonHoc } from '../../entities/mon-hoc.entity';

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
}
