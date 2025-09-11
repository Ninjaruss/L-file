import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaPurposeField1736517800000 implements MigrationInterface {
  name = 'AddMediaPurposeField1736517800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the purpose enum type
    await queryRunner.query(
      `CREATE TYPE "public"."media_purpose_enum" AS ENUM('gallery', 'entity_display')`,
    );

    // Add the purpose column with default value
    await queryRunner.query(
      `ALTER TABLE "media" ADD "purpose" "public"."media_purpose_enum" NOT NULL DEFAULT 'gallery'`,
    );

    // Create index on purpose for efficient querying
    await queryRunner.query(
      `CREATE INDEX "IDX_media_purpose" ON "media" ("purpose")`,
    );

    // Data migration: Set purpose for existing media based on current usage
    // Media with ownerType and ownerId (linked to entities) should be ENTITY_DISPLAY
    // Media without specific entity linkage should remain GALLERY
    await queryRunner.query(`
      UPDATE "media" 
      SET "purpose" = 'entity_display' 
      WHERE "ownerType" IS NOT NULL 
        AND "ownerId" IS NOT NULL 
        AND "isDefault" = true
    `);

    // Additional logic: Set media with specific entity relationships as entity_display
    // This covers cases where old relationship columns might still exist
    await queryRunner.query(`
      UPDATE "media" 
      SET "purpose" = 'entity_display' 
      WHERE ("characterId" IS NOT NULL 
        OR "arcId" IS NOT NULL 
        OR "eventId" IS NOT NULL 
        OR "gambleId" IS NOT NULL)
        AND "isDefault" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the index
    await queryRunner.query(`DROP INDEX "IDX_media_purpose"`);

    // Drop the purpose column
    await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "purpose"`);

    // Drop the enum type
    await queryRunner.query(`DROP TYPE "public"."media_purpose_enum"`);
  }
}
