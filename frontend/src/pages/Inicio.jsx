import { PageHeader } from "../components/PageHeader";
import { Stack, Title, Group, Avatar } from "@mantine/core";
import { Link } from "react-router-dom";
export default function Inicio() {
  return (
    <Stack gap="md">
      <PageHeader>
        <Group justify="space-between" style={{ flex: 1 }}>
          <Title order={4}>Inicio</Title>
          <Group>
            <Avatar radius="xl" alt="" component={Link} to="/user" />
          </Group>
        </Group>
      </PageHeader>
    </Stack>
  )
}