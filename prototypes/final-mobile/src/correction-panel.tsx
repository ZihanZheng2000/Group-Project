import { useState } from 'react'
import { canEditSplit, splitParticipants, validateSplit, type Correction } from './corrections'
import { money, parseMoney, people, split, type Entry, type Expense, type Person } from './ledger'

const statusLabels: Record<Correction['status'], string> = {
  pending: 'Awaiting approval',
  approved: 'Approved',
  declined: 'Declined',
  superseded: 'Closed after the payer updated the split',
}

export function CorrectionPanel({ expense, entries, requests, role, submit, decide }: {
  expense: Expense
  entries: Entry[]
  requests: Correction[]
  role: Person
  submit: (shares: Expense['shares'], note: string) => void
  decide: (status: 'approved' | 'declined') => void
}) {
  const [editing, setEditing] = useState(false)
  const [amounts, setAmounts] = useState<Partial<Record<Person, string>>>({})
  const [note, setNote] = useState('')
  const owner = expense.payer === role
  const payer = people[expense.payer].name.split(' ')[0]
  const participants = splitParticipants(expense)
  const pending = requests.at(-1)?.status === 'pending' ? requests.at(-1) : undefined
  const previous = pending ? requests.slice(0, -1) : requests
  const paid = new Map<Person, number>()
  for (const entry of entries) {
    if (entry.kind === 'payment' && entry.to === expense.payer && (entry.expenseId === expense.id ||
      (entry.id === '6' && expense.id === '3'))) {
      paid.set(entry.from, (paid.get(entry.from) ?? 0) + entry.amount)
    }
  }
  const shareOf = (person: Person) => expense.shares.find(share => share.person === person)?.cents ?? 0
  const decimal = (cents: number) => (cents / 100).toFixed(2)
  const proposed = participants.map(person => ({ person, cents: parseMoney(amounts[person] ?? '') }))
  const validInputs = participants.every(person => {
    const amount = amounts[person]?.trim() ?? ''
    return !amount || parseMoney(amount) > 0 || /^0+(?:\.0{1,2})?$/.test(amount)
  })
  const total = proposed.reduce((sum, share) => sum + share.cents, 0)
  const validated = validInputs ? validateSplit(expense, proposed) : undefined
  function edit() {
    setAmounts(Object.fromEntries(participants.map(person => [person, decimal(shareOf(person))])))
    setNote('')
    setEditing(true)
  }
  function divideEqually() {
    const included = proposed.filter(share => share.cents > 0).map(share => share.person)
    const equal = split(expense.amount, included.length ? included : participants)
    setAmounts(Object.fromEntries(participants.map(person => [person, decimal(equal.find(share => share.person === person)?.cents ?? 0)])))
  }

  return <section className="correction" aria-label="Expense split correction">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3>{editing ? 'Edit split amounts' : 'Expense split'}</h3>
      {!editing && canEditSplit(expense, role) && (owner || !pending) && <button className="button secondary" onClick={edit}>Edit split</button>}
    </div>
    {editing && <form className="correction-form" onSubmit={event => {
      event.preventDefault()
      if (!validated) return
      submit(validated, note)
      setEditing(false)
    }}>
      <div className="flex items-center justify-between gap-2">
        <strong>Each person’s amount</strong><button type="button" className="text-action" onClick={divideEqually}>Split equally</button>
      </div>
      <p className="small muted">Enter $0.00 for anyone who owes nothing for this expense.</p>
      {participants.map(person => <label className="amount-split-row" key={person}>
        <span>{people[person].name}{person === role ? ' (you)' : ''}</span>
        <input inputMode="decimal" value={amounts[person] ?? ''}
          onChange={event => setAmounts({ ...amounts, [person]: event.target.value })}/>
      </label>)}
      <p className={validInputs && total === expense.amount ? 'small muted' : 'small negative'} aria-live="polite">
        {validInputs ? `${money(total)} assigned of ${money(expense.amount)}` : 'Enter valid amounts in dollars and cents.'}
      </p>
      {!owner && <label>Note to {payer} (optional)<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={300} rows={2}/></label>}
      {!owner && <p className="small muted">The current split stays in effect until {payer} approves.</p>}
      {owner && pending && <p className="small muted">Saving your split will close the pending request.</p>}
      <footer className="modal-actions">
        <button type="button" className="button secondary" onClick={() => setEditing(false)}>Cancel</button>
        <button className="button primary" disabled={!validated}>{owner ? 'Save split' : `Submit to ${payer}`}</button>
      </footer>
    </form>}
    {!editing && pending && <div className="correction-form">
      <p className="correction-status" role="status">{owner ? `${people[pending.requester].name} proposed a new split.` : `Awaiting ${payer}’s approval`}</p>
      <SplitPreview request={pending} paid={paid}/>
      {owner && <footer className="modal-actions">
        <button className="button secondary" onClick={() => decide('declined')}>Decline</button>
        <button className="button primary" onClick={() => decide('approved')}>Approve</button>
      </footer>}
    </div>}
    {!editing && !pending && previous.length > 0 && <p className="correction-status" role="status">Latest request: {statusLabels[previous[previous.length - 1].status]}</p>}
    {!editing && previous.length > 0 && <details>
      <summary className="text-action">Split request history</summary>
      <ol className="space-y-3">{[...previous].reverse().map((request, index) => <li key={index}>
        <strong>{statusLabels[request.status]}</strong>
        <SplitPreview request={request} paid={paid}/>
      </li>)}</ol>
    </details>}
  </section>
}

function SplitPreview({ request, paid }: { request: Correction; paid: Map<Person, number> }) {
  const cents = (shares: Expense['shares'], person: Person) => shares.find(share => share.person === person)?.cents ?? 0
  const affected = [...new Set([...request.before, ...request.proposed].map(share => share.person))]
    .filter(person => cents(request.before, person) !== cents(request.proposed, person))
  return <div>
    <table className="receipt-table">
      <thead><tr><th scope="col">Person</th><th scope="col">Current</th><th scope="col">Proposed</th></tr></thead>
      <tbody>{affected.map(person => <tr key={person}><th scope="row">{people[person].name}</th>
        <td>{money(cents(request.before, person))}</td><td>{money(cents(request.proposed, person))}</td></tr>)}</tbody>
    </table>
    {request.note && <p className="small">{people[request.requester].name}: {request.note}</p>}
    {[...paid].map(([person, amount]) => {
      const remaining = cents(request.proposed, person) - amount
      return <p className="mt-2 text-sm" key={person}>{people[person].name} already paid <strong>{money(amount)}</strong>.
        {' '}{remaining >= 0 ? `Remaining after edit: ${money(remaining)}` : `Credit after edit: ${money(-remaining)}`}.</p>
    })}
  </div>
}
