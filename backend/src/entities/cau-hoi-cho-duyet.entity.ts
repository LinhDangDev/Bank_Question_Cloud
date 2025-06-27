import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Phan } from './phan.entity';
import { CLO } from './clo.entity';

@Entity('CauHoiChoDuyet')
export class CauHoiChoDuyet {
    @PrimaryGeneratedColumn('uuid')
    MaCauHoiChoDuyet: string;

    @Column({ type: 'uuid', nullable: true })
    MaPhan: string;

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    MaSoCauHoi: string;

    @Column({ type: 'nvarchar', length: 'max' })
    NoiDung: string;

    @Column({ nullable: true })
    HoanVi: boolean;

    @Column({ nullable: true })
    CapDo: number;

    @Column({ nullable: true })
    SoCauHoiCon: number;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    DoPhanCachCauHoi: string;

    @Column({ type: 'uuid', nullable: true })
    MaCauHoiCha: string;

    @Column({ nullable: true })
    XoaTamCauHoi: boolean;

    @Column({ nullable: true })
    SoLanDuocThi: number;

    @Column({ nullable: true })
    SoLanDung: number;

    @Column({ type: 'datetime', nullable: true })
    NgayTao: Date;

    @Column({ type: 'datetime', nullable: true })
    NgaySua: Date;

    @Column({ type: 'uuid', nullable: true })
    MaCLO: string;

    @Column({ type: 'uuid' })
    NguoiTao: string; // ID của teacher tạo câu hỏi

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    GhiChu: string; // Ghi chú từ admin khi duyệt/từ chối

    @Column({ type: 'int', default: 0 })
    TrangThai: number; // 0: Chờ duyệt, 1: Đã duyệt, 2: Từ chối

    @Column({ type: 'uuid', nullable: true })
    NguoiDuyet: string; // ID của admin duyệt

    @Column({ type: 'datetime', nullable: true })
    NgayDuyet: Date;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    DuLieuCauTraLoi: string; // JSON string chứa dữ liệu câu trả lời

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    DuLieuCauHoiCon: string; // JSON string chứa dữ liệu câu hỏi con

    // Relationships
    @ManyToOne(() => User)
    @JoinColumn({ name: 'NguoiTao' })
    Teacher: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'NguoiDuyet' })
    Admin: User;

    @ManyToOne(() => Phan)
    @JoinColumn({ name: 'MaPhan' })
    Phan: Phan;

    @ManyToOne(() => CLO)
    @JoinColumn({ name: 'MaCLO' })
    CLO: CLO;
}
