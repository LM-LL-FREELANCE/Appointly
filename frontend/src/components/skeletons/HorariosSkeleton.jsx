import { Box, Group, Paper, SimpleGrid, Skeleton, Stack } from "@mantine/core"
import { useIsDesktop } from "../../hooks/useIsDesktop.js"

const DIAS_COUNT = 7
const SLOTS_PATTERN = [0, 2, 3, 1, 2, 0, 2]

export default function HorariosSkeleton() {
  const isDesktop = useIsDesktop()

  return (
    <Stack gap="sm" pb={10}>
      {Array.from({ length: DIAS_COUNT }).map((_, dia) => {
        const slotsCount = SLOTS_PATTERN[dia]
        const isActive = slotsCount > 0

        return (
          <Paper key={dia} withBorder p="sm" radius="md">
            <Group wrap="wrap" gap="md" align={isDesktop ? 'stretch' : 'center'}>
              {isDesktop ? (
                <Paper
                  radius="sm"
                  p="lg"
                  w={180}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'start',
                    justifyContent: 'start',
                    paddingLeft: '15px',
                  }}
                >
                  <Skeleton height={24} width={120} radius="xl" />
                </Paper>
              ) : (
                <Group justify="space-between" w="100%">
                  <Skeleton height={28} width={130} radius="xl" />
                  {isActive && <Skeleton height={16} width={60} radius="sm" />}
                </Group>
              )}

              <Paper
                radius="sm"
                style={{ flex: 1, minWidth: 0, alignItems: 'center', margin: 'auto' }}
                h="100%"
              >
                {isActive ? (
                  isDesktop ? (
                    <Box
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 200px))',
                        gap: 'var(--mantine-spacing-xs)',
                      }}
                    >
                      {Array.from({ length: slotsCount }).map((_, i) => (
                        <Skeleton key={i} height={38} radius="sm" />
                      ))}
                    </Box>
                  ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                      {Array.from({ length: slotsCount }).map((_, i) => (
                        <Skeleton key={i} height={52} radius="sm" />
                      ))}
                    </SimpleGrid>
                  )
                ) : (
                  <Box style={{ display: 'flex', alignItems: 'center' }} h="100%" mih={{ base: 0, md: 38 }}>
                    <Skeleton height={16} width={90} radius="sm" />
                  </Box>
                )}
              </Paper>
            </Group>
          </Paper>
        )
      })}
    </Stack>
  )
}
