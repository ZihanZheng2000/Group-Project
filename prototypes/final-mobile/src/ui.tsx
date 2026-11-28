import type { ReactNode } from 'react'
import { people, type Person } from './ledger'

const paths: Record<string, ReactNode> = {
  logo: <><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="m3 12 9 4 9-4M3 17l9 4 9-4"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2"/></>,
  people: <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 21v-2a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v2m1-16.4a3.5 3.5 0 0 1 0 6.8m1 2.6a5 5 0 0 1 4 5v2"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12a2 2 0 0 0 4 0"/></>,
  edit: <><path d="M13.5 6.5 17.5 10.5M4 20l4-.8L20 7.2a1.5 1.5 0 0 0 0-2.2l-1-1a1.5 1.5 0 0 0-2.2 0L4.8 16Z"/></>,
  dining: <><path d="M4 3v5a3 3 0 0 0 6 0V3M7 3v18M20 3c-2.5 0-5 3.5-5 7v3h5m0-10v18"/></>,
  car: <><rect x="3" y="10" width="18" height="8" rx="2"/><path d="m5 10 2-5h10l2 5M5 18v2m14-2v2M7 14h1m8 0h1"/></>,
  bolt: <path d="m13 2-8 12h6l-1 8 9-12h-6l1-8Z"/>,
  back: <path d="m15 18-6-6 6-6"/>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6m-6 4h6m-6 4h3"/></>,
  balances: <><path d="M12 3v17m-5 1h10M4 7h16M4 7l-3 7h6L4 7Zm16 0-3 7h6l-3-7Z"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  home: <><path d="m3 11 9-8 9 8M5 10v11h14V10"/><path d="M10 21v-7h4v7"/></>,
  case: <><rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V4h6v3M8 7v13m8-13v13"/></>,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  exchange: <path d="M3 8h17l-4-4m5 12H4l4 4"/>,
  reset: <><path d="M3 12a9 9 0 1 1 3 7m-3-7V5m0 7h7"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  chevron: <path d="m9 6 6 6-6 6"/>,
}
export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
export function Avatar({ person }: { person: Person }) {
  const profile = people[person]
  return <span className={`avatar ${profile.color}`} aria-hidden="true">{profile.initials}</span>
}
