import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuoteToEditLogEnum1744500000000 implements MigrationInterface {
  name = 'AddQuoteToEditLogEnum1744500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "edit_log_entitytype_enum" ADD VALUE IF NOT EXISTS 'quote'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
    // A full enum recreation would be required. Omitted for safety.
  }
}
