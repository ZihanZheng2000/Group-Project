import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { balance, contacts, dinnerId, groupIds, groupName, groups, money, people, type Entry, type Expense, type Person } from './ledger'
import { Avatar, Icon } from './ui'
import { EditExpenseForm, ExpenseForm, Modal, PaymentForm } from './forms'
import { addEvent, deliverReminder, outstanding, seedDemo, setReminder, type Demo } from './followup'
import { Conversation } from './conversation'
import { balanceLabel, Breakdown, ExpenseBreakdown } from './breakdown'
import { CorrectionPanel } from './correction-panel'
import { applySplit, canEditSplit, validateSplit, type Correction } from './corrections'
import './style.css'

const storageKey = 'cs6750-shared-ledger-final-v1'
const pages = {
  groups: { name: 'Groups', icon: 'case' },
  activity: { name: 'Activity', icon: 'clock' },
  account: { name: 'Account', icon: 'user' },
  expenses: { name: 'All expenses', icon: 'receipt' },
  balances: { name: 'Balances', icon: 'balances' },
  payments: { name: 'Payment history', icon: 'clock' },
}
type Page = keyof typeof pages
type Route = { page: Page } | { page: 'group'; id: keyof typeof groups } | { page: 'friend'; id: Person }
type Overlay = 'expense' | 'payment' | 'reset' | null

function loadDemo(): Demo {
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const saved: Demo & { correction?: Omit<Correction, 'requester'>; correctionHistory?: Omit<Correction, 'requester'>[] } = JSON.parse(stored)
      const { correction, correctionHistory, ...demo } = saved
      if (!correction && !correctionHistory?.length) return demo
      const legacy = [...(correctionHistory ?? []), ...(correction ? [correction] : [])]
      return { ...demo, splitRequests: { ...demo.splitRequests, [dinnerId]: legacy.map(item => ({ ...item, requester: 'me' })) } }
    }
  } catch { /* Allow the demo to run without browser storage. */ }
  return seedDemo
}

function Activity({ actor, entries, onSelect }: { actor: Person; entries: Entry[]; onSelect: (entry: Entry) => void }) {
  if (!entries.length) return <div className="empty"><Icon name="receipt" size={24}/><p>No activity to show here yet.</p></div>
  return <ul className="activity">{entries.map(entry => {
    const payment = entry.kind === 'payment'
    const payer = payment ? entry.from : entry.payer
    const title = payment ? `${payer === actor ? 'You' : people[payer].name} paid ${entry.to === actor ? 'you' : people[entry.to].name}` : entry.title
    const itemIcon = payment ? 'exchange' : /dinner|coffee|grocer/i.test(entry.title) ? 'dining'
      : /parking/i.test(entry.title) ? 'car' : /utilities/i.test(entry.title) ? 'bolt' : 'receipt'
    const date = new Date(entry.date + 'T12:00:00')
    return <li key={entry.id}><button className="activity-row" onClick={() => onSelect(entry)}>
      <span className="row-date"><span>{date.toLocaleDateString('en-US', { month: 'short' })}</span><strong>{date.getDate()}</strong></span>
      <span className={`entry-icon item-${itemIcon}`}><Icon name={itemIcon}/></span>
      <span className="row-title"><strong>{title}</strong><span>{groupName(entry.group)}</span></span>
      <span className="row-amount"><strong>{money(entry.amount)}</strong><span>{payment ? 'Payment' : payer === actor ? 'You paid' : `${people[payer].name.split(' ')[0]} paid`}</span></span>
      <Icon name="chevron" size={15}/>
    </button></li>
  })}</ul>
}

