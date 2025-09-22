import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// This script scrapes the Usogui Fandom "List of Chapters" page and
// generates two JSON files used by the seeders:
// - server/src/database/data/volumes.json
// - server/src/database/data/chapters.json

const FANDOM_LIST_URL = 'https://usogui.fandom.com/wiki/List_of_Chapters';

async function fetchHtml(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function writeJson(relPath: string, data: any) {
  const outPath = path.resolve(__dirname, '..', 'data', relPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
}

async function scrape() {
  console.log('Fetching Fandom page...', FANDOM_LIST_URL);
  const html = await fetchHtml(FANDOM_LIST_URL);
  const $ = cheerio.load(html);

  // NOTE: Fandom pages can be structured in many ways. This scraper attempts
  // to find chapter entries and volume groupings heuristically. You should
  // inspect the generated JSON and adjust selectors if necessary.

  const chapters: Array<{ number: number; title?: string }> = [];
  type VolumeMapEntry = {
    number: number;
    startChapter: number;
    endChapter?: number;
    coverUrl?: string;
    description?: string;
    __linkToFollow?: string;
  };
  const volumesMap: Record<number, VolumeMapEntry> = {};

  // Heuristic: look for table rows or list items in the content area that contain "Chapter" numbers
  // This selector may need fine-tuning for the exact Fandom markup.
  $('#mw-content-text')
    .find('li, tr, td')
    .each((i, el) => {
      const text = $(el).text().trim();
      // match leading chapter number like "1. The Lie Eater" or "Chapter 1 — The Lie Eater"
      const match = text.match(
        /(?:Chapter\s*)?(\d{1,4})[^\d\n]*[-–—:\.]?\s*(.*)$/i,
      );
      if (match) {
        const num = parseInt(match[1], 10);
        const title = match[2] ? match[2].trim() : undefined;
        if (!chapters.some((c) => c.number === num)) {
          chapters.push({ number: num, title: title || undefined });
        }
      }
    });

  // Attempt to find volumes and cover images by looking for gallery or infobox images on volume pages.
  // We'll also try to find headings like "Volume 1" and nearby image tags.
  $('#mw-content-text')
    .find('h2, h3, .thumb, .portable-infobox, .pi-image')
    .each((i, el) => {
      const heading = $(el).text().trim();
      const volMatch = heading.match(/Volume\s*(\d{1,3})/i);
      if (volMatch) {
        const num = parseInt(volMatch[1], 10);
        if (!volumesMap[num]) {
          volumesMap[num] = { number: num, startChapter: 0 };
        }
        // find nearby image
        const img = $(el).nextAll('img').first();
        // try multiple attribute names commonly used by Fandom
        const imgUrl =
          img &&
          (img.attr('src') ||
            img.attr('data-src') ||
            img.attr('data-image-name'));
        if (imgUrl) volumesMap[num].coverUrl = imgUrl;
        else {
          // as a fallback, look for any link near the heading that points to a wiki page (likely a volume page)
          const link =
            $(el).find('a[href*="/wiki/"]').first() ||
            $(el).nextAll('a[href*="/wiki/"]').first();
          const href = link && link.attr('href');
          if (href) {
            const full = href.startsWith('http')
              ? href
              : `https://usogui.fandom.com${href}`;
            // store link to follow later (async)
            if (!volumesMap[num].coverUrl)
              volumesMap[num].__linkToFollow = full;
          }
        }
      }
    });

  // As a fallback, group chapters into volumes by ranges (common volumes hold ~10 chapters)
  chapters.sort((a, b) => a.number - b.number);
  if (Object.keys(volumesMap).length === 0 && chapters.length) {
    // create volumes every 10 chapters as a fallback
    const currentVol = 1;
    for (const c of chapters) {
      const volIndex = Math.floor((c.number - 1) / 10) + 1;
      if (!volumesMap[volIndex])
        volumesMap[volIndex] = {
          number: volIndex,
          startChapter: c.number,
          endChapter: c.number,
        };
      volumesMap[volIndex].endChapter = c.number;
    }
  } else {
    // fill start/end chapter for detected volumes using the chapter list
    const volNumbers = Object.keys(volumesMap)
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);
    for (let i = 0; i < volNumbers.length; i++) {
      const vnum = volNumbers[i];
      const start = chapters.find(
        (c) =>
          c.number >= 1 &&
          c.number <= 999 &&
          (i === 0 ||
            c.number > (volumesMap[volNumbers[i - 1]].endChapter || 0)),
      );
      if (start) volumesMap[vnum].startChapter = start.number;
      // end chapter: next volume start - 1
      if (i < volNumbers.length - 1) {
        const nextVol = volNumbers[i + 1];
        const nextStart = chapters.find(
          (c) =>
            c.number >= 1 &&
            c.number <= 999 &&
            c.number >= volumesMap[nextVol].startChapter,
        );
        if (nextStart) volumesMap[vnum].endChapter = nextStart.number - 1;
      } else {
        volumesMap[vnum].endChapter = chapters.length
          ? chapters[chapters.length - 1].number
          : undefined;
      }
    }
  }

  const volumes = Object.values(volumesMap).map((v) => ({
    number: v.number,
    startChapter: v.startChapter,
    endChapter: v.endChapter || null,
    coverUrl: v.coverUrl || null,
    description: v.description || null,
  }));

  console.log(
    `Found ${chapters.length} chapters and ${volumes.length} volumes (heuristic).`,
  );

  writeJson('chapters.json', chapters);
  // If we have volume link placeholders to follow, fetch those pages to find images
  const volumesWithLinks = Object.values(volumesMap).filter(
    (v: VolumeMapEntry) => !!v.__linkToFollow,
  );
  for (const v of volumesWithLinks) {
    try {
      const linkedHtml = await fetchHtml(v.__linkToFollow as string);
      const $$ = cheerio.load(linkedHtml);
      // Try common selectors for infobox/thumbnail images
      const candidate =
        $$('table.portable-infobox img').first() ||
        $$('.thumb img').first() ||
        $$('.pi-image img').first();
      const candUrl =
        candidate && (candidate.attr('src') || candidate.attr('data-src'));
      if (candUrl) {
        const vol = volumes.find((x: any) => x.number === v.number);
        if (vol) vol.coverUrl = candUrl;
      }
    } catch (err) {
      // ignore per-volume fetch errors
    }
  }

  writeJson('volumes.json', volumes);

  console.log('Wrote JSON files to server/src/database/data/');
}

scrape().catch((err) => {
  console.error('Scrape failed:', err);
  process.exit(1);
});
