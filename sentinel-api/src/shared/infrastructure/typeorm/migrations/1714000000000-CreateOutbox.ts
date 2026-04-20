import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOutbox1714000000000 implements MigrationInterface {
  name = 'CreateOutbox1714000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "outbox" (
        "id"            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "event_type"    varchar(128)  NOT NULL,
        "aggregate_id"  uuid          NOT NULL,
        "payload"       jsonb         NOT NULL DEFAULT '{}',
        "status"        varchar(16)   NOT NULL DEFAULT 'PENDING',
        "retries"       int           NOT NULL DEFAULT 0,
        "created_at"    timestamptz   NOT NULL DEFAULT now(),
        "published_at"  timestamptz
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_outbox_pending" ON "outbox" ("status", "created_at")
      WHERE "status" = 'PENDING';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_outbox_pending";`);
    await queryRunner.query(`DROP TABLE "outbox";`);
  }
}
