import { PageHeader } from "../components/PageHeader";
import { Stack, Title, Group, Grid, Paper, SimpleGrid, Alert, Loader, Container, Center, Text } from "@mantine/core";
import { IconAlertSquareRounded } from '@tabler/icons-react';
import { useDisclosure } from "@mantine/hooks";
import { StatCard } from "./professional/Dashboard/StatCard.jsx";
import useGetTurnosActivos from "../hooks/useGetTurnosActivos.jsx";
import useGetTurnosMes from "../hooks/useGetTurnosMes.jsx";
import { useNavigate } from "react-router-dom";
import ButtonLay from "../components/Button.jsx";
import TurnoCard from "../components/TurnoActivoCard.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { TurnoDetailModal } from "./client/MisTurnos/TurnoDetailModal.jsx";
import { CancelarTurnoModal } from "./client/MisTurnos/CancelarTurnoModal.jsx";
import useCancelTurno from "../hooks/useCancelTurno.jsx";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconSearch,
  IconCalendarPlus,
  IconCalendarEvent,
} from "@tabler/icons-react"


const PRIMARY_COL_HEIGHT = '600px';
const SECONDARY_COL_HEIGHT = `calc(${PRIMARY_COL_HEIGHT} / 2 - var(--mantine-spacing-md) / 2)`;

export default function Inicio() {
  const { user } = useAuth()
  const dni = user ? user.dni : ""
  const userName = user ? `${user.nombre} ${user.apellido}` : "invitado"
  const [detailModal, { open: openDetail, close: closeDetail }] = useDisclosure(false)
  const [cancelTurnoModal, { open: openCancel, close: closeCancel }] = useDisclosure(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: turnosHistorial, isLoading: isLoadingHistorial } = useGetTurnosActivos({ dni })
  const { data: turnosActivos, isLoading: isLoadingActivos } = useGetTurnosActivos({ dni, estado: "activo" })
  const { data: turnosMes, isLoading: isLoadingMes } = useGetTurnosMes({ dni })
  const formatedTurno = (turnosActivos || []).map(turno => ({
    ...turno,
    especialidades: turno.especialidades ? turno.especialidades.split('|') : [],
    fecha: new Date(turno.fecha_turno).toLocaleDateString('es-AR', {
      timeZone: 'UTC',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }),
  }));
  const btnData = [
    { label: "Buscar Doctores", link: () => navigate("/buscar"), type: "variant", icon: <IconSearch /> },
    { label: "Reservar Turno", link: () => navigate("/reservar"), type: "outline", icon: <IconCalendarPlus /> },
    { label: "Mis Turnos", link: () => navigate("/misturnos/*"), type: "outline", icon: <IconCalendarEvent /> },
  ]

  console.log(formatedTurno)
  const { mutate: mutateCancelTurno, isPending: isCancelling } = useCancelTurno()

  const handleCancelFromDetail = () => {
    closeDetail()
    openCancel()
  }

  const cancelTurno = () => {
    if (!turnosActivos || turnosActivos.length === 0) return;

    mutateCancelTurno({
      id: turnosActivos[0].id_turno,
      motivo: ""
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['turnos'] });
        closeCancel();
      },
      onError: (err) => {
        if (err.status === 409 && err.code === 'ALREADY_CANCELLED') {
          queryClient.invalidateQueries({ queryKey: ['turnos'] });
          closeCancel();
        }
      }
    })
  }
  return (
    <>
      <PageHeader title={`Hola, ${userName}`} />
      {!user && (
        <Center style={{ minHeight: '70vh' }}>
          <Stack align="center" gap="md">
            <Alert variant="light" color="blue" title="Bienvenido a Appointly" icon={<IconAlertSquareRounded />}>
              Debes iniciar sesion o registrarte para poder ver la informacion y poder sacar turnos en la pagina de Apointly
            </Alert>
            <ButtonLay link={() => navigate("/login")} typeColor="light" color="blue" label={"Inicia sesion aqui"} />
          </Stack>
        </Center>
      )}
      {user && (
        <>
          <Container my="lg" maw={1500}>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Paper withBorder mah={PRIMARY_COL_HEIGHT} radius="lg" py="1rem" px="lg">
                <Title size="h2">Proximo turno</Title>
                <Paper my="xl">
                  {isLoadingActivos ? (
                    <Center>
                      <Loader />
                    </Center>
                  ) : formatedTurno && formatedTurno.length > 0 ? (
                    <TurnoCard data={formatedTurno[0]} openedModal={openDetail} cancelarTurno={openCancel} />
                  ) : (
                    <Center style={{ minHeight: '40vh' }}>
                      <Stack align="center" gap="md">
                        <Text c="dimmed">No hay turnos próximos</Text>
                      </Stack>
                    </Center>
                  )}
                </Paper>
              </Paper>
              <Grid gap="md">
                <Grid.Col mah={PRIMARY_COL_HEIGHT} span={6}>
                  <StatCard height={SECONDARY_COL_HEIGHT} label={"Turnos de este mes"} value={isLoadingMes ? <Loader /> : turnosMes.data.length} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <StatCard height={SECONDARY_COL_HEIGHT} label={"Historial de turnos"} value={isLoadingHistorial ? <Loader /> : turnosHistorial.length} />
                </Grid.Col>
                <Grid.Col>
                  <Paper withBorder radius="lg" py="1rem" px="lg" h={SECONDARY_COL_HEIGHT}>
                    <Title size="h3" >Accesos Rápidos</Title>
                    <Group mt="xl" gap="lg">
                      {btnData.map((btn, index) => (
                        <ButtonLay key={index} label={btn.label} typeColor={btn.type} link={btn.link} leftSection={btn.icon} />
                      ))}
                    </Group>
                  </Paper>
                </Grid.Col>
              </Grid>
            </SimpleGrid>
          </Container>



          {detailModal && turnosActivos && turnosActivos.length > 0 && (
            <TurnoDetailModal
              opened={detailModal} onClose={closeDetail} onCancelRequest={handleCancelFromDetail}
              turno={turnosActivos[0]}
            />
          )}
          {cancelTurnoModal && turnosActivos && turnosActivos.length > 0 && (
            <CancelarTurnoModal
              opened={cancelTurnoModal}
              onClose={closeCancel}
              onConfirm={cancelTurno}
              turno={turnosActivos[0]}
              isPending={isCancelling}
            />
          )}
        </>
      )}
    </>
  )
}