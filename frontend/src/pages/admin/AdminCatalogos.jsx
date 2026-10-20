import { Tabs } from '@mantine/core'
import { IconHeartHandshake, IconStethoscope } from '@tabler/icons-react'
import { PageHeader } from '../../components/PageHeader.jsx'
import { CatalogoTabla } from './catalogos/CatalogoTabla.jsx'

export default function AdminCatalogos() {
  return (
    <>
      <PageHeader
        title="Catálogos"
        subtitle="Especialidades y obras sociales que ofrece el centro."
      />

      <Tabs defaultValue="especialidades" variant="outline" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="especialidades" leftSection={<IconStethoscope size={16} />}>
            Especialidades
          </Tabs.Tab>
          <Tabs.Tab value="obras-sociales" leftSection={<IconHeartHandshake size={16} />}>
            Obras sociales
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="especialidades">
          <CatalogoTabla recurso="especialidades" />
        </Tabs.Panel>
        <Tabs.Panel value="obras-sociales">
          <CatalogoTabla recurso="obras-sociales" />
        </Tabs.Panel>
      </Tabs>
    </>
  )
}
