import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Anchor,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  List,
  Stack,
  Text,
  Title
} from '@mantine/core'
import { Heart, Mail, Coffee, Github, Twitter } from 'lucide-react'
import { mantineTheme } from '../../lib/mantine-theme'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About L-File - The Ultimate Usogui Database',
    description:
      "Learn about L-File, the comprehensive fan-made database dedicated to the manga series Usogui (The Lie Eater). Created by fans, for fans.",
    keywords: ['Usogui', 'Lie Eater', 'manga', 'database', 'characters', 'gambles', 'about'],
    openGraph: {
      title: 'About L-File - The Ultimate Usogui Database',
      description:
        'Learn about L-File, the comprehensive fan-made database dedicated to the manga series Usogui (The Lie Eater).',
      type: 'website'
    },
    twitter: {
      card: 'summary',
      title: 'About L-File - The Ultimate Usogui Database',
      description:
        'Learn about L-File, the comprehensive fan-made database dedicated to the manga series Usogui (The Lie Eater).'
    }
  }
}

const supportItems = [
  {
    primary: 'Buy me a coffee',
    secondary: 'Help cover hosting costs and development time'
  },
  {
    primary: 'Contribute content',
    secondary: 'Submit guides, character analyses, or media'
  },
  {
    primary: 'Spread the word',
    secondary: 'Share L-File with other Usogui fans'
  },
  {
    primary: 'Report issues',
    secondary: 'Help us improve by reporting bugs or suggesting features'
  }
]

const accentRed = mantineTheme.other?.usogui?.red ?? '#e11d48'
const accentPurple = mantineTheme.other?.usogui?.purple ?? '#7c3aed'
const surface = mantineTheme.other?.usogui?.black ?? '#0a0a0a'
const cardClass = 'rounded-2xl shadow-sm border border-slate-800/70 bg-slate-900/80 backdrop-blur p-8'

export default function AboutPage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Box ta="center">
          <Title order={2} mb="sm">
            About L-File
          </Title>
          <Text size="lg" c="dimmed">
            Comprehensive fan-made archive and community hub for the world of Usogui
          </Text>
        </Box>

        <Grid gutter="xl">
          <Grid.Col span={12}>
            <Card className={cardClass}>
              <Stack gap="md">
                <Title order={3} c="red.4">
                  About
                </Title>
                <Text size="md">
                  L-File is a comprehensive fan-made database and community hub dedicated to the manga series Usogui (The Lie Eater).
                  This project aims to provide fans with detailed information about characters, story arcs, gambles, events, and guides
                  to help navigate the complex world of Usogui.
                </Text>
                <Text size="md">
                  Our mission is to create the most complete and accurate resource for Usogui fans worldwide, featuring character
                  profiles, detailed gamble explanations, chapter guides, and community-contributed content. Whether you're a new reader
                  trying to understand the intricate gambling strategies or a long-time fan looking to dive deeper into character
                  relationships, L-File is here to enhance your Usogui experience.
                </Text>
                <Text size="md">
                  This is a non-profit, fan-created project built with love for the Usogui community. All content is created by fans,
                  for fans, and we encourage community participation through guide submissions and media contributions.
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card className={`${cardClass} h-full flex flex-col`}>
              <Stack gap="md">
                <Group gap="sm">
                  <Heart size={24} color={accentRed} />
                  <Title order={3} c="red.4">
                    Support Me
                  </Title>
                </Group>
                <Text size="md">
                  L-File is a passion project that takes considerable time and effort to maintain. If you find this resource helpful
                  and would like to support its continued development, here are some ways you can help:
                </Text>
                <List spacing="md" size="sm">
                  {supportItems.map((item) => (
                    <List.Item key={item.primary}>
                      <Text fw={600}>{item.primary}</Text>
                      <Text size="sm" c="dimmed">
                        {item.secondary}
                      </Text>
                    </List.Item>
                  ))}
                </List>
                <Group gap="sm" mt="md">
                  <Button
                    size="md"
                    variant="gradient"
                    gradient={{ from: accentRed, to: accentPurple }}
                    leftSection={<Coffee size={16} />}>
                    Ko-fi (Coming Soon)
                  </Button>
                  <Button size="md" variant="outline" color="red" leftSection={<Github size={16} />}>
                    GitHub (Coming Soon)
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card className={cardClass}>
              <Stack gap="md">
                <Title order={3} c="red.4">
                  Supporters
                </Title>
                <Text size="md">
                  A huge thank you to everyone who has supported L-File through contributions, feedback, and by spreading the word!
                </Text>
                <Text size="sm" c="dimmed" fs="italic">
                  Supporter list coming soon...
                </Text>
                <Divider my="md" />
                <Text size="sm" c="dimmed">
                  Want to be featured here? Support the project and help us grow the Usogui community!
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={12}>
            <Card className={cardClass}>
              <Stack gap="md">
                <Title order={3} c="red.4">
                  Contact
                </Title>
                <Text size="md">
                  Have questions, suggestions, or want to get involved? Here's how you can reach out:
                </Text>
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="sm">
                      <Group gap="sm">
                        <Mail size={20} />
                        <Text size="md">
                          Email:{' '}
                          <Anchor href="mailto:contact@l-file.com" underline="hover">
                            contact@l-file.com
                          </Anchor>
                        </Text>
                      </Group>
                      <Group gap="sm">
                        <Github size={20} />
                        <Text size="md">GitHub: Coming Soon</Text>
                      </Group>
                    </Stack>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group gap="sm">
                      <Twitter size={20} />
                      <Text size="md">Twitter: Coming Soon</Text>
                    </Group>
                  </Grid.Col>
                </Grid>
                <Divider my="md" />
                <Text size="sm" c="dimmed">
                  For content submissions, please use the dedicated "Submit Guide" and "Submit Media" options in the navigation menu.
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  )
}
