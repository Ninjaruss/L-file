import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationToPageTypeEnum1738200000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'organization' to the page_view_pagetype_enum enum
    await queryRunner.query(`
      ALTER TYPE page_view_pagetype_enum ADD VALUE IF NOT EXISTS 'organization'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type, which is complex
    // For now, we'll leave the enum value in place on rollback
    // If needed, a more complex migration would be required
    console.log('Cannot remove enum value in down migration - this is a PostgreSQL limitation');
  }
}
