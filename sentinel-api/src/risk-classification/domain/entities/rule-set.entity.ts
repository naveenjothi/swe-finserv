import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { RulesPayload } from '../value-objects/rules-payload.vo';

export enum RulesSource {
  SEED = 'SEED',
  FCA_WEBHOOK = 'FCA_WEBHOOK',
  MANUAL_UPLOAD = 'MANUAL_UPLOAD',
}

export interface RuleSetProps {
  id?: string;
  version: string;
  validFrom: Date;
  validTo: Date | null;
  payload: RulesPayload;
  source: RulesSource;
  createdBy: string;
  createdAt?: Date;
}

export class RuleSet extends AggregateRoot {
  private readonly _version: string;
  private readonly _validFrom: Date;
  private _validTo: Date | null;
  private readonly _payload: RulesPayload;
  private readonly _source: RulesSource;
  private readonly _createdBy: string;

  private constructor(props: RuleSetProps) {
    super(props.id, props.createdAt);
    this._version = props.version;
    this._validFrom = props.validFrom;
    this._validTo = props.validTo;
    this._payload = props.payload;
    this._source = props.source;
    this._createdBy = props.createdBy;
  }

  static create(props: RuleSetProps): RuleSet {
    if (!props.version || props.version.trim() === '') {
      throw new Error('RuleSet.version is required');
    }
    if (props.validTo && props.validTo < props.validFrom) {
      throw new Error('RuleSet.validTo cannot be before validFrom');
    }
    return new RuleSet(props);
  }

  static rehydrate(props: RuleSetProps): RuleSet {
    return new RuleSet(props);
  }

  supersede(now: Date = new Date()): void {
    if (this._validTo !== null) {
      throw new Error(`RuleSet ${this._version} is already superseded`);
    }
    this._validTo = now;
  }

  isActive(at: Date = new Date()): boolean {
    if (this._validFrom > at) return false;
    if (this._validTo !== null && this._validTo <= at) return false;
    return true;
  }

  get version(): string {
    return this._version;
  }
  get validFrom(): Date {
    return this._validFrom;
  }
  get validTo(): Date | null {
    return this._validTo;
  }
  get payload(): RulesPayload {
    return this._payload;
  }
  get source(): RulesSource {
    return this._source;
  }
  get createdBy(): string {
    return this._createdBy;
  }
}
