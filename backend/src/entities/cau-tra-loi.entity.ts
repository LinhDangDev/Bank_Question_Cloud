import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { CauHoi } from './cau-hoi.entity';

@Entity('CauTraLoi')
export class CauTraLoi {
    @PrimaryColumn('uuid')
    MaCauTraLoi: string;

    @Column({ type: 'uuid' })
    MaCauHoi: string;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    NoiDung: string;

    @Column()
    ThuTu: number;

    @Column()
    LaDapAn: boolean;

    @Column()
    HoanVi: boolean;

    @ManyToOne(() => CauHoi, cauHoi => cauHoi.CauTraLoi)
    @JoinColumn({ name: 'MaCauHoi' })
    CauHoi: CauHoi;

    @OneToMany('Files', 'CauTraLoi')
    Files: any[];
}
