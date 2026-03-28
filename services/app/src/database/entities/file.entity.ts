import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('files')
@Index(['userId', 'deletedAt'])
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column()
  originalName: string;

  @Column({ unique: true })
  storageKey: string;

  @Column({ type: 'integer' })
  size: number;

  @Column()
  mimeType: string;

  @Column({ type: 'varchar', nullable: true })
  checksumSha256: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
