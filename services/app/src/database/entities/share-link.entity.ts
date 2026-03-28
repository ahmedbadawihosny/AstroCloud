import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('share_links')
@Index(['tokenHash'])
export class ShareLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  fileId: string;

  @Column('uuid')
  userId: string;

  @Column({ unique: true })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
