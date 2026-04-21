import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ClientDetailView, GetClientByIdQuery } from './get-client-by-id.query';

@QueryHandler(GetClientByIdQuery)
export class GetClientByIdHandler implements IQueryHandler<GetClientByIdQuery, ClientDetailView> {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(query: GetClientByIdQuery): Promise<ClientDetailView> {
    const rows = await this.dataSource.query(
      `
      SELECT 
        c.*,
        k.status as kyc_status
      FROM client_records c
      LEFT JOIN kyc_cases k ON k.client_record_id = c.id
      WHERE c.id = $1
      `,
      [query.id],
    );

    if (rows.length === 0) {
      throw new NotFoundException(`Client record ${query.id} not found`);
    }
    const r = rows[0];

    // Parse json columns if they come as string
    const triggeredRules =
      typeof r.triggered_rules === 'string' ? JSON.parse(r.triggered_rules) : r.triggered_rules;

    return {
      id: r.id,
      client_name: r.client_name,
      client_type: r.client_type,
      pep_status: r.pep_status,
      sanctions_screening_match: r.sanctions_screening_match,
      adverse_media_flag: r.adverse_media_flag,
      country_of_tax_residence: r.country_of_tax_residence,
      annual_income: r.annual_income,
      source_of_funds: r.source_of_funds,
      computed_tier: r.computed_tier,
      triggered_rules: triggeredRules,
      requires_edd: r.requires_edd,
      kyc_status: r.kyc_status || null,
      rules_version: r.rules_version,
      declared_tier: r.declared_tier,
      mismatch: r.mismatch,
      submitted_by: r.submitted_by,
      created_at:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : new Date(r.created_at).toISOString(),
    };
  }
}
