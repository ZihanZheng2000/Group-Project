import { useLayoutEffect, useRef } from 'react'
import { contribution, groupName, money, people, split, type Entry, type Expense, type Person } from './ledger'
import { Avatar, Icon } from './ui'

export function balanceLabel(friend: Person, cents: number) {
  const name = people[friend].name
  if (cents < 0) return `You owe ${name}`
  if (cents > 0) return `${name} owes you`
  return `Settled up with ${name}`
}

function shareOf(amount: number, members: Person[], person: Person) {
  return split(amount, members).find(share => share.person === person)?.cents ?? 0
}

export function ExpenseBreakdown({ actor, expense, effect, collapsible = false }: {
  actor: Person; expense: Expense; effect?: number; collapsible?: boolean
}) {
  const { receipt, payer, amount, shares } = expense
  const names = (members: Person[]) => members.map(person => person === actor ? 'You' : people[person].name).join(', ')
  const included = shares.filter(share => share.cents > 0)
  const members = included.map(share => share.person)
  const equal = split(amount, members)
  const itemizedShares = included.every((share, index) => equal[index].cents === share.cents)
  const subtotal = receipt?.items.reduce((total, item) => total + item.amount, 0) ?? 0
  const lineShare = (end: number, start: number) => shareOf(end, members, actor) - shareOf(start, members, actor)
  const personalShare = shares.find(share => share.person === actor)?.cents ?? 0
  const breakdown = receipt ? <>
      <h3>Itemized receipt</h3>
      <table className="receipt-table">
        <thead><tr><th scope="col">Item</th><th scope="col">Bill total</th>{itemizedShares && <th scope="col">Your share</th>}</tr></thead>
        <tbody>
          {receipt.items.map((item, index) => {
            const start = receipt.items.slice(0, index).reduce((total, previous) => total + previous.amount, 0)
            return <tr key={item.label}><th scope="row">{item.label}<small>Shared by {names(item.members)}</small></th><td>{money(item.amount)}</td>{itemizedShares && <td>{money(lineShare(start + item.amount, start))}</td>}</tr>
          })}
          <tr><th scope="row">Subtotal</th><td>{money(subtotal)}</td>{itemizedShares && <td>{money(shareOf(subtotal, members, actor))}</td>}</tr>
          <tr><th scope="row">Tax</th><td>{money(receipt.tax)}</td>{itemizedShares && <td>{money(lineShare(subtotal + receipt.tax, subtotal))}</td>}</tr>
          <tr><th scope="row">Tip</th><td>{money(receipt.tip)}</td>{itemizedShares && <td>{money(lineShare(amount, subtotal + receipt.tax))}</td>}</tr>
        </tbody>
        <tfoot><tr><th scope="row">Total</th><td>{money(amount)}</td>{itemizedShares && <td>{money(personalShare)}</td>}</tr></tfoot>
      </table>
      <h3 className="mt-3">Expense split</h3>
      <dl className="detail-shares">{shares.map(share => <div key={share.person} className="flex justify-between border-t border-gray-200 py-2"><dt>{names([share.person])}</dt><dd>{money(share.cents)}</dd></div>)}</dl>
    </> : <>
      <p className="muted">No itemized receipt available.</p>
      <h3>Expense split</h3>
      <dl className="detail-shares">{shares.map(share => <div key={share.person} className="flex justify-between border-t border-gray-200 py-2"><dt>{names([share.person])}</dt><dd>{money(share.cents)}</dd></div>)}</dl>
    </>
  return <div className="expense-breakdown">
    <dl className="receipt-facts">
      <div><dt>Paid by</dt><dd>{payer === actor ? 'You' : people[payer].name}</dd></div>
      <div><dt>Full expense</dt><dd>{money(amount)}</dd></div>
      <div><dt>Your share</dt><dd>{money(personalShare)}</dd></div>
    </dl>
    {collapsible ? <details className="expense-disclosure">
      <summary className="text-action">
        <Icon name="receipt" size={16}/>
        <span className="disclosure-show">View breakdown</span>
        <span className="disclosure-hide">Hide breakdown</span>
        <span className="entry-chevron"><Icon name="chevron" size={15}/></span>
      </summary>
      <div className="expense-disclosure-content">{breakdown}</div>
    </details> : breakdown}
    {effect !== undefined && <p className="small muted">Effect on your balance: {effect < 0 ? '+' : '−'}{money(Math.abs(effect))}</p>}
  </div>
}

export function Breakdown({ actor, friend, entries, origin, back, settle, openExpense }: {
  actor: Person; friend: Person; entries: Entry[]; origin: string; back: () => void; settle: () => void; openExpense: (id: string) => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => heading.current?.focus(), [])
  const rows = entries.map(entry => ({ entry, effect: contribution(entry, actor, friend) }))
    .filter(row => row.effect !== 0).sort((a, b) => b.entry.date.localeCompare(a.entry.date))
  const net = rows.reduce((sum, row) => sum + row.effect, 0)
  const firstName = people[friend].name.split(' ')[0]
  return <>
    <button className="text-action breakdown-back" onClick={back}><span aria-hidden="true">←</span> Back to {origin}</button>
    <div className="page-heading">
      <div><h1 ref={heading} tabIndex={-1}>Balance breakdown</h1><p className="muted">{people[friend].name}</p></div>
      {net < 0 && <button className="button primary" onClick={settle}><Icon name="exchange"/>Settle up with {firstName}</button>}
    </div>
    <section className="breakdown-total" aria-label="Current net balance">
      <Avatar person={friend}/><strong>{balanceLabel(friend, net)}</strong><span className={net < 0 ? 'negative' : 'positive'}>{money(Math.abs(net))}</span>
    </section>
    <section className="panel">
      <header className="panel-heading"><h2>What makes up this balance</h2><span className="muted small">Effect on what you owe</span></header>
      {rows.length === 0 && <p className="empty">No shared expenses or payments yet.</p>}
      {rows.map(({ entry, effect }) => {
        const impact = <strong className={effect < 0 ? 'negative' : 'positive'}>{effect < 0 ? '+' : '−'}{money(Math.abs(effect))}</strong>
        const context = <small>{groupName(entry.group)} · {entry.date}</small>
        if (entry.kind === 'payment') return <div className="breakdown-row" key={entry.id}>
          <span className="entry-icon payment-icon"><Icon name="exchange"/></span>
          <span className="breakdown-row-title"><strong>{entry.from === actor ? `You paid ${firstName}` : `${firstName} paid you`}</strong>{context}</span>
          <span className="breakdown-impact">{impact}</span>
        </div>
        return <details key={entry.id} className="breakdown-entry">
          <summary className="breakdown-row">
            <span className="entry-icon"><Icon name="receipt"/></span>
            <span className="breakdown-row-title"><strong>{entry.title}</strong>{context}<small>{effect < 0 ? `You owe ${firstName}` : `${firstName} owes you · Credit`}</small></span>
            <span className="breakdown-impact">{impact}</span>
            <span className="entry-chevron"><Icon name="chevron" size={15}/></span>
          </summary>
          <ExpenseBreakdown actor={actor} expense={entry} effect={effect}/>
          <button className="text-action expense-detail-link" onClick={() => openExpense(entry.id)}>Open {entry.title} details <Icon name="arrow" size={16}/></button>
        </details>
      })}
      <footer className="breakdown-footer"><strong>Net amount</strong><span>{balanceLabel(friend, net)} <strong>{money(Math.abs(net))}</strong></span></footer>
    </section>
  </>
}
