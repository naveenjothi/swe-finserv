import { ClassifiableRecord } from '../../domain/value-objects/classifiable-record.vo';

export class ClassifyRecordCommand {
  constructor(public readonly record: ClassifiableRecord) {}
}

export interface ClassifyRecordResult {
  rulesVersion: string;
  computed_tier: string;
  triggered_rules: Array<{ tier: string; code: string; description: string }>;
  requires_edd: boolean;
}
