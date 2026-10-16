import { useState } from 'react'
import { Box, Button, Divider, Drawer, Grid, Group, Paper, Stack, Text, Textarea } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconAlertCircle, IconHistory } from '@tabler/icons-react'
import { fechaCorta, horaCorta } from '../../utils/fechas.utils.js'
import { EstadoTurnoBadge } from '../../components/EstadoTurnoBadge.jsx'
import { accionesProfesional, claveAccion } from '../../utils/estadosTurno.js'
import { ConfirmarEstadoModal } from './ConfirmarEstadoModal.jsx'
import { TurnoHistorialModal } from './TurnoHistorialModal.jsx'
import { ReprogramarTurnoModal } from './ReprogramarTurnoModal.jsx'
import { useAccionesTurnoProf } from './useAccionesTurnoProf.js'

function DetailRow({ label, children }) {
  return (
    <>
      <Grid py="md" align="center">
        <Grid.Col span={5}>
          <Text fz="sm" c="dimmed">{label}</Text>
        </Grid.Col>
        <Grid.Col span={7}>
          {children}
        </Grid.Col>
      </Grid>
      <Divider />
    </>
  )
}

// Detalle de UN turno para mobile. Adaptado del detalle del cliente:
// muestra el PACIENTE, las acciones de atención del profesional, el historial y la
// cancelación, y "Atrás" vuelve a la lista (in-page) en vez de navegar a otra ruta.
// `turno` viene siempre de la query del día, así que refleja el estado actualizado.
export function DetalleTurnoProfMobile({ turno, ahora, dniProfesional, onVolver }) {
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)
  const [motivo, setMotivo] = useState('')
  const acciones = useAccionesTurnoProf()
  const { mutate: cancelar, isPending } = acciones.cancelar

  const confirmarCancelacion = () =>
    cancelar({ id: turno.id_turno, motivo: motivo.trim() }, {
      onSuccess: () => {
        closeDrawer()
        onVolver()
      },
    })

  return (
    <>
      <Stack gap="md">
        <Paper withBorder radius="lg" px="md" pt="xs" pb={0}>
          <DetailRow label="Paciente">
            <Text fz="md" fw={600}>{turno.nombre} {turno.apellido}</Text>
          </DetailRow>
          <DetailRow label="Fecha">
            <Text fz="md" fw={600}>{fechaCorta(turno.fecha_turno)}</Text>
          </DetailRow>
          <DetailRow label="Hora">
            <Text fz="md" fw={600}>{horaCorta(turno.hora_turno)} hs</Text>
          </DetailRow>
          <DetailRow label="Estado">
            <EstadoTurnoBadge estado={turno.estado} />
          </DetailRow>
        </Paper>

        {accionesProfesional(turno, ahora).map((accion) => accion.cancelar ? (
          <Button key="cancelar" variant="light" color="red" size="md" radius="md" fullWidth onClick={openDrawer}>
            {accion.label}
          </Button>
        ) : (
          <Button
            key={claveAccion(accion)}
            size="md"
            variant={accion.reprogramar ? 'light' : 'filled'}
            radius="md"
            fullWidth
            loading={acciones.cambiandoEstado}
            onClick={() => acciones.ejecutar(turno, accion)}
          >
            {accion.label}
          </Button>
        ))}

        <Button
          variant="default"
          size="md"
          radius="md"
          leftSection={<IconHistory size={16} />}
          onClick={() => acciones.abrirHistorial(turno)}
        >
          Ver historial
        </Button>

        <Button variant="default" color="gray" size="md" radius="md" onClick={onVolver}>
          Atrás
        </Button>
      </Stack>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        position="bottom"
        withCloseButton={false}
        radius="lg"
        size="50%"
        overlayProps={{ backgroundOpacity: 0.3 }}
        styles={{ body: { padding: 0 } }}
      >
        <Box px="lg" pt="lg" pb="md">
          <Group gap="sm" mb="xs" align="center" wrap="nowrap">
            <IconAlertCircle size={28} color="var(--mantine-color-red-5)" style={{ flexShrink: 0 }} />
            <Text fw={700} fz="xl">¿Cancelar turno?</Text>
          </Group>
          <Text c="dimmed" fz="sm" lh={1.6} mb="md">
            {fechaCorta(turno.fecha_turno)} · {horaCorta(turno.hora_turno)} · {turno.nombre} {turno.apellido}.{' '}
            Se le avisará al paciente por email.
          </Text>
          <Textarea
            label="Motivo (opcional)"
            placeholder="Se lo incluirá en el email al paciente"
            value={motivo}
            onChange={(e) => setMotivo(e.currentTarget.value)}
            autosize
            minRows={2}
            maxRows={4}
            disabled={isPending}
          />
        </Box>
        <Box px="lg" pb="xl">
          <Stack gap="sm">
            <Button fullWidth variant="light" color="red" size="md" radius="xl" onClick={confirmarCancelacion} loading={isPending}>
              Sí, cancelar
            </Button>
            <Button fullWidth variant="default" size="md" radius="xl" onClick={closeDrawer} disabled={isPending}>
              No, volver
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <ConfirmarEstadoModal
        opened={!!acciones.confirmacion}
        onClose={acciones.cerrarConfirmacion}
        onConfirm={acciones.confirmar}
        turno={acciones.confirmacion?.turno}
        accion={acciones.confirmacion?.accion}
        isPending={acciones.cambiandoEstado}
      />

      <ReprogramarTurnoModal
        opened={!!acciones.reprogramando}
        onClose={acciones.cerrarReprogramar}
        turno={acciones.reprogramando}
        dniProfesional={dniProfesional}
        ahora={ahora}
      />

      <TurnoHistorialModal
        opened={acciones.historialId !== null}
        onClose={acciones.cerrarHistorial}
        turnoId={acciones.historialId}
      />
    </>
  )
}
