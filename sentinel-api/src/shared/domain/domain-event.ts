export interface DomainEvent {
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly eventType: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
  ) {
    this.occurredAt = new Date();
  }
}
