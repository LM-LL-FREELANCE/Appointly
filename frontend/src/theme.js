// src/config/theme.js
// Tema de Appointly para Mantine v9.3.1.
// Paleta Opción A: azul profesional (#2563EB) con verde esmeralda como acento.
// Mantine deriva los modos claro/oscuro automáticamente; acá definimos la
// escala de marca y sobrescribimos las variables que la paleta exige fijar.

import { createTheme } from '@mantine/core';

export const appTheme = createTheme({
  // ── Colors ──────────────────────────────────────────────────────────
  // Mantine requiere 10 tonos por color (0 = más claro, 9 = más oscuro).
  // El índice 6 es el tono por defecto: ahí va el #2563EB de Appointly.
  // En dark mode Mantine usa por defecto el índice más claro del array,
  // lo que ya nos da el viraje a azul claro que buscábamos.
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 4 }, // light: #2563EB · dark: #3B82F6

  colors: {
    brand: [
      '#EFF6FF', // 0  blue-50   — fondos suaves, fila activa
      '#DBEAFE', // 1  blue-100
      '#BFDBFE', // 2  blue-200
      '#93C5FD', // 3  blue-300
      '#60A5FA', // 4  blue-400  — primario en dark / hover dark
      '#3B82F6', // 5  blue-500  — primario base en dark
      '#2563EB', // 6  blue-600  — PRIMARIO Appointly (light)
      '#1D4ED8', // 7  blue-700
      '#1E40AF', // 8  blue-800  — hover/active en light
      '#1E3A8A', // 9  blue-900  — soft de marca en dark
    ],
    // Acento esmeralda — usar puntualmente (disponibilidad, highlights).
    accent: [
      '#ECFDF5', // 0  emerald-50
      '#D1FAE5', // 1  emerald-100
      '#A7F3D0', // 2  emerald-200
      '#6EE7B7', // 3  emerald-300
      '#34D399', // 4  emerald-400 — acento en dark
      '#10B981', // 5  emerald-500 — ACENTO base (light)
      '#059669', // 6  emerald-600
      '#047857', // 7  emerald-700
      '#065F46', // 8  emerald-800
      '#064E3B', // 9  emerald-900 — acento soft en dark
    ],
    // Verde "éxito/confirmado" (distinto del acento esmeralda a propósito).
    green: [
      '#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80',
      '#22C55E', // 5 — confirmado en dark
      '#16A34A', // 6 — confirmado base (light)
      '#15803D', '#166534', '#14532D',
    ],
    // Ámbar "pendiente".
    yellow: [
      '#FFFBEB', '#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24',
      '#F59E0B', // 5 — pendiente en dark
      '#D97706', // 6 — pendiente base (light)
      '#B45309', '#92400E', '#78350F',
    ],
    // Rojo "cancelado/error".
    red: [
      '#FEF2F2', '#FEE2E2', '#FECACA', '#FCA5A5', '#F87171',
      '#EF4444', // 5 — error en dark
      '#DC2626', // 6 — error base (light)
      '#B91C1C', '#991B1B', '#7F1D1D',
    ],
    // Celeste "info".
    cyan: [
      '#F0F9FF', '#E0F2FE', '#BAE6FD', '#7DD3FC', '#38BDF8',
      '#0EA5E9', // 5 — info en dark
      '#0284C7', // 6 — info base (light)
      '#0369A1', '#075985', '#0C4A6E',
    ],
    // Neutros slate — reemplazan el gris por defecto de Mantine para que
    // fondos, bordes y textos coincidan con la paleta de Appointly.
    dark: [
      '#F1F5F9', // 0  texto principal en dark (slate-100)
      '#CBD5E1', // 1
      '#94A3B8', // 2  texto secundario / disabled
      '#64748B', // 3
      '#475569', // 4
      '#334155', // 5  bordes en dark (slate-700)
      '#1E293B', // 6  superficies: cards, modales (slate-800)
      '#0F172A', // 7  fondo de la app (slate-900)
      '#0B1120', // 8
      '#020617', // 9  slate-950
    ],
  },

  white: '#FFFFFF',
  black: '#0F172A',

  // ── Typography ──────────────────────────────────────────────────────
  // Para cambiar la fuente: reemplazá 'Roboto' por la familia deseada acá
  // y actualizá el <link> de Google Fonts en index.html.
  fontFamily: "'Roboto', system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontFamilyMonospace:
    "'Roboto Mono', ui-monospace, SFMono-Regular, monospace",

  // Mobile-first: base 15px para legibilidad cómoda en pantallas chicas.
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

  // ── Breakpoints ─────────────────────────────────────────────────────
  // Valores default de Mantine, explícitos para ajustarlos sin adivinar.
  breakpoints: {
    xs: '36em', // ~576px
    sm: '48em', // ~768px
    md: '62em', // ~992px
    lg: '75em', // ~1200px
    xl: '88em', // ~1408px
  },

  // ── Shape & Spacing ─────────────────────────────────────────────────
  defaultRadius: 'md', // 8px — coincide con el borderRadius del theme AntD

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

// ── CSS variables resolver ──────────────────────────────────────────────
// Fija las superficies y textos exactos de la paleta. Mantine ya vira los
// colores de marca por modo; esto ancla los neutros para que el fondo de la
// app y las superficies sean los slate elegidos y no los grises por defecto.
export const cssVariablesResolver = () => ({
  variables: {
    // Tokens compartidos por ambos modos (vacío: nada que forzar global).
  },
  light: {
    '--mantine-color-body': '#F8FAFC',        // fondo de la app
    '--mantine-color-default': '#FFFFFF',     // superficies
    '--mantine-color-default-border': '#E2E8F0',
    '--mantine-color-text': '#0F172A',
    '--mantine-color-dimmed': '#64748B',
    '--mantine-color-gray-0': '#E8EEF4',      // hover visible sobre el fondo #F8FAFC
  },
  dark: {
    '--mantine-color-body': '#0F172A',        // fondo de la app
    '--mantine-color-default': '#1E293B',     // superficies
    '--mantine-color-default-border': '#334155',
    '--mantine-color-text': '#F1F5F9',
    '--mantine-color-dimmed': '#94A3B8',
  },
});
