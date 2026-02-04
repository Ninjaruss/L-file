# Database Migration Guide

## 🛡️ Safe Migration Workflow

This guide ensures you can safely add data and run migrations without breaking your database or crashing your computer.

## Quick Reference

### Before Any Migration

```bash
# 1. Check what migrations are pending
yarn db:migrate:check

# 2. Create a backup (ALWAYS!)
yarn db:backup

# 3. See what SQL will run (dry-run)
yarn db:migrate:dry-run

# 4. Run the migration
yarn db:migrate

# 5. Verify database state
yarn db:check
```

## Available Commands

| Command | Purpose | Safe to Run Anytime? |
|---------|---------|----------------------|
| `yarn db:migrate:check` | Check pending migrations | ✅ Yes |
| `yarn db:migrate:dry-run` | Preview migrations without executing | ✅ Yes |
| `yarn db:status` | Show migration history | ✅ Yes |
| `yarn db:backup` | Backup database to file | ✅ Yes |
| `yarn db:migrate` | Run pending migrations | ⚠️ With backup |
| `yarn db:revert` | Rollback last migration | ⚠️ Use carefully |
| `yarn db:seed` | Populate database with data | ✅ Idempotent |
| `yarn db:check` | Verify database consistency | ✅ Yes |

## Adding New Data Safely

### Option 1: Add to Seeders (Recommended)

**When to use:** Adding initial/reference data (characters, organizations, etc.)

**Advantages:**
- ✅ Idempotent (can run multiple times safely)
- ✅ Version controlled
- ✅ Fast with new batch operations
- ✅ No migration needed

**Process:**

1. **Update the appropriate seeder file:**
   ```typescript
   // Example: server/src/database/seeds/character.seeder.ts
   const characters = [
     {
       name: 'New Character',
       description: 'Character description',
       firstAppearanceChapter: 100,
     },
     // ... existing characters
   ];
   ```

2. **Run seeding:**
   ```bash
   cd server
   yarn db:seed
   ```

3. **Verify:**
   ```bash
   yarn db:check
   ```

### Option 2: Create a Data Migration

**When to use:** Complex data transformations or updates to existing data

**Process:**

1. **Create a migration:**
   ```bash
   yarn db:generate add-new-data
   ```

2. **Edit the migration file** in `server/src/migrations/`:
   ```typescript
   import { MigrationInterface, QueryRunner } from "typeorm";

   export class AddNewData1234567890 implements MigrationInterface {
     public async up(queryRunner: QueryRunner): Promise<void> {
       // Add data in batches for better performance
       await queryRunner.query(`
         INSERT INTO "character" ("name", "description", "firstAppearanceChapter")
         VALUES
           ('Character 1', 'Description 1', 100),
           ('Character 2', 'Description 2', 101),
           ('Character 3', 'Description 3', 102)
         ON CONFLICT (name) DO NOTHING;
       `);
     }

     public async down(queryRunner: QueryRunner): Promise<void> {
       // Clean rollback
       await queryRunner.query(`
         DELETE FROM "character"
         WHERE name IN ('Character 1', 'Character 2', 'Character 3');
       `);
     }
   }
   ```

3. **Test the migration:**
   ```bash
   # Check pending migrations
   yarn db:migrate:check

   # Preview (dry-run)
   yarn db:migrate:dry-run

   # Backup first!
   yarn db:backup

   # Run migration
   yarn db:migrate
   ```

## Schema Changes (Adding Columns/Tables)

### 1. Modify Entity

```typescript
// server/src/entities/character.entity.ts
@Entity()
@Index(['name']) // Add indexes for frequently queried fields
export class Character {
  // ... existing fields

  @Column({ nullable: true })
  newField: string;
}
```

### 2. Generate Migration

```bash
yarn db:generate add-new-field-to-character
```

### 3. Review Generated Migration

The migration will be created in `server/src/migrations/`. **Always review it!**

Check for:
- ✅ Proper column types
- ✅ Nullable vs NOT NULL constraints
- ✅ Default values if needed
- ✅ Indexes on foreign keys
- ✅ Proper down() rollback logic

### 4. Run Migration Safely

