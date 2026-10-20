import { Button, Group, Paper, Stack, Text } from '@mantine/core'
import { IconDots } from '@tabler/icons-react'
import { EstadoTurnoBadge } from '../../../components/EstadoTurnoBadge.jsx'
import { UserAvatar } from '../../../components/UserAvatar.jsx'
import { esAbierto } from '../../../utils/estadosTurno.js'
import { fechaCorta, horaCorta } from '../../../utils/fechas.utils.js'
import { TurnoRowMenu } from './TurnoRowMenu.jsx'

export function TurnoCardAdmin({
  turno,
  ahora,
  cambiandoEstado,
  onConfirmar,
  onMarcarEnEspera,
  onReprogramar,
  onVerHistorial,
  onReasignar,
  onCompletar,
  onMarcarAusente,
  onCancelar,
}) {
  const nombreCliente = `${turno.c_nombre ?? turno.nombre ?? ''} ${turno.c_apellido ?? turno.apellido ?? ''}`.trim()
  const nombreProfesional = `${turno.p_nombre ?? ''} ${turno.p_apellido ?? ''}`.trim()
  const abierto = esAbierto(turno.estado)

  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Text fw={600} fz="sm">
            {fechaCorta(turno.fecha_turno)} · {horaCorta(turno.hora_turno)} hs
          </Text>
          <EstadoTurnoBadge estado={turno.estado} />
        </Group>

        <Group gap="sm" wrap="nowrap">
          <UserAvatar
            size={32}
            radius="100%"
            withLink={false}
            src={turno.c_foto_url ?? turno.foto_url}
            name={nombreCliente}
          />
          <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
            <Text fz="xs" c="dimmed">Paciente</Text>
            <Text fz="sm" fw={500} lineClamp={1}>{nombreCliente}</Text>
          </Stack>
        </Group>

        <Group gap="sm" wrap="nowrap">
          <UserAvatar
            size={32}
            radius="100%"
            withLink={false}
            src={turno.p_foto_url}
            name={nombreProfesional}
          />
          <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
            <Text fz="xs" c="dimmed">Profesional</Text>
            <Text fz="sm" fw={500} lineClamp={1}>{nombreProfesional}</Text>
          </Stack>
        </Group>

        {abierto && (
          <TurnoRowMenu
            turno={turno}
            ahora={ahora}
            cambiandoEstado={cambiandoEstado}
            onConfirmar={onConfirmar}
            onMarcarEnEspera={onMarcarEnEspera}
            onReprogramar={onReprogramar}
            onVerHistorial={onVerHistorial}
            onReasignar={onReasignar}
            onCompletar={onCompletar}
            onMarcarAusente={onMarcarAusente}
            onCancelar={onCancelar}
            target={
              <Button
                variant="default"
                fullWidth
                leftSection={<IconDots size={16} />}
                aria-label="Acciones del turno"
              >
                Acciones
              </Button>
            }
          />
        )}
      </Stack>
    </Paper>
  )
}
