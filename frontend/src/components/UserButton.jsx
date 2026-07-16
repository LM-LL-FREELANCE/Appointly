import { Avatar, Group, Text, UnstyledButton, Menu, Button } from '@mantine/core'
import { IconChevronRight } from "@tabler/icons-react"
import classes from './UserButton.module.css'
import { useAuth } from '../hooks/useAuth.js'

import { IconSettings, IconBrandLine, IconPolaroid, IconZoom, IconArrowsLeftRight, IconTrash } from '@tabler/icons-react'

export function UserButton() {
  const { user } = useAuth()

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>

        <UnstyledButton className={classes.user}>
          <Group justify="space-between" wrap="nowrap">
            <Group wrap="nowrap">
              <Avatar radius="xl" alt="" />
              <div>
                <Text size="sm" fw={500}>{user?.name}</Text>
                <Text c="dimmed" size="xs">{user?.role}</Text>
              </div>
            </Group>
            <IconChevronRight size={14} stroke={1.5} />
          </Group>
        </UnstyledButton>

      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Application</Menu.Label>
        <Menu.Item leftSection={<IconSettings size={14} />}>
          Settings
        </Menu.Item>
        <Menu.Item leftSection={<IconBrandLine size={14} />}>
          Brand
        </Menu.Item>
        <Menu.Item leftSection={<IconPolaroid size={14} />}>
          Gallery
        </Menu.Item>
        <Menu.Item
          leftSection={<IconZoom size={14} />}
          rightSection={
            <Text size="xs" c="dimmed">
              ⌘K
            </Text>
          }
        >
          Search
        </Menu.Item>

        <Menu.Divider />

        <Menu.Label>Danger zone</Menu.Label>
        <Menu.Item
          leftSection={<IconArrowsLeftRight size={14} />}
        >
          Transfer my data
        </Menu.Item>
        <Menu.Item
          color="red"
          leftSection={<IconTrash size={14} />}
        >
          Delete my account
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

