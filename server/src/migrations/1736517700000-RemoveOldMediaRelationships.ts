import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOldMediaRelationships1736517700000
  implements MigrationInterface
{
  name = 'RemoveOldMediaRelationships1736517700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(
      'WARNING: This migration will remove old media relationship fields.',
    );
    console.log(
      'Ensure all data has been properly migrated to the new polymorphic system before running this.',
    );

    // Remove foreign key constraints first
    await queryRunner.query(
      `ALTER TABLE "media" DROP CONSTRAINT IF EXISTS "FK_media_character"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media" DROP CONSTRAINT IF EXISTS "FK_media_arc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media" DROP CONSTRAINT IF EXISTS "FK_media_event"`,
    );
    await queryRunner.query(
      `ALTER TABLE "media" DROP CONSTRAINT IF EXISTS "FK_media_gamble"`,
    );

    // Remove old relationship columns
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "characterId"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "arcId"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "eventId"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "gambleId"`);

    console.log('Old media relationship fields removed successfully.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add old relationship columns
    await queryRunner.query(`ALTER TABLE "media" ADD "characterId" integer`);
    await queryRunner.query(`ALTER TABLE "media" ADD "arcId" integer`);
    await queryRunner.query(`ALTER TABLE "media" ADD "eventId" integer`);
    await queryRunner.query(`ALTER TABLE "media" ADD "gambleId" integer`);

    // Note: This down migration cannot restore the foreign key constraints or data
    // as they would need to be manually recreated based on the current database schema
    console.log(
      'WARNING: Old relationship columns restored but foreign key constraints and data must be manually recreated.',
    );
  }
}
