import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CauTraLoi } from './cau-tra-loi.entity';
import { ChiTietDeThi } from './chi-tiet-de-thi.entity';
import { Files } from './files.entity';
import { Phan } from './phan.entity';
import { CLO } from './clo.entity';
import { User } from './user.entity';

@Entity('CauHoi')
export class CauHoi {
    @PrimaryGeneratedColumn('uuid')
    MaCauHoi: string;

    @Column({ type: 'uuid' })
    MaPhan: string;

    @Column()
    MaSoCauHoi: number;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    NoiDung: string;

    @Column()
    HoanVi: boolean;

    @Column()
    CapDo: number;

    @Column({ default: 0 })
    SoCauHoiCon: number;

    @Column({ type: 'float', nullable: true })
    DoPhanCachCauHoi: number;

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

    @Column({ type: 'datetime', nullable: true, select: false })
    NgaySua: Date;

    @Column({ type: 'uuid', nullable: true })
    MaCLO: string;

    @Column({ type: 'float', nullable: true })
    DoKhoThucTe: number;

    @Column({ type: 'uuid', nullable: true })
    NguoiTao: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'NguoiTao' })
    Creator: User;

    @ManyToOne(() => Phan)
    @JoinColumn({ name: 'MaPhan' })
    Phan: Phan;

    @ManyToOne(() => CLO)
    @JoinColumn({ name: 'MaCLO' })
    CLO: CLO;

    @OneToMany(() => CauTraLoi, cauTraLoi => cauTraLoi.CauHoi)
    CauTraLoi: CauTraLoi[];

    @OneToMany(() => ChiTietDeThi, chiTietDeThi => chiTietDeThi.CauHoi)
    ChiTietDeThi: ChiTietDeThi[];

    @OneToMany(() => Files, files => files.CauHoi)
    Files: Files[];
}
