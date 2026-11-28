import { useState, type FormEvent } from 'react'
import { money, parseMoney } from './ledger'
import { bankTransfer, eventLabel, outstanding, type Demo, type Event, type Reply, type Role } from './followup'
import { Avatar, Icon } from './ui'

export function Conversation({ demo, role, switchRole, send, schedule, back, history, initialAction }: {
  demo: Demo; role: Role; switchRole: (role: Role) => void; send: (event: Event) => void; schedule: (at?: number) => void; back: () => void; history: () => void; initialAction?: 'remind'
}) {
  const [preview, setPreview] = useState(initialAction === 'remind' && demo.reminderAt === undefined)
  const [timing, setTiming] = useState('24')
  const [reminderDate, setReminderDate] = useState('')
  const [reminderError, setReminderError] = useState('')
  function openReminder() {
    const at = demo.reminderAt
    setTiming(at === undefined ? '24' : 'custom')
    setReminderDate(at === undefined ? '' : new Date(at - new Date(at).getTimezoneOffset() * 60_000).toISOString().slice(0, 16))
    setReminderError('')
    setPreview(true)
  }
  function submitReminder(event: FormEvent) {
    event.preventDefault()
    if (timing === 'now') {
      send({ kind: 'reminder', amount: due })
    } else {
      const now = Date.now()
      const at = timing === 'custom' ? new Date(reminderDate).getTime() : now + Number(timing) * 3_600_000
      if (!Number.isFinite(at) || at <= now) return setReminderError('Choose a date and time in the future.')
      schedule(at)
    }
    setPreview(false)
  }
  const [reply, setReply] = useState<Reply>('later')
  const [note, setNote] = useState('')
  const [amount, setAmount] = useState((bankTransfer.amount / 100).toFixed(2))
  const [date, setDate] = useState(bankTransfer.date)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const due = outstanding(demo.entries)
  const last = demo.thread.at(-1)
  const reporting = editing || reply === 'reported'
  const awaitingReply = due > 0 && last?.kind === 'reminder'
  const canCorrect = due > 0 && (last?.kind === 'reported' || last?.kind === 'missing')
  const reportedTransfer = [...demo.thread].reverse().find(event => event.kind === 'reported')
  const recorded = demo.entries.some(entry => entry.id === bankTransfer.id)
  const status = due === 0 ? 'Settled' : last?.kind === 'reported' ? 'Payment reported · Awaiting receipt check'
    : last?.kind === 'reminder' ? 'Reminder sent · Awaiting reply'
    : demo.reminderAt !== undefined && role === 'sam' ? 'Reminder scheduled'
    : last?.kind === 'missing' ? 'Receipt not confirmed'
    : last?.kind === 'later' || last?.kind === 'question' ? 'Reply received' : 'Outstanding'
  const trip = demo.entries.filter(entry => entry.group === 'trip')
  const dinner = trip.find(entry => entry.kind === 'expense' && entry.id === '3')
  const parking = trip.find(entry => entry.kind === 'expense' && entry.id === '2')
  const dinnerShare = dinner?.kind === 'expense' ? dinner.shares.find(share => share.person === 'me')?.cents ?? 0 : 0
  const parkingShare = parking?.kind === 'expense' ? parking.shares.find(share => share.person === 'sam')?.cents ?? 0 : 0
  const otherActivity = due - dinnerShare + parkingShare
  const match = last?.kind === 'reported' && last.amount === bankTransfer.amount && last.date === bankTransfer.date
  function submit(event: FormEvent) {
    event.preventDefault()
    const text = note.trim()
    if (reporting) {
      const cents = parseMoney(amount)
      if (!cents || !date) return setError('Enter a valid transfer date and a positive USD amount such as 21.00.')
      send({ kind: 'reported', amount: cents, date, note: text })
    } else {
      send({ kind: reply, note: text })
    }
    setNote('')
    setError('')
    setEditing(false)
  }

  return <>
    <button className="text-action mb-4" onClick={back}><span aria-hidden="true">←</span> Back to Chicago Weekend</button>
    <div className="page-heading"><div><h1>Payment follow-up</h1><p className="muted">Chicago Weekend · Alex Kim and Sam Patel</p></div>
      {recorded && <button className="button secondary" onClick={history}><Icon name="clock"/>Payment history</button>}
    </div>
    <div className="follow-summary"><Avatar person={role === 'sam' ? 'me' : 'sam'}/><div><h2>{due === 0 ? 'No payment due' : role === 'sam' ? 'Alex owes you' : 'You owe Sam'}</h2><p className="status-label" role="status">{status}</p></div><strong>{money(due)}</strong></div>

    {role === 'sam' && due > 0 && last?.kind !== 'reminder' && last?.kind !== 'reported' && <section className="panel">
      <header className="panel-heading"><h2>{preview ? 'Review reminder' : 'Payment reminder'}</h2>{!preview && <button className="button primary" onClick={openReminder}>{demo.reminderAt === undefined ? 'Send reminder' : 'Edit reminder'}</button>}</header>
      {!preview && demo.reminderAt !== undefined && <div className="follow-content">
        <p><strong>Scheduled for</strong> <time dateTime={new Date(demo.reminderAt).toISOString()}>{new Date(demo.reminderAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time></p>
        <p className="muted">The demo delivers it at the scheduled time while open, or when you reopen it after that time.</p>
        <div className="modal-actions"><button className="button secondary" onClick={() => schedule()}>Cancel reminder</button><button className="button primary" onClick={() => send({ kind: 'reminder', amount: due })}>Send now</button></div>
      </div>}
      {preview && <form className="form" onSubmit={submitReminder}><dl className="transfer-facts"><div><dt>To</dt><dd>Alex Kim</dd></div><div><dt>Amount due</dt><dd>{money(due)}</dd></div></dl>
        <div className="transfer-lines"><p><span>Dinner in Chicago · Alex’s share</span><strong>{money(dinnerShare)}</strong></p><p><span>Parking garage · Credit to Alex</span><strong>−{money(parkingShare)}</strong></p>{otherActivity !== 0 && <p><span>Other Chicago Weekend activity</span><strong>{otherActivity < 0 ? '−' : '+'}{money(Math.abs(otherActivity))}</strong></p>}</div>
        <label>Send reminder<select value={timing} onChange={event => { setTiming(event.target.value); setReminderError('') }}>
          <option value="now">Immediately</option><option value="24">In 1 day</option><option value="72">In 3 days</option><option value="120">In 5 days</option><option value="720">In 30 days</option><option value="custom">Custom date and time</option>
        </select></label>
        {timing === 'custom' && <label>Reminder date and time (local)<input type="datetime-local" required value={reminderDate} onChange={event => setReminderDate(event.target.value)}/></label>}
        {reminderError && <p role="alert" className="negative">{reminderError}</p>}
        <div className="modal-actions"><button type="button" className="button secondary" onClick={() => setPreview(false)}>Cancel</button><button className="button primary">{timing === 'now' ? 'Confirm and send' : 'Schedule reminder'}</button></div>
      </form>}
    </section>}

    {role === 'sam' && awaitingReply && <section className="panel follow-entry">
      <div><h2>Waiting for Alex’s reply</h2><p className="small muted">Switch to Alex to respond to the reminder.</p></div>
      <button className="button secondary" onClick={() => switchRole('me')}>Switch to Alex</button>
    </section>}
    {role === 'me' && canCorrect && !editing && <section className="panel follow-entry">
      <div><h2>{last?.kind === 'reported' ? 'Transfer report sent to Sam' : 'Sam could not confirm receipt'}</h2>
        <p className="small muted">{reportedTransfer && `${money(reportedTransfer.amount)} · ${reportedTransfer.date} · `}The balance is still {money(due)}.</p></div>
      <div className="flex flex-wrap gap-2">
        <button className="button secondary" onClick={() => {
          if (reportedTransfer) {
            setAmount((reportedTransfer.amount / 100).toFixed(2))
            setDate(reportedTransfer.date)
            setNote(reportedTransfer.note)
          }
          setEditing(true)
        }}>Correct transfer details</button>
        {last?.kind === 'reported' && <button className="button primary" onClick={() => switchRole('sam')}>Switch to Sam to check receipt</button>}
      </div>
    </section>}
    {role === 'me' && due > 0 && (awaitingReply || (canCorrect && editing)) && <section className="panel">
      <header className="panel-heading"><h2>{editing ? 'Correct transfer details' : 'Reply to Sam'}</h2></header>
      <form className="form" onSubmit={submit}>
        {!editing && <label>Your reply<select value={reply} onChange={event => { setReply(event.target.value as Reply); setError('') }}>
          <option value="later">{eventLabel.later}</option><option value="reported">{eventLabel.reported}</option><option value="question">{eventLabel.question}</option>
        </select></label>}
        {reporting && <><p className="form-note">Your simulated transfer to Sam was {money(bankTransfer.amount)} on {bankTransfer.date}.</p><div className="form-grid"><label>Amount sent (USD)<input inputMode="decimal" required placeholder="0.00" value={amount} onChange={event => setAmount(event.target.value)}/></label>
          <label>Transfer date<input type="date" required value={date} onChange={event => setDate(event.target.value)}/></label></div></>}
        <label>Message (optional)<textarea rows={2} maxLength={300} value={note} onChange={event => setNote(event.target.value)}/></label>
        {error && <p role="alert" className="negative">{error}</p>}
        <footer className="modal-actions">
          {editing && <button type="button" className="button secondary" onClick={() => { setEditing(false); setReply('later'); setError('') }}>Cancel</button>}
          <button className="button primary">{reporting ? 'Send transfer report' : 'Send reply'}</button>
        </footer>
      </form>
    </section>}

    {role === 'sam' && last?.kind === 'reported' && <section className="panel">
      <header className="panel-heading"><h2>Check receipt</h2></header>
      <div className="follow-content">
        <div className="comparison">
          <div><h3>Alex’s reported transfer</h3><strong>{money(last.amount)}</strong><p>{last.date} · Alex Kim → Sam Patel</p></div>
          <div><h3>Simulated bank activity</h3><strong>{money(bankTransfer.amount)}</strong><p>{bankTransfer.date} · Alex Kim → Sam Patel</p></div>
        </div>
        <p className="form-note">{match ? due >= last.amount && !recorded ? 'The amount and date match. Confirm receipt to record this payment in the ledger.' : 'The matching transfer cannot be applied to the current outstanding balance.' : `The ${last.amount !== bankTransfer.amount && last.date !== bankTransfer.date ? 'amount and date do' : last.amount !== bankTransfer.amount ? 'amount does' : 'date does'} not match. Switch to Alex to correct the report, or mark the transfer as not received.`}</p>
        <div className="modal-actions"><button className="button secondary" onClick={() => send({ kind: 'missing' })}>I haven’t received it</button><button className="button primary" disabled={!match || due < last.amount || recorded} onClick={() => send({ kind: 'confirmed' })}>Confirm receipt</button></div>
      </div>
    </section>}

    <section className="panel">
      <header className="panel-heading"><h2>Conversation</h2></header>
      {demo.thread.length ? <ol className="thread">{demo.thread.map((event, index) => {
        const from = event.kind === 'reminder' || event.kind === 'missing' || event.kind === 'confirmed' ? 'sam' : 'me'
        return <li key={index}><Avatar person={from}/><div><small>{from === 'sam' ? 'Sam Patel' : 'Alex Kim'}</small><strong>{eventLabel[event.kind]}</strong>
          {event.kind === 'reminder' && <p>{money(event.amount)} outstanding · Chicago Weekend</p>}
          {event.kind === 'reported' && <p>{money(event.amount)} sent on {event.date}</p>}
          {'note' in event && event.note && <p>{event.note}</p>}
          {event.kind === 'missing' && <p>Sam marked the reported transfer as not received.</p>}
          {event.kind === 'confirmed' && <p>{money(bankTransfer.amount)} from Alex to Sam · {bankTransfer.date}</p>}
        </div></li>
      })}</ol> : <p className="empty">No reminders or replies yet.</p>}
    </section>
  </>
}
