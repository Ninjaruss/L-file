import { AppDataSource } from '../src/data-source';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  await AppDataSource.initialize();

  const reportPath = path.join(__dirname, '..', 'database', 'data', 'volume-media-report.json');
  if (!fs.existsSync(reportPath)) {
    console.error('Report not found at', reportPath);
    process.exit(1);
  }
  const rows = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as any[];

  const backupDir = path.join(__dirname, '..', 'database', 'data', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `media-backup-${ts}.json`);

  const toUpdate = [] as any[];
  for (const r of rows) {
    const volNum = r.volume_number || r.owner_id;
    const ext = path.extname(new URL(r.url || '').pathname) || '.jpg';
    const fileName = `volume-${String(volNum).padStart(2, '0')}${ext}`;
    const localUrl = `/assets/volume-covers/${fileName}`;
    toUpdate.push({ id: r.media_id, oldUrl: r.url, newUrl: localUrl, fileName });
  }

  fs.writeFileSync(backupPath, JSON.stringify(toUpdate, null, 2), 'utf8');
  console.log('Wrote backup of pending updates to', backupPath);

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    for (const u of toUpdate) {
      await queryRunner.manager.query(
        `UPDATE media SET url = $1, "fileName" = $2, "isUploaded" = $3 WHERE id = $4`,
        [u.newUrl, u.fileName, true, u.id],
      );
    }
    await queryRunner.commitTransaction();
    console.log('Updated', toUpdate.length, 'media rows to local URLs');
  } catch (e) {
    await queryRunner.rollbackTransaction();
    console.error('Transaction failed, rolled back:', e);
    process.exit(1);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
