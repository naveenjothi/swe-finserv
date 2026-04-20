import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  INITIAL_RULES_PAYLOAD,
  INITIAL_RULES_VERSION,
} from '../../../../risk-classification/infrastructure/seed/initial-rules.payload';

export class CreateRulesConfig1713600000000 implements MigrationInterface {
  name = 'CreateRulesConfig1713600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "rules_config" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "version" varchar(50) NOT NULL,
        "valid_from" timestamptz NOT NULL,
        "valid_to" timestamptz NULL,
        "payload" jsonb NOT NULL,
        "source" varchar(32) NOT NULL,
        "created_by" varchar(128) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_rules_config" PRIMARY KEY ("id"),
        CONSTRAINT "uq_rules_config_version" UNIQUE ("version")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_rules_config_active"
      ON "rules_config" ("valid_from" DESC)
      WHERE "valid_to" IS NULL
    `);

    await queryRunner.query(
      `INSERT INTO "rules_config"
       ("version", "valid_from", "valid_to", "payload", "source", "created_by")
       VALUES ($1, now(), NULL, $2::jsonb, 'SEED', 'system')`,
      [INITIAL_RULES_VERSION, JSON.stringify(INITIAL_RULES_PAYLOAD)],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_rules_config_active"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rules_config"`);
  }
}
