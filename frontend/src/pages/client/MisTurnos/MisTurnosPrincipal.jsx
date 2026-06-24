import { useState } from "react"
import { useLocation } from "react-router-dom"
import { PageHeader } from "../../../components/PageHeader.jsx"
import { Text, Stack, Group, Avatar, SegmentedControl, Box, Alert, Loader } from "@mantine/core"
import { TurnoCard } from "./TurnoCard.jsx"
import TurnosTable from "./TurnosTable.jsx"
import { useQuery } from "@tanstack/react-query"
import { getTurnosClienteByDni } from "../../../services/clientes.js"


const DNI = '25890123'
/* 25890123 activo */
/* 22456789 cancelado */

export default function MisTurnos() {

  const { state } = useLocation()
  const [estado, setEstado] = useState(state?.tab ?? 'activo')

  const { data: [activos, pasados] = [[], []], isPending, isError } = useQuery({
    queryKey: ['turnos', DNI],
    queryFn: () => getTurnosClienteByDni({ dni: DNI, rol: 'cliente', estado: estado }),
    select: (data) => {
      const now = new Date();
      return data.reduce(
        ([activos, pasados], t) => {
          const baseDate = new Date(t.fecha_turno);
          const [h, m] = t.hora_turno.split(':');
          const turnoDate = new Date(
            baseDate.getUTCFullYear(),
            baseDate.getUTCMonth(),
            baseDate.getUTCDate(),
            +h, +m
          );

          const mapped = {
            ...t,
            fecha_turno: baseDate.toLocaleDateString('es-AR', {
              timeZone: 'UTC',
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            }),
            hora_turno: t.hora_turno.slice(0, 5),
          };

          if (t.estado === 'cancelado' || turnoDate < now) {
            const estado = t.estado === 'cancelado' ? 'cancelado' : 'completado';
            return [activos, [...pasados, { ...mapped, estado }]];
          }

          return [[...activos, mapped], pasados];
        },
        [[], []]
      );
    }
  });

  return (
    <>
      <PageHeader>
        <Group justify="space-between" style={{ flex: 1 }}>
          <Stack gap={0}>
            <Text fw={600} fz={{ base: 'xl', sm: 'lg' }}>Mis Turnos</Text>
          </Stack>
          <Group>
            <SegmentedControl visibleFrom="md" size="md" radius="lg" value={estado} onChange={setEstado} data={[{ label: 'Próximos', value: 'activo' }, { label: 'Historial', value: 'cancelado' }]} disabled={isPending} />
            <Avatar radius="xl" alt="" /* component={Link} */ to="/user" />
          </Group>
        </Group>
      </PageHeader>

      {isPending && (
        <Group justify="center" mt="xl">
          <Loader />
        </Group>
      )}

      {isError && (
        <Alert color="red" mt="md">
          Error al cargar los turnos
        </Alert>
      )}

      {!isPending && !isError && (
        <>
          <Box px={{ base: 0, md: 'xl' }} visibleFrom="md">
            {estado === 'activo' ? (
              <TurnosTable turno={activos} dni={DNI} />
            ) : (
              <TurnosTable turno={pasados} dni={DNI} />
            )}
          </Box>

          <Stack gap="sm" pb={10} hiddenFrom="md">
            <SegmentedControl fullWidth size="xl" radius="lg" value={estado} onChange={setEstado} data={[{ label: 'Próximos', value: 'activo' }, { label: 'Historial', value: 'cancelado' }]} />
            {(estado === 'activo' ? activos : pasados).map((turno) => (
              <TurnoCard key={turno.id_turno} turno={turno} estado={estado} />
            ))}
          </Stack>
        </>
      )}
    </>
  )
}