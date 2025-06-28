import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CauHoiChoDuyetController } from './cau-hoi-cho-duyet.controller';
import { CauHoiChoDuyetService } from './cau-hoi-cho-duyet.service';
import { CauHoiChoDuyet } from '../../entities/cau-hoi-cho-duyet.entity';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { User } from '../../entities/user.entity';
import { NotificationModule } from '../notification/notification.module';
import { NotificationHelperService } from '../../common/services/notification-helper.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([CauHoiChoDuyet, CauHoi, CauTraLoi, User]),
        NotificationModule,
    ],
    controllers: [CauHoiChoDuyetController],
    providers: [CauHoiChoDuyetService, NotificationHelperService],
    exports: [CauHoiChoDuyetService],
})
export class CauHoiChoDuyetModule { }
