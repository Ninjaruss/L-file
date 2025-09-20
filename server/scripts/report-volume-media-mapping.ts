import { AppDataSource } from '../src/data-source';

async function main() {
  await AppDataSource.initialize();

  const rows: any[] = await AppDataSource.manager.query(
    `SELECT m.id as media_id, m.url, m."ownerId" as owner_id, m."ownerType" as owner_type, m.purpose, m.type, m.status, v.id as volume_id, v.number as volume_number
     FROM media m
     LEFT JOIN volume v ON v.id = m."ownerId" AND m."ownerType" = 'volume'
     WHERE m."ownerType" = $1 AND m.purpose = $2
     ORDER BY m.id`,
    ['volume', 'entity_display'],
  );

  console.log('Total media rows checked:', rows.length);
  const missing: any[] = [];
  for (const r of rows) {
    const volumeInfo = r.volume_id ? `${r.volume_id} (number ${r.volume_number})` : 'MISSING';
    console.log(`${r.media_id}: ownerId=${r.owner_id} -> volume=${volumeInfo}  url=${r.url}  status=${r.status}`);
    if (!r.volume_id) missing.push(r);
  }

  if (missing.length === 0) {
    console.log('\nAll media rows map to an existing Volume.');
  } else {
    console.log(`\n${missing.length} media rows have missing or invalid ownerId mapping to volume.`);
  }

  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
