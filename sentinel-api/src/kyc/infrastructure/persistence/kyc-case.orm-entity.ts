import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { KycStatus } from '../../domain/value-objects/kyc-status.vo';

@Entity({ name: 'kyc_cases' })
@Index('idx_kyc_cases_client', ['clientRecordId'], { unique: true })
@Index('idx_kyc_cases_status', ['status'])
export class KycCaseOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'client_record_id' })
  clientRecordId!: string;

  @Column({ type: 'varchar', length: 32, enum: KycStatus })
  status!: KycStatus;

  @Column({ type: 'varchar', length: 128, name: 'assigned_to', nullable: true })
  assignedTo!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  documents!: string[];

  @Column({ type: 'varchar', length: 128, name: 'created_by' })
  createdBy!: string;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
