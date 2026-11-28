import { groups, type Expense, type Person } from './ledger'

export type Correction = {
  before: Expense['shares']
  proposed: Expense['shares']
  requester: Person
  note: string
  status: 'pending' | 'approved' | 'declined' | 'superseded'
}

export function splitParticipants(expense: Expense) {
  const existing = expense.shares.map(share => share.person)
  const members = expense.group === 'personal' ? existing : groups[expense.group].members
  return [...new Set([...existing, expense.payer, ...members])]
}

export function canEditSplit(expense: Expense, actor: Person) {
  return splitParticipants(expense).includes(actor)
}

export function validateSplit(expense: Expense, shares: Expense['shares']) {
  const participants = splitParticipants(expense)
  if (new Set(shares.map(share => share.person)).size !== shares.length ||
    shares.some(({ person, cents }) => !participants.includes(person) || !Number.isSafeInteger(cents) || cents < 0) ||
    shares.reduce((sum, share) => sum + share.cents, 0) !== expense.amount) return
  const proposed = shares.filter(share => share.cents > 0 || share.person === expense.payer || expense.group === 'personal')
  const centsFor = (list: Expense['shares'], person: Person) => list.find(share => share.person === person)?.cents ?? 0
  if (participants.every(person => centsFor(proposed, person) === centsFor(expense.shares, person))) return
  return proposed
}

export function applySplit(expense: Expense, shares: Expense['shares']): Expense {
  const members = shares.filter(share => share.cents > 0).map(share => share.person)
  return {
    ...expense,
    shares,
    receipt: expense.receipt && {
      ...expense.receipt,
      items: expense.receipt.items.map(item => ({ ...item, members })),
    },
  }
}
