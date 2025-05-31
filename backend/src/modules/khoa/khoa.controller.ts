import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { KhoaService } from './khoa.service';
import { Khoa } from '../../entities/khoa.entity';

@Controller('khoa')
export class KhoaController {
    constructor(private readonly khoaService: KhoaService) { }

    @Get()
    findAll() {
        return this.khoaService.findAll();
    }

    @Get(':MaKhoa')
    findOne(@Param('MaKhoa') MaKhoa: string) {
        return this.khoaService.findOne(MaKhoa);
    }

    @Post()
    create(@Body() khoa: Partial<Khoa>) {
        return this.khoaService.create(khoa);
    }

    @Patch(':MaKhoa')
    update(@Param('MaKhoa') MaKhoa: string, @Body() khoa: Partial<Khoa>) {
        return this.khoaService.update(MaKhoa, khoa);
    }

    @Delete(':MaKhoa')
    remove(@Param('MaKhoa') MaKhoa: string) {
        return this.khoaService.remove(MaKhoa);
    }

    @Patch(':MaKhoa/soft-delete')
    softDelete(@Param('MaKhoa') MaKhoa: string) {
        return this.khoaService.softDelete(MaKhoa);
    }

    @Patch(':MaKhoa/restore')
    restore(@Param('MaKhoa') MaKhoa: string) {
        return this.khoaService.restore(MaKhoa);
    }
}
