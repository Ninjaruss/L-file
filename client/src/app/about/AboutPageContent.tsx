'use client'

import {
  Anchor,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  Stack,
  Text,
  Title,
  useMantineTheme,
  rem
} from '@mantine/core'
import { backgroundStyles } from '../../lib/mantine-theme'
import { Mail, Github } from 'lucide-react'


const resolveHex = (color: string | undefined, fallback: string) => {
  if (!color) return fallback
  return color.startsWith('#') ? color : fallback
}

const normalizeHex = (hex: string) => {
  const sanitized = hex.replace('#', '')
  if (sanitized.length === 3) {
    return sanitized
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
  }
  return sanitized.padEnd(6, '0').slice(0, 6)
}

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = normalizeHex(hex)
  const int = Number.parseInt(normalized, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const createGradient = (angle: number, from: string, to: string) =>
  `linear-gradient(${angle}deg, ${from}, ${to})`

export function AboutPageContent() {
  const theme = useMantineTheme()

  const accentRedRaw = theme.colors.red?.[5]
  const accentPurpleRaw = theme.colors.purple?.[5]
  const surfaceUpperRaw = theme.colors.black?.[1]
  const surfaceLowerRaw = theme.colors.black?.[3]
  const mutedRaw = theme.colors.black?.[6]
  const whiteRaw = theme.white

  const accentRedHex = resolveHex(accentRedRaw, '#e11d48')
  const accentPurpleHex = resolveHex(accentPurpleRaw, '#7c3aed')
  const surfaceUpperHex = resolveHex(surfaceUpperRaw, '#171717')
  const surfaceLowerHex = resolveHex(surfaceLowerRaw, '#404040')
  const mutedHex = resolveHex(mutedRaw, '#a3a3a3')
  const whiteHex = resolveHex(whiteRaw, '#ffffff')

  const cardBaseStyle = {
    background: createGradient(160, hexToRgba(surfaceUpperHex, 0.88), hexToRgba(surfaceLowerHex, 0.96)),
    border: `1px solid ${hexToRgba(accentPurpleHex, 0.22)}`,
    boxShadow: `0 25px 55px -30px ${hexToRgba(accentPurpleHex, 0.55)}`,
    backdropFilter: 'blur(16px)'
  } as const

  const accentCardStyle = {
    ...cardBaseStyle,
    background: createGradient(135, hexToRgba(accentRedHex, 0.16), hexToRgba(accentPurpleHex, 0.18)),
    border: `1px solid ${hexToRgba(accentRedHex, 0.35)}`,
    boxShadow: `0 30px 60px -28px ${hexToRgba(accentRedHex, 0.6)}`
  } as const

  const user = 'contact'
  const domain = 'ninjaruss.net'

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <Container size="lg" py="xl">
      <Stack gap="xl">

        {/* Magazine Masthead */}
        <Box
          style={{
            borderBottom: `2px solid ${accentRedHex}`,
            paddingBottom: rem(24),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: rem(16)
          }}
        >
          <Box>
            <Text
              style={{
                fontFamily: 'var(--font-opti-goudy-text)',
                fontSize: rem(56),
                lineHeight: 1,
                color: '#ffffff',
                fontWeight: 400
              }}
            >
              L-File
            </Text>
            <Text size="xs" c="dimmed" style={{ letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: rem(4) }}>
              Fan Database — Usogui
            </Text>
          </Box>
          <Text size="sm" c="dimmed" style={{ maxWidth: rem(280), textAlign: 'right' }}>
            Non-profit fan project. Free and ad-free, maintained by the community.
          </Text>
        </Box>

        <Grid gutter="xl">
          {/* Contribute Section */}
          <Grid.Col span={12}>
            <Card radius="xl" p={0} style={accentCardStyle}>
              <Grid gutter={0}>
                <Grid.Col
                  span={{ base: 12, md: 8 }}
                  style={{
                    padding: rem(40),
                    borderRight: `1px solid ${hexToRgba(accentRedHex, 0.15)}`
                  }}
                >
                  <Stack gap="md">
                    <Text
                      style={{
                        fontFamily: 'var(--font-opti-goudy-text)',
                        fontSize: rem(44),
                        lineHeight: 1.1,
                        color: accentRedHex,
                        fontWeight: 400
                      }}
                    >
                      Become a contributor.
                    </Text>
                    <Text size="md" c={hexToRgba(whiteHex, 0.75)} style={{ maxWidth: rem(480) }}>
                      L-File is open source and community-driven. Editors help maintain and expand the database — adding characters, gambles, and event details.
                      If you know Usogui well and want to help, apply for the editor role.
                    </Text>
                    <Group gap="sm" mt="sm">
                      <Button
                        component="a"
                        href="https://github.com/ninjaruss/l-file"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="lg"
                        variant="gradient"
                        gradient={{ from: accentRedHex, to: accentPurpleHex }}
                        leftSection={<Github size={20} />}
                      >
                        GitHub
                      </Button>
                      <Button
                        component="a"
                        href={`mailto:${user}@${domain}`}
                        size="lg"
                        variant="outline"
                        style={{
                          color: hexToRgba(whiteHex, 0.9),
                          borderColor: hexToRgba(whiteHex, 0.3)
                        }}
                        leftSection={<Mail size={20} />}
                      >
                        Apply as Editor
                      </Button>
                    </Group>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }} style={{ padding: rem(40) }}>
                  <Stack gap="lg">
                    {[
                      { primary: 'Code contributions', secondary: 'Fix bugs, add features, and help build new tools for fans' },
                      { primary: 'Content contributions', secondary: 'Submit guides, character analyses, quotes, and media' },
                      { primary: 'Spread the word', secondary: 'Share L-File with other Usogui fans and readers' },
                    ].map((item) => (
                      <Box
                        key={item.primary}
                        style={{
                          borderLeft: `2px solid ${hexToRgba(accentPurpleHex, 0.5)}`,
                          paddingLeft: rem(16)
                        }}
                      >
                        <Text fw={700} size="sm" c={whiteHex} mb={2}>{item.primary}</Text>
                        <Text size="xs" c={hexToRgba(whiteHex, 0.5)}>{item.secondary}</Text>
                      </Box>
                    ))}
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>
          </Grid.Col>

          {/* About Section */}
          <Grid.Col span={12}>
            <Card radius="xl" p={0} style={cardBaseStyle}>
              <Box style={{ padding: `${rem(40)} ${rem(48)}` }}>
                {/* Decorative quote mark */}
                <Text
                  aria-hidden="true"
                  style={{
                    fontFamily: 'var(--font-opti-goudy-text)',
                    fontSize: rem(96),
                    lineHeight: 0.8,
                    color: accentRedHex,
                    opacity: 0.15,
                    marginBottom: rem(-20),
                    display: 'block',
                    userSelect: 'none'
                  }}
                >
                  "
                </Text>
                {/* Pull-quote first paragraph */}
                <Text
                  style={{
                    fontFamily: 'var(--font-opti-goudy-text)',
                    fontSize: rem(20),
                    fontWeight: 400,
                    lineHeight: 1.55,
                    color: hexToRgba(whiteHex, 0.9),
                    borderLeft: `3px solid ${accentRedHex}`,
                    paddingLeft: rem(24),
                    marginBottom: rem(24)
                  }}
                >
                  L-File is a fan-made database and community hub dedicated to <em>Usogui (The Lie Eater)</em>.
                  It organizes information about characters, story arcs, gambles, and events to help readers explore the series' complex world.
                </Text>
                <Text size="md" c={hexToRgba(whiteHex, 0.7)} mb="md">
                  Usogui is dense, strategic, and detail-heavy, and existing resources can be difficult to navigate.
                  L-File exists to present information in a clearer, more structured way while preserving the depth that makes the series special.
                </Text>
                <Text size="md" c={hexToRgba(whiteHex, 0.7)}>
                  This is a non-profit fan project. Content is created by fans, for fans, and community contributions help the database continue to grow over time.
                </Text>
              </Box>
            </Card>
          </Grid.Col>

          {/* Supporters Section */}
          <Grid.Col span={12}>
            <Card radius="xl" p="xl" style={cardBaseStyle}>
              <Stack gap="md">
                <Box style={{ borderTop: `1px solid ${hexToRgba(accentPurpleHex, 0.3)}`, paddingTop: rem(12) }}>
                  <Title
                    order={3}
                    style={{
                      fontFamily: 'var(--font-opti-goudy-text)',
                      color: accentPurpleHex,
                      fontSize: rem(28),
                      fontWeight: 400
                    }}
                  >
                    Contributors
                  </Title>
                </Box>
                <Text size="md" c={hexToRgba(whiteHex, 0.8)}>
                  Thank you to everyone who has contributed to L-File — writing guides, editing content, submitting media, and helping the database grow.
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          {/* Contact Section */}
          <Grid.Col span={12}>
            <Card radius="xl" p="xl" style={{ ...cardBaseStyle, overflow: 'hidden', position: 'relative' }}>
              {/* Decorative envelope glyph */}
              <Text
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: rem(-16),
                  bottom: rem(-24),
                  fontSize: rem(128),
                  lineHeight: 1,
                  opacity: 0.04,
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
              >
                ✉
              </Text>
              <Stack gap="md" style={{ position: 'relative' }}>
                <Title order={3} c={accentRedHex}>
                  Contact
                </Title>
                <Text size="md" c={hexToRgba(whiteHex, 0.82)}>
                  Questions, suggestions, or interested in contributing? You can reach out here:
                </Text>

                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="sm">
                      <Group gap="sm">
                        <Mail size={20} />
                        <Text size="md" c={whiteHex}>
                          Email{' '}
                          <Anchor href={`mailto:${user}@${domain}`}>
                            {user}@{domain}
                          </Anchor>
                        </Text>
                      </Group>
                      <Group gap="sm">
                        <Github size={20} />
                        <Anchor
                          href="https://github.com/ninjaruss"
                          target="_blank"
                          rel="noopener noreferrer"
                          c={whiteHex}
                          underline="hover"
                          size="md"
                        >
                          @ninjaruss
                        </Anchor>
                      </Group>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group gap="sm">
                      <Github size={20} />
                      <Anchor
                        href="https://github.com/ninjaruss/l-file"
                        target="_blank"
                        rel="noopener noreferrer"
                        c={whiteHex}
                        underline="hover"
                        size="md"
                      >
                        github.com/ninjaruss/l-file
                      </Anchor>
                    </Group>
                  </Grid.Col>
                </Grid>
                <Divider my="md" color={hexToRgba(accentRedHex, 0.35)} />
                <Text size="sm" c={hexToRgba(whiteHex, 0.6)}>
                  For content submissions, please use the dedicated &quot;Submit Guide&quot; and &quot;Submit Media&quot; options in the navigation menu.
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
    </Box>
  )
}
