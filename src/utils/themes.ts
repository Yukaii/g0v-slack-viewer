export type AppThemeId = 'g0v-light' | 'g0v-dark' | 'g0v-jothon' | 'slack-classic';

export interface AppThemeMeta {
  id: AppThemeId;
  name: string;
  subtitle: string;
  isDark: boolean;
  swatchSidebar: string;
  swatchAccent: string;
  swatchBg: string;
}

export const APP_THEMES: AppThemeMeta[] = [
  {
    id: 'g0v-light',
    name: 'g0v Civic',
    subtitle: 'Carbon ink & g0v crimson',
    isDark: false,
    swatchSidebar: '#18181b',
    swatchAccent: '#c8161d',
    swatchBg: '#ffffff',
  },
  {
    id: 'g0v-dark',
    name: 'g0v Night',
    subtitle: 'Obsidian hacker dark mode',
    isDark: true,
    swatchSidebar: '#111114',
    swatchAccent: '#ef4444',
    swatchBg: '#16161a',
  },
  {
    id: 'g0v-jothon',
    name: 'g0v Jothon',
    subtitle: 'Summit jade & warm paper',
    isDark: false,
    swatchSidebar: '#0f292e',
    swatchAccent: '#c8161d',
    swatchBg: '#faf8f4',
  },
  {
    id: 'slack-classic',
    name: 'Slack Classic',
    subtitle: 'Traditional aubergine & blue',
    isDark: false,
    swatchSidebar: '#3f0e40',
    swatchAccent: '#1164a3',
    swatchBg: '#ffffff',
  },
];

export function getThemeMeta(id: AppThemeId): AppThemeMeta {
  return APP_THEMES.find((t) => t.id === id) ?? APP_THEMES[0];
}
