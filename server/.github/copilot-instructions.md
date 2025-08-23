# GitHub Copilot Instructions for Usogui Fansite Server

This document provides guidance for AI assistants working with this NestJS-based server codebase.

## Project Overview

This is a NestJS server application for the Usogui fansite, featuring:
- REST API endpoints for managing manga/anime content
- TypeORM with PostgreSQL for data persistence
- JWT-based authentication and authorization
- Role-based access control
- API documentation with Swagger
- Entity translation system supporting multiple languages

## Key Architecture Points

### 1. Module Structure
The application follows NestJS's modular architecture with feature-based modules:

Core Modules:
- `auth` - Authentication and authorization (JWT, guards, decorators)
- `users` - User management
- `series` - Series/manga metadata
- `chapters` - Chapter information
- `arcs` - Story arc management
- `characters` - Character information
- `events` - Event tracking
- `factions` - Group/faction management
- `tags` - Content tagging system
- `media` - Media asset handling
- `translations` - Content translation management
- `gambles` - Game/gambling event tracking (specific to Usogui content)
- `chapter-spoilers` - For managing spoiler content related to chapters

### 2. Database Configuration
- Uses TypeORM with PostgreSQL
- Two configuration locations:
  - Runtime: `src/config/database.config.ts` (for application)
  - Migration: `typeorm.config.ts` (for CLI operations)
- Entity files in `src/entities/` (main entities and translations)
- Migrations in `src/migrations/`
- Note: Database paths in both configs must remain in sync

### 3. Security Implementation
- JWT-based authentication using Passport (`auth` module)
- Role-based guards via `@Roles()` decorator and `RolesGuard`
- Email verification system with tokens
- Password reset flow in `auth.service.ts`
- Special handling for test users in development

## Development Workflows

### 1. Database Operations
```bash
# Generate migrations after entity changes
yarn db:generate src/migrations/MigrationName

# Run migrations
yarn db:migrate

# Revert last migration
yarn db:revert

# Seed database with test data
yarn db:seed
```

### 2. Testing
```bash
# Unit tests
yarn test

# Watch mode
yarn test:watch

# E2E tests
yarn test:e2e
```

### 3. Content Translation Pattern
The application uses a specialized translation system:
- Base entities (`series.entity.ts`, `chapter.entity.ts`, etc.) contain language-agnostic data
- Translation entities in `src/entities/translations/` store language-specific content
- Follow the pattern in `series-translation.entity.ts` for new translatable content
- Translation module is for future Japanese language support, but default endpoints return English content
- Each translated entity extends BaseTranslation and links to its parent entity through a foreign key relationship

## Special Conventions

1. Test User Handling:
   - The auth service has special handling for test users (auto-verification)
   - See `isTestUser` check in `auth.service.ts`

2. Database Entity Structure:
   - All entities include standard `createdAt` and `updatedAt` timestamps
   - Main content entities (chapters, characters, etc.) link to a series
   - Translation entities extend from `BaseTranslation`

3. Gambles Module:
   - Specific to Usogui manga's gambling events
   - Uses complex relationships between teams, rounds, and players
   - See `gamble.entity.ts` for the unique structure

4. DTOs Location:
   - DTOs are stored in `dto/` folders within each module
   - Follow consistent naming: `create-*.dto.ts`, `update-*.dto.ts`

## Entity Relationships

1. Series:
   - Central entity containing metadata about the manga series
   - Has many Chapters, Characters, Arcs, and Events
   - Contains core properties like title, publication dates, and status

2. Chapters:
   - Belongs to a Series and optionally to an Arc
   - Has many ChapterSpoilers
   - Contains chapter number, title, and publication details

3. Characters:
   - Belongs to a Series
   - May be associated with multiple Factions
   - Contains character details, role, and significance in the story

4. Arcs:
   - Belongs to a Series
   - Contains multiple Chapters
   - Represents a story arc with start/end chapters and arc description

5. Events:
   - Belongs to a Series
   - May reference Characters and Chapters
   - Contains event details, timeline information, and significance

6. Factions:
   - Belongs to a Series
   - Contains multiple Characters
   - Represents groups or organizations within the story

7. Tags:
   - Many-to-many relationships with content entities
   - Used for categorization and filtering
   
8. Gambles:
   - Complex entity specific to Usogui's gambling events
   - Contains GambleRounds and GambleTeams
   - Represents the high-stakes games central to the manga

9. ChapterSpoilers:
   - Belongs to a Chapter
   - Contains spoiler content with spoiler type classification
   - Used to manage sensitive plot revelations

## Common Gotchas

1. Database:
   - Always backup before migrations
   - Test migrations thoroughly
   - Watch for TypeORM relationship issues
   - Monitor query performance

2. Authentication:
   - Check token expiration settings
   - Verify role guards implementation
   - Test password reset flow thoroughly
   - Monitor rate limiting effectiveness

3. API Design:
   - Follow REST conventions
   - Document API changes
   - Version APIs when needed
   - Consider backward compatibility

## Resources

- Database seed files for sample data in `src/database/seeds/`
- TypeORM migration commands in package.json scripts
- Environment validation in `src/config/env.validation.ts`
- Database diagram at `docs/2025-08-21 Database Diagram.png`
