import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ProviderEnum } from '../../auth/enums/provider.enum';

@Entity('accounts')
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  provider: ProviderEnum;

  @Column({ unique: true })
  providerId: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  tokenExpiry: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
