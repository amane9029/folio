import React from 'react';

export const Icon = ({ children, size = 18, strokeWidth = 1.75, ...rest }: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size} height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >{children}</svg>
);

export const IconSearch = (p: any) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>;
export const IconFilter = (p: any) => <Icon {...p}><path d="M3 5h18"/><path d="M6 12h12"/><path d="M10 19h4"/></Icon>;
export const IconUpload = (p: any) => <Icon {...p}><path d="M12 16V4"/><path d="m6 10 6-6 6 6"/><path d="M4 20h16"/></Icon>;
export const IconPlus   = (p: any) => <Icon {...p}><path d="M12 5v14"/><path d="M5 12h14"/></Icon>;
export const IconTrash  = (p: any) => <Icon {...p}><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></Icon>;
export const IconCheck  = (p: any) => <Icon {...p}><path d="m4 12 5 5L20 6"/></Icon>;
export const IconChevDown = (p: any) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>;
export const IconChevLeft = (p: any) => <Icon {...p}><path d="m15 6-6 6 6 6"/></Icon>;
export const IconChevRight= (p: any) => <Icon {...p}><path d="m9 6 6 6-6 6"/></Icon>;
export const IconLogout = (p: any) => <Icon {...p}><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></Icon>;
export const IconBook   = (p: any) => <Icon {...p}><path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z"/><path d="M4 17a3 3 0 0 1 3-3h11"/></Icon>;
export const IconFolder = (p: any) => <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></Icon>;
export const IconAlert  = (p: any) => <Icon {...p}><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></Icon>;
export const IconShield = (p: any) => <Icon {...p}><path d="M12 3 4 6v6c0 4.5 3.4 8.6 8 9 4.6-.4 8-4.5 8-9V6l-8-3Z"/></Icon>;
export const IconClose  = (p: any) => <Icon {...p}><path d="M6 6l12 12"/><path d="M18 6 6 18"/></Icon>;
export const IconArrow  = (p: any) => <Icon {...p}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></Icon>;
export const IconLoader = (p: any) => (
  <svg xmlns="http://www.w3.org/2000/svg"
    width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.25"
    strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.2-8.55"/>
  </svg>
);

export const IconClock    = (p: any) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>;
export const IconMail     = (p: any) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></Icon>;
export const IconUserPlus = (p: any) => <Icon {...p}><circle cx="9" cy="8" r="4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M19 8v6"/><path d="M16 11h6"/></Icon>;
export const IconDrive    = (p: any) => <Icon {...p}><rect x="3" y="13" width="18" height="7" rx="2"/><path d="m4 13 3-7h10l3 7"/><circle cx="7.5" cy="16.5" r=".8" fill="currentColor"/></Icon>;
export const IconList     = (p: any) => <Icon {...p}><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></Icon>;
export const IconCalendar = (p: any) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/><path d="M16 3v4"/></Icon>;
export const IconCopy     = (p: any) => <Icon {...p}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></Icon>;
export const IconTranslate= (p: any) => <Icon {...p}><path d="M3 6h12"/><path d="M9 3v3"/><path d="M5 12c0-3 3-6 6-6"/><path d="M5 12c2 4 5 5 8 5"/><path d="m13 21 4-10 4 10"/><path d="M14.5 18h5"/></Icon>;
export const IconSparkle  = (p: any) => <Icon {...p}><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/><path d="m5.6 18.4 2.8-2.8"/><path d="m15.6 8.4 2.8-2.8"/></Icon>;
