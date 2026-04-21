import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationshipManager1714100000000 implements MigrationInterface {
  name = 'AddRelationshipManager1714100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "client_records" ADD "relationship_manager" varchar(128)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "client_records" DROP COLUMN "relationship_manager"`);
  }
}
