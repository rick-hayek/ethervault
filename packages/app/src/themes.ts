import type { ThemeId } from '@ethervault/core';

/**
 * Theme token definition.
 * Each theme defines a complete visual identity via CSS custom property values.
 */
export interface ThemeTokens {
  // Primary color scale (CSS rgb triplets, e.g. '253 242 248')
  primary: Record<string, string>;
  // Surface backgrounds (light / dark)
  surfaceLight: string;
  surfaceDark: string;
  cardLight: string;
  cardDark: string;
  // Border radius
  radiusBase: string;
  radiusLg: string;
  radiusFull: string;
  // Typography
  fontFamily: string;
  fontWeightBase: string;
  // Shadow
  shadowColor: string;
  shadowColorDark: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  emoji: string;
  nameKey: string;       // i18n key, e.g. 'theme.kawaii.name'
  descKey: string;       // i18n key, e.g. 'theme.kawaii.desc'
  premium?: boolean;      // Whether this theme requires Premium
  // Preview swatch colors (for the picker card)
  previewColors: [string, string, string]; // 3 representative hex colors
  tokens: ThemeTokens;
}

// ─── Theme Definitions ─────────────────────────────────────────────────────────

export const THEME_DEFINITIONS: ThemeDefinition[] = [
  // ── Default (Classic) ──────────────────────────────────────────────────────
  {
    id: 'default',
    emoji: '🌙',
    nameKey: 'theme.default.name',
    descKey: 'theme.default.desc',
    premium: false,
    previewColors: ['#c0c0c0', '#495057', '#f8f9fa'],
    tokens: {
      primary: {
        '50':  '248 249 250',
        '100': '241 243 245',
        '200': '233 236 239',
        '300': '222 226 230',
        '400': '192 192 192',
        '500': '173 181 189',
        '600': '73 80 87',
        '700': '52 58 64',
        '800': '33 37 41',
        '900': '18 20 22',
      },
      surfaceLight: '248 250 252',
      surfaceDark:  '2 6 23',
      cardLight:    '255 255 255',
      cardDark:     '15 23 42',
      radiusBase:   '20px',
      radiusLg:     '2rem',
      radiusFull:   '9999px',
      fontFamily:   "'Inter', system-ui, -apple-system, sans-serif",
      fontWeightBase: '400',
      shadowColor:     'rgba(0, 0, 0, 0.08)',
      shadowColorDark: 'rgba(0, 0, 0, 0.3)',
    },
  },

  // ── Fresh (清新) ──────────────────────────────────────────────────────────
  {
    id: 'fresh',
    emoji: '🌿',
    nameKey: 'theme.fresh.name',
    descKey: 'theme.fresh.desc',
    premium: false,
    previewColors: ['#34d399', '#38bdf8', '#f0fdf4'],
    tokens: {
      primary: {
        '50':  '240 253 244',
        '100': '220 252 234',
        '200': '187 247 208',
        '300': '134 239 172',
        '400': '74 222 128',
        '500': '34 197 94',
        '600': '22 163 74',
        '700': '21 128 61',
        '800': '22 101 52',
        '900': '20 83 45',
      },
      surfaceLight: '247 254 249',
      surfaceDark:  '5 15 10',
      cardLight:    '255 255 255',
      cardDark:     '12 25 18',
      radiusBase:   '16px',
      radiusLg:     '1.5rem',
      radiusFull:   '9999px',
      fontFamily:   "'Nunito', 'DM Sans', system-ui, sans-serif",
      fontWeightBase: '400',
      shadowColor:     'rgba(34, 197, 94, 0.08)',
      shadowColorDark: 'rgba(34, 197, 94, 0.15)',
    },
  },

  // ── Kawaii (可爱) ──────────────────────────────────────────────────────────
  {
    id: 'kawaii',
    emoji: '🎀',
    nameKey: 'theme.kawaii.name',
    descKey: 'theme.kawaii.desc',
    premium: false,
    previewColors: ['#f9a8d4', '#c084fc', '#fdf2f8'],
    tokens: {
      primary: {
        '50':  '253 242 248',
        '100': '252 231 243',
        '200': '251 207 232',
        '300': '249 168 212',
        '400': '244 114 182',
        '500': '236 72 153',
        '600': '219 39 119',
        '700': '190 24 93',
        '800': '157 23 77',
        '900': '131 24 67',
      },
      surfaceLight: '255 250 253',
      surfaceDark:  '30 10 24',
      cardLight:    '255 245 250',
      cardDark:     '42 15 30',
      radiusBase:   '24px',
      radiusLg:     '2.5rem',
      radiusFull:   '9999px',
      fontFamily:   "'Quicksand', 'Nunito', system-ui, sans-serif",
      fontWeightBase: '500',
      shadowColor:     'rgba(236, 72, 153, 0.12)',
      shadowColorDark: 'rgba(236, 72, 153, 0.2)',
    },
  },

  // ── Noir (暗黑) ──────────────────────────────────────────────────────────
  {
    id: 'noir',
    emoji: '🖤',
    nameKey: 'theme.noir.name',
    descKey: 'theme.noir.desc',
    premium: false,
    previewColors: ['#fbbf24', '#1c1917', '#000000'],
    tokens: {
      primary: {
        '50':  '255 251 235',
        '100': '254 243 199',
        '200': '253 230 138',
        '300': '252 211 77',
        '400': '251 191 36',
        '500': '245 158 11',
        '600': '202 138 4',
        '700': '161 98 7',
        '800': '120 53 15',
        '900': '78 38 12',
      },
      surfaceLight: '245 245 244',
      surfaceDark:  '0 0 0',
      cardLight:    '255 255 255',
      cardDark:     '10 10 10',
      radiusBase:   '12px',
      radiusLg:     '1rem',
      radiusFull:   '9999px',
      fontFamily:   "'Inter', system-ui, -apple-system, sans-serif",
      fontWeightBase: '400',
      shadowColor:     'rgba(0, 0, 0, 0.06)',
      shadowColorDark: 'rgba(0, 0, 0, 0)',
    },
  },

  // ── Cyberpunk (朋克) ──────────────────────────────────────────────────────
  {
    id: 'cyberpunk',
    emoji: '⚡',
    nameKey: 'theme.cyberpunk.name',
    descKey: 'theme.cyberpunk.desc',
    premium: true,
    previewColors: ['#39ff14', '#a855f7', '#0a0a0a'],
    tokens: {
      primary: {
        '50':  '230 255 230',
        '100': '200 255 200',
        '200': '160 255 160',
        '300': '110 255 110',
        '400': '57 255 20',
        '500': '40 220 15',
        '600': '30 180 10',
        '700': '20 140 8',
        '800': '15 100 5',
        '900': '10 60 3',
      },
      surfaceLight: '240 245 240',
      surfaceDark:  '5 5 8',
      cardLight:    '230 240 230',
      cardDark:     '12 12 18',
      radiusBase:   '6px',
      radiusLg:     '8px',
      radiusFull:   '6px',
      fontFamily:   "'Orbitron', 'JetBrains Mono', 'Courier New', monospace",
      fontWeightBase: '500',
      shadowColor:     'rgba(57, 255, 20, 0.15)',
      shadowColorDark: 'rgba(57, 255, 20, 0.25)',
    },
  },

  // ── Steel (重金属) ──────────────────────────────────────────────────────────
  {
    id: 'steel',
    emoji: '🤘',
    nameKey: 'theme.steel.name',
    descKey: 'theme.steel.desc',
    premium: true,
    previewColors: ['#111827', '#dc2626', '#9ca3af'],
    tokens: {
      primary: {
        '50':  '254 242 242',
        '100': '254 226 226',
        '200': '252 165 165',
        '300': '248 113 113',
        '400': '239 68 68',
        '500': '220 38 38',
        '600': '185 28 28',
        '700': '153 27 27',
        '800': '127 29 29',
        '900': '69 10 10',
      },
      surfaceLight: '229 231 235',
      surfaceDark:  '12 12 14',
      cardLight:    '243 244 246',
      cardDark:     '24 24 27',
      radiusBase:   '4px',
      radiusLg:     '6px',
      radiusFull:   '4px',
      fontFamily:   "'Metal Mania', 'Impact', 'Arial Black', sans-serif",
      fontWeightBase: '700',
      shadowColor:     'rgba(220, 38, 38, 0.15)',
      shadowColorDark: 'rgba(220, 38, 38, 0.25)',
    },
  },

  // ── Retro (复古) ──────────────────────────────────────────────────────────
  {
    id: 'retro',
    emoji: '📺',
    nameKey: 'theme.retro.name',
    descKey: 'theme.retro.desc',
    premium: true,
    previewColors: ['#f59e0b', '#92400e', '#fef3c7'],
    tokens: {
      primary: {
        '50':  '255 251 235',
        '100': '254 243 199',
        '200': '253 230 138',
        '300': '252 211 77',
        '400': '251 191 36',
        '500': '245 158 11',
        '600': '217 119 6',
        '700': '180 83 9',
        '800': '146 64 14',
        '900': '120 53 4',
      },
      surfaceLight: '255 252 240',
      surfaceDark:  '18 12 6',
      cardLight:    '255 249 230',
      cardDark:     '28 20 10',
      radiusBase:   '8px',
      radiusLg:     '10px',
      radiusFull:   '8px',
      fontFamily:   "'Courier Prime', 'Courier New', monospace",
      fontWeightBase: '400',
      shadowColor:     'rgba(14, 165, 233, 0.15)',
      shadowColorDark: 'rgba(245, 158, 11, 0.12)',
    },
  },

  // ── Ocean (深海) ──────────────────────────────────────────────────────────
  {
    id: 'ocean',
    emoji: '🌊',
    nameKey: 'theme.ocean.name',
    descKey: 'theme.ocean.desc',
    premium: true,
    previewColors: ['#0ea5e9', '#0e7490', '#0c4a6e'],
    tokens: {
      primary: {
        '50':  '240 249 255',
        '100': '224 242 254',
        '200': '186 230 253',
        '300': '125 211 252',
        '400': '56 189 248',
        '500': '14 165 233',
        '600': '2 132 199',
        '700': '3 105 161',
        '800': '7 89 133',
        '900': '12 74 110',
      },
      surfaceLight: '245 250 255',
      surfaceDark:  '3 8 18',
      cardLight:    '250 253 255',
      cardDark:     '8 15 30',
      radiusBase:   '14px',
      radiusLg:     '1.25rem',
      radiusFull:   '9999px',
      fontFamily:   "'DM Sans', 'Inter', system-ui, sans-serif",
      fontWeightBase: '400',
      shadowColor:     'rgba(14, 165, 233, 0.1)',
      shadowColorDark: 'rgba(14, 165, 233, 0.18)',
    },
  },
];

/**
 * Get a theme definition by ID.
 * Falls back to 'default' if not found.
 */
export function getThemeById(id: ThemeId): ThemeDefinition {
  return THEME_DEFINITIONS.find(t => t.id === id) ?? THEME_DEFINITIONS[0];
}

/**
 * Map old themeColor values to the closest ThemeId for migration.
 */
export function migrateThemeColor(color: string): ThemeId {
  const mapping: Record<string, ThemeId> = {
    'silver':    'default',
    'lightgrey': 'default',
    'blue':      'ocean',
    'emerald':   'fresh',
    'violet':    'default',
    'amber':     'retro',
    'rose':      'kawaii',
    'pink':      'kawaii',
    'ivory':     'retro',
  };
  return mapping[color] ?? 'default';
}
