import { useState } from 'react'
import { createCorrection, type Correction } from './corrections'
import { balance, groups, money, people, type Entry, type Expense, type Person } from './ledger'
import type { Role } from './followup'

export function CorrectionPanel({ dinner, entries, correction, role, submit, decide }: {
  dinner: Expense
  entries: Entry[]
  correction?: Correction
  role: Role
  submit: (members: Person[], note: string) => void
  decide: (status: 'approved' | 'declined') => void
}) {
  const [editing, setEditing] = useState(false)
  const [members, setMembers] = useState(dinner.shares.map(share => share.person))
  const [note, setNote] = useState('')
  const draft = editing ? createCorrection(dinner, members, note) : undefined
  const pending = correction?.status === 'pending'
  const preview = editing ? draft : correction
  const trip = entries.filter(entry => entry.group === 'trip')
  function withShares(shares: Expense['shares']) {
    return balance(trip.map(entry => entry.id === dinner.id ? { ...dinner, shares } : entry), 'me', 'sam')
  }
  function edit() {
    setMembers(dinner.shares.map(share => share.person))
    setNote('')
    setEditing(true)
  }
  return <section className="correction" aria-label="Expense split correction">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3>{editing ? 'Edit split' : 'Split correction'}</h3>
      {role === 'me' && !pending && !editing && <button className="button secondary" onClick={edit}>Edit split</button>}
    </div>
    {editing && <form className="correction-form" onSubmit={event => {
      event.preventDefault()
      if (!draft) return
      submit(members, note)
      setEditing(false)
    }}>
      <fieldset>
        <legend>Who should split this expense?</legend>
        {groups.trip.members.map(person => <label className="split-option" key={person}>
          <input type="checkbox" checked={members.includes(person)} disabled={person === dinner.payer}
            onChange={event => setMembers(current => event.target.checked ? [...current, person] : current.filter(member => member !== person))}/>
          <span>{person === 'me' ? 'Alex Kim (you)' : people[person].name}{person === dinner.payer && ' (paid)'}</span>
        </label>)}
      </fieldset>
      {draft && <SplitPreview correction={draft} before={withShares(draft.before)} after={withShares(draft.proposed)}/>}
      <label>Note to Sam (optional)<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={300} rows={2}/></label>
      <p className="small muted">Your edited split takes effect after Sam approves it.</p>
      <footer className="modal-actions">
        <button type="button" className="button secondary" onClick={() => setEditing(false)}>Cancel</button>
        <button className="button primary" disabled={!draft}>Submit to Sam</button>
      </footer>
    </form>}
    {!editing && preview && <div className="correction-form">
      <p className="correction-status" role="status">{{
        pending: role === 'sam' ? 'Alex edited the split. Review the changes below.' : 'Awaiting Sam’s approval',
        approved: 'Sam approved the split. The ledger has been updated.',
        declined: 'Sam declined the split. The original split is still active.',
      }[preview.status]}</p>
      <SplitPreview correction={preview} before={pending ? withShares(preview.before) : undefined}
        after={pending ? withShares(preview.proposed) : undefined}/>
      {preview.note && <p className="small">Alex’s note: {preview.note}</p>}
      {pending && role === 'sam' && <footer className="modal-actions">
        <button className="button secondary" onClick={() => decide('declined')}>Decline</button>
        <button className="button primary" onClick={() => decide('approved')}>Approve</button>
      </footer>}
    </div>}
  </section>
}

function SplitPreview({ correction, before, after }: { correction: Correction; before?: number; after?: number }) {
  const share = (shares: Expense['shares'], person: Person) => shares.find(entry => entry.person === person)?.cents ?? 0
  function describe(cents: number) {
    if (cents < 0) return `Alex owes Sam ${money(-cents)}`
    if (cents > 0) return `Sam owes Alex ${money(cents)}`
    return 'Settled ($0.00)'
  }
  const changed = groups.trip.members.filter(person => share(correction.before, person) !== share(correction.proposed, person))
  return <div>
    <table className="receipt-table">
      <thead><tr><th scope="col">Person</th><th scope="col">Original share</th><th scope="col">Edited share</th></tr></thead>
      <tbody>{changed.map(person => <tr key={person}><th scope="row">{people[person].name}</th>
        <td>{money(share(correction.before, person))}</td><td>{money(share(correction.proposed, person))}</td></tr>)}</tbody>
    </table>
    {before !== undefined && after !== undefined && <p className="mt-3 text-sm"><strong>Alex and Sam’s net balance</strong><br/>
      {describe(before)} → {describe(after)}
    </p>}
  </div>
}
