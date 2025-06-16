import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CauHoi } from './cau-hoi.entity';
import { ChiTietDeThi } from './chi-tiet-de-thi.entity';
import { MonHoc } from './mon-hoc.entity';

@Entity('Phan')
export class Phan {
    @PrimaryGeneratedColumn('uuid')
    MaPhan: string;

    @Column({ type: 'uuid' })
    MaMonHoc: string;

    @Column({ type: 'nvarchar', length: 250 })
    TenPhan: string;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    NoiDung: string;

    @Column()
    ThuTu: number;

    @Column()
    SoLuongCauHoi: number;

    @Column({ type: 'uuid', nullable: true })
    MaPhanCha: string;

    @Column({ nullable: true })
    MaSoPhan: number;

    @Column({ nullable: true })
    XoaTamPhan: boolean;

    @Column()
    LaCauHoiNhom: boolean;

    @Column({ type: 'datetime', nullable: true })
    NgayTao: Date;

    @Column({ type: 'datetime', nullable: true, select: false })
    NgaySua: Date;

    @ManyToOne(() => MonHoc, monHoc => monHoc.Phan)
    @JoinColumn({ name: 'MaMonHoc' })
    MonHoc: MonHoc;

    @OneToMany(() => CauHoi, cauHoi => cauHoi.Phan)
    CauHoi: CauHoi[];

    @OneToMany(() => ChiTietDeThi, chiTietDeThi => chiTietDeThi.Phan)
    ChiTietDeThi: ChiTietDeThi[];
}
