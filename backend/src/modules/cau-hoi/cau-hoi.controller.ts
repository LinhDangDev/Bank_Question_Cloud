import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CauHoiService } from './cau-hoi.service';
import { CreateCauHoiDto, UpdateCauHoiDto } from '../../dto';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { PaginationDto } from '../../dto/pagination.dto';

@Controller('cau-hoi')
export class CauHoiController {
    constructor(private readonly cauHoiService: CauHoiService) { }

    @Get()
    async findAll(@Query() paginationDto: PaginationDto) {
        return await this.cauHoiService.findAll(paginationDto);
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<CauHoi> {
        return await this.cauHoiService.findOne(id);
    }

    @Get('phan/:maPhan')
    async findByMaPhan(
        @Param('maPhan') maPhan: string,
        @Query() paginationDto: PaginationDto
    ) {
        return await this.cauHoiService.findByMaPhan(maPhan, paginationDto);
    }

    @Get('clo/:maCLO')
    async findByMaCLO(
        @Param('maCLO') maCLO: string,
        @Query() paginationDto: PaginationDto
    ) {
        return await this.cauHoiService.findByMaCLO(maCLO, paginationDto);
    }

    @Get('con/:maCauHoiCha')
    async findByCauHoiCha(
        @Param('maCauHoiCha') maCauHoiCha: string,
        @Query() paginationDto: PaginationDto
    ) {
        return await this.cauHoiService.findByCauHoiCha(maCauHoiCha, paginationDto);
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
