import { createTheme } from '@mantine/core';

export const appTheme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 4 },

  colors: {
    brand: [
      '#EFF6FF',
      '#DBEAFE',
      '#BFDBFE',
      '#93C5FD',
      '#60A5FA',
      '#3B82F6',
      '#2563EB', // light primary
      '#1D4ED8',
      '#1E40AF',
      '#1E3A8A',
    ],
    accent: [
      '#ECFDF5',
      '#D1FAE5',
      '#A7F3D0',
      '#6EE7B7',
      '#34D399',
      '#10B981',
      '#059669',
      '#047857',
      '#065F46',
      '#064E3B',
    ],
    green: [
      '#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80',
      '#22C55E',
      '#16A34A',
      '#15803D', '#166534', '#14532D',
    ],
    yellow: [
      '#FFFBEB', '#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24',
      '#F59E0B',
      '#D97706',
      '#B45309', '#92400E', '#78350F',
    ],
    red: [
      '#FEF2F2', '#FEE2E2', '#FECACA', '#FCA5A5', '#F87171',
      '#EF4444',
      '#DC2626',
      '#B91C1C', '#991B1B', '#7F1D1D',
    ],
    cyan: [
      '#F0F9FF', '#E0F2FE', '#BAE6FD', '#7DD3FC', '#38BDF8',
      '#0EA5E9',
      '#0284C7',
      '#0369A1', '#075985', '#0C4A6E',
    ],
    dark: [
      '#F1F5F9',
      '#CBD5E1',
      '#94A3B8',
      '#64748B',
      '#475569',
      '#334155',
      '#1E293B',
      '#0F172A',
      '#0B1120',
      '#020617',
    ],
  },

  white: '#FFFFFF',
  black: '#0F172A',

  fontFamily: "'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontFamilyMonospace: "'Roboto Mono', ui-monospace, SFMono-Regular, monospace",

  fontSizes: {
    xs: '12px',
    sm: '13px',
    md: '15px',
    lg: '17px',
    xl: '20px',
  },

  headings: {
    fontFamily: "'Roboto', system-ui, sans-serif",
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '24px', lineHeight: '1.3' },
      h2: { fontSize: '20px', lineHeight: '1.35' },
      h3: { fontSize: '18px', lineHeight: '1.4' },
      h4: { fontSize: '16px', lineHeight: '1.45' },
    },
  },

  lineHeights: {
    xs: '1.4',
    sm: '1.45',
    md: '1.55',
    lg: '1.6',
    xl: '1.65',
  },

  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
  },

  defaultRadius: 'md',

  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },

  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
});

export const cssVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': '#F8FAFC',
    '--mantine-color-default': '#FFFFFF',
    '--mantine-color-default-border': '#E2E8F0',
    '--mantine-color-text': '#0F172A',
    '--mantine-color-dimmed': '#64748B',
    '--mantine-color-gray-0': '#E8EEF4',
  },
  dark: {
    '--mantine-color-body': '#0F172A',
    '--mantine-color-default': '#1E293B',
    '--mantine-color-default-border': '#334155',
    '--mantine-color-text': '#F1F5F9',
    '--mantine-color-dimmed': '#94A3B8',
  },
});
