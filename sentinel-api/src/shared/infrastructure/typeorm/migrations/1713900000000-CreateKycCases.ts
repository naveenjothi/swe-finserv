import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKycCases1713900000000 implements MigrationInterface {
  name = 'CreateKycCases1713900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "kyc_cases" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "client_record_id" uuid NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'PENDING',
        "assigned_to" varchar(128) NULL,
        "notes" text NULL,
        "documents" jsonb NOT NULL DEFAULT '[]',
        "created_by" varchar(128) NOT NULL,
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_kyc_cases" PRIMARY KEY ("id"),
        CONSTRAINT "uq_kyc_cases_client" UNIQUE ("client_record_id"),
        CONSTRAINT "fk_kyc_cases_client" FOREIGN KEY ("client_record_id")
          REFERENCES "client_records" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_kyc_cases_status"
      ON "kyc_cases" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_kyc_cases_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "kyc_cases"`);
  }
}
