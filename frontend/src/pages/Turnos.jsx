import { useState } from 'react'
import { Alert, Stack, Button, Box, Group } from '@mantine/core'
import { PageHeader } from '../components/PageHeader.jsx'
import { useLocation, useNavigate } from 'react-router-dom'
import { useIsDesktop } from '../hooks/useIsDesktop.js'
import TurnosTableProf from './turnos/TurnosTableProf.jsx'
import { TurnoCardProf } from './turnos/TurnoCardProf.jsx'
import { DetalleTurnoProfMobile } from './turnos/DetalleTurnoProfMobile.jsx'

export default function Turnos() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  const fecha = state?.fecha ?? null
  const dniProfesional = state?.dni_profesional ?? null
  // Los turnos llegan como snapshot del state (no hay query en esta página),
  // así que los guardamos en estado local para poder reflejar una cancelación.
  const [turnos, setTurnos] = useState(state?.turnos ?? [])
  // Turno seleccionado para ver el detalle en mobile (in-page, sin cambiar de ruta).
  const [detalle, setDetalle] = useState(null)

  const marcarCancelado = (id_turno) =>
    setTurnos((prev) => prev.map((t) => (t.id_turno === id_turno ? { ...t, estado: 'cancelado' } : t)))

  if (turnos.length === 0 && !fecha) {
    return (
      <>
        <PageHeader title="Turnos" />
        <Stack gap="md" align="center" maw={420} mx="auto" mt="xl">
          <Alert color="red">
            No ha seleccionado la fecha de los turnos del dia que quiere ver. Por favor, aprete el boton "Volver a agenda" y lo redigira a la agenda para que pueda seleccionar la fecha de los turnos del dia que quiere ver.
          </Alert>
          <Button onClick={() => navigate('/agenda')}>Volver a agenda</Button>
        </Stack>
      </>
    )
  }

  return (
    <>
      <PageHeader title={`Turnos del ${fecha}`} />

      {turnos.length === 0 ? (
        <Alert color="blue" mt="md">No hay turnos para este día.</Alert>
      ) : (
        <>
          {/* Desktop: tabla */}
          {isDesktop ? (
            <Box px={{ base: 0, md: 'xl' }}>
              <TurnosTableProf
                turnos={turnos}
                dniProfesional={dniProfesional}
                onCancelled={marcarCancelado}
              />
            </Box>
          ) : detalle ? (
            <DetalleTurnoProfMobile
              turno={detalle}
              dniProfesional={dniProfesional}
              onVolver={() => setDetalle(null)}
              onCancelled={marcarCancelado}
            />
          ) : (
            <Stack gap="sm" pb={10}>
              {turnos.map((turno) => (
                <TurnoCardProf key={turno.id_turno} turno={turno} onVerDetalle={setDetalle} />
              ))}
            </Stack>
          )}

          <Group justify="end" mt="md" mx="lg">
            <Button onClick={() => navigate('/agenda')}>
              Volver a agenda
            </Button>
          </Group>
        </>
      )}
    </>
  )
}
