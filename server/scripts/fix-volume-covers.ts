import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'src', 'database', 'data');
const VOLUMES_JSON = path.join(DATA_DIR, 'volumes.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

function backup(filePath: string) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const name = path.basename(filePath, '.json');
  const dest = path.join(BACKUP_DIR, `${name}-backup-${ts}.json`);
  fs.copyFileSync(filePath, dest);
  return dest;
}

function absoluteUrl(src: string) {
  if (!src) return src;
  if (src.startsWith('http')) return src;
  if (src.startsWith('//')) return 'https:' + src;
  if (src.startsWith('/')) return 'https://usogui.fandom.com' + src;
  return src;
}

function findNearestChapterNum($node: any, $: any) {
  // Search nearby text for "Chapter N" patterns
  const searchNodes: any[] = [];
  // add parents up to 3 levels
  let cur = $node.parent();
  for (let i = 0; i < 5 && cur.length; i++) {
    searchNodes.push(...cur.toArray());
    cur = cur.parent();
  }
  // add previous siblings of parent
  const parent = $node.parent();
  if (parent && parent.length) {
    let sib = parent.prev();
    for (let i = 0; i < 10 && sib.length; i++) {
      searchNodes.push(...sib.toArray());
      sib = sib.prev();
    }
    sib = parent.next();
    for (let i = 0; i < 5 && sib.length; i++) {
      searchNodes.push(...sib.toArray());
      sib = sib.next();
    }
  }

  // flatten unique
  const texts = searchNodes.map((el) => $(el).text()).filter(Boolean).join('\n');
  const m = texts.match(/Chapter\s*(\d{1,4})/i);
  if (m) return parseInt(m[1], 10);
  // fallback: match any standalone number lines (e.g., leading numbers)
  const m2 = texts.match(/(^|\s)(\d{1,4})(\s|\.|:)/);
  if (m2) return parseInt(m2[2], 10);
  return null;
}

async function main() {
  if (!fs.existsSync(VOLUMES_JSON)) throw new Error('volumes.json missing');
  const volumes = JSON.parse(fs.readFileSync(VOLUMES_JSON, 'utf8')) as any[];
  const backupPath = backup(VOLUMES_JSON);
  console.log('Backed up volumes.json to', backupPath);

  const url = 'https://usogui.fandom.com/wiki/List_of_Chapters';
  console.log('Fetching', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const $content = $('#mw-content-text');

  // Collect candidate images within content
  const images: { src: string; chapter?: number | null; node: any }[] = [];
  $content.find('img').each((i, img) => {
    const $img = $(img);
    let src = $img.attr('data-src') || $img.attr('src') || '';
    src = absoluteUrl(src);
    const chapter = findNearestChapterNum($img, $);
    images.push({ src, chapter, node: img });
  });

  console.log('Found', images.length, 'images; trying to map to volumes');

  // For each image with chapter, find which volume contains that chapter
  const volByNum = new Map<number, any>();
  for (const v of volumes) volByNum.set(v.number, v);

  const updates: { volumeNumber: number; old: string | null; new: string }[] = [];

  for (const img of images) {
    if (!img.chapter) continue;
    const ch = img.chapter;
    // find volume where startChapter <= ch <= endChapter
    const vol = volumes.find((v) => v.startChapter != null && v.endChapter != null && ch >= v.startChapter && ch <= v.endChapter);
    if (vol) {
      const old = vol.coverUrl || null;
      const newUrl = img.src;
      // prefer images where src includes 'static.wikia' or '/images/'
      if (!old || old !== newUrl) {
        vol.coverUrl = newUrl;
        updates.push({ volumeNumber: vol.number, old, new: newUrl });
      }
    }
  }

  // As a fallback, map images in order to volumes without coverUrl
  const volsNeeding = volumes.filter((v) => !v.coverUrl).map((v) => v.number);
  if (volsNeeding.length > 0) {
    console.log('Volumes still missing coverUrl:', volsNeeding.length);
    // map remaining images (in document order) to remaining volumes in sequence
    let imgIdx = 0;
    for (const vnum of volsNeeding) {
      // find next image not already used
      while (imgIdx < images.length && !images[imgIdx].src) imgIdx++;
      if (imgIdx >= images.length) break;
      const candidate = images[imgIdx];
      const vol = volumes.find((vv) => vv.number === vnum);
      const old = vol.coverUrl || null;
      vol.coverUrl = candidate.src;
      updates.push({ volumeNumber: vnum, old, new: candidate.src });
      imgIdx++;
    }
  }

  // Write back volumes.json
  fs.writeFileSync(VOLUMES_JSON, JSON.stringify(volumes, null, 2), 'utf8');

  console.log('Applied', updates.length, 'coverUrl updates. Sample:');
  console.log(updates.slice(0, 20));
  const remaining = volumes.filter((v) => !v.coverUrl).map((v) => v.number);
  console.log('Volumes still missing coverUrl after mapping:', remaining.length, remaining.slice(0, 50));
}

main().catch((e) => { console.error(e); process.exit(1); });
