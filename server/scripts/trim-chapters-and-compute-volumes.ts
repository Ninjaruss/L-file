import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'src', 'database', 'data');
const CHAPTERS_JSON = path.join(DATA_DIR, 'chapters.json');
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

async function trimChapters(maxChapter = 539) {
  if (!fs.existsSync(CHAPTERS_JSON)) throw new Error('chapters.json missing');
  const chapters = JSON.parse(fs.readFileSync(CHAPTERS_JSON, 'utf8')) as any[];
  const filtered = chapters.filter((c) => typeof c.number === 'number' && c.number <= maxChapter);
  if (filtered.length === chapters.length) {
    console.log('No chapters to trim; total chapters:', chapters.length);
    return { changed: false, originalCount: chapters.length, newCount: filtered.length };
  }
  const backupPath = backup(CHAPTERS_JSON);
  fs.writeFileSync(CHAPTERS_JSON, JSON.stringify(filtered, null, 2), 'utf8');
  console.log(`Trimmed chapters.json: ${chapters.length} -> ${filtered.length}; backup at ${backupPath}`);
  return { changed: true, originalCount: chapters.length, newCount: filtered.length, backupPath };
}

function findChapterAfterIndex(html: string, index: number): number | null {
  // search from index for first occurrence of 'Chapter N' pattern
  const sub = html.slice(index);
  const m = sub.match(/Chapter\s*(\d{1,4})/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

async function computeVolumeBoundaries(maxChapter = 539) {
  if (!fs.existsSync(VOLUMES_JSON)) throw new Error('volumes.json missing');
  const volumes = JSON.parse(fs.readFileSync(VOLUMES_JSON, 'utf8')) as any[];

  const url = 'https://usogui.fandom.com/wiki/List_of_Chapters';
  console.log('Fetching', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const contentHtml = $('#mw-content-text').html() || html;

  // Find ISBN markers on the page in order
  // ISBN regex: look for 'ISBN' followed by digits and hyphens
  const isbnMatches: { index: number; text: string }[] = [];
  for (const m of contentHtml.matchAll(/ISBN[^\d]*(\d[\d\- ]{9,})/gi)) {
    const idx = m.index || 0;
    isbnMatches.push({ index: idx, text: m[0] });
  }

  console.log('Found', isbnMatches.length, 'ISBN-like markers');

  // For each ISBN marker, find the next Chapter N after that index
  const starts: number[] = [];
  for (const im of isbnMatches) {
    const ch = findChapterAfterIndex(contentHtml, im.index + im.text.length);
    if (ch) starts.push(ch);
  }

  console.log('Derived start chapters from page (count):', starts.length);

  // If we didn't find enough starts, try alternate heuristic: look for volume headings that include 'Volume' and then chapter
  if (starts.length < volumes.length) {
    // look for occurrences of 'Volume' followed by number and then next chapter
    for (const m of contentHtml.matchAll(/Volume\s*(\d{1,3})/gi)) {
      const idx = m.index || 0;
      const ch = findChapterAfterIndex(contentHtml, idx + (m[0].length));
      if (ch) starts.push(ch);
    }
  }

  // Deduplicate and sort starts
  const uniqueStarts = Array.from(new Set(starts)).sort((a, b) => a - b);
  console.log('Unique start chapters found:', uniqueStarts.length);

  // Map starts to volumes in order: assume first found start maps to volume 1, etc.
  // If counts mismatch, only map min(counts)
  const mapCount = Math.min(uniqueStarts.length, volumes.length);
  const backupPath = backup(VOLUMES_JSON);

  // Prepare start array: for volumes without discovered start, leave existing or set null
  const newVolumes = volumes.map((v, idx) => ({ ...v }));

  for (let i = 0; i < mapCount; i++) {
    newVolumes[i].startChapter = uniqueStarts[i];
  }

  // Compute endChapter: for each volume i, end = start[i+1] -1; for last, end = maxChapter
  for (let i = 0; i < newVolumes.length; i++) {
    const start = newVolumes[i].startChapter;
    const nextStart = newVolumes[i + 1] ? newVolumes[i + 1].startChapter : null;
    if (start != null) {
      if (nextStart != null) newVolumes[i].endChapter = nextStart - 1;
      else newVolumes[i].endChapter = maxChapter;
    } else {
      // keep existing endChapter or set null
      if (newVolumes[i].endChapter == null) newVolumes[i].endChapter = null;
    }
  }

  fs.writeFileSync(VOLUMES_JSON, JSON.stringify(newVolumes, null, 2), 'utf8');
  console.log(`Updated volumes.json; backup at ${backupPath}`);
  return { backupPath, updatedCount: mapCount };
}

(async () => {
  try {
    const trimRes = await trimChapters(539);
    const volRes = await computeVolumeBoundaries(539);
    console.log('Done', trimRes, volRes);
  } catch (e) {
    console.error('Failed:', e);
    process.exit(1);
  }
})();
