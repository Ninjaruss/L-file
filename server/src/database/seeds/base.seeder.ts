import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as chalk from 'chalk';

/**
 * Base seeder class with robust error handling
 */
@Injectable()
export abstract class BaseSeeder {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly dataSource: DataSource) {}

  /**
   * Main method to run the seeder
   */
  public async seed(): Promise<boolean> {
    this.logger.log(chalk.blue(`🌱 Running ${this.constructor.name}...`));

    // Create a transaction for the seeding operation
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if seeder should run (e.g. data already exists)
      const shouldRun = await this.shouldSeed();

      if (!shouldRun) {
        this.logger.log(
          chalk.yellow(
            `⏭️ Skipping ${this.constructor.name} - data already exists`,
          ),
        );
        return true;
      }

      // Check dependencies
      await this.checkDependencies();

      // Run the actual seed operation
      await this.seedData(queryRunner);

      // Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log(
        chalk.green(`✅ ${this.constructor.name} completed successfully`),
      );
      return true;
    } catch (error: unknown) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();

      this.logger.error(chalk.red(`❌ ${this.constructor.name} failed`));
      this.logger.error(error);

      // Report detailed error information
      const dbError = error as {
        message?: string;
        sql?: string;
        parameters?: unknown[];
      };
      if (dbError.message) {
        this.logger.error(chalk.red(`Error message: ${dbError.message}`));
      }

      if (dbError.sql) {
        this.logger.error(chalk.red(`Failed SQL: ${dbError.sql}`));
      }

      if (dbError.parameters) {
        this.logger.error(
          chalk.red(`Parameters: ${JSON.stringify(dbError.parameters)}`),
        );
      }

      return false;
    } finally {
      // Release queryRunner
      await queryRunner.release();
    }
  }

  /**
   * Check if the seeder should run (e.g. if data already exists)
   * Default is to always run, override in child classes
   */
  protected shouldSeed(): Promise<boolean> {
    return Promise.resolve(true);
  }

  /**
   * Check if dependencies for this seeder are met
   * Override in child classes to add specific checks
   */
  protected async checkDependencies(): Promise<void> {
    // Default implementation does nothing
    // Override in child classes to add dependency checks
  }

  /**
   * Actual seeding logic to be implemented by child classes
   */
  protected abstract seedData(queryRunner: any): Promise<void>;

  /**
   * Batch upsert helper - inserts records in batches using ON CONFLICT DO NOTHING
   * This is much faster than individual inserts with existence checks
   */
  protected async batchUpsert<T>(
    repository: any,
    records: Partial<T>[],
    conflictColumns: string[],
    batchSize: number = 500,
  ): Promise<void> {
    if (records.length === 0) return;

    const tableName = repository.metadata.tableName;
    const columns = repository.metadata.columns
      .filter((col: any) => col.databaseName !== 'id')
      .map((col: any) => col.databaseName);

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      // Build values array
      const values = batch.map((record: any) =>
        columns.map((col: string) => {
          const jsName = repository.metadata.columns.find(
            (c: any) => c.databaseName === col,
          )?.propertyName;
          return jsName ? record[jsName] : null;
        }),
      );

      // Build placeholders
      const placeholders = values
        .map(
          (_, idx) =>
            `(${columns.map((_, colIdx) => `$${idx * columns.length + colIdx + 1}`).join(', ')})`,
        )
        .join(', ');

      const flatValues = values.flat();

      const query = `
        INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')})
        VALUES ${placeholders}
        ON CONFLICT (${conflictColumns.map((c) => `"${c}"`).join(', ')}) DO NOTHING
      `;

      await this.dataSource.query(query, flatValues);
      this.logger.log(
        `Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`,
      );
    }
  }

  /**
   * Batch insert helper without conflict checking - for new records only
   * Even faster than upsert when you know records don't exist
   */
  protected async batchInsert<T>(
    repository: any,
    records: Partial<T>[],
    batchSize: number = 500,
  ): Promise<void> {
    if (records.length === 0) return;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await repository.save(batch, { chunk: Math.min(batchSize, 100) });
      this.logger.log(
        `Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`,
      );
    }
  }

  /**
   * Get existing records by a field to avoid redundant queries
   */
  protected async getExistingByField<T>(
    repository: any,
    field: string,
    values: any[],
  ): Promise<Map<any, T>> {
    const existing = await repository
      .createQueryBuilder()
      .where(`${field} IN (:...values)`, { values })
      .getMany();

    const map = new Map<any, T>();
    for (const item of existing) {
      map.set(item[field], item);
    }
    return map;
  }
}
