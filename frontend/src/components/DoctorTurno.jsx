import { useNavigate } from "react-router-dom";
import { Card, Stack, Text, Badge, Group, Image, Anchor, Box } from "@mantine/core";

export default function DoctorTurno({ doctor }) {
  const navigate = useNavigate();
  const { nombre, apellido, especialidades = [], obrasSociales = [], foto } = doctor;

  return (
    <Card withBorder radius="md" padding="md" h="100%">
      <Stack gap="sm">
        {foto ? (
          <Image src={foto} height={140} radius="sm" alt={`${nombre} ${apellido}`} />
        ) : (
          <Box
            h={140}
            style={{
              borderRadius: "var(--mantine-radius-sm)",
              background:
                "repeating-linear-gradient(45deg, #e9ecef, #e9ecef 10px, #f1f3f5 10px, #f1f3f5 20px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text size="sm" c="dimmed">foto del doctor</Text>
          </Box>
        )}

        <Stack gap={4}>
          <Text fw={700}>{`${nombre} ${apellido}`}</Text>
          <Text size="sm" c="dimmed">
            {especialidades.join(" · ")}
          </Text>
        </Stack>

        {obrasSociales.length > 0 && (
          <Group gap="xs">
            {obrasSociales.map((os) => (
              <Badge key={os} variant="outline" color="gray" radius="xl">
                {os}
              </Badge>
            ))}
          </Group>
        )}

        <Anchor
          size="sm"
          ta="center"
          onClick={() => navigate("/buscar")}
          style={{ cursor: "pointer" }}
        >
          ← Cambiar profesional
        </Anchor>
      </Stack>
    </Card>
  );
}
