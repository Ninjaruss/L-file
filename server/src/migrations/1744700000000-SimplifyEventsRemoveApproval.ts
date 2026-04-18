import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyEventsRemoveApproval1744700000000 implements MigrationInterface {
  name = 'SimplifyEventsRemoveApproval1744700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event" DROP COLUMN IF EXISTS "status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" DROP COLUMN IF EXISTS "rejection_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "page_number" integer NULL`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."event_status_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."event_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD COLUMN "status" "public"."event_status_enum" NOT NULL DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD COLUMN "rejection_reason" character varying(500) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" DROP COLUMN IF EXISTS "page_number"`,
    );
  }
}
