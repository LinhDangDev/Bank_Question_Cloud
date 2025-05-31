import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { DeThiService } from './de-thi.service';
import { CreateDeThiDto, UpdateDeThiDto } from '../../dto';
import { DeThi } from '../../entities/de-thi.entity';
import { PaginationDto } from '../../dto/pagination.dto';

@Controller('de-thi')
export class DeThiController {
    constructor(private readonly deThiService: DeThiService) { }

    @Get()
    async findAll(@Query() paginationDto: PaginationDto) {
        return await this.deThiService.findAll(paginationDto);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.deThiService.findOne(id);
    }

    @Get('mon-hoc/:maMonHoc')
    async findByMaMonHoc(
        @Param('maMonHoc') maMonHoc: string,
        @Query() paginationDto: PaginationDto
    ) {
        return await this.deThiService.findByMaMonHoc(maMonHoc, paginationDto);
    }

    @Post()
    async create(@Body() createDeThiDto: CreateDeThiDto) {
        return await this.deThiService.createDeThi(createDeThiDto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateDeThiDto: UpdateDeThiDto,
    ) {
        return await this.deThiService.updateDeThi(id, updateDeThiDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return await this.deThiService.delete(id);
    }

    @Patch(':id/duyet')
    async duyetDeThi(@Param('id') id: string): Promise<void> {
        return await this.deThiService.duyetDeThi(id);
    }

    @Patch(':id/huy-duyet')
    async huyDuyetDeThi(@Param('id') id: string): Promise<void> {
        return await this.deThiService.huyDuyetDeThi(id);
    }
}
