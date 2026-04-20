import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { ClassifiableRecord } from '../../../risk-classification/domain/value-objects/classifiable-record.vo';
import { RiskTier } from '../../../risk-classification/domain/value-objects/risk-tier.vo';
import { TriggeredRule } from '../../../risk-classification/domain/value-objects/triggered-rule.vo';
import { OnboardingSubmittedEvent } from '../events/onboarding-submitted.event';

export interface ClientRecordProps {
  id?: string;
  clientName: string;
  clientType: string;
  pepStatus: boolean;
  sanctionsScreeningMatch: boolean;
  adverseMediaFlag: boolean;
  countryOfTaxResidence: string;
  annualIncome: number;
  sourceOfFunds: string;
  computedTier: RiskTier;
  triggeredRules: TriggeredRule[];
  requiresEdd: boolean;
  rulesVersion: string;
  declaredTier: RiskTier | null;
  mismatch: boolean;
  submittedBy: string;
  createdAt?: Date;
}

export class ClientRecord extends AggregateRoot {
  private readonly _clientName: string;
  private readonly _clientType: string;
  private readonly _pepStatus: boolean;
  private readonly _sanctionsScreeningMatch: boolean;
  private readonly _adverseMediaFlag: boolean;
  private readonly _countryOfTaxResidence: string;
  private readonly _annualIncome: number;
  private readonly _sourceOfFunds: string;
  private readonly _computedTier: RiskTier;
  private readonly _triggeredRules: TriggeredRule[];
  private readonly _requiresEdd: boolean;
  private readonly _rulesVersion: string;
  private readonly _declaredTier: RiskTier | null;
  private readonly _mismatch: boolean;
  private readonly _submittedBy: string;

  private constructor(props: ClientRecordProps) {
    super(props.id, props.createdAt);
    this._clientName = props.clientName;
    this._clientType = props.clientType;
    this._pepStatus = props.pepStatus;
    this._sanctionsScreeningMatch = props.sanctionsScreeningMatch;
    this._adverseMediaFlag = props.adverseMediaFlag;
    this._countryOfTaxResidence = props.countryOfTaxResidence;
    this._annualIncome = props.annualIncome;
    this._sourceOfFunds = props.sourceOfFunds;
    this._computedTier = props.computedTier;
    this._triggeredRules = props.triggeredRules;
    this._requiresEdd = props.requiresEdd;
    this._rulesVersion = props.rulesVersion;
    this._declaredTier = props.declaredTier;
    this._mismatch = props.mismatch;
    this._submittedBy = props.submittedBy;
  }

  static create(props: ClientRecordProps): ClientRecord {
    if (!props.clientName || props.clientName.trim() === '') {
      throw new Error('ClientRecord.clientName is required');
    }
    const record = new ClientRecord(props);
    record.addDomainEvent(
      new OnboardingSubmittedEvent(record.id, record._rulesVersion, record._computedTier),
    );
    return record;
  }

  static rehydrate(props: ClientRecordProps): ClientRecord {
    return new ClientRecord(props);
  }

  toClassifiableRecord(): ClassifiableRecord {
    return {
      pep_status: this._pepStatus,
      sanctions_screening_match: this._sanctionsScreeningMatch,
      adverse_media_flag: this._adverseMediaFlag,
      country_of_tax_residence: this._countryOfTaxResidence,
      client_type: this._clientType,
      annual_income: this._annualIncome,
      source_of_funds: this._sourceOfFunds,
    };
  }

  get clientName(): string {
    return this._clientName;
  }
  get clientType(): string {
    return this._clientType;
  }
  get pepStatus(): boolean {
    return this._pepStatus;
  }
  get sanctionsScreeningMatch(): boolean {
    return this._sanctionsScreeningMatch;
  }
  get adverseMediaFlag(): boolean {
    return this._adverseMediaFlag;
  }
  get countryOfTaxResidence(): string {
    return this._countryOfTaxResidence;
  }
  get annualIncome(): number {
    return this._annualIncome;
  }
  get sourceOfFunds(): string {
    return this._sourceOfFunds;
  }
  get computedTier(): RiskTier {
    return this._computedTier;
  }
  get triggeredRules(): TriggeredRule[] {
    return this._triggeredRules;
  }
  get requiresEdd(): boolean {
    return this._requiresEdd;
  }
  get rulesVersion(): string {
    return this._rulesVersion;
  }
  get declaredTier(): RiskTier | null {
    return this._declaredTier;
  }
  get mismatch(): boolean {
    return this._mismatch;
  }
  get submittedBy(): string {
    return this._submittedBy;
  }
}
