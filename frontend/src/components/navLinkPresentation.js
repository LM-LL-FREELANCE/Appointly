export const navLinkStyles = {
  root: {
    padding: '11px var(--mantine-spacing-sm)',
    borderRadius: 'var(--mantine-radius-sm)',
    '&:hover': {
      backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
      color: 'light-dark(var(--mantine-color-black), var(--mantine-color-white))',
    },
  },
  label: { fontSize: 'var(--mantine-font-size-md)' },
}

export const navLinkClassName = ''

export const navLinkLogoutClassName =
  'text-[light-dark(var(--mantine-color-red-7),var(--mantine-color-red-4))] ' +
  'hover:bg-[var(--mantine-color-red-light)] hover:text-[var(--mantine-color-red-light-color)]'
