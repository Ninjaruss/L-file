import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const CHAPTERS_JSON = path.join(__dirname, '..', 'src', 'database', 'data', 'chapters.json');
const BACKUP_DIR = path.join(__dirname, '..', 'src', 'database', 'data', 'backups');

async function fetchFandom() {
  const url = 'https://usogui.fandom.com/wiki/List_of_Chapters';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // The Fandom page has lists of chapter entries -- heuristics: find all table rows or list items with links to chapters
  const titles: Record<number, string> = {};

  // Look for anchors where the text contains a chapter number and a title like "Chapter 1: The ..." or just link titles
  $('#mw-content-text').find('li, tr, td').each((i, el) => {
    const text = $(el).text().trim();
    const anchors = $(el).find('a');
    anchors.each((j, a) => {
      const href = $(a).attr('href') || '';
      // Only consider links that likely point to a chapter page
      if (!href.includes('/wiki/')) return;
      const linkText = $(a).text().trim();
      // Try to parse patterns like "Chapter 12: Title" or "12" followed by title in parent element
      const chapterMatch = linkText.match(/Chapter\s*(\d+)/i) || text.match(/Chapter\s*(\d+)/i);
      if (chapterMatch) {
        const num = parseInt(chapterMatch[1], 10);
        // Prefer a cleaner title from the surrounding text if available: look for 'Chapter X: Title'
        const fullMatch = text.match(new RegExp(`Chapter\\s*${num}\\s*[:\-–]?\\s*(.+)`));
        const title = fullMatch ? fullMatch[1].trim() : linkText;
        if (num && title) titles[num] = title;
      } else {
        // Try to match leading number like "12. Title" or "12 Title"
        const leading = text.match(/^(\d{1,4})[.)\-–]?\s*(.+)$/);
        if (leading) {
          const num = parseInt(leading[1], 10);
          const title = leading[2].trim();
          if (num && title) titles[num] = title;
        }
      }
    });
  });

  // Fallback: find headings with 'Chapter' words
  $('h2, h3, h4').each((i, h) => {
    const t = $(h).text().trim();
    const m = t.match(/Chapter\s*(\d+)[:\-–]?\s*(.+)/i);
    if (m) titles[parseInt(m[1], 10)] = m[2].trim();
  });

  return titles;
}

async function main() {
  if (!fs.existsSync(CHAPTERS_JSON)) throw new Error('chapters.json not found at ' + CHAPTERS_JSON);
  const chapters = JSON.parse(fs.readFileSync(CHAPTERS_JSON, 'utf8')) as any[];

  // Backup
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `chapters-backup-${ts}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(chapters, null, 2), 'utf8');
  console.log('Backed up chapters.json to', backupPath);

  const scraped = await fetchFandom();
  console.log('Scraped', Object.keys(scraped).length, 'chapter titles from Fandom (sample 10):', Object.entries(scraped).slice(0, 10));

  let updated = 0;
  for (const c of chapters) {
    const num = c.number;
    if (scraped[num]) {
      const newTitle = scraped[num];
      if (!c.title || c.title !== newTitle) {
        c.title = newTitle;
        updated++;
      }
    }
  }

  fs.writeFileSync(CHAPTERS_JSON, JSON.stringify(chapters, null, 2), 'utf8');
  console.log(`Updated ${updated} chapters in ${CHAPTERS_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
