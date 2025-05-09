import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('YeuCauRutTrich')
export class YeuCauRutTrich {
    @PrimaryGeneratedColumn('uuid', { name: 'MaYeuCauDe' })
    MaYeuCau: string;

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    HoTenGiaoVien: string;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    NoiDungRutTrich: string;

    @Column({ type: 'datetime', nullable: true })
    NgayLay: Date;
}
