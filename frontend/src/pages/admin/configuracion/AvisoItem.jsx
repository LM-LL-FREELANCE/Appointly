import { ActionIcon, Badge, Group, Paper, Switch, Text } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { AvisoIcon } from '../../../components/AvisoIcon.jsx'
import { avisoTipo, vigenciaAviso } from '../../../utils/avisos.js'

export function AvisoItem({ aviso, onEditar, onEliminar, onToggle, togglePending = false }) {
  const tipo = avisoTipo(aviso.tipo)

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <Group gap="sm" wrap="wrap" style={{ flex: 1, minWidth: 0 }}>
          <Badge
            color={tipo.color}
            variant="light"
            leftSection={<AvisoIcon tipo={aviso.tipo} size={12} />}
          >
            {tipo.label}
          </Badge>
          <Text fw={600} style={{ overflowWrap: 'anywhere' }}>{aviso.titulo}</Text>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Switch
            checked={aviso.activo}
            onChange={(event) => onToggle(aviso, event.currentTarget.checked)}
            label="Activo"
            size="sm"
            disabled={togglePending}
            aria-label={`Aviso activo: ${aviso.titulo}`}
          />
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => onEditar(aviso)}
            aria-label={`Editar ${aviso.titulo}`}
          >
            <IconPencil size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => onEliminar(aviso)}
            aria-label={`Eliminar ${aviso.titulo}`}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      </Group>

      <Text fz="sm" mt="xs" lineClamp={2} style={{ whiteSpace: 'pre-wrap' }}>
        {aviso.mensaje}
      </Text>
      <Text fz="sm" c="dimmed" mt="xs">{vigenciaAviso(aviso)}</Text>
    </Paper>
  )
}
