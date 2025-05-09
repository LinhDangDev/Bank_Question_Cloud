import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeThi } from '../../entities/de-thi.entity';
import { DeThiController } from './de-thi.controller';
import { DeThiService } from './de-thi.service';

@Module({
    imports: [TypeOrmModule.forFeature([DeThi])],
    controllers: [DeThiController],
    providers: [DeThiService],
    exports: [DeThiService],
})
export class DeThiModule { }
