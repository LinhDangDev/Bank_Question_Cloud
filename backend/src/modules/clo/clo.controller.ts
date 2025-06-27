import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CLOService } from './clo.service';
import { CLO } from '../../entities/clo.entity';
import { CreateCLODto, UpdateCLODto } from '../../dto/clo.dto';

@Controller('clo')
export class CLOController {
    constructor(private readonly cloService: CLOService) { }

    @Get()
    async findAll(@Query('maMonHoc') maMonHoc?: string) {
        if (maMonHoc) {
            return await this.cloService.findByMonHoc(maMonHoc);
        }
        return await this.cloService.findAll();
    }

    @Get('mon-hoc/:maMonHoc')
    async findByMonHoc(@Param('maMonHoc') maMonHoc: string) {
        return await this.cloService.findByMonHoc(maMonHoc);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.cloService.findOne(id);
    }

    @Post()
    async create(@Body() createCLODto: CreateCLODto) {
        return await this.cloService.create(createCLODto);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateCLODto: UpdateCLODto) {
        return await this.cloService.update(id, updateCLODto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.cloService.remove(id);
        return { message: 'CLO đã được xóa thành công' };
    }
}
