import { useState } from 'react'
import { Alert, Stack, Button, Box, Group, Loader } from '@mantine/core'
import { PageHeader } from '../components/PageHeader.jsx'
import { useLocation, useNavigate } from 'react-router-dom'
import { useIsDesktop } from '../hooks/useIsDesktop.js'
import { useAuth } from '../hooks/useAuth.js'
import useTurnosDia, { useAhoraEnZona } from '../hooks/useTurnosDia.jsx'
import QueryError from '../components/QueryError.jsx'
import TurnosTableProf from './turnos/TurnosTableProf.jsx'
import { TurnoCardProf } from './turnos/TurnoCardProf.jsx'
import { DetalleTurnoProfMobile } from './turnos/DetalleTurnoProfMobile.jsx'

export default function Turnos() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const { user } = useAuth()

  const fecha = state?.fecha ?? null
  // The Agenda's snapshot only paints the first frame; the query (polling) is the source of truth.
  const { data: turnos = [], isError, error, refetch, isLoading } = useTurnosDia({
    dni: user?.dni,
    fecha,
    initialData: state?.turnos,
  })
  const ahora = useAhoraEnZona()
  // Turno seleccionado para ver el detalle en mobile (in-page, sin cambiar de ruta).
  // Guardamos solo el id y lo buscamos en la query, así el detalle refleja los datos frescos.
  const [detalleId, setDetalleId] = useState(null)
  const detalle = turnos.find((t) => t.id_turno === detalleId) ?? null

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

      {isLoading ? (
        <Group justify="center" mt="xl"><Loader /></Group>
      ) : isError && turnos.length === 0 ? (
        <QueryError message={error?.message} onRetry={refetch} />
      ) : turnos.length === 0 ? (
        <Alert color="blue" mt="md">No hay turnos para este día.</Alert>
      ) : (
        <>
          {/* Desktop: tabla */}
          {isDesktop ? (
            <Box px={{ base: 0, md: 'xl' }}>
              <TurnosTableProf turnos={turnos} ahora={ahora} />
            </Box>
          ) : detalle ? (
            <DetalleTurnoProfMobile turno={detalle} ahora={ahora} onVolver={() => setDetalleId(null)} />
          ) : (
            <Stack gap="sm" pb={10}>
              {turnos.map((turno) => (
                <TurnoCardProf key={turno.id_turno} turno={turno} onVerDetalle={(t) => setDetalleId(t.id_turno)} />
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
