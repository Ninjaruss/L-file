'use client'

import { useState } from 'react'
import { Container, Title, Button, Group, Stack, Text, Card, Badge } from '@mantine/core'
import { DynamicVolumeShowcase } from '../../components/DynamicVolumeShowcase'
import { SHOWCASE_CONFIGURATIONS, setActiveConfiguration, type ShowcaseConfiguration } from '../../lib/showcase-config'

export default function ShowcaseDemoPage() {
  const [currentConfig, setCurrentConfig] = useState<ShowcaseConfiguration>(SHOWCASE_CONFIGURATIONS[0])

  const handleConfigChange = (config: ShowcaseConfiguration) => {
    setCurrentConfig(config)
    setActiveConfiguration(config.id)
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Title order={1} ta="center">
          Dynamic Volume Showcase Demo
        </Title>

        <Text size="lg" c="dimmed" ta="center">
          Switch between different showcase configurations to see the dynamic capabilities
        </Text>

        {/* Configuration Selector */}
        <Card withBorder padding="lg">
          <Stack gap="md">
            <Title order={3}>Available Configurations</Title>
            <Group>
              {SHOWCASE_CONFIGURATIONS.map((config) => (
                <Button
                  key={config.id}
                  variant={currentConfig.id === config.id ? 'filled' : 'outline'}
                  onClick={() => handleConfigChange(config)}
                  size="sm"
                >
                  {config.name}
                </Button>
              ))}
            </Group>
          </Stack>
        </Card>

        {/* Current Configuration Info */}
        <Card withBorder padding="lg">
          <Stack gap="sm">
            <Group justify="space-between">
              <Title order={4}>Current Configuration</Title>
              <Badge color="blue" variant="light">
                {currentConfig.layout?.toUpperCase() || 'AUTO'} LAYOUT
              </Badge>
            </Group>
            <Text c="dimmed">{currentConfig.name}</Text>
            <Group gap="xs">
              <Text size="sm" fw={500}>Volumes:</Text>
              {currentConfig.volumes.map((volume) => (
                <Badge key={volume.id} variant="outline" size="sm">
                  Vol. {volume.id}
                </Badge>
              ))}
            </Group>
            {currentConfig.animations && (
              <Group gap="xs">
                <Text size="sm" fw={500}>Animation:</Text>
                <Badge variant="outline" size="sm" color="green">
                  Float: {currentConfig.animations.floatIntensity}
                </Badge>
                <Badge variant="outline" size="sm" color="orange">
                  Parallax: {currentConfig.animations.parallaxIntensity}
                </Badge>
                <Badge variant="outline" size="sm" color="purple">
                  Scale: {currentConfig.animations.scaleRange?.[0]}-{currentConfig.animations.scaleRange?.[1]}
                </Badge>
              </Group>
            )}
          </Stack>
        </Card>

        {/* Showcase Display */}
        <Card withBorder padding="lg">
          <DynamicVolumeShowcase
            volumes={currentConfig.volumes}
            layout={currentConfig.layout}
            animations={currentConfig.animations}
            height="clamp(400px, 45vw, 500px)"
          />
        </Card>

        {/* Usage Instructions */}
        <Card withBorder padding="lg">
          <Stack gap="md">
            <Title order={3}>How to Use</Title>
            <Stack gap="xs">
              <Text size="sm">
                <strong>1. Configure:</strong> Edit the configurations in <code>lib/showcase-config.ts</code>
              </Text>
              <Text size="sm">
                <strong>2. Switch Active:</strong> Use <code>setActiveConfiguration(id)</code> to change the active showcase
              </Text>
              <Text size="sm">
                <strong>3. Custom Volumes:</strong> Add new volume configurations with background and popout images
              </Text>
              <Text size="sm">
                <strong>4. Animation Presets:</strong> Choose from subtle, standard, or dramatic animation presets
              </Text>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}