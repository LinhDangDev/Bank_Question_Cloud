import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CauTraLoiService } from './cau-tra-loi.service';
import { CreateCauTraLoiDto, UpdateCauTraLoiDto } from '../../dto';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { PaginationDto } from '../../dto/pagination.dto';

@Controller('cau-tra-loi')
export class CauTraLoiController {
    constructor(private readonly cauTraLoiService: CauTraLoiService) { }

    @Get()
    async findAll(@Query() paginationDto: PaginationDto) {
        return await this.cauTraLoiService.findAll(paginationDto);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.cauTraLoiService.findOne(id);
    }

    @Get('cau-hoi/:maCauHoi')
    async findByMaCauHoi(
        @Param('maCauHoi') maCauHoi: string,
        @Query() paginationDto: PaginationDto
    ) {
        return await this.cauTraLoiService.findByMaCauHoi(maCauHoi, paginationDto);
    }

    @Post()
    async create(@Body() createCauTraLoiDto: CreateCauTraLoiDto) {
        return await this.cauTraLoiService.createCauTraLoi(createCauTraLoiDto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateCauTraLoiDto: UpdateCauTraLoiDto,
    ) {
        return await this.cauTraLoiService.updateCauTraLoi(id, updateCauTraLoiDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return await this.cauTraLoiService.delete(id);
    }
}
