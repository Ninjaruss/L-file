Database scraping & seeding
==========================

This folder contains tools to generate JSON data from the Usogui Fandom "List of Chapters" page, and a seeder to import that data into the database.

Files added
- `tools/fetch-fandom-data.ts` - Node script (uses `node-fetch` + `cheerio`) to scrape chapter names and volume covers and write JSON into `data/`.
- `data/chapters.json` - placeholder/sample chapters data.
- `data/volumes.json` - placeholder/sample volumes data.
- `seeds/fandom-data.seeder.ts` - seeder that reads the JSON files and upserts volumes, chapters, and volume cover media.

How to run (local developer)
1. Install extra deps required by the scraper:

```bash
cd server
yarn add cheerio node-fetch
```

2. Run the scraper (this will write `server/src/database/data/chapters.json` and `volumes.json`):

```bash
node -r ts-node/register src/database/tools/fetch-fandom-data.ts
```

3. Seed the database:

```bash
yarn db:seed
```

Notes
- The scraper is heuristic-based and may need selector adjustments depending on Fandom markup. Inspect the JSON files after scraping and edit them if needed.
- Cover images are referenced by URL (external). Consider hosting approved images on your CDN/Backblaze for reliability and licensing.
