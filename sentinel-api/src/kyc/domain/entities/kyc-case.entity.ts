import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { KycStatus, KYC_TERMINAL_STATUSES } from '../value-objects/kyc-status.vo';
import { KycStatusChangedEvent } from '../events/kyc-status-changed.event';

export interface KycCaseProps {
  id?: string;
  clientRecordId: string;
  status: KycStatus;
  assignedTo: string | null;
  notes: string | null;
  documents: string[];
  createdBy: string;
  updatedAt: Date;
  createdAt?: Date;
}

export class KycCase extends AggregateRoot {
  private readonly _clientRecordId: string;
  private _status: KycStatus;
  private _assignedTo: string | null;
  private _notes: string | null;
  private _documents: string[];
  private readonly _createdBy: string;
  private _updatedAt: Date;

  private constructor(props: KycCaseProps) {
    super(props.id, props.createdAt);
    this._clientRecordId = props.clientRecordId;
    this._status = props.status;
    this._assignedTo = props.assignedTo;
    this._notes = props.notes;
    this._documents = props.documents;
    this._createdBy = props.createdBy;
    this._updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<KycCaseProps, 'status' | 'updatedAt'> & { status?: KycStatus },
  ): KycCase {
    return new KycCase({
      ...props,
      status: props.status ?? KycStatus.PENDING,
      updatedAt: new Date(),
    });
  }

  static rehydrate(props: KycCaseProps): KycCase {
    return new KycCase(props);
  }

  transition(newStatus: KycStatus, changedBy: string, notes?: string): void {
    if (KYC_TERMINAL_STATUSES.includes(this._status)) {
      throw new Error(`Cannot transition from terminal status ${this._status}`);
    }
    const previous = this._status;
    this._status = newStatus;
    this._updatedAt = new Date();
    if (notes !== undefined) {
      this._notes = notes;
    }
    this.addDomainEvent(
      new KycStatusChangedEvent(this.id, this._clientRecordId, previous, newStatus, changedBy),
    );
  }

  assign(officer: string): void {
    this._assignedTo = officer;
    this._updatedAt = new Date();
  }

  addDocument(documentRef: string): void {
    this._documents.push(documentRef);
    this._updatedAt = new Date();
  }

  get clientRecordId(): string {
    return this._clientRecordId;
  }
  get status(): KycStatus {
    return this._status;
  }
  get assignedTo(): string | null {
    return this._assignedTo;
  }
  get notes(): string | null {
    return this._notes;
  }
  get documents(): string[] {
    return [...this._documents];
  }
  get createdBy(): string {
    return this._createdBy;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
