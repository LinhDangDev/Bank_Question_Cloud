import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CauHoi } from './cau-hoi.entity';
import { Files } from './files.entity';

@Entity('CauTraLoi')
export class CauTraLoi {
    @PrimaryGeneratedColumn('uuid')
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

    @OneToMany(() => Files, files => files.CauTraLoi)
    Files: Files[];
}
