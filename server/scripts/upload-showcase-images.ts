/**
 * Uploads all local volume showcase images to Cloudflare R2 and upserts
 * Media DB records pointing to the new R2 URLs.
 *
 * Reads R2 credentials from server/.env
 * Reads images from client/public/assets/showcase/Usogui_Volume_{N}_{type}.webp
 * Uploads to R2 key: volume_showcase_{type}/{filename}
 * Upserts media rows with ownerType='volume', usageType='volume_showcase_background|popout'
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { AppDataSource } from '../src/data-source';

dotenv.config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

const SHOWCASE_DIR = path.join(
  __dirname,
  '..',
  '..',
  'client',
  'public',
  'assets',
  'showcase',
);

// Matches Usogui_Volume_2_background.webp, Usogui_Volume_37_popout.webp, etc.
const FILE_PATTERN = /^Usogui_Volume_(\d+)_(background|popout)\.webp$/;

async function main() {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error('Missing R2 environment variables. Check server/.env');
    process.exit(1);
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  // Collect matching webp files
  const files = fs
    .readdirSync(SHOWCASE_DIR)
    .filter((f) => FILE_PATTERN.test(f))
    .sort();

  if (files.length === 0) {
    console.error('No Usogui_Volume_N_type.webp files found in', SHOWCASE_DIR);
    process.exit(1);
  }

  console.log(`Found ${files.length} showcase image files to upload`);

  const uploads: { volumeNumber: number; type: string; key: string; url: string; fileName: string }[] = [];

  for (const file of files) {
    const match = file.match(FILE_PATTERN);
    if (!match) continue;
    const volumeNumber = parseInt(match[1], 10);
    const imageType = match[2]; // 'background' or 'popout'
    const key = `volume_showcase_${imageType}/${file}`;
    const filePath = path.join(SHOWCASE_DIR, file);
    const buffer = fs.readFileSync(filePath);

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: 'image/webp',
          ContentLength: buffer.length,
        }),
      );
      const url = `${R2_PUBLIC_URL}/${key}`;
      uploads.push({ volumeNumber, type: imageType, key, url, fileName: file });
      console.log(`  ✓ Uploaded volume ${volumeNumber} ${imageType}: ${url}`);
    } catch (err) {
      console.error(`  ✗ Failed to upload ${file}:`, err);
      process.exit(1);
    }
  }

  console.log(`\nAll ${uploads.length} files uploaded. Upserting DB records...`);

  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    let upserted = 0;

    for (const { volumeNumber, type, key, url, fileName } of uploads) {
      const usageType = `volume_showcase_${type}`;

      // Look up volume id
      const volumeRows = await queryRunner.manager.query(
        `SELECT id FROM volume WHERE number = $1 LIMIT 1`,
        [volumeNumber],
      );

      if (volumeRows.length === 0) {
        console.warn(`  ! No volume found with number ${volumeNumber}, skipping`);
        continue;
      }

      const volumeId = volumeRows[0].id;

      // Check for existing media record
      const existing = await queryRunner.manager.query(
        `SELECT id FROM media
         WHERE "ownerType" = 'volume'
           AND "ownerId" = $1
           AND "usageType" = $2
         LIMIT 1`,
        [volumeId, usageType],
      );

      if (existing.length > 0) {
        // Update existing record
        await queryRunner.manager.query(
          `UPDATE media
           SET url = $1,
               "fileName" = $2,
               key = $3,
               "isUploaded" = true,
               "mimeType" = 'image/webp',
               status = 'approved',
               purpose = 'entity_display'
           WHERE id = $4`,
          [url, fileName, key, existing[0].id],
        );
        console.log(`  ✓ Updated media #${existing[0].id} for volume ${volumeNumber} ${type}`);
      } else {
        // Insert new record
        await queryRunner.manager.query(
          `INSERT INTO media
             ("ownerType", "ownerId", "usageType", purpose, url, "fileName", key,
              "isUploaded", "mimeType", status, type,
              "createdAt", "updatedAt")
           VALUES
             ('volume', $1, $2, 'entity_display', $3, $4, $5,
              true, 'image/webp', 'approved', 'image',
              NOW(), NOW())`,
          [volumeId, usageType, url, fileName, key],
        );
        console.log(`  ✓ Inserted new media record for volume ${volumeNumber} ${type}`);
      }

      upserted++;
    }

    await queryRunner.commitTransaction();
    console.log(`\nDone. Upserted ${upserted} media records.`);
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Transaction failed, rolled back:', err);
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
