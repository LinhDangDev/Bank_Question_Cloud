import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { CauHoiService } from './cau-hoi.service';
import { CreateCauHoiDto, UpdateCauHoiDto } from '../../dto';
import { CauHoi } from '../../entities/cau-hoi.entity';

@Controller('cau-hoi')
export class CauHoiController {
    constructor(private readonly cauHoiService: CauHoiService) { }

    @Get()
    async findAll(): Promise<CauHoi[]> {
        return await this.cauHoiService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<CauHoi> {
        return await this.cauHoiService.findOne(id);
    }

    @Get('phan/:maPhan')
    async findByMaPhan(@Param('maPhan') maPhan: string): Promise<CauHoi[]> {
        return await this.cauHoiService.findByMaPhan(maPhan);
    }

    @Get('clo/:maCLO')
    async findByMaCLO(@Param('maCLO') maCLO: string): Promise<CauHoi[]> {
        return await this.cauHoiService.findByMaCLO(maCLO);
    }

    @Get('con/:maCauHoiCha')
    async findByCauHoiCha(@Param('maCauHoiCha') maCauHoiCha: string): Promise<CauHoi[]> {
        return await this.cauHoiService.findByCauHoiCha(maCauHoiCha);
    }

    @Post()
    async create(@Body() createCauHoiDto: CreateCauHoiDto): Promise<CauHoi> {
        return await this.cauHoiService.createCauHoi(createCauHoiDto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateCauHoiDto: UpdateCauHoiDto,
    ): Promise<CauHoi> {
        return await this.cauHoiService.updateCauHoi(id, updateCauHoiDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return await this.cauHoiService.delete(id);
    }

    @Patch(':id/soft-delete')
    async softDelete(@Param('id') id: string): Promise<void> {
        return await this.cauHoiService.softDeleteCauHoi(id);
    }

    @Patch(':id/restore')
    async restore(@Param('id') id: string): Promise<void> {
        return await this.cauHoiService.restoreCauHoi(id);
    }
}
