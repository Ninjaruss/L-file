#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get current environment
const env = process.env.NODE_ENV || 'development';
const isDevelopment = env === 'development';
const isProduction = env === 'production';

// Safety checks
function runSafetyChecks() {
  console.log(chalk.blue('🛡️ Running database migration safety checks...'));
  
  // Check if we're in production
  if (isProduction) {
    console.log(chalk.yellow('⚠️ WARNING: Running in production environment!'));
    
    // Force backup for production
    return promptForBackup(true);
  }
  
  return promptForBackup(false);
}

// Prompt user for database backup
function promptForBackup(required = false) {
  const message = required
    ? '⚠️ In production, a database backup is REQUIRED. Proceed with backup? (Y/n): '
    : 'Would you like to backup the database before proceeding? (Y/n): ';
  
  return new Promise((resolve) => {
    rl.question(chalk.yellow(message), (answer) => {
      const response = answer.trim().toLowerCase();
      
      if (response === 'n' || response === 'no') {
        if (required) {
          console.log(chalk.red('❌ Backup is required in production. Exiting.'));
          rl.close();
          process.exit(1);
        } else {
          console.log(chalk.yellow('⚠️ Proceeding without backup. This is risky!'));
          resolve(true);
        }
      } else {
        backupDatabase()
          .then(() => resolve(true))
          .catch((err) => {
            console.error(chalk.red('❌ Backup failed:'), err);
            rl.close();
            process.exit(1);
          });
      }
    });
  });
}

// Backup the database
async function backupDatabase() {
  console.log(chalk.blue('📦 Backing up database...'));
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  try {
    // Get database name from environment
    const dbName = process.env.DATABASE_NAME;
    const dbUser = process.env.DATABASE_USERNAME;
    const dbHost = process.env.DATABASE_HOST || 'localhost';
    
    if (!dbName || !dbUser) {
      throw new Error('Database credentials not found in environment variables');
    }
    
    // Run pg_dump
    execSync(`pg_dump -h ${dbHost} -U ${dbUser} -d ${dbName} -f ${backupFile}`, {
      stdio: 'inherit',
    });
    
    console.log(chalk.green(`✅ Database backup created at: ${backupFile}`));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Backup failed:'), error);
    throw error;
  }
}

// Run migration generation
function generateMigration(name) {
  console.log(chalk.blue(`🔄 Generating migration: ${name}...`));
  
  try {
    execSync(`yarn typeorm migration:generate src/migrations/${name}`, {
      stdio: 'inherit',
    });
    
    console.log(chalk.green('✅ Migration generated successfully'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Migration generation failed:'), error);
    return false;
  }
}

// Run migrations
function runMigrations() {
  console.log(chalk.blue('🚀 Running migrations...'));
  
  try {
    execSync('yarn typeorm migration:run', {
      stdio: 'inherit',
    });
    
    console.log(chalk.green('✅ Migrations completed successfully'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Migration run failed:'), error);
    return false;
  }
}

// Main function
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  const migrationName = args[1];
  
  // Load environment variables
  require('dotenv').config();
  
  console.log(chalk.blue('🛢️ Database Migration Helper'));
  console.log(chalk.blue(`Environment: ${env}`));
  
  switch (command) {
    case 'generate':
      if (!migrationName) {
        console.error(chalk.red('❌ Migration name is required'));
        rl.close();
        process.exit(1);
      }
      
      await runSafetyChecks();
      const success = generateMigration(migrationName);
      rl.close();
      process.exit(success ? 0 : 1);
      break;
      
    case 'run':
      await runSafetyChecks();
      const runSuccess = runMigrations();
      rl.close();
      process.exit(runSuccess ? 0 : 1);
      break;
      
    case 'backup':
      await backupDatabase();
      rl.close();
      process.exit(0);
      break;
      
    default:
      console.error(chalk.red(`❌ Unknown command: ${command}`));
      console.log(chalk.blue('Available commands:'));
      console.log('  generate <name>  - Generate a new migration');
      console.log('  run              - Run pending migrations');
      console.log('  backup           - Backup the database');
      rl.close();
      process.exit(1);
  }
}

// Run the main function
main().catch((err) => {
  console.error(chalk.red('❌ Error:'), err);
  rl.close();
  process.exit(1);
});
