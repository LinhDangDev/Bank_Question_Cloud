import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { CauHoi } from './cau-hoi.entity';

@Entity('CLO')
export class CLO {
    @PrimaryGeneratedColumn('uuid')
    MaCLO: string;

    @Column({ type: 'nvarchar', length: 250 })
    TenCLO: string;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    NoiDung: string;

    @Column({ type: 'datetime' })
    NgayTao: Date;

    @Column({ type: 'datetime', nullable: true })
    NgayCapNhat: Date;

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    TrangThai: string;

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    NguoiTao: string;

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    NguoiCapNhat: string;

    @OneToMany(() => CauHoi, cauHoi => cauHoi.CLO)
    CauHois: CauHoi[];
}
