import { AppDataSource } from '../src/data-source';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  await AppDataSource.initialize();

  const rows: any[] = await AppDataSource.manager.query(
    `SELECT m.id as media_id, m.url, m."ownerId" as owner_id, m."ownerType" as owner_type, m.purpose, m.type, m.status, v.id as volume_id, v.number as volume_number, v."startChapter" as startChapter, v."endChapter" as endChapter, v.description as volume_description
     FROM media m
     LEFT JOIN volume v ON v.id = m."ownerId" AND m."ownerType" = 'volume'
     WHERE m."ownerType" = $1 AND m.purpose = $2
     ORDER BY v.number`,
    ['volume', 'entity_display'],
  );

  const outDir = path.join(__dirname, '..', 'database', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'volume-media-report.json');
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf8');
  console.log('Wrote report to', outPath, 'with', rows.length, 'rows');

  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
