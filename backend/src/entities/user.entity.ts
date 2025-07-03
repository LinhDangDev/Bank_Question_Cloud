import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Khoa } from './khoa.entity';

@Entity('User')
export class User {
    @PrimaryGeneratedColumn('uuid')
    MaNguoiDung: string;

    @Column({ unique: true })
    TenDangNhap: string;

    @Column({ unique: true })
    Email: string;

    @Column()
    HoTen: string;

    @Column()
    MatKhau: string;

    @Column()
    NgayTao: Date;

    @Column({ default: false })
    DaXoa: boolean;

    @Column({ default: false })
    BiKhoa: boolean;

    @Column({ default: true })
    CanDoiMatKhau: boolean;

    @Column({ nullable: true })
    NgayHoatDongCuoi: Date;

    @Column({ nullable: true })
    NgayDangNhapCuoi: Date;

    @Column({ nullable: true })
    NgayDoiMatKhauCuoi: Date;

    @Column({ nullable: true })
    NgayKhoaCuoi: Date;

    @Column({ nullable: true })
    SoLanNhapSaiMatKhau: number;

    @Column({ nullable: true })
    BatDauKhoangThoiGianNhapSai: Date;

    @Column({ nullable: true })
    SoLanTraLoiSai: number;

    @Column({ nullable: true })
    BatDauKhoangThoiGianTraLoiSai: Date;

    @Column({ nullable: true })
    MuoiMatKhau: string;

    @Column({ nullable: true, type: 'ntext' })
    GhiChu: string;

    @Column({ default: false })
    LaNguoiDungHeThong: boolean;

    @Column({ nullable: true })
    MaKhoa: string;

    @ManyToOne(() => Khoa)
    @JoinColumn({ name: 'MaKhoa' })
    Khoa: Khoa;
}
