import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Phan } from '../../entities/phan.entity';
import { PhanController } from './phan.controller';
import { PhanService } from './phan.service';

@Module({
    imports: [TypeOrmModule.forFeature([Phan])],
    controllers: [PhanController],
    providers: [PhanService],
    exports: [PhanService],
})
export class PhanModule { }
