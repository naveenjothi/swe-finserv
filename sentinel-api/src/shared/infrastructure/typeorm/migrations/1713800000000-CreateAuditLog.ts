import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLog1713800000000 implements MigrationInterface {
  name = 'CreateAuditLog1713800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "aggregate_id" uuid NOT NULL,
        "aggregate_type" varchar(64) NOT NULL,
        "event_type" varchar(128) NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}',
        "performed_by" varchar(128) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_audit_log" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_audit_log_aggregate"
      ON "audit_log" ("aggregate_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_audit_log_event_type"
      ON "audit_log" ("event_type")
    `);

    /* ── append-only trigger ── */
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'audit_log is append-only: % operations are not allowed', TG_OP;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_audit_log_immutable
      BEFORE UPDATE OR DELETE ON "audit_log"
      FOR EACH ROW
      EXECUTE FUNCTION prevent_audit_log_mutation()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_audit_log_immutable ON "audit_log"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS prevent_audit_log_mutation()`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_log_event_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_log_aggregate"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_log"`);
  }
}
