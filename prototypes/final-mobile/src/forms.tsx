import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { allocatePayment, balance, contacts, groupIds, groupName, groups, money, parseMoney, people, rescaleSplit, settlementScopes, split, today, type Entry, type Expense, type Group, type Person } from './ledger'
import { Icon } from './ui'

export function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const dragStart = useRef<number | null>(null)
  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} aria-labelledby="modal-title" onCancel={event => { event.preventDefault(); close() }}>
    <div className="sheet-top">
      <div className="sheet-handle" aria-hidden="true"
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0) return
          dragStart.current = event.clientY
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={event => {
          if (dragStart.current === null || !event.isPrimary) return
          ref.current!.style.translate = `0 ${Math.max(0, event.clientY - dragStart.current)}px`
        }}
        onPointerUp={event => {
          if (dragStart.current === null || !event.isPrimary) return
          const shouldClose = event.clientY - dragStart.current > 70
          dragStart.current = null
          ref.current!.style.translate = ''
          if (shouldClose) close()
        }}
        onPointerCancel={() => {
          dragStart.current = null
          ref.current!.style.translate = ''
        }}><span/></div>
      <header className="modal-head"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Close" onClick={close}><Icon name="close"/></button></header>
    </div>
    {children}
  </dialog>
}

export function ExpenseForm({ actor, group, friend, save, close }: {
  actor: Person; group?: Group; friend?: Person; save: (entries: Entry[], message: string) => void; close: () => void
}) {
  const availableGroups = groupIds.filter(id => groups[id].members.includes(actor))
  const [scope, setScope] = useState<Group>(group ?? (friend ? 'personal' : availableGroups[0] ?? 'personal'))
  const [participant, setParticipant] = useState<Person>(friend ?? 'maya')
  const [payer, setPayer] = useState<Person>(actor)
  const [raw, setRaw] = useState('')
  const [error, setError] = useState('')
  const members: Person[] = scope === 'personal' ? [actor, participant] : groups[scope].members
  const amount = parseMoney(raw)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = String(data.get('description')).trim()
    if (!title || !amount) return setError('Enter a description and a positive USD amount with up to two decimal places (maximum $999,999.99).')
    save([{ kind: 'expense', id: crypto.randomUUID(), date: String(data.get('date')), group: scope, title, payer, amount, shares: split(amount, members) }], 'Expense added.')
  }
  return <form className="form" onSubmit={submit}>
    <label>Description<input autoFocus name="description" placeholder="e.g. Dinner" maxLength={100} required/></label>
    <div className="form-grid">
      <label>Amount (USD)<input value={raw} onChange={e => setRaw(e.target.value)} placeholder="0.00" inputMode="decimal" required/></label>
      <label>Date<input name="date" type="date" defaultValue={today()} required/></label>
    </div>
    <label>Group<select value={scope} onChange={e => { setScope(e.target.value as Group); setPayer(actor) }}>
      {availableGroups.map(id => <option key={id} value={id}>{groupName(id)}</option>)}<option value="personal">Outside a group</option>
    </select></label>
    {scope === 'personal' && <label>Split with<select value={participant} onChange={e => { setParticipant(e.target.value as Person); setPayer(actor) }}>
      {contacts(actor).map(id => <option key={id} value={id}>{people[id].name}</option>)}
    </select></label>}
    <label>Paid by<select value={payer} onChange={e => setPayer(e.target.value as Person)}>
      {members.map(id => <option key={id} value={id}>{id === actor ? 'You' : people[id].name}</option>)}
    </select></label>
    <div className="form-note"><strong>Split equally</strong><div>{split(amount, members).map(({ person, cents }) => `${person === actor ? 'You' : people[person].name} ${money(cents)}`).join(' · ')}</div></div>
    {error && <p role="alert" className="negative">{error}</p>}
    <footer className="modal-actions"><button type="button" className="button secondary" onClick={close}>Cancel</button><button className="button primary">Save expense</button></footer>
  </form>
}

