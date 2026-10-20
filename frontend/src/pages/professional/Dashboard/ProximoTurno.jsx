import { useState } from 'react'
import {
  Group,
  Text,
  Stack,
  Paper,
  Button,
  Badge,
  Divider,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCalendarClock,
  IconCalendarOff,
  IconClock,
  IconCalendar,
  IconEye,
  IconPlayerPlay,
  IconCircleCheck,
  IconCheck,
} from '@tabler/icons-react'
import { TurnoProDetailModal } from './TurnoProDetailModal.jsx'
import { CancelarTurnoProfModal } from '../../turnos/CancelarTurnoProfModal.jsx'
import { ConfirmarEstadoModal } from '../../turnos/ConfirmarEstadoModal.jsx'
import { ReprogramarTurnoModal } from '../../turnos/ReprogramarTurnoModal.jsx'
import { TurnoHistorialModal } from '../../turnos/TurnoHistorialModal.jsx'
import { useAccionesTurnoProf } from '../../turnos/useAccionesTurnoProf.js'
import { accionesProfesional } from '../../../utils/estadosTurno.js'
import { aISO, fechaCorta, horaCorta } from '../../../utils/fechas.utils.js'
import { UserAvatar } from '../../../components/UserAvatar.jsx'
import { EstadoTurnoBadge } from '../../../components/EstadoTurnoBadge.jsx'

function labelRelativo(fechaISO) {
  const fecha = fechaISO?.slice(0, 10)
  if (!fecha) return null

  const hoy = aISO(new Date())
  const manana = aISO(new Date(Date.now() + 24 * 60 * 60 * 1000))

  if (fecha === hoy) return 'Hoy'
  if (fecha === manana) return 'Mañana'
  return fechaCorta(fechaISO)
}

