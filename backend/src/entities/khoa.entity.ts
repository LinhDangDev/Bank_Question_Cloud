import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MonHoc } from './mon-hoc.entity';

@Entity('Khoa')
export class Khoa {
    @PrimaryGeneratedColumn('uuid')
    MaKhoa: string;

    @Column({ type: 'nvarchar', length: 250 })
    TenKhoa: string;

    @Column({ nullable: true })
    XoaTamKhoa: boolean;

    @OneToMany(() => MonHoc, monHoc => monHoc.Khoa)
    MonHoc: MonHoc[];
}
