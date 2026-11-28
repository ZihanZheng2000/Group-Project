import type { Correction } from './corrections'
import { balance, initialEntries, type Entry } from './ledger'

export type Role = 'sam' | 'me'
export type Reply = 'later' | 'reported' | 'question'
export type Event =
  | { kind: 'reminder'; amount: number }
  | { kind: 'later' | 'question'; note: string }
  | { kind: 'reported'; amount: number; date: string; note: string }
  | { kind: 'missing' | 'confirmed' }

export type Demo = { entries: Entry[]; thread: Event[]; reminderAt?: number; correction?: Correction }
export const seedDemo: Demo = { entries: initialEntries, thread: [] }
export const bankTransfer = { amount: 2100, date: '2026-11-16', id: 'bank-chicago-transfer' }
export const outstanding = (entries: Entry[]) => Math.max(0, -balance(entries.filter(entry => entry.group === 'trip'), 'me', 'sam'))

export function setReminder(demo: Demo, role: Role, at?: number): Demo {
  const last = demo.thread.at(-1)?.kind
  if (role !== 'sam') return demo
  if (at !== undefined && (!Number.isFinite(at) || at <= Date.now() ||
      outstanding(demo.entries) === 0 || last === 'reminder' || last === 'reported')) return demo
  return { ...demo, reminderAt: at }
}

export function deliverReminder(demo: Demo): Demo {
  if (demo.reminderAt === undefined || demo.reminderAt > Date.now()) return demo
  return addEvent({ ...demo, reminderAt: undefined }, 'sam', { kind: 'reminder', amount: 0 })
}

export function addEvent(demo: Demo, role: Role, event: Event): Demo {
  const last = demo.thread.at(-1)
  const amountDue = outstanding(demo.entries)
  let entries = demo.entries
  switch (event.kind) {
    case 'reminder':
      if (role !== 'sam' || amountDue <= 0 || last?.kind === 'reminder' || last?.kind === 'reported') return demo
      event = { ...event, amount: amountDue }
      break
    case 'later':
    case 'question':
    case 'reported':
      if (role !== 'me' || amountDue <= 0) return demo
      if (event.kind !== 'reported' && last?.kind !== 'reminder') return demo
      if (event.kind === 'reported' && (!Number.isSafeInteger(event.amount) || event.amount <= 0 || !event.date)) return demo
      break
    case 'missing':
      if (role !== 'sam' || last?.kind !== 'reported') return demo
      break
    case 'confirmed':
      if (role !== 'sam' || last?.kind !== 'reported' || last.amount !== bankTransfer.amount ||
          last.date !== bankTransfer.date || amountDue < last.amount ||
          entries.some(entry => entry.id === bankTransfer.id)) return demo
      entries = [{ id: bankTransfer.id, kind: 'payment', group: 'trip', from: 'me', to: 'sam', amount: last.amount, date: last.date }, ...entries]
      break
  }
  return { ...demo, entries, thread: [...demo.thread, event], reminderAt: event.kind === 'reminder' || event.kind === 'reported' ? undefined : demo.reminderAt }
}

export const eventLabel: Record<Event['kind'], string> = {
  reminder: 'Reminder sent',
  later: 'I’ll pay later',
  reported: 'I already paid',
  question: 'I have a question about the amount',
  missing: 'I haven’t received it',
  confirmed: 'Receipt confirmed · Payment recorded',
}
