import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Files } from '../../entities/files.entity';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
    imports: [
        TypeOrmModule.forFeature([Files]),
        MulterModule.register({
            dest: './uploads',
        }),
    ],
    controllers: [FilesController],
    providers: [FilesService],
    exports: [FilesService],
})
export class FilesModule { }
