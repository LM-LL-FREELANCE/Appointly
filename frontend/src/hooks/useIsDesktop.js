import { useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

/**
 * Devuelve true cuando el viewport alcanza el breakpoint indicado (min-width).
 * Lee el valor desde theme.breakpoints en vez de tener el media query
 * hardcodeado en cada página, así solo hay un lugar para ajustar el corte.
 *
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} breakpoint - key de theme.breakpoints (default 'md')
 */
export function useIsDesktop(breakpoint = 'md') {
  const theme = useMantineTheme()
  return useMediaQuery(`(min-width: ${theme.breakpoints[breakpoint]})`)
}
