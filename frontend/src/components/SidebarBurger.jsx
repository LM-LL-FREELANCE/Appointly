import { Burger } from '@mantine/core'
import { useSidebar } from '../hooks/useSidebar.js'

export function SidebarBurger() {
  const { mobileOpened, toggleMobile, desktopOpened, toggleDesktop } = useSidebar()
  return (
    <>
      <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="md" />
      <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
    </>
  )
}
