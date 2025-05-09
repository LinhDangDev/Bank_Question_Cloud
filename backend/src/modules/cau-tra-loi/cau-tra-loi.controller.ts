import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CauTraLoiService } from './cau-tra-loi.service';
import { CreateCauTraLoiDto, UpdateCauTraLoiDto } from '../../dto';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';

@Controller('cau-tra-loi')
export class CauTraLoiController {
    constructor(private readonly cauTraLoiService: CauTraLoiService) { }

    @Get()
    async findAll(): Promise<CauTraLoi[]> {
        return await this.cauTraLoiService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<CauTraLoi> {
        return await this.cauTraLoiService.findOne(id);
    }

    @Get('cau-hoi/:maCauHoi')
    async findByMaCauHoi(@Param('maCauHoi') maCauHoi: string): Promise<CauTraLoi[]> {
        return await this.cauTraLoiService.findByMaCauHoi(maCauHoi);
    }

    @Post()
    async create(@Body() createCauTraLoiDto: CreateCauTraLoiDto): Promise<CauTraLoi> {
        return await this.cauTraLoiService.createCauTraLoi(createCauTraLoiDto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateCauTraLoiDto: UpdateCauTraLoiDto,
    ): Promise<CauTraLoi> {
        return await this.cauTraLoiService.updateCauTraLoi(id, updateCauTraLoiDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return await this.cauTraLoiService.delete(id);
    }
}
