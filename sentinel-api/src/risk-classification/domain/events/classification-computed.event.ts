import { BaseDomainEvent } from '../../../shared/domain/domain-event';
import { ClassificationResult } from '../value-objects/classification-result.vo';

export class ClassificationComputedEvent extends BaseDomainEvent {
  constructor(
    recordId: string,
    public readonly rulesVersion: string,
    public readonly result: ClassificationResult,
  ) {
    super(recordId, 'risk-classification.classification-computed');
  }
}