export function EditExpenseForm({ expense, save, close }: {
  expense: Expense; save: (expense: Expense) => void; close: () => void
}) {
  const decimal = (cents: number) => (cents / 100).toFixed(2)
  const [error, setError] = useState('')
  const receipt = expense.receipt
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const title = String(fields.get('description')).trim()
    const date = String(fields.get('date'))
    const rawAmount = (name: string) => String(fields.get(name) ?? '').trim()
    const validAmount = (name: string) => parseMoney(rawAmount(name)) > 0 || /^0+(?:\.0{1,2})?$/.test(rawAmount(name))
    const receiptFields = receipt ? [...receipt.items.map((_, index) => `item-${index}`), 'tax', 'tip'] : ['amount']
    if (!title || !date || !receiptFields.every(validAmount)) {
      setError('Enter a description, date, and valid amounts in dollars and cents.')
      return
    }
    const revised = receipt && {
      items: receipt.items.map((item, index) => ({ ...item, amount: parseMoney(rawAmount(`item-${index}`)) })),
      tax: parseMoney(rawAmount('tax')),
      tip: parseMoney(rawAmount('tip')),
    }
    const amount = revised
      ? revised.items.reduce((total, item) => total + item.amount, revised.tax + revised.tip)
      : parseMoney(rawAmount('amount'))
    if (amount <= 0 || amount > 99999999) {
      setError('The total must be between $0.01 and $999,999.99.')
      return
    }
    save({ ...expense, title, date, amount, receipt: revised,
      shares: rescaleSplit(amount, expense) })
  }
  return <form className="form" onSubmit={submit}>
    <label>Description<input name="description" defaultValue={expense.title} required maxLength={100}/></label>
    <label>Date<input name="date" type="date" defaultValue={expense.date} required/></label>
    {receipt ? <>
      {receipt.items.map((item, index) => <label key={item.label}>{item.label} (USD)
        <input name={`item-${index}`} defaultValue={decimal(item.amount)} inputMode="decimal" required/>
      </label>)}
      <div className="form-grid">
        <label>Tax (USD)<input name="tax" inputMode="decimal" defaultValue={decimal(receipt.tax)} required/></label>
        <label>Tip (USD)<input name="tip" inputMode="decimal" defaultValue={decimal(receipt.tip)} required/></label>
      </div>
      <p className="small muted">The total and each person’s share update when you save.</p>
    </> : <label>Amount (USD)<input name="amount" defaultValue={decimal(expense.amount)} inputMode="decimal" required/></label>}
    {error && <p className="negative" role="alert">{error}</p>}
    <footer className="modal-actions"><button type="button" className="button secondary" onClick={close}>Cancel</button>
      <button className="button primary">Save changes</button></footer>
  </form>
}

export function PaymentForm({ actor, entries, group, friend, save, close }: {
  actor: Person; entries: Entry[]; group?: Group; friend?: Person; save: (entries: Entry[], message: string) => void; close: () => void
}) {
  const scoped = group ? entries.filter(entry => entry.group === group) : entries
  const eligible = contacts(actor).filter(id => (!friend || id === friend) && balance(scoped, actor, id) !== 0)
  const [selection, setSelection] = useState<Person | ''>(friend && eligible.includes(friend) ? friend : eligible[0] ?? '')
  const [raw, setRaw] = useState('')
  const [error, setError] = useState('')
  const [review, setReview] = useState(false)
  const net = selection ? balance(scoped, actor, selection) : 0
  const amount = parseMoney(raw)
  const name = selection ? people[selection].name : ''
  const description = net < 0 ? `You pay ${name}` : `${name} pays you`
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selection || !amount || amount > Math.abs(net)) return setError(`Enter an amount from $0.01 to ${money(Math.abs(net))} with up to two decimal places.`)
    if (!review) { setReview(true); setError(''); return }
    const scopes = settlementScopes(scoped, actor, selection)
    const paymentEntries: Entry[] = allocatePayment(scopes, amount, Math.sign(net)).map(({ group: paymentGroup, cents }) => ({
      id: crypto.randomUUID(), kind: 'payment', date: today(), group: paymentGroup,
      from: net < 0 ? actor : selection, to: net < 0 ? selection : actor, amount: cents,
    }))
    save(paymentEntries, 'Payment recorded.')
  }
  if (!eligible.length) return <div className="form"><p>There are no outstanding balances to settle.</p><footer className="modal-actions"><button className="button secondary" onClick={close}>Close</button></footer></div>
  return <form className="form" onSubmit={submit}>
    {review ? <div className="payment-review"><div className="review-icon"><Icon name="exchange" size={24}/></div><strong>{money(amount)}</strong><p>{description}</p><small>{group ? groupName(group) : 'Across all expenses'}</small></div> : <>
      <label>Settle with<select value={selection} onChange={e => { setSelection(e.target.value as Person); setRaw(''); setError('') }}>
        {eligible.map(id => <option key={id} value={id}>{people[id].name}</option>)}
      </select></label>
      <div className="form-note"><strong>{description}</strong><div>Outstanding balance · {money(Math.abs(net))}</div></div>
      <label>Amount (USD)<div className="amount-input"><input value={raw} onChange={e => setRaw(e.target.value)} placeholder="0.00" inputMode="decimal" required/><button className="text-action" type="button" onClick={() => { setRaw((Math.abs(net) / 100).toFixed(2)); setError('') }}>Use full balance</button></div></label>
    </>}
    <p className="muted small">This is a simulated payment. No money will move.</p>
    {error && <p role="alert" className="negative">{error}</p>}
    <footer className="modal-actions"><button type="button" className="button secondary" onClick={review ? () => setReview(false) : close}>{review ? 'Back' : 'Cancel'}</button><button className="button primary">{review ? 'Confirm payment' : 'Continue'}</button></footer>
  </form>
}