```bash
# Always backup first!
yarn db:backup

# Preview the SQL
yarn db:migrate:dry-run

# Run the migration
yarn db:migrate
```

## Performance Best Practices

### 1. Adding Indexes

**Always add indexes for:**
- Foreign key columns
- Columns used in WHERE clauses
- Columns used in JOIN conditions
- Columns used for sorting (ORDER BY)

```typescript
@Entity()
@Index(['userId']) // Single column
@Index(['userId', 'createdAt']) // Composite index
export class Entity {
  // ...
}
```

### 2. Batch Data Operations

**Bad (Slow):**
```typescript
for (const item of items) {
  await repository.save(item); // N queries!
}
```

**Good (Fast):**
```typescript
// Insert all at once
await repository.save(items); // 1 query

// Or use raw SQL for very large datasets
await queryRunner.query(`
  INSERT INTO "table" (col1, col2)
  VALUES
    ('val1', 'val2'),
    ('val3', 'val4'),
    ...
  ON CONFLICT DO NOTHING;
`);
```

### 3. Large Data Migrations

For inserting >10,000 rows:

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  const batchSize = 1000;
  const data = [...]; // Your large dataset

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    await queryRunner.query(`
      INSERT INTO "table" (columns...)
      VALUES ${batch.map(() => '(?, ?, ?)').join(', ')}
      ON CONFLICT DO NOTHING;
    `, batch.flatMap(item => [item.val1, item.val2, item.val3]));

    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)}`);
  }
}
```

## Troubleshooting

### Migration Taking Too Long

**Causes:**
- Large dataset without batching
- Missing indexes
- Query logging enabled
- Inefficient queries

**Solutions:**
1. Break into smaller migrations
2. Add indexes first, then data
3. Use batch inserts (see above)
4. Disable query logging (automatic in new setup)

### VS Code/Computer Crashing

**Causes:**
- Too many database connections
- Memory-intensive operations
- Inefficient seeders

**Solutions:**
1. Use the optimized seeders (already implemented)
2. Run migrations with: `TYPEORM_LOGGING=false yarn db:migrate`
3. Increase statement timeout: `PGSTATEMENT_TIMEOUT=600000 yarn db:migrate`
4. Close other applications

### Migration Failed Midway

**Recovery:**
```bash
# Check migration status
yarn db:status

# If transaction mode is 'all' (default), the migration was rolled back
# Restore from backup if needed
psql -U user -d database < backups/backup-TIMESTAMP.sql

# Fix the migration file and try again
yarn db:migrate
```

### Rollback Last Migration

```bash
# This will run the down() method
yarn db:revert
```

## Safety Checklist

Before running any migration:

- [ ] Backup created: `yarn db:backup`
- [ ] Reviewed migration SQL
- [ ] Tested on local database first
- [ ] No syntax errors: `yarn build`
- [ ] Proper rollback logic in down() method
- [ ] Indexes added for new foreign keys
- [ ] Large data operations use batching
- [ ] Query logging disabled for performance

## Example: Full Workflow

```bash
# 1. Add new entity field
# Edit: server/src/entities/character.entity.ts

# 2. Build to check for errors
cd server
yarn build

# 3. Generate migration
yarn db:generate add-backstory-field

# 4. Review the generated migration file
# Edit: server/src/migrations/TIMESTAMP-add-backstory-field.ts

# 5. Backup database
yarn db:backup

# 6. Check what will run
yarn db:migrate:dry-run

# 7. Run migration
yarn db:migrate

# 8. Verify
yarn db:check

# 9. Update seeders if needed
# Edit: server/src/database/seeds/character.seeder.ts

# 10. Run seeding
yarn db:seed
```

## Emergency Rollback

If something goes wrong:

```bash
# 1. Stop the application
# Ctrl+C or stop the server

# 2. Restore from backup
psql -U $DATABASE_USERNAME -d $DATABASE_NAME < backups/backup-TIMESTAMP.sql

# 3. Check database state
yarn db:status

# 4. Fix the migration and try again
```

## Tips for Production

1. **Always test locally first**
2. **Schedule migrations during low-traffic periods**
3. **Keep backups for at least 7 days**
4. **Monitor database performance after migrations**
5. **Have a rollback plan ready**
6. **Document any manual steps needed**
