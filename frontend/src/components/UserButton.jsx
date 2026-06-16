import { Avatar, Group, Text, UnstyledButton } from '@mantine/core';
import { IconChevronRight } from "@tabler/icons-react";
import classes from './UserButton.module.css';

export function UserButton() {
  return (
    <UnstyledButton className={classes.user}>
      <Group justify="space-between" wrap="nowrap">
        <Group wrap="nowrap">
          <Avatar radius="xl" alt="" />
          <div>
            <Text size="sm" fw={500}>Dra. M. Pérez</Text>
            <Text c="dimmed" size="xs">Profesional</Text>
          </div>
        </Group>
        <IconChevronRight size={14} stroke={1.5} />
      </Group>
    </UnstyledButton>
  );
}