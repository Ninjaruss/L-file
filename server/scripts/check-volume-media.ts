import { AppDataSource } from '../src/data-source';
import { Media } from '../src/entities/media.entity';

async function main() {
  await AppDataSource.initialize();
  // Use a raw SQL query to avoid TypeScript-find type constraints when running via ts-node
  const rows: any[] = await AppDataSource.manager.query(
    `SELECT id, url, "ownerId", "ownerType", purpose, type, status FROM media WHERE "ownerType" = $1 AND purpose = $2 ORDER BY id LIMIT 20`,
    ['volume', 'entity_display'],
  );
  // Also get a count
  const countResult: any[] = await AppDataSource.manager.query(
    `SELECT count(*)::int as cnt FROM media WHERE "ownerType" = $1 AND purpose = $2`,
    ['volume', 'entity_display'],
  );
  const count = countResult?.[0]?.cnt ?? rows.length;
  console.log('Found', count, 'media rows for volume entity_display (showing up to 20)');
  for (const r of rows) {
    console.log(r.id, r.url, r.ownerId, r.ownerType, r.purpose, r.type, r.status);
  }
  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
