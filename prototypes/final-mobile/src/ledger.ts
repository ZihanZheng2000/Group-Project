export const people = {
  me: { name: 'Alex Kim', initials: 'AK', color: 'mint' },
  maya: { name: 'Maya Chen', initials: 'MC', color: 'peach' },
  jordan: { name: 'Jordan Lee', initials: 'JL', color: 'lilac' },
  sam: { name: 'Sam Patel', initials: 'SP', color: 'blue' },
}
export type Person = keyof typeof people
export const contacts = (actor: Person) => (Object.keys(people) as Person[]).filter(person => person !== actor)
export const groups = {
  apartment: { name: 'Apartment', icon: 'home', members: ['me', 'maya', 'jordan'] as Person[] },
  trip: { name: 'Chicago Weekend', icon: 'case', members: ['me', 'maya', 'sam', 'jordan'] as Person[] },
}
export type Group = keyof typeof groups | 'personal'
export const groupIds = Object.keys(groups) as (keyof typeof groups)[]
export const groupName = (group: Group) => group === 'personal' ? 'Outside a group' : groups[group].name
export type Receipt = {
  items: { label: string; amount: number; members: Person[] }[]
  tax: number
  tip: number
}
export type Expense = {
  id: string; kind: 'expense'; date: string; group: Group; title: string
  payer: Person; amount: number; shares: { person: Person; cents: number }[]; receipt?: Receipt
}
export type Payment = {
  id: string; kind: 'payment'; date: string; group: Group
  from: Person; to: Person; amount: number; expenseId?: string
}
export type Entry = Expense | Payment

export function split(amount: number, members: Person[]) {
  const share = Math.floor(amount / members.length)
  const remainder = amount % members.length
  return members.map((person, index) => ({ person, cents: share + Number(index < remainder) }))
}

function seed(id: string, date: string, group: Group, title: string, payer: Person, amount: number, members: Person[]): Expense {
  return { id, kind: 'expense', date, group, title, payer, amount, shares: split(amount, members) }
}

export const dinnerId = '3'

export const initialEntries: Entry[] = [
  { id: '6', kind: 'payment', date: '2026-11-14', group: 'trip', from: 'maya', to: 'sam', amount: 2700, expenseId: dinnerId },
  seed('5', '2026-11-16', 'apartment', 'November utilities', 'maya', 12900, groups.apartment.members),
  seed('4', '2026-11-15', 'apartment', 'Apartment groceries', 'me', 7500, groups.apartment.members),
  {
    ...seed(dinnerId, '2026-11-13', 'trip', 'Dinner in Chicago', 'sam', 10800, groups.trip.members),
    receipt: {
      items: [
        { label: 'Shared pizza', amount: 5400, members: groups.trip.members },
        { label: 'Shared appetizers', amount: 3300, members: groups.trip.members },
      ],
      tax: 870,
      tip: 1230,
    },
  },
  seed('2', '2026-11-12', 'trip', 'Parking garage', 'me', 4500, ['me', 'maya', 'sam']),
  seed('1', '2026-11-10', 'personal', 'Coffee and pastries', 'jordan', 1600, ['me', 'jordan']),
]

export function contribution(entry: Entry, first: Person, second: Person) {
  if (entry.kind === 'payment') {
    if (entry.from === first && entry.to === second) return entry.amount
    if (entry.from === second && entry.to === first) return -entry.amount
    return 0
  }
  if (entry.payer === first) return entry.shares.find(share => share.person === second)?.cents ?? 0
  if (entry.payer === second) return -(entry.shares.find(share => share.person === first)?.cents ?? 0)
  return 0
}

export function balance(entries: Entry[], first: Person, second: Person) {
  return entries.reduce((total, entry) => total + contribution(entry, first, second), 0)
}

export type Allocation = { group: Group; cents: number }
export function settlementScopes(entries: Entry[], actor: Person, friend: Person) {
  return ([...groupIds, 'personal'] as Group[]).map(group => ({
    group, cents: balance(entries.filter(entry => entry.group === group), actor, friend),
  })).filter(scope => scope.cents !== 0)
}

export function allocatePayment(scopes: Allocation[], amount: number, direction: number) {
  let remaining = amount
  return scopes.filter(scope => Math.sign(scope.cents) === direction).flatMap(scope => {
    const cents = Math.min(remaining, Math.abs(scope.cents))
    remaining -= cents
    return cents ? [{ group: scope.group, cents }] : []
  })
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const money = (cents: number) => usd.format(cents / 100)
export function parseMoney(raw: string) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(raw.trim())
  if (!match) return 0
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents <= 99999999 ? cents : 0
}
export const today = () => new Date().toLocaleDateString('en-CA')
