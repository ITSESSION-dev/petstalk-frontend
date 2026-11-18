// Íconos de línea (estilo Lucide) dibujados en SVG, sin dependencias externas
const P = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z" />,
  calendar: <><rect x="3" y="4.5" width="18" height="16.5" rx="3" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></>,
  bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" /></>,
  paw: <><circle cx="5.5" cy="10" r="2" /><circle cx="9.5" cy="5.5" r="2" /><circle cx="14.5" cy="5.5" r="2" /><circle cx="18.5" cy="10" r="2" /><path d="M12 11c-3 0-6 4.5-6 7a2.5 2.5 0 0 0 3.5 2.3c1-.5 1.6-.8 2.5-.8s1.5.3 2.5.8A2.5 2.5 0 0 0 18 18c0-2.5-3-7-6-7Z" /></>,
  walk: <><circle cx="13" cy="4" r="1.8" /><path d="m9 21 2.5-6.5L14 17v4M7 12l3-4 3.5 1 2 3.5 2.5 1" /><path d="M11.5 14.5 10 8" /></>,
  bowl: <><path d="M3 11h18a9 9 0 0 1-18 0Z" /><path d="M8 7c0-1.5 1-1.5 1-3M12 7c0-1.5 1-1.5 1-3M16 7c0-1.5 1-1.5 1-3" /></>,
  drop: <path d="M12 2.7S5.5 9.6 5.5 14a6.5 6.5 0 0 0 13 0C18.5 9.6 12 2.7 12 2.7Z" />,
  moon: <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7Z" />,
  cake: <><path d="M4 21V13a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8M2 21h20" /><path d="M4 16c1.3 1 2.7 1 4 0s2.7-1 4 0 2.7 1 4 0 2.7-1 4 0M12 11V7.5M12 4.5c.7-.6 1-1.2 1-2-1 .3-2 1-2 2a1 1 0 0 0 1 1Z" /></>,
  tag: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  syringe: <><path d="m18 2 4 4M17 7l3-3M19 9 9.7 18.3a1 1 0 0 1-1.4 0l-2.6-2.6a1 1 0 0 1 0-1.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6" /></>,
  pill: <><rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-45 12 12)" /><path d="m8.5 8.5 7 7" /></>,
  shield: <path d="M12 21.5s8-3.5 8-10V5l-8-2.5L4 5v6.5c0 6.5 8 10 8 10Z" />,
  steth: <><path d="M5 3v5a4 4 0 0 0 8 0V3" /><path d="M9 12v2a5 5 0 0 0 10 0v-2" /><circle cx="19" cy="10" r="2" /></>,
  flower: <><circle cx="12" cy="12" r="2.5" /><path d="M12 9.5C12 6 13.5 3 12 3s-0 3-0 6.5M14.5 12c3.5 0 6.5 1.5 6.5 0s-3 0-6.5 0M12 14.5c0 3.5-1.5 6.5 0 6.5s0-3 0-6.5M9.5 12C6 12 3 10.5 3 12s3 0 6.5 0" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
  left: <path d="m15 18-6-6 6-6" />,
  right: <path d="m9 18 6-6-6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  camera: <><path d="M14.5 4h-5L7.5 6.5H4a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2h-3.5Z" /><circle cx="12" cy="13" r="3.5" /></>,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="M20 6 9 17l-5-5" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>
};

export default function Icon({ name, size = 20, stroke = 1.8, className = '', style }) {
  return (
    <svg className={`ic ${className}`} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name] || P.paw}
    </svg>
  );
}
