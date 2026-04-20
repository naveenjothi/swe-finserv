import { BaseDomainEvent } from '../../../shared/domain/domain-event';

export class BulkReclassificationCompletedEvent extends BaseDomainEvent {
  constructor(
    rulesVersion: string,
    public readonly totalRecordsScanned: number,
    public readonly tierChanges: number,
    public readonly eddEscalations: number,
  ) {
    super(rulesVersion, 'risk-classification.bulk-reclassification-completed');
  }
}
