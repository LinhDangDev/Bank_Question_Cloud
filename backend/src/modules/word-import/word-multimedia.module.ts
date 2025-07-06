import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WordMultimediaService } from './word-multimedia.service';
import { WordMultimediaController } from './word-multimedia.controller';
import { Files } from '../../entities/files.entity';
import { SpacesService } from '../../services/spaces.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Files])
    ],
    controllers: [WordMultimediaController],
    providers: [WordMultimediaService, SpacesService],
    exports: [WordMultimediaService],
})
export class WordMultimediaModule {}
