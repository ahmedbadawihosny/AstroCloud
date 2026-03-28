import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false, nullable: true })
  password: string | null;

  @Column({ type: 'varchar', nullable: true })
  profilePictureUrl: string | null;

  @Column({ default: 'PENDING' })
  role: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  knowAboutUs: string | null;

  @Column({ type: 'varchar', nullable: true })
  couponCode: string | null;

  @Column({ type: 'timestamptz' })
  expireCouponCode: Date;

  @Column({ default: false })
  isPremiumAccount: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLogin: Date | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
