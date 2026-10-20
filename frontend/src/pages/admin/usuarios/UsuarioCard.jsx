import { Button, Group, Paper, Stack, Text } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { UserAvatar } from '../../../components/UserAvatar.jsx'
import { EstadoCuentaBadge } from './EstadoCuentaBadge.jsx'
import { RolCuentaBadge } from './RolCuentaBadge.jsx'

export function UsuarioCard({ usuario, onVerFicha }) {
  const nombre = `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim()

  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <UserAvatar size="md" withLink={false} src={usuario.foto_url} name={nombre} />
            <Text fw={600} fz="md" lineClamp={1} title={nombre} style={{ minWidth: 0 }}>
              {nombre}
            </Text>
          </Group>
          <EstadoCuentaBadge estado={usuario.estado} />
        </Group>

        <Group gap="sm" wrap="nowrap">
          <RolCuentaBadge rol={usuario.rol} />
          <Text c="dimmed" fz="sm">{usuario.dni}</Text>
        </Group>

        <Button variant="default" radius="md" size="md" rightSection={<IconChevronRight size={16} />} onClick={onVerFicha}>
          Ver ficha
        </Button>
      </Stack>
    </Paper>
  )
}
