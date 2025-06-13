import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PhanService } from './phan.service';
import { Phan } from '../../entities/phan.entity';

@Controller('phan')
export class PhanController {
    constructor(private readonly phanService: PhanService) { }

    @Get()
    async findAll() {
        return await this.phanService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.phanService.findOne(id);
    }

    @Get('mon-hoc/:maMonHoc')
    async findByMaMonHoc(@Param('maMonHoc') maMonHoc: string) {
        return await this.phanService.findByMaMonHoc(maMonHoc);
    }
}
