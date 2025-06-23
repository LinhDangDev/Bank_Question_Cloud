import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { YeuCauRutTrich } from '../../entities/yeu-cau-rut-trich.entity';
import { YeuCauRutTrichController } from './yeu-cau-rut-trich.controller';
import { YeuCauRutTrichService } from './yeu-cau-rut-trich.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([YeuCauRutTrich]),
        BullModule.registerQueue({
            name: 'extraction',
        }),
    ],
    controllers: [YeuCauRutTrichController],
    providers: [YeuCauRutTrichService],
    exports: [YeuCauRutTrichService],
})
export class YeuCauRutTrichModule { }
