import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPolymorphicMediaFields1736517600000
  implements MigrationInterface
{
  name = 'AddPolymorphicMediaFields1736517600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create MediaOwnerType enum
    await queryRunner.query(
      `CREATE TYPE "media_ownertype_enum" AS ENUM('character', 'arc', 'event', 'gamble', 'faction', 'user')`,
    );

    // Add new polymorphic fields to media table
    await queryRunner.query(
      `ALTER TABLE "media" ADD "ownerType" "media_ownertype_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "media" ADD "ownerId" integer`);
    await queryRunner.query(`ALTER TABLE "media" ADD "chapterNumber" integer`);
    await queryRunner.query(
      `ALTER TABLE "media" ADD "isDefault" boolean NOT NULL DEFAULT false`,
    );

    // Add indexes for the new polymorphic fields
    await queryRunner.query(
      `CREATE INDEX "IDX_media_ownerType_ownerId" ON "media" ("ownerType", "ownerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_ownerType_ownerId_chapterNumber" ON "media" ("ownerType", "ownerId", "chapterNumber")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_ownerType_ownerId_isDefault" ON "media" ("ownerType", "ownerId", "isDefault")`,
    );

    // Migrate existing data from old relationship fields to new polymorphic fields
    console.log(
      'Migrating existing media relationships to polymorphic format...',
    );

    // Migrate character relationships
    await queryRunner.query(
      `UPDATE "media" SET "ownerType" = 'character', "ownerId" = "characterId" WHERE "characterId" IS NOT NULL`,
    );

    // Migrate arc relationships
    await queryRunner.query(
      `UPDATE "media" SET "ownerType" = 'arc', "ownerId" = "arcId" WHERE "arcId" IS NOT NULL AND "ownerType" IS NULL`,
    );

    // Migrate event relationships
    await queryRunner.query(
      `UPDATE "media" SET "ownerType" = 'event', "ownerId" = "eventId" WHERE "eventId" IS NOT NULL AND "ownerType" IS NULL`,
    );

    // Migrate gamble relationships
    await queryRunner.query(
      `UPDATE "media" SET "ownerType" = 'gamble', "ownerId" = "gambleId" WHERE "gambleId" IS NOT NULL AND "ownerType" IS NULL`,
    );

    console.log('Migration of existing relationships completed.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes for polymorphic fields
    await queryRunner.query(
      `DROP INDEX "IDX_media_ownerType_ownerId_isDefault"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_media_ownerType_ownerId_chapterNumber"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_media_ownerType_ownerId"`);

    // Remove polymorphic fields
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "isDefault"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "chapterNumber"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "ownerType"`);

    // Drop the enum type
    await queryRunner.query(`DROP TYPE "media_ownertype_enum"`);
  }
}
