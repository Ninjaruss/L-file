import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserVolumeBadgeToEditLogEnum1745000000000
  implements MigrationInterface
{
  name = 'AddUserVolumeBadgeToEditLogEnum1745000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "edit_log_entitytype_enum" ADD VALUE IF NOT EXISTS 'user'`,
    );
    await queryRunner.query(
      `ALTER TYPE "edit_log_entitytype_enum" ADD VALUE IF NOT EXISTS 'volume'`,
    );
    await queryRunner.query(
      `ALTER TYPE "edit_log_entitytype_enum" ADD VALUE IF NOT EXISTS 'badge'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
    // A full enum recreation would be required. Omitted for safety.
  }
}
