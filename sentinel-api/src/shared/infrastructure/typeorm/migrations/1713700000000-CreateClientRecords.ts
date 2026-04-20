import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClientRecords1713700000000 implements MigrationInterface {
  name = 'CreateClientRecords1713700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "client_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "client_name" varchar(255) NOT NULL,
        "client_type" varchar(32) NOT NULL,
        "pep_status" boolean NOT NULL DEFAULT false,
        "sanctions_screening_match" boolean NOT NULL DEFAULT false,
        "adverse_media_flag" boolean NOT NULL DEFAULT false,
        "country_of_tax_residence" varchar(128) NOT NULL,
        "annual_income" numeric(15,2) NOT NULL,
        "source_of_funds" varchar(128) NOT NULL,
        "computed_tier" varchar(16) NOT NULL,
        "triggered_rules" jsonb NOT NULL DEFAULT '[]',
        "requires_edd" boolean NOT NULL DEFAULT false,
        "rules_version" varchar(50) NOT NULL,
        "declared_tier" varchar(16) NULL,
        "mismatch" boolean NOT NULL DEFAULT false,
        "submitted_by" varchar(128) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_client_records" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_client_records_tier"
      ON "client_records" ("computed_tier")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_client_records_mismatch"
      ON "client_records" ("mismatch")
      WHERE "mismatch" = true
    `);

    /* ── append-only trigger: prevents UPDATE and DELETE ── */
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_client_record_mutation()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'client_records is append-only: % operations are not allowed', TG_OP;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_client_records_immutable
      BEFORE UPDATE OR DELETE ON "client_records"
      FOR EACH ROW
      EXECUTE FUNCTION prevent_client_record_mutation()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_client_records_immutable ON "client_records"`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS prevent_client_record_mutation()`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_client_records_mismatch"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_client_records_tier"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "client_records"`);
  }
}
