import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { YeuCauRutTrichService } from './yeu-cau-rut-trich.service';
import { CreateYeuCauRutTrichDto } from '../../dto/yeu-cau-rut-trich.dto';
import { PaginationDto } from '../../dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('yeu-cau-rut-trich')
export class YeuCauRutTrichController {
    constructor(private readonly yeuCauRutTrichService: YeuCauRutTrichService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() createYeuCauRutTrichDto: CreateYeuCauRutTrichDto) {
        return this.yeuCauRutTrichService.create(createYeuCauRutTrichDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Query() paginationDto: PaginationDto) {
        return this.yeuCauRutTrichService.findAll(paginationDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.yeuCauRutTrichService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('status/:id')
    async getStatus(@Param('id') id: string) {
        return this.yeuCauRutTrichService.getStatus(id);
    }
}
