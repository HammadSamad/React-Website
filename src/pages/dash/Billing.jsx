import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { guestById, money, invoiceTotals, hotelInfo } from '../../data/hotel.js';
import './Billing.css';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
];
const fmt = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Billing() {
  const { invoices, markInvoicePaid, addInvoice, guests, settings } = useData();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [active, setActive] = useState(null);
  const [creating, setCreating] = useState(false);
  const [invGuest, setInvGuest] = useState('');
  const [lines, setLines] = useState([{ label: '', amount: '' }]);

  const gById = useMemo(() => {
    const m = { ...guestById };
    for (const g of guests) m[g.id] = g;
    return m;
  }, [guests]);
  const nameOf = (inv) => gById[inv.guestId]?.name || 'Guest';

  const counts = useMemo(() => {
    const c = { all: invoices.length };
    for (const i of invoices) c[i.status] = (c[i.status] || 0) + 1;
    return c;
  }, [invoices]);

  const outstanding = useMemo(
    () => invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + invoiceTotals(i.items, settings.taxRate).total, 0),
    [invoices, settings.taxRate]
  );

  const filtered = useMemo(() => invoices.filter((inv) => {
    if (tab !== 'all' && inv.status !== tab) return false;
    if (!q) return true;
    return `${inv.number} ${nameOf(inv)}`.toLowerCase().includes(q.toLowerCase());
  }), [invoices, tab, q]);

  const inv = active ? invoices.find((i) => i.id === active) : null;
  const totals = inv ? invoiceTotals(inv.items, settings.taxRate) : null;

  const setLine = (i, key, val) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [key]: val } : l)));
  const addLine = () => setLines((ls) => [...ls, { label: '', amount: '' }]);
  const removeLine = (i) => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls));
  const cleanItems = lines
    .map((l) => ({ label: l.label.trim(), amount: Math.round(Number(l.amount) || 0) }))
    .filter((l) => l.label && l.amount > 0);
  const createTotals = invoiceTotals(cleanItems, settings.taxRate);
  const canCreate = invGuest && cleanItems.length > 0;
  const submitInvoice = () => {
    if (!canCreate) return;
    addInvoice({ guestId: invGuest, items: cleanItems });
    setCreating(false);
    setInvGuest('');
    setLines([{ label: '', amount: '' }]);
  };

  return (
    <>
      <DashHeader title="Billing" subtitle="Invoices, folios, and settlement.">
        <div className="billing-head-actions">
          <div className="billing-outstanding">
            <span className="billing-outstanding__l">Outstanding</span>
            <span className="billing-outstanding__v">{money(outstanding)}</span>
          </div>
          <button className="btn btn--sm" onClick={() => setCreating(true)}><Icon name="plus" size={15} /> New invoice</button>
        </div>
      </DashHeader>

      <div className="dash-toolbar">
        <div className="dash-search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice or guest…" />
        </div>
        <div className="seg">
          {TABS.map((t) => (
            <button key={t.key} className={`seg__btn ${tab === t.key ? 'is-active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}<span className="seg__count">{counts[t.key] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="panel panel--flush">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>Invoice</th><th>Guest</th><th>Issued</th><th className="num">Items</th><th className="num">Total</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => {
                const t = invoiceTotals(invoice.items, settings.taxRate);
                return (
                  <tr key={invoice.id}>
                    <td className="td-strong">{invoice.number}</td>
                    <td>{nameOf(invoice)}</td>
                    <td className="td-mut">{fmt(invoice.issued)}</td>
                    <td className="num td-mut">{invoice.items.length}</td>
                    <td className="num td-strong">{money(t.total)}</td>
                    <td><StatusBadge status={invoice.status} /></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn--sm btn--ghost" onClick={() => setActive(invoice.id)}>View</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="dash-empty"><Icon name="receipt" size={30} /><p>No invoices found.</p></div>}
        </div>
      </section>

      <Modal
        open={!!inv}
        onClose={() => setActive(null)}
        wide
        title="Invoice"
        subtitle={inv?.number}
        footer={inv && <>
          <button className="btn btn--outline" onClick={() => window.print()}><Icon name="print" size={15} /> Print</button>
          {inv.status === 'pending'
            ? <button className="btn" onClick={() => { markInvoicePaid(inv.id); }}><Icon name="check" size={15} /> Mark paid</button>
            : <button className="btn" disabled><Icon name="circleCheck" size={15} /> Settled</button>}
        </>}
      >
        {inv && (
          <div className="invoice-doc">
            <div className="invoice-doc__top">
              <div>
                <div className="invoice-doc__brand">{hotelInfo.name}</div>
                <div className="invoice-doc__addr">{hotelInfo.address}<br />{hotelInfo.city}</div>
              </div>
              <div className="invoice-doc__meta">
                <div className="invoice-doc__word">Invoice</div>
                <div className="invoice-doc__num">{inv.number}</div>
                <div className="invoice-doc__date">Issued {fmt(inv.issued)}</div>
                <StatusBadge status={inv.status} />
              </div>
            </div>

            <div className="invoice-doc__billed">
              <span className="invoice-doc__k">Billed to</span>
              <div className="invoice-doc__guest">{nameOf(inv)}</div>
              <div className="invoice-doc__gsub">{gById[inv.guestId]?.email} · {gById[inv.guestId]?.country}</div>
            </div>

            <table className="invoice-lines">
              <thead><tr><th>Description</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {inv.items.map((it, i) => (
                  <tr key={i}><td>{it.label}</td><td className="num">{money(it.amount)}</td></tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-totals">
              <div className="invoice-totals__row"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
              <div className="invoice-totals__row"><span>Tax &amp; service ({settings.taxRate}%)</span><span>{money(totals.tax)}</span></div>
              <div className="invoice-totals__row invoice-totals__row--grand"><span>Total</span><span>{money(totals.total)}</span></div>
            </div>

            <p className="invoice-doc__foot">Thank you for staying with {hotelInfo.full}. We look forward to welcoming you again.</p>
          </div>
        )}
      </Modal>

      {/* Create invoice */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        wide
        title="New invoice"
        subtitle="Draft a folio and add line items."
        footer={<>
          <button className="btn btn--outline" onClick={() => setCreating(false)}>Cancel</button>
          <button className="btn" onClick={submitInvoice} disabled={!canCreate}>Create invoice</button>
        </>}
      >
        <label className="field inv-create__guest">
          <span className="field-label">Guest</span>
          <select className="select" value={invGuest} onChange={(e) => setInvGuest(e.target.value)}>
            <option value="" disabled>Select a guest…</option>
            {guests.map((g) => <option key={g.id} value={g.id}>{g.name}{g.vip ? ' · VIP' : ''}</option>)}
          </select>
        </label>

        <span className="field-label">Line items</span>
        <div className="inv-lines">
          {lines.map((l, i) => (
            <div className="inv-line" key={i}>
              <input className="input" value={l.label} onChange={(e) => setLine(i, 'label', e.target.value)} placeholder="Description — e.g. Garden Deluxe × 3 nights" />
              <input className="input" type="number" min="0" value={l.amount} onChange={(e) => setLine(i, 'amount', e.target.value)} placeholder="Amount" />
              <button type="button" className="inv-line__del" onClick={() => removeLine(i)} disabled={lines.length === 1} title="Remove line"><Icon name="trash" size={15} /></button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn--sm btn--ghost inv-add-line" onClick={addLine}><Icon name="plus" size={14} /> Add line</button>

        <div className="inv-create__totals">
          <div className="inv-create__row"><span>Subtotal</span><span>{money(createTotals.subtotal)}</span></div>
          <div className="inv-create__row"><span>Tax &amp; service ({settings.taxRate}%)</span><span>{money(createTotals.tax)}</span></div>
          <div className="inv-create__row inv-create__row--grand"><span>Total</span><span>{money(createTotals.total)}</span></div>
        </div>
      </Modal>
    </>
  );
}
