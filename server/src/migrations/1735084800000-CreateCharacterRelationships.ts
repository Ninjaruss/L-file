import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCharacterRelationships1735084800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the relationship type enum
    await queryRunner.query(`
      CREATE TYPE character_relationship_type_enum AS ENUM (
        'ally',
        'rival',
        'mentor',
        'subordinate',
        'family',
        'partner',
        'enemy',
        'acquaintance'
      );
    `);

    // Create the character_relationship table
    await queryRunner.query(`
      CREATE TABLE character_relationship (
        id SERIAL PRIMARY KEY,
        "sourceCharacterId" INTEGER NOT NULL,
        "targetCharacterId" INTEGER NOT NULL,
        "relationshipType" character_relationship_type_enum NOT NULL,
        description TEXT,
        "startChapter" INTEGER NOT NULL,
        "endChapter" INTEGER,
        "spoilerChapter" INTEGER NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT fk_source_character
          FOREIGN KEY ("sourceCharacterId")
          REFERENCES character(id)
          ON DELETE CASCADE,

        CONSTRAINT fk_target_character
          FOREIGN KEY ("targetCharacterId")
          REFERENCES character(id)
          ON DELETE CASCADE,

        CONSTRAINT chk_no_self_relationship
          CHECK ("sourceCharacterId" != "targetCharacterId"),

        CONSTRAINT chk_valid_chapter_range
          CHECK ("endChapter" IS NULL OR "endChapter" >= "startChapter")
      );
    `);

    // Create indexes for efficient querying
    await queryRunner.query(`
      CREATE INDEX "IDX_character_relationship_source"
      ON character_relationship ("sourceCharacterId");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_character_relationship_target"
      ON character_relationship ("targetCharacterId");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_character_relationship_type"
      ON character_relationship ("relationshipType");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_character_relationship_spoiler"
      ON character_relationship ("spoilerChapter");
    `);

    // Unique constraint to prevent duplicate relationships at the same start chapter
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_character_relationship_unique"
      ON character_relationship ("sourceCharacterId", "targetCharacterId", "startChapter");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_character_relationship_unique"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_character_relationship_spoiler"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_character_relationship_type"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_character_relationship_target"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_character_relationship_source"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS character_relationship`);

    // Drop enum
    await queryRunner.query(
      `DROP TYPE IF EXISTS character_relationship_type_enum`,
    );
  }
}
