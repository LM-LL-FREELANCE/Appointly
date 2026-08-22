import { Group, Stack, Text } from '@mantine/core'
import { SidebarBurger } from './SidebarBurger.jsx'
import { UserAvatar } from './UserAvatar.jsx'

export function PageHeader({
  title,
  subtitle,
  actions,
  withAvatar = true,
  avatar,
  children,
}) {
  return (
    <Group align="center" mb="md" style={{ minHeight: 52 }}>
      <SidebarBurger />
      {children ? (
        children
      ) : (
        <Group justify="space-between" style={{ flex: 1 }}>
          <Stack gap={0}>
            {typeof title === 'string' ? (
              <Text fw={600} fz="xl">
                {title}
              </Text>
            ) : (
              title
            )}
            {subtitle && (
              typeof subtitle === 'string' ? (
                <Text c="dimmed" fz="md" visibleFrom="sm">
                  {subtitle}
                </Text>
              ) : (
                subtitle
              )
            )}
          </Stack>

          {(actions || withAvatar) && (
            <Group gap="sm" wrap="nowrap">
              {actions}
              {withAvatar && (avatar || <UserAvatar />)}
            </Group>
          )}
        </Group>
      )}
    </Group>
  )
}
