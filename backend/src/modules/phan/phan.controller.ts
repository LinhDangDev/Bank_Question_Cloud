import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PhanService } from './phan.service';
import { CreatePhanDto, UpdatePhanDto } from '../../dto/phan.dto';

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

    @Post()
    async create(@Body() phan: CreatePhanDto) {
        return await this.phanService.create(phan);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() phan: UpdatePhanDto) {
        return await this.phanService.update(id, phan);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return await this.phanService.remove(id);
    }

    @Patch(':id/soft-delete')
    async softDelete(@Param('id') id: string) {
        return await this.phanService.softDelete(id);
    }

    @Patch(':id/restore')
    async restore(@Param('id') id: string) {
        return await this.phanService.restore(id);
    }
}
