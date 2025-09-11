import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateCharacterImagesToMedia1736600000000
  implements MigrationInterface
{
  name = 'MigrateCharacterImagesToMedia1736600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migrate existing character images to the new Media system
    await queryRunner.query(`
      INSERT INTO media (
        url,
        type,
        description,
        "ownerType",
        "ownerId",
        "isDefault",
        status,
        purpose,
        "submittedById",
        "createdAt"
      )
      SELECT 
        c."imageFileName" as url,
        'image' as type,
        COALESCE(c."imageDisplayName", c.name || ' - Official Portrait') as description,
        'character' as "ownerType",
        c.id as "ownerId",
        true as "isDefault",
        'approved' as status,
        'entity_display' as purpose,
        1 as "submittedById", -- Use admin user ID, adjust as needed
        NOW() as "createdAt"
      FROM character c
      WHERE c."imageFileName" IS NOT NULL 
        AND c."imageFileName" != ''
        AND NOT EXISTS (
          SELECT 1 FROM media m 
          WHERE m."ownerType" = 'character' 
            AND m."ownerId" = c.id 
            AND m.purpose = 'entity_display'
        );
    `);

    console.log('Migrated character images to new Media system');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove migrated character media
    await queryRunner.query(`
      DELETE FROM media 
      WHERE "ownerType" = 'character' 
        AND purpose = 'entity_display'
        AND "submittedById" = 1;
    `);

    console.log('Reverted character image migration');
  }
}