export function ProximoTurno({
  turno,
  dniProfesional,
  estadoJornada = 'sin_turnos',
}) {
  const acciones = useAccionesTurnoProf()
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false)
  const [cancelModalItem, setCancelModalItem] = useState(null)

  const handleOpenCancel = (item) => {
    setCancelModalItem(item)
  }

  const handleCloseCancel = () => {
    if (acciones.cancelar.isPending) return
    setCancelModalItem(null)
  }

  const handleConfirmCancel = (motivo) => {
    if (!cancelModalItem) return
    acciones.cancelar.mutate(
      { id: cancelModalItem.id_turno, motivo },
      { onSuccess: () => setCancelModalItem(null) },
    )
  }

  const relativo = turno ? labelRelativo(turno.fecha_turno) : null
  const accionesDisponibles = turno ? accionesProfesional(turno) : []

  const accionIniciar = accionesDisponibles.find((a) => a.estado === 'en_curso')
  const accionCompletar = accionesDisponibles.find((a) => a.estado === 'completado')

  const tieneHeroIniciar = Boolean(accionIniciar)
  const tieneHeroCompletar = turno?.estado === 'en_curso' && Boolean(accionCompletar)

  return (
    <Paper withBorder radius="lg" p="lg" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
      <Stack style={{ flex: 1 }} justify={turno ? 'flex-start' : 'space-between'} gap="lg">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconCalendarClock size={16} stroke={2} />
            <Text fw={700} fz="lg">
              {turno?.estado === 'en_curso' ? 'En atención' : 'Próximo turno'}
            </Text>
          </Group>
          {turno?.estado && (
            <EstadoTurnoBadge estado={turno.estado} size="sm" />
          )}
        </Group>
        <Divider />

        {turno ? (
          <>
            <Group gap="md" wrap="wrap">
              <UserAvatar
                size="xl"
                radius="100%"
                withLink={false}
                src={turno.foto_url}
                name={`${turno.nombre ?? ''} ${turno.apellido ?? ''}`.trim()}
              />
              <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} wrap="wrap">
                  <Text fw={700} fz="md">{turno.nombre} {turno.apellido}</Text>
                  {relativo && (
                    <Badge
                      variant="dot"
                      color={relativo === 'Hoy' ? 'brand' : 'gray'}
                      size="sm"
                      radius="xl"
                    >
                      {relativo}
                    </Badge>
                  )}
                </Group>
                <Group gap="md">
                  <Group gap={4}>
                    <IconClock size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                    <Text c="dimmed" fz="sm">{horaCorta(turno.hora_turno)} hs</Text>
                  </Group>
                  <Group gap={4}>
                    <IconCalendar size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                    <Text c="dimmed" fz="sm">{fechaCorta(turno.fecha_turno)}</Text>
                  </Group>
                </Group>
              </Stack>
            </Group>

            <Stack gap="sm">
              <Divider size="xs" />

              {/* Botón Hero para la acción principal */}
              {tieneHeroIniciar && (
                <Button
                  variant="light"
                  color="brand"
                  radius="md"
                  fullWidth
                  leftSection={<IconPlayerPlay size={16} />}
                  loading={acciones.cambiandoEstado}
                  onClick={() => acciones.ejecutar(turno, accionIniciar)}
                >
                  Iniciar atención
                </Button>
              )}

              {tieneHeroCompletar && (
                <Button
                  variant="light"
                  color="green"
                  radius="md"
                  fullWidth
                  leftSection={<IconCircleCheck size={16} />}
                  loading={acciones.cambiandoEstado}
                  onClick={() => acciones.ejecutar(turno, accionCompletar)}
                >
                  Finalizar consulta
                </Button>
              )}

              <Button
                variant="default"
                radius="md"
                fullWidth
                leftSection={<IconEye size={16} stroke={1.5} />}
                onClick={openDetail}
              >
                Detalle
              </Button>
            </Stack>

            <TurnoProDetailModal
              opened={detailOpened}
              onClose={closeDetail}
              onCancelRequest={() => {
                closeDetail()
                handleOpenCancel(turno)
              }}
              onReprogramar={(t) => acciones.ejecutar(t, { reprogramar: true })}
              onAbrirHistorial={(t) => acciones.abrirHistorial(t)}
              turno={turno}
            />

            <ConfirmarEstadoModal
              opened={Boolean(acciones.confirmacion)}
              confirmacion={acciones.confirmacion}
              turno={acciones.confirmacion?.turno}
              accion={acciones.confirmacion?.accion}
              onClose={acciones.cerrarConfirmacion}
              onConfirm={acciones.confirmar}
              isPending={acciones.cambiandoEstado}
            />

            <ReprogramarTurnoModal
              opened={Boolean(acciones.reprogramando)}
              turno={acciones.reprogramando}
              dniProfesional={dniProfesional}
              onClose={acciones.cerrarReprogramar}
            />

            <TurnoHistorialModal
              opened={Boolean(acciones.historialId)}
              turnoId={acciones.historialId}
              onClose={acciones.cerrarHistorial}
            />

            <CancelarTurnoProfModal
              opened={Boolean(cancelModalItem)}
              onClose={handleCloseCancel}
              onConfirm={handleConfirmCancel}
              turno={cancelModalItem}
              isPending={acciones.cancelar.isPending}
            />
          </>
        ) : (
          <Stack align="center" justify="center" gap="xs" style={{ flex: 1 }} py="xl">
            {estadoJornada === 'finalizada' ? (
              <>
                <IconCheck size={40} stroke={1.5} color="var(--mantine-color-teal-6)" />
                <Text fw={600} fz="md" ta="center">Jornada finalizada</Text>
                <Text c="dimmed" fz="sm" ta="center">No quedan más turnos pendientes por hoy.</Text>
              </>
            ) : (
              <>
                <IconCalendarOff size={40} stroke={1.5} color="var(--mantine-color-dimmed)" />
                <Text fw={600} fz="md" ta="center">Sin turnos para hoy</Text>
                <Text c="dimmed" fz="sm" ta="center">No tenés turnos programados para la fecha.</Text>
              </>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
