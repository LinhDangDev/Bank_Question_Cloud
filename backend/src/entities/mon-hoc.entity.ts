import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DeThi } from './de-thi.entity';
import { Khoa } from './khoa.entity';
import { Phan } from './phan.entity';

@Entity('MonHoc')
export class MonHoc {
    @PrimaryGeneratedColumn('uuid')
    MaMonHoc: string;

    @Column({ type: 'uuid' })
    MaKhoa: string;

    @Column({ type: 'nvarchar', length: 50 })
    MaSoMonHoc: string;

    @Column({ type: 'nvarchar', length: 250 })
    TenMonHoc: string;

    @Column({ nullable: true })
    XoaTamMonHoc: boolean;

    @ManyToOne(() => Khoa, khoa => khoa.MonHoc)
    @JoinColumn({ name: 'MaKhoa' })
    Khoa: Khoa;

    @OneToMany(() => Phan, phan => phan.MonHoc)
    Phan: Phan[];

    @OneToMany(() => DeThi, deThi => deThi.MonHoc)
    DeThi: DeThi[];
}
