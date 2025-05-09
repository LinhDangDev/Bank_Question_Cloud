import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('User')
export class User {
    @PrimaryGeneratedColumn('uuid')
    UserId: string;

    @Column({ type: 'nvarchar', length: 100 })
    LoginName: string;

    @Column({ type: 'nvarchar', length: 100 })
    Email: string;

    @Column({ type: 'nvarchar', length: 255 })
    Name: string;

    @Column({ type: 'nvarchar', length: 128 })
    Password: string;

    @Column({ type: 'datetime' })
    DateCreated: Date;

    @Column()
    IsDeleted: boolean;

    @Column()
    IsLockedOut: boolean;

    @Column({ type: 'datetime', nullable: true })
    LastActivityDate: Date;

    @Column({ type: 'datetime', nullable: true })
    LastLoginDate: Date;

    @Column({ type: 'datetime', nullable: true })
    LastPasswordChangedDate: Date;

    @Column({ type: 'datetime', nullable: true })
    LastLockoutDate: Date;

    @Column({ nullable: true })
    FailedPwdAttemptCount: number;

    @Column({ type: 'datetime', nullable: true })
    FailedPwdAttemptWindowStart: Date;

    @Column({ nullable: true })
    FailedPwdAnswerCount: number;

    @Column({ type: 'datetime', nullable: true })
    FailedPwdAnswerWindowStart: Date;

    @Column({ type: 'nvarchar', length: 255, nullable: true })
    PasswordSalt: string;

    @Column({ type: 'ntext', nullable: true })
    Comment: string;

    @Column()
    IsBuildInUser: boolean;
}
