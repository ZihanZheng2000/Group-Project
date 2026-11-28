import { dinnerId, groups, split, type Entry, type Expense, type Person } from './ledger'

export type Correction = {
  before: Expense['shares']
  proposed: Expense['shares']
  note: string
  status: 'pending' | 'approved' | 'declined'
}

export function isDinner(entry: Entry): entry is Expense {
  return entry.kind === 'expense' && entry.id === dinnerId
}

export function createCorrection(dinner: Expense, members: Person[], note: string): Correction | undefined {
  if (!isDinner(dinner) || !members.includes(dinner.payer)) return
  const selected = groups.trip.members.filter(person => members.includes(person))
  const proposed = split(dinner.amount, selected)
  const unchanged = proposed.length === dinner.shares.length &&
    proposed.every(share => dinner.shares.some(current => current.person === share.person && current.cents === share.cents))
  if (unchanged) return
  return { before: dinner.shares, proposed, note: note.trim().slice(0, 300), status: 'pending' }
}

export function applyCorrection(dinner: Expense, correction: Correction): Expense {
  const members = correction.proposed.map(share => share.person)
  return {
    ...dinner,
    shares: correction.proposed,
    receipt: dinner.receipt && {
      ...dinner.receipt,
      items: dinner.receipt.items.map(item => ({ ...item, members })),
    },
  }
}
