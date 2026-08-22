import { PageHeader } from "../components/PageHeader";
import { Text, Stack, Group, Avatar, Title, Notification, Paper, Button, Stepper, Grid, Divider, Loader } from "@mantine/core";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsDesktop } from "../hooks/useIsDesktop.js";
import { DatePickerInput } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons-react";
import 'dayjs/locale/es';
import useSlots from "../hooks/useSlots";
import DoctorTurno from "../components/DoctorTurno";
import SlotBox from "../components/SlotBox";
import { rangoSemana, aISO } from "../utils/fechas.utils";
import { TableConfirmarTurno } from "../components/TableConfirmarTurno";
import useCreateTurno from "../hooks/useCrearTurno";
import { IconCircleDashedCheck } from '@tabler/icons-react';



const Reservar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const doctor = location.state?.doctor;
  const isDesktop = useIsDesktop('sm');
  const [obraSocial] = useState("OSDE")
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const { desde, hasta } = rangoSemana(fechaSeleccionada);
  const { data: slotData, isLoading } = useSlots({
    dni: doctor?.dni_profesional,
    desde,
    hasta,
  });
  const [active, setActive] = useState(doctor ? 1 : 0);
  const nextStep = () => setActive((current) => (current < 3 ? current + 1 : current));
  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  const diaData = slotData?.dias?.find((d) => d.fecha === aISO(fechaSeleccionada));
  const slotsHoy = diaData?.slots || [];

  const formatFecha = (date) => {
    return new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" }).format(date);
  };

  const handleFechaChange = (value) => {
    if (value) {
      // Mantine v9 entrega un string 'YYYY-MM-DD'. Lo construimos como fecha
      // LOCAL (no con new Date(string), que lo interpreta en UTC y corre el día).
      const [anio, mes, dia] = value.split('-').map(Number);
      const newDate = new Date(anio, mes - 1, dia, 12, 0, 0, 0);

      setFechaSeleccionada(newDate);
      setSlotSeleccionado(null);
      reset();
    }
  };

  const [turnoConfirmado, setTurnoConfirmado] = useState(false)
  /* const [userClient, setUserClient] = useState(25890123) */
  const { mutate, isPending, error: errorTurno, reset } = useCreateTurno()
  const confirmTurno = () => {
    mutate({
      dni_profesional: doctor.dni_profesional,
      fecha_turno: aISO(fechaSeleccionada),
      hora_turno: slotSeleccionado,
      /* userDni: userClient,
      userRol: 'cliente', */
    }, {
      onSuccess: () => {
        setTurnoConfirmado(true)
      }
    })
  }
  const onVolverReservar = () => {
    setTurnoConfirmado(false)
    setActive(doctor ? 1 : 0)
    setSlotSeleccionado(null)
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    setFechaSeleccionada(d)
    navigate("/buscar")
  }

  const especialidad = Array.isArray(doctor?.especialidades)
    ? doctor.especialidades[0]
    : doctor?.especialidades;

  return (
    <>
      <PageHeader
        title="Reservar turno"
        subtitle={doctor ? `${doctor.nombre} ${doctor.apellido} · ${especialidad}` : undefined}
      />
      {!turnoConfirmado && (
        <Stack gap="md">

          <Paper withBorder p="md" radius="md">
            <Stepper
              active={active}
              orientation={isDesktop ? "horizontal" : "vertical"}
              w="100%"
            >
              <Stepper.Step label="Profesional" description={doctor ? "elegido" : "eligir uno"} />
              <Stepper.Step label="Fecha y hora" description={slotSeleccionado ? "Fecha y hora elegida" : "Elige una fecha y hora"} />
              <Stepper.Step label="Confirmar" description="revisá datos" />
            </Stepper>
          </Paper>
          {!doctor && (
            <Paper withBorder radius="md" p="xl">
              <Stack align="center" gap="sm" py="xl">
                <Avatar size={64} radius="md" color="gray" />
                <Title order={4} fw={500}>Todavía no elegiste un profesional</Title>
                <Text c="dimmed" size="sm" ta="center" maw={420}>
                  El primer paso es elegir con quién querés atenderte. Después vas a ver sus horarios disponibles.
                </Text>
                <Button mt="xs" onClick={() => navigate("/buscar")}>
                  Buscar doctores →
                </Button>
              </Stack>
            </Paper>)}
          {active === 1 && (
            <>
              <Grid align="stretch" gutter="md">
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <DoctorTurno doctor={doctor} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 9 }}>
                  <Paper
                    withBorder
                    radius="md"
                    p="md"
                    h="100%"
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <Stack gap="md" style={{ flex: 1 }}>
                      <Group justify="space-between" align="center">
                        <Title order={4} fw={600}>Elegí fecha y horario</Title>
                        <DatePickerInput
                          locale="es"
                          value={fechaSeleccionada}
                          onChange={handleFechaChange}
                          valueFormat="ddd D MMM"
                          rightSection={<IconCalendar size={16} />}
                          w={145}
                          allowDeselect={false}
                          minDate={new Date()}
                        />
                      </Group>
                      <Divider />
                      {isLoading ? (
                        <Loader size="sm" />
                      ) : (
                        <Stack gap="sm">
                          <Text fw={500} size="sm">
                            Horarios disponibles — {formatFecha(fechaSeleccionada)}
                          </Text>
                          <SlotBox
                            slots={slotsHoy}
                            seleccionado={slotSeleccionado}
                            onSelect={(slot) => { setSlotSeleccionado(slot); reset(); }}
                          />
                        </Stack>
                      )}
                    </Stack>
                    <Divider mt="md" />
                    <Group justify="space-between" pt="md">
                      <Text size="sm" c="dimmed">
                        {slotSeleccionado
                          ? `Seleccionado: ${formatFecha(fechaSeleccionada)} · ${slotSeleccionado}`
                          : "Ningún horario seleccionado"}
                      </Text>
                      <Button disabled={!slotSeleccionado} onClick={nextStep}>
                        Continuar →
                      </Button>
                    </Group>
                  </Paper>
                </Grid.Col>
              </Grid>
            </>
          )}
          {active === 2 && (
            <>
              <Paper withBorder radius="md" p="xl" maw={500} mx="auto">
                <Text fw={600} size="md" mb="md">Confirmá tu turno</Text>
                <TableConfirmarTurno data={[
                  { etiqueta: "Profesional", valor: `${doctor.nombre} ${doctor.apellido}` },
                  { etiqueta: "Especialidad", valor: doctor.especialidades },
                  { etiqueta: "Fecha", valor: formatFecha(fechaSeleccionada) },
                  { etiqueta: "Hora", valor: slotSeleccionado },
                  { etiqueta: "Obra Social", valor: obraSocial }
                ]} onVolver={isPending ? () => alert("turno siendo enviado") : () => { reset(); prevStep(); }} onConfirmar={confirmTurno} isPending={isPending} />
                {errorTurno && (
                  <Notification
                    color={errorTurno.code === 'SLOT_TAKEN' ? 'red' : 'orange'}
                    title={errorTurno.code === 'SLOT_TAKEN' ? 'Horario ocupado' : 'Error al reservar'}
                    withCloseButton={false}
                  >
                    {errorTurno.code === 'SLOT_TAKEN'
                      ? 'Ese horario se acaba de ocupar. Volvé a elegir uno.'
                      : 'Ocurrió un error inesperado. Intentá de nuevo.'}
                  </Notification>
                )}
              </Paper>
            </>
          )
          }
        </Stack >)}
      {turnoConfirmado && (
        <Stack gap="md" align="center" justify="center" h="70vh">
          <IconCircleDashedCheck stroke={1} size={100} color="#16A34A" />
          <Text fw={600} size="xl">¡Turno Reservado!</Text>
          <Text fw={400} c="dimmed" size="lg">{`${aISO(fechaSeleccionada)} · ${slotSeleccionado} · ${doctor.nombre} ${doctor.apellido} `}</Text>
          <Text fw={200} c="dimmed" size="md">Te enviamos la confirmación a tu correo</Text>
          <Group justify="space-between">
            <Button variant="default" radius="md" onClick={onVolverReservar}>
              ← Reservar Otro
            </Button>
            <Button radius="md" onClick={() => navigate("/misturnos")}>
              Ver mis turnos  →
            </Button>
          </Group>
        </Stack>
      )}
    </>
  );
};

export default Reservar;