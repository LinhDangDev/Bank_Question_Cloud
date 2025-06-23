import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PhanService } from './phan.service';
import { CreatePhanDto, UpdatePhanDto } from '../../dto/phan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('phan')
export class PhanController {
    constructor(private readonly phanService: PhanService) { }

    @Get()
    async findAll() {
        return await this.phanService.findAll();
    }

    @Get('mon-hoc/:maMonHoc')
    async findByMaMonHoc(@Param('maMonHoc') maMonHoc: string) {
        return await this.phanService.findByMaMonHoc(maMonHoc);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.phanService.findOne(id);
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
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async remove(@Param('id') id: string) {
        return await this.phanService.remove(id);
    }

    @Patch(':id/soft-delete')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'teacher')
    async softDelete(@Param('id') id: string) {
        return await this.phanService.softDelete(id);
    }

    @Patch(':id/restore')
    async restore(@Param('id') id: string) {
        return await this.phanService.restore(id);
    }
}
