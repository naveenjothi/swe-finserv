import { BaseEntity } from '../../../shared/domain/base.entity';

export interface AuditEntryProps {
  id?: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload: Record<string, unknown>;
  performedBy: string;
  createdAt?: Date;
}

export class AuditEntry extends BaseEntity {
  private readonly _aggregateId: string;
  private readonly _aggregateType: string;
  private readonly _eventType: string;
  private readonly _payload: Record<string, unknown>;
  private readonly _performedBy: string;

  private constructor(props: AuditEntryProps) {
    super(props.id, props.createdAt);
    this._aggregateId = props.aggregateId;
    this._aggregateType = props.aggregateType;
    this._eventType = props.eventType;
    this._payload = props.payload;
    this._performedBy = props.performedBy;
  }

  static create(props: AuditEntryProps): AuditEntry {
    return new AuditEntry(props);
  }

  static rehydrate(props: AuditEntryProps): AuditEntry {
    return new AuditEntry(props);
  }

  get aggregateId(): string {
    return this._aggregateId;
  }
  get aggregateType(): string {
    return this._aggregateType;
  }
  get eventType(): string {
    return this._eventType;
  }
  get payload(): Record<string, unknown> {
    return this._payload;
  }
  get performedBy(): string {
    return this._performedBy;
  }
}
