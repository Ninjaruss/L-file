import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArcParentRelationship1735300000000 implements MigrationInterface {
  name = 'AddArcParentRelationship1735300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add parentId column to arc table
    await queryRunner.query(`
      ALTER TABLE "arc"
      ADD COLUMN "parentId" INTEGER;
    `);

    // Create index for efficient queries
    await queryRunner.query(`
      CREATE INDEX "IDX_arc_parent"
      ON arc ("parentId");
    `);

    // Add foreign key constraint (self-referencing)
    await queryRunner.query(`
      ALTER TABLE "arc"
      ADD CONSTRAINT "FK_arc_parent"
      FOREIGN KEY ("parentId") REFERENCES "arc"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "arc"
      DROP CONSTRAINT IF EXISTS "FK_arc_parent";
    `);

    // Remove index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_arc_parent";
    `);

    // Remove parentId column
    await queryRunner.query(`
      ALTER TABLE "arc"
      DROP COLUMN IF EXISTS "parentId";
    `);
  }
}
