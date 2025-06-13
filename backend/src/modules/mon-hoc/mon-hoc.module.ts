import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonHoc } from '../../entities/mon-hoc.entity';
import { MonHocController } from './mon-hoc.controller';
import { MonHocService } from './mon-hoc.service';

@Module({
    imports: [TypeOrmModule.forFeature([MonHoc])],
    controllers: [MonHocController],
    providers: [MonHocService],
    exports: [MonHocService],
})
export class MonHocModule { }
