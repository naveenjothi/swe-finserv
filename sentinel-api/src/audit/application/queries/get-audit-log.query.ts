export class GetAuditLogQuery {
  constructor(
    public readonly skip: number,
    public readonly take: number,
    public readonly aggregateId?: string,
  ) {}
}

export interface AuditEntryView {
  id: string;
  aggregate_id: string;
  aggregate_type: string;
  event_type: string;
  payload: Record<string, unknown>;
  performed_by: string;
  created_at: string;
}
