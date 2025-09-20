import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

async function download(url: string, dest: string) {
  const res = await fetch(url, { timeout: 30_000 });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  const buffer = await res.buffer();
  fs.writeFileSync(dest, buffer);
}

async function main() {
  const reportPath = path.join(__dirname, '..', 'database', 'data', 'volume-media-report.json');
  if (!fs.existsSync(reportPath)) {
    console.error('Report not found at', reportPath);
    process.exit(1);
  }
  const rows = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as any[];
  const outDir = path.join(__dirname, '..', '..', 'client', 'public', 'assets', 'volume-covers');
  fs.mkdirSync(outDir, { recursive: true });

  for (const r of rows) {
    const volNum = r.volume_number || r.owner_id;
    const url: string = r.url;
    if (!url) {
      console.log(`Skipping volume ${volNum}: no url`);
      continue;
    }
    // Create a safe filename
    const ext = path.extname(new URL(url).pathname) || '.jpg';
    const fileName = `volume-${String(volNum).padStart(2, '0')}${ext}`;
    const dest = path.join(outDir, fileName);
    if (fs.existsSync(dest)) {
      console.log(`Already exists: ${fileName}`);
      continue;
    }
    try {
      console.log(`Downloading volume ${volNum} -> ${fileName}`);
      await download(url, dest);
    } catch (e) {
      console.error(`Failed to download ${url} for volume ${volNum}:`, e.message || e);
    }
  }

  console.log('Done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
