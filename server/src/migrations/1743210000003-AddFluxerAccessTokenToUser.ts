import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFluxerAccessTokenToUser1743210000003 implements MigrationInterface {
  name = 'AddFluxerAccessTokenToUser1743210000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "fluxerAccessToken" VARCHAR
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "fluxerAccessToken"
    `);
  }
}
