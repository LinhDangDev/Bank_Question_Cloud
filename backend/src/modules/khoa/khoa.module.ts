import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Khoa } from '../../entities/khoa.entity';
import { KhoaController } from './khoa.controller';
import { KhoaService } from './khoa.service';

@Module({
    imports: [TypeOrmModule.forFeature([Khoa])],
    controllers: [KhoaController],
    providers: [KhoaService],
    exports: [KhoaService],
})
export class KhoaModule { }
