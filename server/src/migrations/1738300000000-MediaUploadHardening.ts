import { MigrationInterface, QueryRunner } from 'typeorm';

export class MediaUploadHardening1738300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create MediaUsageType enum
    await queryRunner.query(`
      CREATE TYPE media_usagetype_enum AS ENUM ('character_image', 'guide_image', 'gallery_upload')
    `);

    // 2. Add new columns to media table (all nullable for backward compatibility)
    await queryRunner.query(`
      ALTER TABLE media
      ADD COLUMN "key" VARCHAR(500),
      ADD COLUMN "mimeType" VARCHAR(100),
      ADD COLUMN "fileSize" INTEGER,
      ADD COLUMN "width" INTEGER,
      ADD COLUMN "height" INTEGER,
      ADD COLUMN "usageType" media_usagetype_enum
    `);

    // 3. Change media.id from integer to UUID
    // This is a complex operation that requires:
    // - Creating a new UUID column
    // - Generating UUIDs for existing rows
    // - Updating foreign keys
    // - Dropping old column and renaming new one

    // Add new UUID column
    await queryRunner.query(`
      ALTER TABLE media ADD COLUMN id_new UUID DEFAULT gen_random_uuid()
    `);

    // Generate UUIDs for existing rows
    await queryRunner.query(`
      UPDATE media SET id_new = gen_random_uuid() WHERE id_new IS NULL
    `);

    // Make id_new not nullable
    await queryRunner.query(`
      ALTER TABLE media ALTER COLUMN id_new SET NOT NULL
    `);

    // Update foreign key in user table
    await queryRunner.query(`
      ALTER TABLE "user" ADD COLUMN "selectedCharacterMediaId_new" UUID
    `);

    await queryRunner.query(`
      UPDATE "user" u
      SET "selectedCharacterMediaId_new" = m.id_new
      FROM media m
      WHERE u."selectedCharacterMediaId" = m.id
    `);

    // Update foreign key in character_media_popularity table
    await queryRunner.query(`
      ALTER TABLE character_media_popularity ADD COLUMN "mediaId_new" UUID
    `);

    await queryRunner.query(`
      UPDATE character_media_popularity cmp
      SET "mediaId_new" = m.id_new
      FROM media m
      WHERE cmp."mediaId" = m.id
    `);

    // Drop old foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "FK_user_selectedCharacterMediaId"
    `);

    await queryRunner.query(`
      ALTER TABLE character_media_popularity DROP CONSTRAINT IF EXISTS "FK_character_media_popularity_mediaId"
    `);

    await queryRunner.query(`
      ALTER TABLE character_media_popularity DROP CONSTRAINT IF EXISTS "UQ_character_media_popularity_mediaId"
    `);

    // Drop old columns
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN "selectedCharacterMediaId"
    `);

    await queryRunner.query(`
      ALTER TABLE character_media_popularity DROP COLUMN "mediaId"
    `);

    // Drop old primary key and id column from media
    await queryRunner.query(`
      ALTER TABLE media DROP CONSTRAINT IF EXISTS "PK_media"
    `);

    await queryRunner.query(`
      ALTER TABLE media DROP COLUMN id
    `);

    // Rename new columns
    await queryRunner.query(`
      ALTER TABLE media RENAME COLUMN id_new TO id
    `);

    await queryRunner.query(`
      ALTER TABLE "user" RENAME COLUMN "selectedCharacterMediaId_new" TO "selectedCharacterMediaId"
    `);

    await queryRunner.query(`
      ALTER TABLE character_media_popularity RENAME COLUMN "mediaId_new" TO "mediaId"
    `);

    // Add new primary key
    await queryRunner.query(`
      ALTER TABLE media ADD CONSTRAINT "PK_media" PRIMARY KEY (id)
    `);

    // Re-add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD CONSTRAINT "FK_user_selectedCharacterMediaId"
      FOREIGN KEY ("selectedCharacterMediaId")
      REFERENCES media(id)
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE character_media_popularity
      ADD CONSTRAINT "FK_character_media_popularity_mediaId"
      FOREIGN KEY ("mediaId")
      REFERENCES media(id)
      ON DELETE CASCADE
    `);

    // Re-add unique constraint
    await queryRunner.query(`
      ALTER TABLE character_media_popularity
      ADD CONSTRAINT "UQ_character_media_popularity_mediaId"
      UNIQUE ("mediaId")
    `);

    // Make character_media_popularity.mediaId NOT NULL
    await queryRunner.query(`
      ALTER TABLE character_media_popularity
      ALTER COLUMN "mediaId" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // WARNING: This down migration will lose data if UUIDs can't be converted back to integers
    // In production, you may want to keep a backup of the original IDs

    console.warn(
      'WARNING: Downgrading from UUID to integer IDs will lose data. This migration should not be run in production.',
    );

    // Remove new columns
    await queryRunner.query(`
      ALTER TABLE media
      DROP COLUMN IF EXISTS "key",
      DROP COLUMN IF EXISTS "mimeType",
      DROP COLUMN IF EXISTS "fileSize",
      DROP COLUMN IF EXISTS "width",
      DROP COLUMN IF EXISTS "height",
      DROP COLUMN IF EXISTS "usageType"
    `);

    // Drop MediaUsageType enum
    await queryRunner.query(`
      DROP TYPE IF EXISTS media_usagetype_enum
    `);

    // Reverting UUID back to integer is complex and data-lossy
    // For simplicity, we'll note that a full rollback would require:
    // 1. Creating new integer ID columns
    // 2. Generating sequential IDs
    // 3. Updating all foreign keys
    // 4. Dropping UUID columns and renaming integer columns back

    console.log(
      'UUID to integer rollback not implemented - would require complex data migration',
    );
  }
}
