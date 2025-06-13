import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { CauHoi } from './cau-hoi.entity';

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

    @OneToMany(() => CauHoi, cauHoi => cauHoi.CLO)
    CauHois: CauHoi[];
}
