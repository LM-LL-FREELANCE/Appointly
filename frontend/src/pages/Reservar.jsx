import { PageHeader } from "../components/PageHeader";
import { Text, Stack, Group, Avatar, Title, Paper, Button, Stepper, Grid, Divider, Loader } from "@mantine/core";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMediaQuery } from "@mantine/hooks";
import { DatePickerInput } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import useSlots from "../hooks/useSlots";
import DoctorTurno from "../components/DoctorTurno";
import SlotBox from "../components/SlotBox";
import { rangoSemana, aISO } from "../utils/fechas.utils";

const Reservar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const doctor = location.state?.doctor;
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const { desde, hasta } = rangoSemana(fechaSeleccionada);
  const { data: slotData, isLoading } = useSlots({
    dni: doctor?.dni_profesional,
    desde,
    hasta,
  });
  console.log(slotData)
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [active, setActive] = useState(doctor ? 1 : 0);
  const nextStep = () => setActive((current) => (current < 3 ? current + 1 : current));

  const diaData = slotData?.dias?.find((d) => d.fecha === aISO(fechaSeleccionada));
  const slotsHoy = diaData?.slots || [];

  const formatFecha = (date) => dayjs(date).locale("es").format("ddd D MMM");

  const handleFechaChange = (date) => {
    if (date) {
      setFechaSeleccionada(new Date(date));
      setSlotSeleccionado(null);
    }
  };

  const especialidad = Array.isArray(doctor?.especialidades)
    ? doctor.especialidades[0]
    : doctor?.especialidades;

  return (
    <Stack gap="md">
      <PageHeader>
        <Group align="baseline" gap="xs">
          <Text fw={600} size="lg">Reservar turno</Text>
          {doctor && (
            <Text fw={400} c="dimmed" size="md">
              {`${doctor.nombre} ${doctor.apellido} · ${especialidad}`}
            </Text>
          )}
        </Group>
      </PageHeader>

      <Paper withBorder p="md" radius="md">
        <Stepper
          active={active}
          onStepClick={(step) => {
            if (!doctor && step > 0) return;
            setActive(step);
          }}
          orientation={isMobile ? "vertical" : "horizontal"}
          w="100%"
        >
          <Stepper.Step label="Profesional" description="elegido" />
          <Stepper.Step label="Fecha y hora" description="elegí un slot" />
          <Stepper.Step label="Confirmar" description="revisá datos" />
        </Stepper>
      </Paper>

      {!doctor ? (
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
        </Paper>
      ) : (
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
                      onSelect={setSlotSeleccionado}
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
      )}
    </Stack>
  );
};

export default Reservar;
