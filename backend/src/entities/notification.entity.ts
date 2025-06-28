import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('Notification')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    NotificationId: string;

    @Column({ type: 'uuid' })
    UserId: string;

    @Column({ type: 'nvarchar', length: 255 })
    Title: string;

    @Column({ type: 'nvarchar', length: 'max' })
    Message: string;

    @Column({ type: 'nvarchar', length: 50 })
    Type: string;

    @Column({ type: 'nvarchar', length: 100, nullable: true })
    RelatedTable: string;

    @Column({ type: 'nvarchar', length: 50, nullable: true })
    RelatedId: string;

    @Column({ default: false })
    IsRead: boolean;

    @Column({ type: 'datetime' })
    CreatedAt: Date;

    @Column({ type: 'datetime', nullable: true })
    ReadAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'UserId' })
    User: User;
}
