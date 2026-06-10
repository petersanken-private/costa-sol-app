// ════════════════════════════════════════════════════════════════════════════
// Icon — stroke-ikoner (24-viewBox, stroke 1.5, currentColor)
//
// Portade från designens AIcon (proto/a-system.jsx). Ingen extern dependency.
// Färg styrs via currentColor → sätt `color` på föräldern eller `className`.
// ════════════════════════════════════════════════════════════════════════════

export type IconName =
  | 'grid' | 'layers' | 'calendar' | 'bell' | 'receipt' | 'chart' | 'compare'
  | 'calc' | 'book' | 'search' | 'plus' | 'arrow' | 'back' | 'bed' | 'bath'
  | 'sqm' | 'pin' | 'menu' | 'close' | 'filter' | 'sort' | 'check' | 'dot'
  | 'chevron' | 'cog'
  // utökat set för innehålls-/kategori-ikoner (ersätter emoji)
  | 'home' | 'file' | 'clipboard' | 'trophy' | 'edit' | 'flag' | 'coins'
  | 'scroll' | 'building' | 'bank' | 'alert' | 'bulb' | 'users' | 'sun'
  | 'scale' | 'hammer' | 'ruler' | 'shield' | 'folder';

const PATHS: Record<IconName, string> = {
  grid:     'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  layers:   'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  calendar: 'M5 5h14v15H5zM5 9h14M9 3v4M15 3v4',
  bell:     'M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6M10 21h4',
  receipt:  'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  chart:    'M4 20V10M10 20V4M16 20v-7M22 20H2',
  compare:  'M9 4v16M4 9h5M15 4v16M15 9h5',
  calc:     'M6 3h12v18H6zM9 7h6M8 11h.5M12 11h.5M16 11h.5M8 15h.5M12 15h.5M16 15h.5',
  book:     'M5 4h11a3 3 0 013 3v13H8a3 3 0 00-3 3zM5 4v16',
  search:   'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4-4',
  plus:     'M12 5v14M5 12h14',
  arrow:    'M5 12h14M13 5l7 7-7 7',
  back:     'M19 12H5M11 19l-7-7 7-7',
  bed:      'M3 18v-7a3 3 0 013-3h12a3 3 0 013 3v7M3 14h18M7 11V8h4v3',
  bath:     'M5 12V6a2 2 0 012-2h2v3M3 12h18v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3zM7 21l-1 2M17 21l1 2',
  sqm:      'M4 4h16v16H4zM4 12h16M12 4v16',
  pin:      'M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12zM12 12a2 2 0 100-4 2 2 0 000 4z',
  menu:     'M3 6h18M3 12h18M3 18h18',
  close:    'M6 6l12 12M18 6l-12 12',
  filter:   'M3 5h18l-7 9v6l-4-2v-4z',
  sort:     'M7 4v16M7 4L4 7M7 4l3 3M17 20V4M17 20l3-3M17 20l-3-3',
  check:    'M5 12l5 5L20 7',
  dot:      'M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0',
  chevron:  'M9 6l6 6-6 6',
  cog:      'M12 8a4 4 0 100 8 4 4 0 000-8zM19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4.9a7 7 0 00-2-1.2L14 3h-4l-.5 2.5a7 7 0 00-2 1.2L5 5.8 3 9.2l2 1.6A7 7 0 005 12a7 7 0 00.1 1.2l-2 1.6 2 3.4 2.4-.9a7 7 0 002 1.2L10 21h4l.5-2.5a7 7 0 002-1.2l2.4.9 2-3.4-2-1.6c0-.4.1-.8.1-1.2z',
  home:     'M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5',
  file:     'M7 3h7l4 4v14H7zM14 3v4h4M10 13h6M10 17h5',
  clipboard:'M9 4H6v17h12V4h-3M9 3.5h6v3H9zM9 12h6M9 16h4',
  trophy:   'M8 4h8v5a4 4 0 01-8 0zM8 6H5v2a3 3 0 003 3M16 6h3v2a3 3 0 01-3 3M10 15h4v3h-4zM7 21h10',
  edit:     'M5 19l3.5-.8L20 6.7 17.3 4 5.8 15.5zM15 6l3 3',
  flag:     'M5 21V4M5 4h12l-2.5 4L17 12H5',
  coins:    'M12 5c3 0 5 .9 5 2s-2 2-5 2-5-.9-5-2 2-2 5-2zM7 7v4c0 1.1 2 2 5 2s5-.9 5-2V7M7 11v4c0 1.1 2 2 5 2s5-.9 5-2v-4',
  scroll:   'M8 4h11v13a3 3 0 01-3 3H7a2 2 0 002-2V4zM8 4a2 2 0 00-2 2v1h2M11 9h5M11 13h5',
  building: 'M5 21V6l7-3 7 3v15M4 21h16M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4',
  bank:     'M3 9l9-5 9 5M4 10h16M6 10v7M10 10v7M14 10v7M18 10v7M3 21h18',
  alert:    'M12 3l9 16H3zM12 9v5M12 17h.01',
  bulb:     'M9 17h6M10 21h4M8.5 14a5 5 0 117 0c-.9.9-1.5 1.6-1.5 3h-4c0-1.4-.6-2.1-1.5-3z',
  users:    'M16 11a3 3 0 100-6 3 3 0 000 6zM8.5 12a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20c0-3 2.9-5 6.5-5s6.5 2 6.5 5M16 15c3.3 0 6 1.8 6 5',
  sun:      'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4',
  scale:    'M12 4v17M8 21h8M6 6h12M12 4l6 2M12 4L6 6M6 6l-3 7h6zM18 6l-3 7h6z',
  hammer:   'M5 21l7.5-7.5M10 8l4-4 1.5 1.5L18 3l3 3-2.5 2.5L20 10l-4 4z',
  ruler:    'M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4',
  shield:   'M12 3l8 3v6c0 4-3.4 7-8 9-4.6-2-8-5-8-9V6zM8.5 12l2.5 2.5L16 10',
  folder:   'M3 7a1 1 0 011-1h5l2 2h8a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1z',
};

export interface IconProps {
  name:       IconName;
  size?:      number;
  className?: string;
}

export function Icon({ name, size = 17, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
