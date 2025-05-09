import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { CauTraLoiController } from './cau-tra-loi.controller';
import { CauTraLoiService } from './cau-tra-loi.service';

@Module({
    imports: [TypeOrmModule.forFeature([CauTraLoi])],
    controllers: [CauTraLoiController],
    providers: [CauTraLoiService],
    exports: [CauTraLoiService],
})
export class CauTraLoiModule { }
