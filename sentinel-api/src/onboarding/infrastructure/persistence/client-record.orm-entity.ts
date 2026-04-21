import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { RiskTier } from '../../../risk-classification/domain/value-objects/risk-tier.vo';
import { TriggeredRule } from '../../../risk-classification/domain/value-objects/triggered-rule.vo';

@Entity({ name: 'client_records' })
@Index('idx_client_records_tier', ['computedTier'])
export class ClientRecordOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, name: 'client_name' })
  clientName!: string;

  @Column({ type: 'varchar', length: 32, name: 'client_type' })
  clientType!: string;

  @Column({ type: 'boolean', name: 'pep_status' })
  pepStatus!: boolean;

  @Column({ type: 'boolean', name: 'sanctions_screening_match' })
  sanctionsScreeningMatch!: boolean;

  @Column({ type: 'boolean', name: 'adverse_media_flag' })
  adverseMediaFlag!: boolean;

  @Column({ type: 'varchar', length: 128, name: 'country_of_tax_residence' })
  countryOfTaxResidence!: string;

  @Column({ type: 'numeric', precision: 15, scale: 2, name: 'annual_income' })
  annualIncome!: number;

  @Column({ type: 'varchar', length: 128, name: 'source_of_funds' })
  sourceOfFunds!: string;

  @Column({ type: 'varchar', length: 16, name: 'computed_tier', enum: RiskTier })
  computedTier!: RiskTier;

  @Column({ type: 'jsonb', name: 'triggered_rules' })
  triggeredRules!: TriggeredRule[];

  @Column({ type: 'boolean', name: 'requires_edd' })
  requiresEdd!: boolean;

  @Column({ type: 'varchar', length: 50, name: 'rules_version' })
  rulesVersion!: string;

  @Column({ type: 'varchar', length: 16, name: 'declared_tier', nullable: true })
  declaredTier!: RiskTier | null;

  @Column({ type: 'boolean' })
  mismatch!: boolean;

  @Column({ type: 'varchar', length: 128, name: 'submitted_by' })
  submittedBy!: string;

  @Column({ type: 'varchar', length: 128, name: 'relationship_manager', nullable: true })
  relationshipManager!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
