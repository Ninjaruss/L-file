import { Box, Container, Group, Skeleton, Stack } from '@mantine/core'

export function ListPageLoading() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Box style={{ textAlign: 'center' }}>
          <Skeleton height={48} width="min(100%, 420px)" mx="auto" mb="md" radius="md" />
          <Skeleton height={18} width="min(100%, 320px)" mx="auto" radius="sm" />
        </Box>
        <Group gap="sm">
          <Skeleton height={40} style={{ flex: 1 }} radius="md" />
          <Skeleton height={40} width={100} radius="md" />
        </Group>
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={280} radius="md" />
          ))}
        </Box>
      </Stack>
    </Container>
  )
}

export default ListPageLoading
