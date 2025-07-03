import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('AuditLog')
export class AuditLog {
    @PrimaryGeneratedColumn('increment')
    MaNhatKy: number;

    @Column({ type: 'nvarchar', length: 100 })
    TenBang: string;

    @Column({ type: 'nvarchar', length: 50 })
    MaBanGhi: string;

    @Column({ type: 'nvarchar', length: 20 })
    HanhDong: string;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    GiaTriCu: string;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    GiaTriMoi: string;

    @Column({ type: 'uuid', nullable: true })
    MaNguoiDung: string;

    @Column({ type: 'nvarchar', length: 255, nullable: true })
    TenNguoiDung: string;

    @Column({ type: 'datetime' })
    ThoiGianThucHien: Date;

    @Column({ type: 'nvarchar', length: 45, nullable: true })
    DiaChiIP: string;

    @Column({ type: 'nvarchar', length: 500, nullable: true })
    UserAgent: string;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    Notes: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'MaNguoiDung' })
    User: User;
}
