import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveRedundantDeathFields1755876460688 implements MigrationInterface {
    name = 'RemoveRedundantDeathFields1755876460688'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP COLUMN "isDeathSpoiler"`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" DROP COLUMN "deathContext"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD "deathContext" text`);
        await queryRunner.query(`ALTER TABLE "chapter_spoiler" ADD "isDeathSpoiler" boolean`);
    }

}
