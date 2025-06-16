import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YeuCauRutTrich } from '../../entities/yeu-cau-rut-trich.entity';
import { YeuCauRutTrichController } from './yeu-cau-rut-trich.controller';
import { YeuCauRutTrichService } from './yeu-cau-rut-trich.service';

@Module({
    imports: [TypeOrmModule.forFeature([YeuCauRutTrich])],
    controllers: [YeuCauRutTrichController],
    providers: [YeuCauRutTrichService],
    exports: [YeuCauRutTrichService],
})
export class YeuCauRutTrichModule { }
