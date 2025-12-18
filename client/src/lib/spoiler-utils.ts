/**
 * Utility functions for determining spoiler status
 */

/**
 * Determines if content should be hidden as a spoiler based on chapter number and user progress
 * This logic matches the MediaSpoilerWrapper component's shouldHideSpoiler logic
 */
export function shouldHideSpoiler(
  chapterNumber: number | undefined,
  userProgress: number,
  spoilerSettings: {
    showAllSpoilers: boolean
    chapterTolerance: number
  }
): boolean {
  // If user has "show all spoilers" enabled, never hide
  if (spoilerSettings.showAllSpoilers) {
    return false
  }

  // Use chapter tolerance if set, otherwise use user's actual progress
  const effectiveProgress = spoilerSettings.chapterTolerance > 0
    ? spoilerSettings.chapterTolerance
    : userProgress

  // If there's a chapter number, check if it's beyond user's progress
  if (chapterNumber) {
    return chapterNumber > effectiveProgress
  }

  // If no chapter number, don't hide
  return false
}
