import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from '../../services/integration.service';

// Import entities
import { DeThi } from '../../entities/de-thi.entity';
import { CauHoi } from '../../entities/cau-hoi.entity';
import { CauTraLoi } from '../../entities/cau-tra-loi.entity';
import { Phan } from '../../entities/phan.entity';
import { ChiTietDeThi } from '../../entities/chi-tiet-de-thi.entity';
import { MonHoc } from '../../entities/mon-hoc.entity';
import { Files } from '../../entities/files.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DeThi,
            CauHoi,
            CauTraLoi,
            Phan,
            ChiTietDeThi,
            MonHoc,
            Files
        ])
    ],
    controllers: [IntegrationController],
    providers: [IntegrationService],
    exports: [IntegrationService]
})
export class IntegrationModule { }
