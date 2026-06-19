import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenIndex1745000000000 implements MigrationInterface {
  name = 'AddRefreshTokenIndex1745000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_refreshToken"
      ON "user" ("refreshToken")
      WHERE "refreshToken" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_refreshToken"
    `);
  }
}
