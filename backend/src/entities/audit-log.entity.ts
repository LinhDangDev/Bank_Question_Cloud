import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('AuditLog')
export class AuditLog {
    @PrimaryGeneratedColumn('increment')
    LogId: number;

    @Column({ type: 'nvarchar', length: 100 })
    TableName: string;

    @Column({ type: 'nvarchar', length: 50 })
    RecordId: string;

    @Column({ type: 'nvarchar', length: 20 })
    Action: string;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    OldValues: string;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    NewValues: string;

    @Column({ type: 'uuid', nullable: true })
    UserId: string;

    @Column({ type: 'nvarchar', length: 255, nullable: true })
    UserName: string;

    @Column({ type: 'datetime' })
    Timestamp: Date;

    @Column({ type: 'nvarchar', length: 45, nullable: true })
    IPAddress: string;

    @Column({ type: 'nvarchar', length: 500, nullable: true })
    UserAgent: string;

    @Column({ type: 'nvarchar', length: 'max', nullable: true })
    Notes: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'UserId' })
    User: User;
}
