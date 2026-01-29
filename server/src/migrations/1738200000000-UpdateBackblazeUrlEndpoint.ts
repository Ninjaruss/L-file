import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBackblazeUrlEndpoint1738200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update media table URLs from f000 to f005
    await queryRunner.query(`
      UPDATE media
      SET url = REPLACE(url, 'https://f000.backblazeb2.com/', 'https://f005.backblazeb2.com/')
      WHERE url LIKE 'https://f000.backblazeb2.com/%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert media table URLs from f005 back to f000
    await queryRunner.query(`
      UPDATE media
      SET url = REPLACE(url, 'https://f005.backblazeb2.com/', 'https://f000.backblazeb2.com/')
      WHERE url LIKE 'https://f005.backblazeb2.com/%'
    `);
  }
}
