import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { money, hotelInfo, paymentMethods } from '../../data/hotel.js';
import { invoicesApi, paymentsApi } from '../../lib/api.js';
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
];
const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Billing() {
  const { invoices, setInvoices, guests, settings, notify, refreshAll } = useData();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [active, setActive] = useState(null);
  const [creating, setCreating] = useState(false);
  const [invGuest, setInvGuest] = useState('');
  const [charges, setCharges] = useState({ roomCharges: '', foodCharges: '', laundryCharges: '', otherCharges: '', tax: '' });
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash' });

  const gById = useMemo(() => {
    const m = {};
    for (const g of guests) m[g._id || g.id] = g;
    return m;
  }, [guests]);
  const nameOf = (inv) => {
    const g = inv.guestId;
    if (g?.guestName) return g.guestName;
    if (g?.name) return g.name;
    return gById[inv.guestId]?._id ? (gById[inv.guestId].guestName || gById[inv.guestId].name) : 'Guest';
  };

  const counts = useMemo(() => {
    const c = { all: invoices.length };
    for (const i of invoices) c[i.paymentStatus] = (c[i.paymentStatus] || 0) + 1;
    return c;
  }, [invoices]);

  const outstanding = useMemo(
    () => invoices.filter((i) => i.paymentStatus === 'pending').reduce((s, i) => s + (i.totalAmount || 0), 0),
    [invoices]
  );

  const filtered = useMemo(() => invoices.filter((inv) => {
    if (tab !== 'all' && inv.paymentStatus !== tab) return false;
    if (!q) return true;
    return `${nameOf(inv)} ${(inv._id || inv.id || '').slice(-6)}`.toLowerCase().includes(q.toLowerCase());
  }), [invoices, tab, q]);

  const inv = active ? invoices.find((i) => (i._id || i.id) === active) : null;

  const setCharge = (key, val) => setCharges((c) => ({ ...c, [key]: val }));
  const totalCharges = Number(charges.roomCharges || 0) + Number(charges.foodCharges || 0) + Number(charges.laundryCharges || 0) + Number(charges.otherCharges || 0) + Number(charges.tax || 0);
  const canCreate = invGuest && totalCharges > 0;
  const submitInvoice = async () => {
    if (!canCreate) return;
    try {
      const payload = {
        guestId: invGuest,
        roomCharges: Number(charges.roomCharges || 0),
        foodCharges: Number(charges.foodCharges || 0),
        laundryCharges: Number(charges.laundryCharges || 0),
        otherCharges: Number(charges.otherCharges || 0),
        tax: Number(charges.tax || 0),
      };
      await invoicesApi.create(payload);
      refreshAll();
      setCreating(false);
      setInvGuest('');
      setCharges({ roomCharges: '', foodCharges: '', laundryCharges: '', otherCharges: '', tax: '' });
      notify('Invoice created');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const submitPayment = async (invoiceId) => {
    try {
      const invoice = invoices.find((i) => (i._id || i.id) === invoiceId);
      const guestId = invoice?.guestId?._id || invoice?.guestId;
      if (!guestId) {
        notify('This invoice has no guest. Add or refresh the invoice first.', 'error');
        return;
      }
      await paymentsApi.create({ invoiceId, guestId, amount: Number(paymentForm.amount), paymentMethod: paymentForm.method, paymentStatus: 'paid' });
      notify('Payment recorded');
      setPaymentModal(null);
      setPaymentForm({ amount: '', method: 'cash' });
      refreshAll();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const downloadPdf = async (id) => {
    try {
      const blob = await invoicesApi.downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `invoice-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      notify('PDF downloaded');
    } catch (e) {
      notify(e.message, 'error');
    }
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
              <tr><th>Invoice</th><th>Guest</th><th>Issued</th><th className="num">Total</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr key={invoice._id || invoice.id}>
                  <td className="td-strong">#{(invoice._id || invoice.id || '').slice(-6).toUpperCase()}</td>
                  <td>{nameOf(invoice)}</td>
                  <td className="td-mut">{fmt(invoice.createdAt)}</td>
                  <td className="num td-strong">{money(invoice.totalAmount || 0)}</td>
                  <td><StatusBadge status={invoice.paymentStatus} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn--sm btn--ghost" onClick={() => setActive(invoice._id || invoice.id)}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
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
        subtitle={`#${(inv?._id || inv?.id || '').slice(-6).toUpperCase()}`}
        footer={inv && <>
          <button className="btn btn--outline" onClick={() => downloadPdf(inv._id || inv.id)}><Icon name="download" size={15} /> Download PDF</button>
          {inv.paymentStatus === 'pending'
            ? <button className="btn" onClick={() => { setPaymentModal(inv._id || inv.id); setPaymentForm({ amount: '', method: 'cash' }); }}><Icon name="creditCard" size={15} /> Add payment</button>
            : <button className="btn" disabled><Icon name="circleCheck" size={15} /> Settled</button>}
          {inv.paymentStatus === 'pending'
            ? <button className="btn" onClick={() => { const invId = inv._id || inv.id; invoicesApi.updatePaymentStatus(invId, 'paid').then(() => refreshAll()).catch(() => {}); }}><Icon name="check" size={15} /> Mark paid</button>
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
                <div className="invoice-doc__num">#{(inv._id || inv.id || '').slice(-6).toUpperCase()}</div>
                <div className="invoice-doc__date">Issued {fmt(inv.createdAt)}</div>
                <StatusBadge status={inv.paymentStatus} />
              </div>
            </div>

            <div className="invoice-doc__billed">
              <span className="invoice-doc__k">Billed to</span>
              <div className="invoice-doc__guest">{nameOf(inv)}</div>
              <div className="invoice-doc__gsub">{inv.guestId?.guestEmail || gById[inv.guestId]?.guestEmail || ''} · {inv.guestId?.guestCountry || gById[inv.guestId]?.guestCountry || ''}</div>
            </div>

            <table className="invoice-lines">
              <thead><tr><th>Description</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {inv.roomCharges > 0 && <tr><td>Room charges</td><td className="num">{money(inv.roomCharges)}</td></tr>}
                {inv.foodCharges > 0 && <tr><td>Food & beverage</td><td className="num">{money(inv.foodCharges)}</td></tr>}
                {inv.laundryCharges > 0 && <tr><td>Laundry</td><td className="num">{money(inv.laundryCharges)}</td></tr>}
                {inv.otherCharges > 0 && <tr><td>Other charges</td><td className="num">{money(inv.otherCharges)}</td></tr>}
                {inv.tax > 0 && <tr><td>Tax & service</td><td className="num">{money(inv.tax)}</td></tr>}
              </tbody>
            </table>

            <div className="invoice-totals">
              <div className="invoice-totals__row invoice-totals__row--grand"><span>Total</span><span>{money(inv.totalAmount || 0)}</span></div>
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
        subtitle="Create an invoice with charge breakdown."
        footer={<>
          <button className="btn btn--outline" onClick={() => setCreating(false)}>Cancel</button>
          <button className="btn" onClick={submitInvoice} disabled={!canCreate}>Create invoice</button>
        </>}
      >
        <label className="field inv-create__guest">
          <span className="field-label">Guest *</span>
          <select className="select" value={invGuest} onChange={(e) => setInvGuest(e.target.value)}>
            <option value="" disabled>Select a guest…</option>
            {guests.map((g) => <option key={g._id || g.id} value={g._id || g.id}>{g.guestName || g.name}{g.vip ? ' · VIP' : ''}</option>)}
          </select>
        </label>

        <div className="form-grid form-grid--2" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Room charges</span>
            <input className="input" type="number" min="0" value={charges.roomCharges} onChange={(e) => setCharge('roomCharges', e.target.value)} placeholder="0" /></label>
          <label className="field"><span className="field-label">Food & beverage</span>
            <input className="input" type="number" min="0" value={charges.foodCharges} onChange={(e) => setCharge('foodCharges', e.target.value)} placeholder="0" /></label>
        </div>
        <div className="form-grid form-grid--2" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Laundry</span>
            <input className="input" type="number" min="0" value={charges.laundryCharges} onChange={(e) => setCharge('laundryCharges', e.target.value)} placeholder="0" /></label>
          <label className="field"><span className="field-label">Other charges</span>
            <input className="input" type="number" min="0" value={charges.otherCharges} onChange={(e) => setCharge('otherCharges', e.target.value)} placeholder="0" /></label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Tax</span>
          <input className="input" type="number" min="0" value={charges.tax} onChange={(e) => setCharge('tax', e.target.value)} placeholder="0" /></label>

        <div className="inv-create__totals" style={{ marginTop: '1.5rem' }}>
          <div className="inv-create__row inv-create__row--grand"><span>Total</span><span>{money(totalCharges)}</span></div>
        </div>
      </Modal>

      {/* Payment modal */}
      <Modal
        open={!!paymentModal}
        onClose={() => setPaymentModal(null)}
        title="Record payment"
        subtitle="Add a payment against this invoice."
        footer={<>
          <button className="btn btn--outline" onClick={() => setPaymentModal(null)}>Cancel</button>
          <button className="btn" onClick={() => paymentModal && submitPayment(paymentModal)} disabled={!paymentForm.amount || Number(paymentForm.amount) <= 0}>Save payment</button>
        </>}
      >
        <label className="field"><span className="field-label">Amount *</span>
          <input className="input" type="number" min="0" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></label>
        <label className="field"><span className="field-label">Method</span>
          <select className="select" value={paymentForm.method} onChange={(e) => setPaymentForm((f) => ({ ...f, method: e.target.value }))}>
            {paymentMethods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select></label>
      </Modal>
    </>
  );
}
