import { Link } from 'react-router-dom'
import {
  Alert, Anchor, Button, Center, Drawer, Group, Loader, Paper, Stack, Text, ThemeIcon,
} from '@mantine/core'
import { IconAlertCircle, IconUsers } from '@tabler/icons-react'
import { UserAvatar } from '../../../components/UserAvatar.jsx'
import { useProfesionalesCatalogo } from '../../../hooks/useAdminCatalogos.jsx'
import { CATALOGO_CONFIG } from './config.js'

export function ProfesionalesAsociadosDrawer({ opened, onClose, recurso, item }) {
  const config = CATALOGO_CONFIG[recurso]
  const { data: profesionales = [], isPending, isError, refetch } = useProfesionalesCatalogo({
    recurso,
    id: item?.id,
  })

  let contenido

  if (isPending) {
    contenido = <Center h={200}><Loader /></Center>
  } else if (isError) {
    contenido = (
      <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />} title="No pudimos cargar los profesionales">
        <Stack gap="sm" align="flex-start">
          <Text fz="sm">Probá de nuevo en unos segundos.</Text>
          <Button size="xs" variant="light" color="red" onClick={refetch}>Reintentar</Button>
        </Stack>
      </Alert>
    )
  } else if (profesionales.length === 0) {
    contenido = (
      <Center h={220}>
        <Stack align="center" gap="xs">
          <ThemeIcon size={48} radius="xl" variant="light"><IconUsers size={26} /></ThemeIcon>
          <Text c="dimmed" ta="center">
            Ningún profesional tiene esta {config.singular} asociada.
          </Text>
        </Stack>
      </Center>
    )
  } else {
    contenido = (
      <Stack gap="sm">
        {profesionales.map((profesional) => {
          const nombre = `${profesional.nombre ?? ''} ${profesional.apellido ?? ''}`.trim()

          return (
            <Anchor
              key={profesional.dni}
              component={Link}
              to={`/admin/usuarios/${profesional.dni}/profesional`}
              underline="never"
              c="inherit"
              onClick={onClose}
            >
              <Paper withBorder radius="md" p="sm">
                <Group gap="sm" wrap="nowrap">
                  <UserAvatar size={32} withLink={false} src={profesional.foto_url} name={nombre} />
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Text fw={500} fz="sm" lineClamp={1}>{nombre}</Text>
                    <Text fz="xs" c="dimmed">Mat. {profesional.numero_matricula}</Text>
                  </Stack>
                </Group>
              </Paper>
            </Anchor>
          )
        })}
      </Stack>
    )
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="md"
      title={item ? `Profesionales — ${item.nombre}` : 'Profesionales'}
      padding="md"
    >
      {contenido}
    </Drawer>
  )
}
