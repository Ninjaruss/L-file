import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const CHAPTERS_JSON = path.join(__dirname, '..', 'src', 'database', 'data', 'chapters.json');
const BACKUP_DIR = path.join(__dirname, '..', 'src', 'database', 'data', 'backups');

function normalizeTitle(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}

async function main() {
  if (!fs.existsSync(CHAPTERS_JSON)) throw new Error('chapters.json not found at ' + CHAPTERS_JSON);
  const chapters = JSON.parse(fs.readFileSync(CHAPTERS_JSON, 'utf8')) as any[];

  // Backup
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `chapters-backup-precise-${ts}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(chapters, null, 2), 'utf8');
  console.log('Backed up chapters.json to', backupPath);

  const url = 'https://usogui.fandom.com/wiki/List_of_Chapters';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const pageText = $('#mw-content-text').text();
  const pageHtml = $('#mw-content-text').html() || '';

  // Find explicit "Chapter N: Title" occurrences across text and links
  const found: Record<number, string> = {};

  // Search for explicit patterns in the page text
  for (const m of pageText.matchAll(/Chapter\s*(\d{1,4})\s*[:\-–]\s*([^\n\r\|]+)/gi)) {
    const num = parseInt(m[1], 10);
    const title = normalizeTitle(m[2]);
    if (title && !title.match(/^\d+$/)) found[num] = title;
  }

  // Also search anchor/link texts and table cells for patterns like "Chapter 12: Title"
  $('#mw-content-text').find('a, td, li, p, span, b, strong').each((i, el) => {
    const t = $(el).text().trim();
    const m = t.match(/Chapter\s*(\d{1,4})\s*[:\-–]\s*(.+)/i);
    if (m) {
      const num = parseInt(m[1], 10);
      const title = normalizeTitle(m[2]);
      if (title && !title.match(/^\d+$/)) found[num] = title;
    }
  });

  // As a fallback, look for patterns like "\n12. Title\n" or "12) Title"
  for (const m of pageText.matchAll(/(^|\s)(\d{1,4})[.)]\s*([^\n\r\|]+)/gi)) {
    const num = parseInt(m[2], 10);
    const title = normalizeTitle(m[3]);
    if (title && !title.match(/^\d+$|^Chapter\s*\d+$/i)) {
      if (!found[num]) found[num] = title;
    }
  }

  // Try to follow links for missing numbers: find anchors whose href includes 'Chapter' or page names with the number
  const missingNums = chapters.map(c => c.number).filter(n => !found[n]);
  if (missingNums.length > 0) {
    console.log('Attempting link-follow for', missingNums.length, 'missing numbers (this may be slow)');

    const anchors = $('#mw-content-text').find('a');
    const anchorList: { num?: number; href: string; text: string }[] = [];
    anchors.each((i, a) => {
      const href = $(a).attr('href') || '';
      const text = $(a).text().trim();
      // Extract number from the anchor text or href
      const tnum = (text.match(/(\d{1,4})/) || [])[1];
      const hnum = (href.match(/(\d{1,4})/) || [])[1];
      const num = tnum ? parseInt(tnum, 10) : hnum ? parseInt(hnum, 10) : undefined;
      if (num) anchorList.push({ num, href, text });
    });

    // Map by number to a candidate href
    const hrefByNum: Record<number, string> = {};
    for (const a of anchorList) {
      if (a.num && !hrefByNum[a.num]) {
        hrefByNum[a.num] = a.href;
      }
    }

    for (const num of missingNums) {
      const href = hrefByNum[num];
      if (!href) continue;
      try {
        const full = href.startsWith('http') ? href : `https://usogui.fandom.com${href}`;
        const r = await fetch(full);
        if (!r.ok) continue;
        const page = await r.text();
        // Look for Chapter N: Title in the linked page
        const mm = page.match(new RegExp(`Chapter\\s*${num}\\s*[:\\-–]\\s*([^<\\n\\r]+)`, 'i')) || page.match(/<title>([^<]+)<\/title>/i);
        if (mm) {
          const title = normalizeTitle(mm[1]);
          if (title && !title.match(/^\d+$/)) found[num] = title;
        }
      } catch (e) {
        // ignore errors per-link
      }
    }
  }

  // Apply found titles to chapters.json entries, format as 'Chapter N: Title'
  let updated = 0;
  const noisy: number[] = [];
  for (const c of chapters) {
    const n: number = c.number;
    if (found[n]) {
      const candidate = found[n];
      // Filter out noisy candidates that look like lists
      if (candidate.includes('|') || candidate.match(/\d+ \|/)) {
        noisy.push(n);
        continue;
      }
      const newTitle = `Chapter ${n}: ${candidate}`;
      if (!c.title || c.title !== newTitle) {
        c.title = newTitle;
        updated++;
      }
    }
  }

  // Write file
  fs.writeFileSync(CHAPTERS_JSON, JSON.stringify(chapters, null, 2), 'utf8');
  console.log(`Updated ${updated} chapters in ${CHAPTERS_JSON}`);
  if (noisy.length) console.log('Skipped noisy matches for chapters:', noisy.slice(0,50));
}

main().catch((e) => { console.error(e); process.exit(1); });
