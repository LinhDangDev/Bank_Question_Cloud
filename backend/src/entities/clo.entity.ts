import { Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { CauHoi } from './cau-hoi.entity';
import { MonHoc } from './mon-hoc.entity';

@Entity('CLO')
export class CLO {
    @PrimaryGeneratedColumn('uuid')
    MaCLO: string;

    @Column({ type: 'nvarchar', length: 250 })
    TenCLO: string;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    MoTa: string;

    @Column()
    ThuTu: number;

    @Column({ nullable: true })
    XoaTamCLO: boolean;

    @Column({ type: 'uuid', nullable: true })
    MaMonHoc: string;

    @ManyToOne(() => MonHoc, monHoc => monHoc.CLOs)
    @JoinColumn({ name: 'MaMonHoc' })
    MonHoc: MonHoc;

    @OneToMany(() => CauHoi, cauHoi => cauHoi.CLO)
    CauHois: CauHoi[];
}
