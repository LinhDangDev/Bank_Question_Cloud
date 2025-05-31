import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('User')
export class User {
    @PrimaryGeneratedColumn('uuid')
    UserId: string;

    @Column({ unique: true })
    LoginName: string;

    @Column({ unique: true })
    Email: string;

    @Column()
    Name: string;

    @Column()
    Password: string;

    @Column()
    DateCreated: Date;

    @Column({ default: false })
    IsDeleted: boolean;

    @Column({ default: false })
    IsLockedOut: boolean;

    @Column({ nullable: true })
    LastActivityDate: Date;

    @Column({ nullable: true })
    LastLoginDate: Date;

    @Column({ nullable: true })
    LastPasswordChangedDate: Date;

    @Column({ nullable: true })
    LastLockoutDate: Date;

    @Column({ nullable: true })
    FailedPwdAttemptCount: number;

    @Column({ nullable: true })
    FailedPwdAttemptWindowStart: Date;

    @Column({ nullable: true })
    FailedPwdAnswerCount: number;

    @Column({ nullable: true })
    FailedPwdAnswerWindowStart: Date;

    @Column({ nullable: true })
    PasswordSalt: string;

    @Column({ nullable: true, type: 'ntext' })
    Comment: string;

    @Column({ default: false })
    IsBuildInUser: boolean;
}
