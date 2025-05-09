import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CauHoi } from './cau-hoi.entity';
import { DeThi } from './de-thi.entity';
import { Phan } from './phan.entity';

@Entity('ChiTietDeThi')
export class ChiTietDeThi {
    @PrimaryGeneratedColumn('uuid')
    MaDeThi: string;

    @PrimaryGeneratedColumn('uuid')
    MaPhan: string;

    @PrimaryGeneratedColumn('uuid')
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
