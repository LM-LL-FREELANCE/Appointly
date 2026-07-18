import { Burger } from '@mantine/core'
import { useSidebar } from '../hooks/useSidebar.js'

export function SidebarBurger() {
  const { mobileOpened, toggleMobile, desktopOpened, toggleDesktop } = useSidebar()
  return (
    <>
      <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="md" size="md"
        styles={{ root: { width: 44, height: 44 } }} />
      <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="md" size="sm"
        styles={{ root: { width: 44, height: 44 } }} />
    </>
  )
}
