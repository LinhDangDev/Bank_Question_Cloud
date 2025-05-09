import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { ChiTietDeThiController } from './chi-tiet-de-thi.controller';
import { ChiTietDeThiService } from './chi-tiet-de-thi.service';

@Module({
    imports: [TypeOrmModule.forFeature([ChiTietDeThi])],
    controllers: [ChiTietDeThiController],
    providers: [ChiTietDeThiService],
    exports: [ChiTietDeThiService],
})
export class ChiTietDeThiModule { }
