import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { RulesPayload } from '../../domain/value-objects/rules-payload.vo';

@Entity({ name: 'rules_config' })
@Index('idx_rules_config_active', ['validTo', 'validFrom'])
export class RulesConfigOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  version!: string;

  @Column({ type: 'timestamptz', name: 'valid_from' })
  validFrom!: Date;

  @Column({ type: 'timestamptz', name: 'valid_to', nullable: true })
  validTo!: Date | null;

  @Column({ type: 'jsonb' })
  payload!: RulesPayload;

  @Column({ type: 'varchar', length: 32 })
  source!: string;

  @Column({ type: 'varchar', length: 128, name: 'created_by' })
  createdBy!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
