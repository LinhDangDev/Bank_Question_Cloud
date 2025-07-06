import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, Index } from 'typeorm';
import { CauHoi } from './cau-hoi.entity';
import { DeThi } from './de-thi.entity';
import { Phan } from './phan.entity';

@Entity('ChiTietDeThi')
@Index(["MaDeThi", "MaPhan", "MaCauHoi"], { unique: true })
export class ChiTietDeThi {
    @PrimaryColumn({ type: 'uuid' })
    MaDeThi: string;

    @PrimaryColumn({ type: 'uuid' })
    MaPhan: string;

    @PrimaryColumn({ type: 'uuid' })
    MaCauHoi: string;

    @Column()
    ThuTu: number;

    @ManyToOne(() => DeThi, deThi => deThi.ChiTietDeThi)
    @JoinColumn({ name: 'MaDeThi' })
    DeThi: DeThi;

    @ManyToOne(() => Phan, phan => phan.ChiTietDeThi)
    @JoinColumn({ name: 'MaPhan' })
    Phan: Phan;

    @ManyToOne(() => CauHoi, cauHoi => cauHoi.ChiTietDeThi)
    @JoinColumn({ name: 'MaCauHoi' })
    CauHoi: CauHoi;
}
