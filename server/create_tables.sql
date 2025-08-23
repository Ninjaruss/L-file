-- Create tables manually
-- This script creates all the necessary tables for the Usogui fansite

-- Users table
CREATE TABLE IF NOT EXISTS "user" (
    "id" SERIAL PRIMARY KEY,
    "username" VARCHAR(50) UNIQUE,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" VARCHAR(255),
    "password" VARCHAR(255) NOT NULL,
    "passwordResetToken" VARCHAR(255),
    "passwordResetExpires" TIMESTAMP,
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Series table
CREATE TABLE IF NOT EXISTS "series" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ongoing',
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Arcs table
CREATE TABLE IF NOT EXISTS "arc" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "startChapter" INTEGER,
    "endChapter" INTEGER,
    "seriesId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE
);

-- Chapters table
CREATE TABLE IF NOT EXISTS "chapter" (
    "id" SERIAL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "title" VARCHAR(200),
    "summary" TEXT,
    "arcId" INTEGER,
    "seriesId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY ("arcId") REFERENCES "arc"("id") ON DELETE SET NULL,
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE
);

-- Characters table
CREATE TABLE IF NOT EXISTS "character" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "role" VARCHAR(50),
    "significance" VARCHAR(20) NOT NULL DEFAULT 'minor',
    "seriesId" INTEGER NOT NULL,
    "arcId" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE,
    FOREIGN KEY ("arcId") REFERENCES "arc"("id") ON DELETE SET NULL
);

-- Events table
CREATE TABLE IF NOT EXISTS "event" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "eventType" VARCHAR(50) NOT NULL DEFAULT 'general',
    "significance" VARCHAR(20) NOT NULL DEFAULT 'minor',
    "seriesId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE
);

-- Factions table
CREATE TABLE IF NOT EXISTS "faction" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "factionType" VARCHAR(50) NOT NULL DEFAULT 'organization',
    "seriesId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE
);

-- Tags table
CREATE TABLE IF NOT EXISTS "tag" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(50) NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Volumes table
CREATE TABLE IF NOT EXISTS "volume" (
    "id" SERIAL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "title" VARCHAR(200),
    "coverUrl" VARCHAR(500),
    "startChapter" INTEGER NOT NULL,
    "endChapter" INTEGER NOT NULL,
    "description" TEXT,
    "seriesId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE
);

-- Chapter Spoilers table
CREATE TABLE IF NOT EXISTS "chapter_spoiler" (
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "spoilerType" VARCHAR(50) NOT NULL DEFAULT 'plot',
    "severity" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "chapterNumber" INTEGER NOT NULL,
    "chapterReferences" JSONB,
    "seriesId" INTEGER NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedByUserId" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE,
    FOREIGN KEY ("verifiedByUserId") REFERENCES "user"("id") ON DELETE SET NULL
);

-- Gambles table
CREATE TABLE IF NOT EXISTS "gamble" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "rules" TEXT,
    "stakes" TEXT,
    "outcome" TEXT,
    "gambleType" VARCHAR(50) NOT NULL DEFAULT 'psychological',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ongoing',
    "chapterNumber" INTEGER,
    "seriesId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE
);

-- Media table
CREATE TABLE IF NOT EXISTS "media" (
    "id" SERIAL PRIMARY KEY,
    "filename" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimetype" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "alt" VARCHAR(255),
    "caption" TEXT,
    "mediaType" VARCHAR(20) NOT NULL DEFAULT 'image',
    "seriesId" INTEGER,
    "characterId" INTEGER,
    "arcId" INTEGER,
    "eventId" INTEGER,
    "factionId" INTEGER,
    "chapterId" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE SET NULL,
    FOREIGN KEY ("characterId") REFERENCES "character"("id") ON DELETE SET NULL,
    FOREIGN KEY ("arcId") REFERENCES "arc"("id") ON DELETE SET NULL,
    FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE SET NULL,
    FOREIGN KEY ("factionId") REFERENCES "faction"("id") ON DELETE SET NULL,
    FOREIGN KEY ("chapterId") REFERENCES "chapter"("id") ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "IDX_series_name" ON "series"("name");
CREATE INDEX IF NOT EXISTS "IDX_arc_series" ON "arc"("seriesId");
CREATE INDEX IF NOT EXISTS "IDX_arc_name" ON "arc"("name");
CREATE INDEX IF NOT EXISTS "IDX_arc_order" ON "arc"("order");
CREATE INDEX IF NOT EXISTS "IDX_chapter_series" ON "chapter"("seriesId");
CREATE INDEX IF NOT EXISTS "IDX_chapter_arc" ON "chapter"("arcId");
CREATE INDEX IF NOT EXISTS "IDX_character_series" ON "character"("seriesId");
CREATE INDEX IF NOT EXISTS "IDX_character_arc" ON "character"("arcId");
CREATE INDEX IF NOT EXISTS "IDX_event_series" ON "event"("seriesId");
CREATE INDEX IF NOT EXISTS "IDX_faction_series" ON "faction"("seriesId");
CREATE INDEX IF NOT EXISTS "IDX_volume_series" ON "volume"("seriesId");
CREATE INDEX IF NOT EXISTS "IDX_volume_number" ON "volume"("number");
CREATE INDEX IF NOT EXISTS "IDX_chapter_spoiler_series" ON "chapter_spoiler"("seriesId");
CREATE INDEX IF NOT EXISTS "IDX_gamble_series" ON "gamble"("seriesId");

COMMIT;
