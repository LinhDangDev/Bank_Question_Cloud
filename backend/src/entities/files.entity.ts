import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CauHoi } from './cau-hoi.entity';
import { CauTraLoi } from './cau-tra-loi.entity';

@Entity('Files')
export class Files {
    @PrimaryGeneratedColumn('uuid')
    MaFile: string;

    @Column({ type: 'uuid', nullable: true })
    MaCauHoi: string;

    @Column({ type: 'nvarchar', length: 250, nullable: true })
    TenFile: string;

    @Column({ nullable: true })
    LoaiFile: number;

    @Column({ type: 'uuid', nullable: true })
    MaCauTraLoi: string;

    @ManyToOne(() => CauHoi, cauHoi => cauHoi.Files)
    @JoinColumn({ name: 'MaCauHoi' })
    CauHoi: CauHoi;

    @ManyToOne(() => CauTraLoi, cauTraLoi => cauTraLoi.Files)
    @JoinColumn({ name: 'MaCauTraLoi' })
    CauTraLoi: CauTraLoi;
}
