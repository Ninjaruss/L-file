import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChapterNumberToNumeric1744600000000 implements MigrationInterface {
  name = 'ChapterNumberToNumeric1744600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Widen chapter number from integer to numeric(5,1) to support side-story
    // chapters like 20.5, 31.5, etc. Existing integer values cast cleanly.
    await queryRunner.query(`
      ALTER TABLE "chapter"
      ALTER COLUMN "number" TYPE numeric(5,1) USING "number"::numeric(5,1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to integer — truncates any decimal chapter numbers.
    await queryRunner.query(`
      ALTER TABLE "chapter"
      ALTER COLUMN "number" TYPE integer USING "number"::integer
    `);
  }
}
