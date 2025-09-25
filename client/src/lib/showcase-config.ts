export interface VolumeShowcaseItem {
  id: number
  backgroundImage: string
  popoutImage?: string
  title?: string
  description?: string
}

export interface ShowcaseAnimations {
  floatIntensity?: number
  parallaxIntensity?: number
  scaleRange?: [number, number]
  rotationRange?: [number, number]
  delayOffset?: number
}

export interface ShowcaseConfiguration {
  id: string
  name: string
  volumes: VolumeShowcaseItem[]
  layout?: 'single' | 'dual'
  animations?: ShowcaseAnimations
  isActive?: boolean
}

// Animation Presets
export const ANIMATION_PRESETS = {
  subtle: {
    floatIntensity: 1,
    parallaxIntensity: 8,
    scaleRange: [1, 1.02] as [number, number],
    rotationRange: [-1, 1] as [number, number],
    delayOffset: 0.1
  },
  standard: {
    floatIntensity: 2,
    parallaxIntensity: 15,
    scaleRange: [1, 1.05] as [number, number],
    rotationRange: [-2, 2] as [number, number],
    delayOffset: 0.2
  },
  dramatic: {
    floatIntensity: 3.5,
    parallaxIntensity: 25,
    scaleRange: [1, 1.08] as [number, number],
    rotationRange: [-4, 4] as [number, number],
    delayOffset: 0.3
  }
} as const

// Predefined showcase configurations
export const SHOWCASE_CONFIGURATIONS: ShowcaseConfiguration[] = [
  {
    id: 'volumes-37-38',
    name: 'Volumes 37 & 38 (Default)',
    volumes: [
      {
        id: 37,
        backgroundImage: '/assets/showcase/Usogui_Volume_37_background.png',
        popoutImage: '/assets/showcase/Usogui_Volume_37_popout.png',
        title: 'Usogui Volume 37',
        description: 'The climactic battles intensify'
      },
      {
        id: 38,
        backgroundImage: '/assets/showcase/Usogui_Volume_38_background.png',
        popoutImage: '/assets/showcase/Usogui_Volume_38_popout.png',
        title: 'Usogui Volume 38',
        description: 'The final confrontation'
      }
    ],
    layout: 'dual',
    animations: ANIMATION_PRESETS.standard,
    isActive: true
  },
  {
    id: 'volume-37-single',
    name: 'Volume 37 (Single)',
    volumes: [
      {
        id: 37,
        backgroundImage: '/assets/showcase/Usogui_Volume_37_background.png',
        popoutImage: '/assets/showcase/Usogui_Volume_37_popout.png',
        title: 'Usogui Volume 37',
        description: 'The climactic battles intensify'
      }
    ],
    layout: 'single',
    animations: ANIMATION_PRESETS.dramatic,
    isActive: false
  },
  {
    id: 'volume-38-single',
    name: 'Volume 38 (Single)',
    volumes: [
      {
        id: 38,
        backgroundImage: '/assets/showcase/Usogui_Volume_38_background.png',
        popoutImage: '/assets/showcase/Usogui_Volume_38_popout.png',
        title: 'Usogui Volume 38',
        description: 'The final confrontation'
      }
    ],
    layout: 'single',
    animations: ANIMATION_PRESETS.dramatic,
    isActive: false
  }
]

// Utility functions for configuration management
export function getActiveConfiguration(): ShowcaseConfiguration {
  return SHOWCASE_CONFIGURATIONS.find(config => config.isActive) || SHOWCASE_CONFIGURATIONS[0]
}

export function getConfigurationById(id: string): ShowcaseConfiguration | undefined {
  return SHOWCASE_CONFIGURATIONS.find(config => config.id === id)
}

export function setActiveConfiguration(id: string): void {
  SHOWCASE_CONFIGURATIONS.forEach(config => {
    config.isActive = config.id === id
  })
}

// Helper function to create custom configurations
export function createShowcaseConfiguration({
  id,
  name,
  volumes,
  layout = volumes.length === 1 ? 'single' : 'dual',
  animations = ANIMATION_PRESETS.standard
}: Omit<ShowcaseConfiguration, 'isActive'>): ShowcaseConfiguration {
  return {
    id,
    name,
    volumes,
    layout,
    animations,
    isActive: false
  }
}

// Validation function for showcase configurations
export function validateShowcaseConfiguration(config: ShowcaseConfiguration): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!config.id || config.id.trim() === '') {
    errors.push('Configuration ID is required')
  }

  if (!config.name || config.name.trim() === '') {
    errors.push('Configuration name is required')
  }

  if (!config.volumes || config.volumes.length === 0) {
    errors.push('At least one volume is required')
  }

  if (config.layout === 'dual' && config.volumes.length < 2) {
    errors.push('Dual layout requires at least 2 volumes')
  }

  if (config.layout === 'single' && config.volumes.length > 1) {
    errors.push('Single layout supports only 1 volume')
  }

  config.volumes.forEach((volume, index) => {
    if (!volume.id) {
      errors.push(`Volume ${index + 1}: ID is required`)
    }

    if (!volume.backgroundImage || volume.backgroundImage.trim() === '') {
      errors.push(`Volume ${index + 1}: Background image is required`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}