function App() {
  const [demo, setDemo] = useState(loadDemo)
  const { entries } = demo
  const [role, setRole] = useState<Person>('me')
  const [followOpen, setFollowOpen] = useState<{ action?: 'remind' } | null>(null)
  const [breakdown, setBreakdown] = useState<Person | null>(null)
  const [route, setRoute] = useState<Route>({ page: 'group', id: 'trip' })
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [paymentPartner, setPaymentPartner] = useState<Person>()
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editingExpense, setEditingExpense] = useState(false)
  const detail = entries.find(entry => entry.id === detailId)
  const lastEvent = demo.thread.at(-1)
  const [notice, setNotice] = useState('')
  const scroller = useRef<HTMLElement>(null)
  const screen = followOpen ? 'payment-follow-up' : breakdown ? `breakdown-${breakdown}`
    : 'id' in route ? `${route.page}-${route.id}` : route.page
  useEffect(() => {
    scroller.current?.scrollTo(0, 0)
  }, [screen])
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(demo)) } catch { /* Storage may be disabled. */ }
  }, [demo])
  useEffect(() => {
    if (demo.reminderAt === undefined) return
    if (outstanding(demo.entries) === 0) {
      setDemo(current => setReminder(current, 'sam'))
      return
    }
    // Recheck after tab suspension and avoid overflowing the browser timer.
    const deliver = () => setDemo(deliverReminder)
    const timer = window.setTimeout(deliver, Math.min(2_147_483_647, Math.max(0, demo.reminderAt - Date.now())))
    window.addEventListener('focus', deliver)
    // Poll as a fallback for very long schedules.
    const polling = window.setInterval(deliver, 60_000)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(polling)
      window.removeEventListener('focus', deliver)
    }
  }, [demo])
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [notice])
  const group = route.page === 'group' ? route.id : undefined
  const friend = route.page === 'friend' ? route.id : undefined
  const title = route.page === 'group' ? groupName(route.id) : route.page === 'friend' ? people[route.id].name : pages[route.page].name
  const scoped = group ? entries.filter(entry => entry.group === group) : entries
  const rows = contacts(role).filter(id => (!friend || friend === id) && (!group || groups[group].members.includes(id)))
    .map(id => ({ id, cents: balance(scoped, role, id) }))
  const owed = rows.reduce((total, row) => total + Math.max(0, row.cents), 0)
  const owe = rows.reduce((total, row) => total + Math.max(0, -row.cents), 0)
  const visible = scoped.filter(entry => {
    const involvesRole = entry.kind === 'payment'
      ? entry.from === role || entry.to === role
      : entry.payer === role || entry.shares.some(share => share.person === role)
    if (!involvesRole && !(entry.group !== 'personal' && groups[entry.group].members.includes(role))) return false
    if (route.page === 'expenses') return entry.kind === 'expense'
    if (route.page === 'payments') return entry.kind === 'payment'
    if (!friend) return true
    return entry.kind === 'payment'
      ? [entry.from, entry.to].includes(friend) && [entry.from, entry.to].includes(role)
      : (entry.payer === role && entry.shares.some(share => share.person === friend)) ||
        (entry.payer === friend && entry.shares.some(share => share.person === role))
  }).sort((a, b) => b.date.localeCompare(a.date))
  const chicago = entries.filter(entry => entry.group === 'trip')
  const followRole = role === 'me' || role === 'sam' ? role : undefined
  const counterparty = role === 'me' ? 'sam' : 'me'
  const chicagoBalance = balance(chicago, role, counterparty)
  const due = outstanding(entries)
  const paymentInProgress = lastEvent?.kind === 'reported' || lastEvent?.kind === 'missing' || lastEvent?.kind === 'reminder'
  const paymentStatus = lastEvent?.kind === 'reported' ? 'Awaiting Sam’s confirmation'
    : lastEvent?.kind === 'missing' ? 'Receipt not confirmed'
    : lastEvent?.kind === 'reminder' ? 'Reminder sent'
    : demo.reminderAt !== undefined && role === 'sam' ? 'Reminder scheduled'
    : lastEvent?.kind === 'confirmed' ? 'Payment recorded' : ''
  function close() {
    setOverlay(null)
    setPaymentPartner(undefined)
  }
  function openPayment(partner?: Person) {
    setPaymentPartner(partner)
    setOverlay('payment')
  }
  const mayEditExpense = (expense: Expense, state: Demo) =>
    expense.payer === role && state.splitRequests?.[expense.id]?.at(-1)?.status !== 'pending'

  function closeDetail() {
    setEditingExpense(false)
    setDetailId(null)
  }

  function saveExpenseEdit(revised: Expense) {
    setDemo(current => ({
      ...current,
      entries: current.entries.map(entry => entry.kind === 'expense' && entry.id === revised.id &&
        mayEditExpense(entry, current) ? revised : entry),
    }))
    setEditingExpense(false)
    setNotice('Expense updated.')
  }

  function submitSplit(expenseId: string, shares: Expense['shares'], note: string) {
    setDemo(current => {
      const expense = current.entries.find(entry => entry.id === expenseId)
      if (expense?.kind !== 'expense' || !canEditSplit(expense, role)) return current
      const proposed = validateSplit(expense, shares)
      if (!proposed) return current
      const requests = current.splitRequests?.[expenseId] ?? []
      const pending = requests.at(-1)?.status === 'pending'
      if (role === expense.payer) {
        return {
          ...current,
          entries: current.entries.map(entry => entry.id === expenseId ? applySplit(expense, proposed) : entry),
          splitRequests: pending ? { ...current.splitRequests, [expenseId]: requests.map(request =>
            request.status === 'pending' ? { ...request, status: 'superseded' } : request) } : current.splitRequests,
        }
      }
      if (pending) return current
      const correction: Correction = { before: expense.shares, proposed, requester: role, note: note.trim().slice(0, 300), status: 'pending' }
      return { ...current, splitRequests: { ...current.splitRequests, [expenseId]: [...requests, correction] } }
    })
  }

  function decideCorrection(expenseId: string, status: 'approved' | 'declined') {
    setDemo(current => {
      const expense = current.entries.find(entry => entry.id === expenseId)
      const history = current.splitRequests?.[expenseId] ?? []
      const pending = history.at(-1)
      if (expense?.kind !== 'expense' || expense.payer !== role || pending?.status !== 'pending') return current
      const proposed = status === 'approved' ? validateSplit(expense, pending.proposed) : undefined
      if (status === 'approved' && !proposed) return current
      const updated = proposed
        ? current.entries.map(entry => entry.id === expenseId ? applySplit(expense, proposed) : entry)
        : current.entries
      return { ...current, entries: updated,
        splitRequests: { ...current.splitRequests, [expenseId]: [...history.slice(0, -1), { ...pending, status }] } }
    })
  }
  function save(newEntries: Entry[], message: string) {
    setDemo(current => ({ ...current, entries: [...newEntries, ...current.entries] }))
    close()
    setNotice(message)
  }
  function navigate(next: Route) {
    setFollowOpen(null)
    setBreakdown(null)
    closeDetail()
    setRoute(next)
    setNotice('')
  }

  function switchRole(next: Person) {
    if (next === role) return
    setRole(next)
    setFollowOpen(current => current && (next === 'me' || next === 'sam') ? {} : null)
    setNotice('')
    closeDetail()
    setBreakdown(null)
    scroller.current?.scrollTo(0, 0)
    if (friend === next || (group && !groups[group].members.includes(next))) {
      setRoute({ page: 'group', id: 'trip' })
    }
  }

  const onActivity = route.page === 'activity' || route.page === 'expenses' || route.page === 'payments'
  const onGroups = route.page === 'group' || route.page === 'groups'
  const pendingSplits = visible.flatMap(entry => {
    if (entry.kind !== 'expense') return []
    const request = demo.splitRequests?.[entry.id]?.at(-1)
    return request?.status === 'pending' && (entry.payer === role || request.requester === role)
      ? [{ expense: entry, request }] : []
  })
  const hasPendingReview = entries.some(entry => entry.kind === 'expense' && entry.payer === role &&
    demo.splitRequests?.[entry.id]?.at(-1)?.status === 'pending')
  const groupList = groupIds.filter(id => groups[id].members.includes(role))
  return <div className="phone">
    <header className="topbar"><div className="top-inner">
      <button className="brand" onClick={() => navigate({ page: 'groups' })}><span className="brand-icon"><Icon name="logo" size={19}/></span> Shared Ledger</button>
      <label className="role-picker"><Avatar person={role}/><span>View as</span><select value={role} onChange={event => switchRole(event.target.value as Person)}>{(['me', 'sam', 'maya', 'jordan'] as const).map(id => <option key={id} value={id}>{people[id].name}</option>)}</select></label>
    </div></header>
    <main ref={scroller} className="scroll-area">
      <div key={screen} className="screen">
        {followOpen && followRole ? <Conversation key={role} demo={demo} role={followRole} switchRole={switchRole} initialAction={followOpen.action}
          schedule={at => setDemo(current => setReminder(current, followRole, at))}
          send={event => setDemo(current => addEvent(current, followRole, event))}
          back={() => navigate({ page: 'group', id: 'trip' })}
          history={() => navigate({ page: 'payments' })}
        /> : breakdown ? <Breakdown actor={role} friend={breakdown} entries={scoped} origin={title}
          back={() => setBreakdown(null)} settle={() => openPayment(breakdown)} openExpense={setDetailId}
        /> : route.page === 'groups' ? <>
          <div className="page-heading"><h1>Groups</h1></div>
          <ul className="activity panel">{groupList.map(id => <li key={id}><button className="activity-row" onClick={() => navigate({ page: 'group', id })}>
            <span className="entry-icon"><Icon name={groups[id].icon}/></span>
            <span className="row-title"><strong>{groupName(id)}</strong><span>{groups[id].members.length} people</span></span>
            <Icon name="chevron" size={16}/>
          </button></li>)}</ul>
        </> : route.page === 'account' ? <>
          <div className="page-heading"><h1>Account</h1></div>
          <section className="panel account-panel">
            <div className="account-person"><Avatar person={role}/><strong>{people[role].name}</strong></div>
            <button className="activity-row" onClick={() => setOverlay('reset')}><span className="entry-icon"><Icon name="reset"/></span><span className="row-title"><strong>Reset demo</strong></span><Icon name="chevron" size={16}/></button>
          </section>
        </> : <>
        <div className={group ? 'page-heading group-heading' : 'page-heading'}>
          {group && <button className="back-link" onClick={() => navigate({ page: 'groups' })}><Icon name="back" size={18}/> Groups</button>}
          <div className="heading-body">
            {group && <span className="group-icon"><Icon name={groups[group].icon} size={24}/></span>}
            <div><h1>{title}</h1>
              {group && <div className="members"><div className="avatar-stack">{groups[group].members.map(id => <Avatar key={id} person={id}/>)}</div><span>{groups[group].members.length} people</span></div>}
              {friend && <p className="muted">Shared expenses and payments</p>}
            </div>
          </div>
        </div>
        {onActivity && <nav className="activity-filter" aria-label="Filter activity">
          {([{ page: 'activity', label: 'All activity' }, { page: 'expenses', label: 'Expenses' }, { page: 'payments', label: 'Payments' }] as const).map(filter =>
            <button key={filter.page} aria-current={route.page === filter.page ? 'page' : undefined} onClick={() => navigate({ page: filter.page })}>{filter.label}</button>
          )}
        </nav>}
        {group === 'trip' && followRole && <section className="settlement-card" aria-label="Balance with Alex or Sam">
          <div className="balance-focus">
            <h2>{balanceLabel(counterparty, chicagoBalance)} <span key={chicagoBalance} className="balance-amount">{money(Math.abs(chicagoBalance))}</span></h2>
            {paymentStatus && <p className="status-label"><Icon name={due === 0 ? 'check' : 'clock'} size={15}/>{paymentStatus}</p>}
          </div>
          <div className="settlement-actions">
            <button className="button secondary" onClick={() => setBreakdown(counterparty)}><Icon name="receipt"/>View breakdown</button>
            {role === 'sam' && due > 0 && !paymentInProgress && <button className="button primary" onClick={() => setFollowOpen({ action: 'remind' })}><Icon name="bell"/>{demo.reminderAt === undefined ? 'Remind Alex' : 'Manage reminder'}</button>}
          </div>
          <div className="settlement-links">
            {due > 0 && <button className="text-action" onClick={() => openPayment(counterparty)}><Icon name="exchange" size={16}/>Settle up</button>}
            <button className="text-action" onClick={() => setFollowOpen({})}><Icon name="clock" size={16}/>Payment follow-up</button>
          </div>
        </section>}
        {!onActivity && (group !== 'trip' || !followRole) && <div className="summary-grid">
          <div className="summary"><span>Total balance</span><strong className={owed >= owe ? 'positive' : 'negative'}>{money(owed - owe)}</strong></div>
          <div className="summary"><span>You owe</span><strong className="negative">{money(owe)}</strong></div>
          <div className="summary"><span>You are owed</span><strong className="positive">{money(owed)}</strong></div>
        </div>}
        {!onActivity && (group !== 'trip' || !followRole) && <button className="button secondary section-action" onClick={() => openPayment(friend)}><Icon name="exchange"/>Settle up</button>}
        {route.page !== 'balances' && <section className="panel activity-panel">
          <header className="panel-heading"><h2>{route.page === 'payments' ? 'Recorded payments' : route.page === 'expenses' ? 'Expense list' : 'Recent activity'}</h2></header>
          {pendingSplits.map(({ expense, request }) => <div key={expense.id} className="pending-correction">
            <span className="entry-icon"><Icon name="edit"/></span>
            <div className="pending-text"><strong>{expense.payer === role ? `${people[request.requester].name} proposed a split` : 'Split awaiting approval'}</strong>
              <p className="small muted">{expense.title}</p></div>
            <button className="button secondary" onClick={() => setDetailId(expense.id)}>{expense.payer === role ? 'Review split' : 'View submitted edit'}</button>
          </div>)}
          <Activity actor={role} entries={visible} onSelect={entry => setDetailId(entry.id)}/>
        </section>}
        {(!onActivity) && <section className="panel">
          <header className="panel-heading"><h2>{group ? 'Group balances' : 'Balances'}</h2></header>
          <div className="balance-grid">
            {([{ label: 'You owe', direction: -1 }, { label: 'You are owed', direction: 1 }]).map(({ label, direction }) => <div key={label} className="balance-column">
              <h3>{label}</h3>
              {rows.filter(row => Math.sign(row.cents) === direction).length === 0 && <p className="muted small">All settled on this side.</p>}
              {rows.filter(row => Math.sign(row.cents) === direction).map(({ id, cents }) => <div key={id} className="balance-actions">
                <button className="balance-row" onClick={() => navigate({ page: 'friend', id })}><Avatar person={id}/><span>{people[id].name}</span><strong className={direction < 0 ? 'negative' : 'positive'}>{money(Math.abs(cents))}</strong><Icon name="chevron" size={14}/></button>
                {(group !== 'trip' || !followRole || id !== counterparty) && <button className="text-action balance-breakdown-link" onClick={() => setBreakdown(id)} aria-label={`View breakdown with ${people[id].name}`}>View breakdown</button>}
              </div>)}
            </div>)}
          </div>
        </section>}
        </>}
      </div>
    </main>
    <nav className="tabbar" aria-label="Main navigation">
      <button aria-current={onGroups ? 'page' : undefined} onClick={() => navigate({ page: 'groups' })}><Icon name="case" size={22}/>Groups</button>
      <button aria-current={route.page === 'balances' || route.page === 'friend' ? 'page' : undefined} onClick={() => navigate({ page: 'balances' })}><Icon name="people" size={22}/>Balances</button>
      <button className="add-tab" onClick={() => setOverlay('expense')}><span><Icon name="plus" size={23}/></span>Add expense</button>
      <button aria-current={onActivity ? 'page' : undefined} onClick={() => navigate({ page: 'activity' })}><span className="tab-icon"><Icon name="clock" size={22}/>{hasPendingReview && <i aria-label="Pending split edit"/>}</span>Activity</button>
      <button aria-current={route.page === 'account' ? 'page' : undefined} onClick={() => navigate({ page: 'account' })}><Icon name="user" size={22}/>Account</button>
    </nav>
    <div className="toast-host" role="status">{notice && <div className="toast"><Icon name="check"/>{notice}</div>}</div>
    {overlay === 'expense' && <Modal title="Add an expense" close={close}><ExpenseForm actor={role} group={group} friend={friend} save={save} close={close}/></Modal>}
    {overlay === 'payment' && <Modal title="Settle up" close={close}><PaymentForm actor={role} entries={entries} group={group} friend={paymentPartner ?? friend} save={save} close={close}/></Modal>}
    {overlay === 'reset' && <Modal title="Reset demo?" close={close}><div className="form"><p>This restores the starting balances and removes split edits, the conversation, and any expenses and payments added during this session.</p><footer className="modal-actions"><button className="button secondary" onClick={close}>Cancel</button><button className="button primary" onClick={() => { setDemo(seedDemo); setRole('me'); navigate({ page: 'group', id: 'trip' }); close(); setNotice('Demo reset.') }}>Reset demo</button></footer></div></Modal>}
    {detail && <Modal title={editingExpense ? 'Edit expense' : detail.kind === 'expense' ? detail.title : 'Payment details'} close={closeDetail}>
      {editingExpense && detail.kind === 'expense'
        ? <EditExpenseForm expense={detail} save={saveExpenseEdit} close={() => setEditingExpense(false)}/>
        : <div className="form">{detail.kind === 'expense' ? <>
        <p className="muted">{groupName(detail.group)} · {detail.date}</p>
        <ExpenseBreakdown actor={role} expense={detail} collapsible/>
        {mayEditExpense(detail, demo) && <button className="button secondary self-start" onClick={() => setEditingExpense(true)}><Icon name="edit"/>Edit expense</button>}
        {canEditSplit(detail, role) && <CorrectionPanel key={detail.id + role} expense={detail} entries={entries}
          role={role} requests={demo.splitRequests?.[detail.id] ?? []}
          submit={(shares, note) => submitSplit(detail.id, shares, note)}
          decide={status => decideCorrection(detail.id, status)}/>}
      </> : <>
        <div className="detail-total">{money(detail.amount)}</div><p className="muted">{groupName(detail.group)} · {detail.date}</p>
        <p>{people[detail.from].name} paid {people[detail.to].name}. Simulated payment.</p>
      </>}
    </div>}</Modal>}
  </div>
}
createRoot(document.getElementById('root')!).render(<App/>)
