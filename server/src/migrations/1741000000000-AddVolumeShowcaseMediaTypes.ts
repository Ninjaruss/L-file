import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVolumeShowcaseMediaTypes1741000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE media_usagetype_enum ADD VALUE IF NOT EXISTS 'volume_showcase_background'
    `);
    await queryRunner.query(`
      ALTER TYPE media_usagetype_enum ADD VALUE IF NOT EXISTS 'volume_showcase_popout'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values without recreating the type.
    // To roll back, you would need to recreate the enum without these values.
    console.warn(
      'Rollback of enum value removal is not supported automatically.',
    );
  }
}
