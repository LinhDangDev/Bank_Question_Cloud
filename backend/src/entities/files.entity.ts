import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '../enums/file-type.enum';

@Entity('Files')
export class Files {
    @ApiProperty({ description: 'File ID' })
    @PrimaryGeneratedColumn('uuid')
    MaFile: string;

    @ApiPropertyOptional({ description: 'Question ID this file belongs to' })
    @Column({ type: 'uuid', nullable: true })
    MaCauHoi: string;

    @ApiPropertyOptional({ description: 'Answer ID this file belongs to' })
    @Column({ type: 'uuid', nullable: true })
    MaCauTraLoi: string;

    @ApiProperty({ description: 'File name or path' })
    @Column({ type: 'nvarchar', length: 500, nullable: false })
    TenFile: string;

    @ApiProperty({ description: 'File type', enum: FileType })
    @Column({ type: 'int', nullable: false, default: FileType.OTHER })
    LoaiFile: FileType;

    @ManyToOne('CauHoi', 'Files', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'MaCauHoi' })
    CauHoi: any;

    @ManyToOne('CauTraLoi', 'Files', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'MaCauTraLoi' })
    CauTraLoi: any;

}
