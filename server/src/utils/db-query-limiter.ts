import pLimit from 'p-limit';

/**
 * Creates a concurrency limiter for database queries to prevent connection pool exhaustion.
 *
 * Usage:
 * ```typescript
 * const limiter = createQueryLimiter(3);
 * const [users, posts, comments] = await Promise.all([
 *   limiter(() => userRepo.find()),
 *   limiter(() => postRepo.find()),
 *   limiter(() => commentRepo.find()),
 * ]);
 * ```
 *
 * @param concurrency - Maximum number of queries to run in parallel (default: 3)
 * @returns A function that wraps async operations with concurrency control
 */
export function createQueryLimiter(concurrency = 3) {
  return pLimit(concurrency);
}
