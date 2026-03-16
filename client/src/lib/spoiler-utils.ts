/**
 * Utility functions for determining spoiler status
 */

/**
 * Determines if content should be hidden as a spoiler based on chapter number and user progress.
 *
 * Returns false (show content) when:
 * - showAllSpoilers is enabled
 * - effectiveProgress is 0 (user has not configured spoiler protection)
 * - no chapterNumber is provided
 * - chapterNumber is within the user's progress
 */
export function shouldHideSpoiler(
  chapterNumber: number | undefined,
  userProgress: number,
  spoilerSettings: {
    showAllSpoilers: boolean
    chapterTolerance: number
  }
): boolean {
  if (spoilerSettings.showAllSpoilers) return false

  const effectiveProgress = spoilerSettings.chapterTolerance > 0
    ? spoilerSettings.chapterTolerance
    : userProgress

  // If neither tolerance nor progress is set, the user has not configured
  // spoiler protection — show all content rather than hiding everything.
  if (effectiveProgress === 0) return false

  if (chapterNumber) return chapterNumber > effectiveProgress

  return false
}
