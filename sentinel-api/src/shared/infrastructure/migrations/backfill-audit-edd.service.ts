import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BackfillAuditEddService {
  private readonly logger = new Logger(BackfillAuditEddService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async runBackfill(): Promise<{ auditCreated: number; kycCasesCreated: number }> {
    this.logger.log('Starting backfill for missing audit entries and KYC cases');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    let auditCreated = 0;
    let kycCasesCreated = 0;

    try {
      // 1. Backfill Audit Entries
      const unAuditedClients = await queryRunner.query(`
        SELECT c.id, c.created_at, c.rules_version, c.computed_tier
        FROM client_records c
        LEFT JOIN audit_logs a ON a.aggregate_id = c.id AND a.event_type = 'onboarding.submitted'
        WHERE a.id IS NULL
      `);

      for (const client of unAuditedClients) {
        const payload = {
          rulesVersion: client.rules_version,
          computedTier: client.computed_tier,
          migrated: true,
        };

        await queryRunner.query(
          `
          INSERT INTO audit_logs (id, aggregate_id, aggregate_type, event_type, payload, performed_by, created_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
          `,
          [
            client.id,
            'ClientRecord',
            'onboarding.submitted',
            JSON.stringify(payload),
            'MIGRATION',
            client.created_at, // Preserve original creation time
          ],
        );
        auditCreated++;
      }

      // 2. Backfill KYC Cases for HIGH/MEDIUM risk
      const clientsWithoutKyc = await queryRunner.query(`
        SELECT c.id, c.computed_tier, c.requires_edd
        FROM client_records c
        LEFT JOIN kyc_cases k ON k.client_record_id = c.id
        WHERE k.id IS NULL AND (c.computed_tier = 'HIGH' OR c.computed_tier = 'MEDIUM')
      `);

      for (const client of clientsWithoutKyc) {
        const initialStatus =
          client.computed_tier === 'HIGH' ? 'ENHANCED_DUE_DILIGENCE' : 'PENDING';

        const kycCaseId = await queryRunner.query(
          `
          INSERT INTO kyc_cases (id, client_record_id, status, assigned_to, notes, documents, created_by, updated_at, created_at)
          VALUES (gen_random_uuid(), $1, $2, NULL, $3, '[]', $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
          `,
          [
            client.id,
            initialStatus,
            'Auto-created during migration — requires EDD approval',
            'MIGRATION',
          ],
        );

        // Emit an audit log for the KYC case creation
        await queryRunner.query(
          `
          INSERT INTO audit_logs (id, aggregate_id, aggregate_type, event_type, payload, performed_by, created_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          `,
          [
            kycCaseId[0].id,
            'KycCase',
            'kyc.case_opened',
            JSON.stringify({ migrated: true }),
            'MIGRATION',
          ],
        );

        kycCasesCreated++;
      }

      this.logger.log(
        `Backfill complete: ${auditCreated} audit entries, ${kycCasesCreated} KYC cases created.`,
      );
      return { auditCreated, kycCasesCreated };
    } finally {
      await queryRunner.release();
    }
  }
}
