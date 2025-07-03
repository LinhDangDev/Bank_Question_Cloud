import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('Notification')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    MaThongBao: string;

    @Column({ type: 'uuid' })
    MaNguoiDung: string;

    @Column({ type: 'nvarchar', length: 255 })
    TieuDe: string;

    @Column({ type: 'nvarchar', length: 'max' })
    NoiDung: string;

    @Column({ type: 'nvarchar', length: 50 })
    LoaiThongBao: string;

    @Column({ type: 'nvarchar', length: 100, nullable: true })
    BangLienQuan: string;

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    MaLienQuan: string;

    @Column({ default: false })
    DaDoc: boolean;

    @Column({ type: 'datetime' })
    NgayTao: Date;

    @Column({ type: 'datetime', nullable: true })
    NgayDoc: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'MaNguoiDung' })
    User: User;
}
