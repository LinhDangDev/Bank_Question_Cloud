import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { ChiTietDeThi } from './chi-tiet-de-thi.entity';
import { MonHoc } from './mon-hoc.entity';

@Entity('DeThi')
export class DeThi {
    @PrimaryColumn({ type: 'uniqueidentifier', default: () => 'NEWID()' })
    MaDeThi: string;

    @Column({ type: 'uuid' })
    MaMonHoc: string;

    @Column({ type: 'nvarchar', length: 250 })
    TenDeThi: string;

    @Column({ type: 'datetime' })
    NgayTao: Date;

    @Column({ type: 'bit', default: false })
    DaDuyet: boolean;

    @Column({ type: 'int', nullable: true })
    SoCauHoi: number;

    @Column({ type: 'nvarchar', length: 255, nullable: true })
    NguoiTao: string;

    @ManyToOne(() => MonHoc, monHoc => monHoc.DeThi)
    @JoinColumn({ name: 'MaMonHoc' })
    MonHoc: MonHoc;

    @OneToMany(() => ChiTietDeThi, chiTietDeThi => chiTietDeThi.DeThi)
    ChiTietDeThi: ChiTietDeThi[];
}
