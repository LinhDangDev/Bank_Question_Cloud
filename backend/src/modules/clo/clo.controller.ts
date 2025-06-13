import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CLOService } from './clo.service';
import { CLO } from '../../entities/clo.entity';

@Controller('clo')
export class CLOController {
    constructor(private readonly cloService: CLOService) { }

    @Get()
    async findAll() {
        return await this.cloService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.cloService.findOne(id);
    }
}
