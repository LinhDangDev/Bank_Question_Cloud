import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CLO } from '../../entities/clo.entity';
import { CLOController } from './clo.controller';
import { CLOService } from './clo.service';

@Module({
    imports: [TypeOrmModule.forFeature([CLO])],
    controllers: [CLOController],
    providers: [CLOService],
    exports: [CLOService],
})
export class CLOModule { }
