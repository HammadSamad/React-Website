/* Line-icon set — 24×24, stroke = currentColor. Elegant, consistent weight. */

const P = {
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'M6 6l12 12M18 6L6 18',
  arrowRight: 'M4 12h16M14 6l6 6-6 6',
  arrowLeft: 'M20 12H4M10 6l-6 6 6 6',
  arrowUpRight: 'M7 17L17 7M8 7h9v9',
  chevronDown: 'M5 9l7 7 7-7',
  chevronRight: 'M9 5l7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M4 12l5 5L20 6',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z',
  bed: 'M3 7v10M3 12h18v5M21 12v-1a3 3 0 0 0-3-3H9v4',
  users: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17 4.5a3 3 0 0 1 0 6M22 20v-1a4 4 0 0 0-3-3.8',
  ruler: 'M4 16.5L16.5 4l3.5 3.5L7.5 20zM8 8l2 2M11 5l2 2M5 11l2 2',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  calendar: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 9h16M8 3v4M16 3v4',
  sparkles: 'M12 3l1.8 4.6L18.5 9.4 13.8 11 12 15.6 10.2 11 5.5 9.4 10.2 7.6zM18 15l.9 2.3 2.3.9-2.3.9L18 21.4l-.9-2.3-2.3-.9 2.3-.9z',
  waves: 'M2 8c2 0 2 1.5 4 1.5S8 8 10 8s2 1.5 4 1.5S16 8 18 8s2 1.5 4 1.5M2 14c2 0 2 1.5 4 1.5S8 14 10 14s2 1.5 4 1.5S16 14 18 14s2 1.5 4 1.5',
  dining: 'M6 3v7a2 2 0 0 0 2 2v9M6 3v4M9 3v4M18 3s2 1 2 5-2 4-2 4v9',
  glass: 'M6 3h12l-1 6a5 5 0 0 1-10 0zM12 15v5M8 20h8',
  fitness: 'M6.5 6.5l11 11M4 9l2-2 3 3-2 2zM15 20l2-2-3-3-2 2zM3 12l1-1M20 13l1-1',
  phone: 'M5 4h4l1.5 5-2 1.5a11 11 0 0 0 5 5l1.5-2 5 1.5v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z',
  mail: 'M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 7l9 6 9-6',
  mapPin: 'M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  bell: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 21h4',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.2A1.6 1.6 0 0 0 7 19.3a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.2A1.6 1.6 0 0 0 4.7 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V1a2 2 0 0 1 4 0v.2A1.6 1.6 0 0 0 17 4.7a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-1.1 2.7H23a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M4 12h11',
  dashboard: 'M4 13h6V4H4zM14 9h6V4h-6zM14 20h6v-9h-6zM4 20h6v-5H4z',
  door: 'M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M14 12h.01',
  clipboard: 'M9 4h6v3H9zM9 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3M9 12h6M9 16h4',
  receipt: 'M5 3l1.5 1.5L8 3l1.5 1.5L11 3l1 1 1-1 1.5 1.5L16 3l1.5 1.5L19 3v18l-1.5-1.5L16 21l-1.5-1.5L13 21l-1-1-1 1-1.5-1.5L8 21l-1.5-1.5L5 21zM8 9h8M8 13h8',
  broom: 'M19 3l-7 7M3 21c2-4 3-6 6-7l2 2c-1 3-3 4-7 6zM10.5 11.5l2 2',
  wrench: 'M14.5 6a3.5 3.5 0 0 0-4.7 4.2L3 17.2 6.8 21l6.9-6.9A3.5 3.5 0 0 0 18 9.5l-2.3 2.3-2-2L16 7.5z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  chat: 'M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4z',
  shield: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  print: 'M6 9V3h12v6M6 18H4v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6h-2M8 14h8v7H8z',
  key: 'M15 7a4 4 0 1 0-3.5 6L13 14.5V17h2v2h2l2-2v-2l-1.5-1.5A4 4 0 0 0 15 7zM14 8h.01',
  leaf: 'M4 20c0-8 6-14 16-14 0 10-6 16-14 14M8 16c2-4 5-6 8-7',
  moon: 'M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.5L7 22l5-2.5L17 22l-1.5-8.5',
  trendingUp: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  wifi: 'M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01',
  coffee: 'M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h2a2 2 0 0 1 0 4h-2M6 2v2M10 2v2M14 2v2',
  car: 'M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M4 11h16v6H4zM7 17v2M17 17v2M7 14h.01M17 14h.01',
  parking: 'M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM9 17V7h4a3 3 0 0 1 0 6H9',
  quote: 'M9 7H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v3H4M20 7h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v3h-3',
  play: 'M6 4l14 8-14 8z',
  circleCheck: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 12l2.5 2.5L16 9',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 7.5h.01',
  download: 'M12 3v12M8 11l4 4 4-4M5 20h14',
  reply: 'M9 7L4 12l5 5M4 12h11a5 5 0 0 1 5 5v1',
};

export default function Icon({ name, size = 20, stroke = 1.6, className = '', style, ...rest }) {
  const d = P[name];
  const filled = name === 'star' || name === 'play';
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {d ? <path d={d} /> : null}
    </svg>
  );
}
