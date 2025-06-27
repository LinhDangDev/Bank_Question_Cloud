import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Khoa } from '../../entities/khoa.entity';
import { KhoaController } from './khoa.controller';
import { KhoaService } from './khoa.service';
import { User } from '../../entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Khoa, User])],
    controllers: [KhoaController],
    providers: [KhoaService],
    exports: [KhoaService],
})
export class KhoaModule { }
