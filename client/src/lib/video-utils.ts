/**
 * Video utility functions for extracting IDs and generating thumbnails
 * from various video platforms (YouTube, Vimeo, etc.)
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports: youtube.com/watch, youtu.be, youtube.com/embed, etc.
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null

  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regExp)
  return match ? match[1] : null
}

/**
 * Extract Vimeo video ID from URL
 */
export function extractVimeoVideoId(url: string): string | null {
  if (!url) return null

  const regExp = /(?:vimeo\.com\/)(\d+)/
  const match = url.match(regExp)
  return match ? match[1] : null
}

/**
 * Get YouTube thumbnail URL for a video
 * Quality options: 'default', 'mqdefault', 'hqdefault', 'sddefault', 'maxresdefault'
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'mqdefault'
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

/**
 * Get YouTube embed URL from video ID
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

/**
 * Get Vimeo thumbnail URL for a video
 * Note: Vimeo thumbnails require an API call, this returns the oEmbed endpoint
 */
export function getVimeoThumbnailUrl(videoId: string): string {
  return `https://vimeo.com/api/v2/video/${videoId}.json`
}

/**
 * Get Vimeo embed URL from video ID
 */
export function getVimeoEmbedUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}`
}

/**
 * Check if URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

/**
 * Check if URL is a Vimeo URL
 */
export function isVimeoUrl(url: string): boolean {
  return url.includes('vimeo.com')
}

/**
 * Get video platform type from URL
 */
export function getVideoPlatform(url: string): 'youtube' | 'vimeo' | 'direct' | null {
  if (!url) return null
  if (isYouTubeUrl(url)) return 'youtube'
  if (isVimeoUrl(url)) return 'vimeo'
  if (url.match(/\.(mp4|webm|ogg)$/i)) return 'direct'
  return null
}

/**
 * Get thumbnail URL for a video URL (auto-detects platform)
 */
export function getVideoThumbnail(url: string): string | null {
  if (!url) return null

  if (isYouTubeUrl(url)) {
    const videoId = extractYouTubeVideoId(url)
    if (videoId) {
      return getYouTubeThumbnail(videoId)
    }
  }

  // Vimeo thumbnails require async API call, return null for now
  // Caller should handle Vimeo thumbnails separately if needed

  return null
}

/**
 * Get embed URL for a video URL (auto-detects platform)
 */
export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null

  if (isYouTubeUrl(url)) {
    const videoId = extractYouTubeVideoId(url)
    if (videoId) {
      return getYouTubeEmbedUrl(videoId)
    }
  }

  if (isVimeoUrl(url)) {
    const videoId = extractVimeoVideoId(url)
    if (videoId) {
      return getVimeoEmbedUrl(videoId)
    }
  }

  return null
}

/**
 * Get YouTube embed URL with enhanced parameters for better UX
 */
export function getYouTubeEmbedUrlEnhanced(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&controls=1&enablejsapi=1&fs=1&cc_load_policy=0&disablekb=0&iv_load_policy=3`
}

/**
 * Get Vimeo embed URL with enhanced parameters for better UX
 */
export function getVimeoEmbedUrlEnhanced(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}?byline=0&portrait=0&color=ffffff&title=0&autoplay=0&controls=1`
}

/**
 * Check if URL is a direct video file URL
 */
export function isDirectVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv']
  const urlPath = url.toLowerCase()
  return videoExtensions.some((ext) => urlPath.includes(ext))
}

/**
 * Check if video can be embedded
 */
export function canEmbedVideo(url: string): boolean {
  return Boolean(extractYouTubeVideoId(url) || extractVimeoVideoId(url) || isDirectVideoUrl(url))
}

/**
 * Get best embed URL with enhanced parameters (auto-detects platform)
 */
export function getEnhancedEmbedUrl(url: string): string | null {
  if (!url) return null

  const youtubeId = extractYouTubeVideoId(url)
  if (youtubeId) {
    return getYouTubeEmbedUrlEnhanced(youtubeId)
  }

  const vimeoId = extractVimeoVideoId(url)
  if (vimeoId) {
    return getVimeoEmbedUrlEnhanced(vimeoId)
  }

  return null
}
