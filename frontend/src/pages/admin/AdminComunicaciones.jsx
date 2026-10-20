import { Stack, Tabs } from '@mantine/core'
import { IconHistory, IconUser, IconUsersGroup } from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'
import { HistorialTab } from './comunicaciones/HistorialTab.jsx'
import { IndividualTab } from './comunicaciones/IndividualTab.jsx'
import { MasivoTab } from './comunicaciones/MasivoTab.jsx'

export default function AdminComunicaciones() {
  return (
    <Stack gap="lg">
      <PageHeader
        title="Comunicaciones"
        subtitle="Envía correos a una cuenta o a un segmento."
      />

      <Tabs defaultValue="individual">
        <Tabs.List mb="md">
          <Tabs.Tab value="individual" leftSection={<IconUser size={16} />}>
            Individual
          </Tabs.Tab>
          <Tabs.Tab value="masivo" leftSection={<IconUsersGroup size={16} />}>
            Masivo
          </Tabs.Tab>
          <Tabs.Tab value="historial" leftSection={<IconHistory size={16} />}>
            Historial
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="individual">
          <IndividualTab />
        </Tabs.Panel>

        <Tabs.Panel value="masivo">
          <MasivoTab />
        </Tabs.Panel>

        <Tabs.Panel value="historial">
          <HistorialTab />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
