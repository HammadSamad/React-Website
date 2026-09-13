import { useEffect, useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatCard from '../../components/dash/StatCard.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { paymentsApi } from '../../lib/api.js';
import { money, paymentMethods, paymentMethodById } from '../../data/hotel.js';
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Collected' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
  { key: 'refunded', label: 'Refunded' },
];
const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Payments() {
  const { invoices, guests, notify, refreshAll } = useData();
  const [payments, setPayments] = useState([]);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ guestId: '', invoiceId: '', amount: '', method: 'cash', transactionId: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [collecting, setCollecting] = useState(false);

  const load = () => paymentsApi.list().then(setPayments).catch(() => setPayments([]));
  useEffect(() => { load(); }, []);

  const gById = useMemo(() => {
    const m = {};
    for (const g of guests) m[g._id || g.id] = g;
    return m;
  }, [guests]);

  const nameOf = (p) => {
    const g = p.guestId;
    if (g?.guestName) return g.guestName;
    if (g?.name) return g.name;
    return gById[p.guestId]?.guestName || gById[p.guestId]?.name || 'Guest';
  };
  const invLabel = (p) => {
    const id = p.invoiceId?._id || p.invoiceId;
    return id ? `#${String(id).slice(-6).toUpperCase()}` : '—';
  };

  const collected = useMemo(() => payments.filter((p) => p.paymentStatus === 'paid').reduce((s, p) => s + (p.amount || 0), 0), [payments]);
  const pending = useMemo(() => payments.filter((p) => p.paymentStatus === 'pending').reduce((s, p) => s + (p.amount || 0), 0), [payments]);
  const counts = useMemo(() => {
    const c = { all: payments.length };
    for (const p of payments) c[p.paymentStatus] = (c[p.paymentStatus] || 0) + 1;
    return c;
  }, [payments]);

  const guestInvoices = useMemo(() => {
    if (!form.guestId) return [];
    const gid = form.guestId;
    return invoices.filter((i) => String(i.guestId?._id || i.guestId) === String(gid));
  }, [form.guestId, invoices]);

  const filtered = useMemo(() => payments.filter((p) => {
    if (tab !== 'all' && p.paymentStatus !== tab) return false;
    if (!q) return true;
    const hay = `${nameOf(p)} ${invLabel(p)} ${paymentMethodById[p.paymentMethod]?.label || p.paymentMethod || ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [payments, tab, q]);

  const selectGuest = (gid) => {
    const firstInv = invoices.find((i) => String(i.guestId?._id || i.guestId) === String(gid));
    setForm({ guestId: gid, invoiceId: firstInv?._id || firstInv?.id || '', amount: firstInv ? Number(firstInv.totalAmount || 0) : '', method: 'cash', transactionId: '' });
  };
  const selectInvoice = (iid) => {
    const inv = invoices.find((i) => (i._id || i.id) === iid);
    setForm((f) => ({ ...f, invoiceId: iid, amount: inv ? Number(inv.totalAmount || 0) : f.amount }));
  };

  const canSave = form.invoiceId && Number(form.amount) > 0 && form.method;

  const submit = async () => {
    if (!canSave) return;
    try {
      await paymentsApi.create({
        invoiceId: form.invoiceId,
        guestId: form.guestId,
        amount: Number(form.amount),
        paymentMethod: form.method,
        paymentStatus: 'paid',
        transactionId: form.transactionId,
      });
      notify('Payment recorded and invoice settled');
      setCreating(false);
      setForm({ guestId: '', invoiceId: '', amount: '', method: 'cash', transactionId: '' });
      await load();
      refreshAll();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const collectStripe = async () => {
    if (!form.invoiceId || !form.guestId || Number(form.amount) <= 0) return notify('Choose a guest, invoice, and amount first.', 'error');
    setCollecting(true);
    try {
      const { url } = await paymentsApi.stripeCheckout({
        guestId: form.guestId,
        invoiceId: form.invoiceId,
        amount: Number(form.amount),
      });
      if (!url) throw new Error('Stripe returned no checkout URL.');
      window.open(url, '_blank', 'noopener,noreferrer');
      setCreating(false);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setCollecting(false);
    }
  };

  const markPaid = async (id) => {
    try {
      await paymentsApi.markPaid(id);
      notify('Payment marked as collected');
      await load();
      refreshAll();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const doRefund = async (id) => {
    try {
      await paymentsApi.refund(id);
      notify('Payment refunded');
      await load();
      refreshAll();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const doDelete = async () => {
    try {
      await paymentsApi.delete(confirmDelete);
      notify('Payment removed');
      setConfirmDelete(null);
      await load();
      refreshAll();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  return (
    <>
      <DashHeader title="Payments" subtitle="Record, collect, refund, and track settlements.">
        <button className="btn btn--sm" onClick={() => setCreating(true)}><Icon name="plus" size={15} /> Record payment</button>
      </DashHeader>

      <div className="kpi-grid">
        <StatCard label="Collected" value={collected} prefix="$" icon="circleCheck" />
        <StatCard label="Pending" value={pending} prefix="$" icon="clock" />
        <StatCard label="Payments" value={payments.length} icon="creditCard" />
      </div>

      <div className="dash-toolbar">
        <div className="dash-search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guest, invoice, or method…" />
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
              <tr><th>Payment</th><th>Invoice</th><th>Guest</th><th className="num">Amount</th><th>Method</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id || p.id}>
                  <td className="td-strong">#{(p._id || p.id || '').slice(-6).toUpperCase()}</td>
                  <td>{invLabel(p)}</td>
                  <td>{nameOf(p)}</td>
                  <td className="num td-strong">{money(p.amount || 0)}</td>
                  <td>{paymentMethodById[p.paymentMethod]?.label || p.paymentMethod || '—'}</td>
                  <td><StatusBadge status={p.paymentStatus} /></td>
                  <td className="td-mut">{fmt(p.paymentDate || p.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      {p.paymentStatus === 'pending' && (
                        <button className="icon-btn" title="Mark as collected" onClick={() => markPaid(p._id || p.id)}><Icon name="check" size={15} /></button>
                      )}
                      {p.paymentStatus === 'paid' && (
                        <button className="icon-btn" title="Refund payment" onClick={() => doRefund(p._id || p.id)}><Icon name="refresh" size={15} /></button>
                      )}
                      <button className="icon-btn icon-btn--danger" title="Delete payment" onClick={() => setConfirmDelete(p._id || p.id)}><Icon name="trash" size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="dash-empty"><Icon name="creditCard" size={30} /><p>No payments match your view.</p></div>}
        </div>
      </section>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Record payment"
        subtitle="Settle an invoice. The invoice is marked paid automatically."
        footer={<>
          <button className="btn btn--outline" onClick={() => setCreating(false)}>Cancel</button>
          <button className="btn" onClick={submit} disabled={!canSave}><Icon name="check" size={15} /> Save payment · {money(Number(form.amount || 0))}</button>
        </>}
      >
        <label className="field">
          <span className="field-label">Guest *</span>
          <select className="select" value={form.guestId} onChange={(e) => selectGuest(e.target.value)}>
            <option value="" disabled>Select guest…</option>
            {guests.map((g) => <option key={g._id || g.id} value={g._id || g.id}>{g.guestName || g.name}</option>)}
          </select>
        </label>
        <label className="field" style={{ marginTop: '1rem' }}>
          <span className="field-label">Invoice *</span>
          <select className="select" value={form.invoiceId} onChange={(e) => selectInvoice(e.target.value)} disabled={!form.guestId}>
            <option value="" disabled>{form.guestId ? 'Select invoice…' : 'Choose a guest first'}</option>
            {guestInvoices.map((i) => (
              <option key={i._id || i.id} value={i._id || i.id}>#{String(i._id || i.id).slice(-6).toUpperCase()} · {money(i.totalAmount || 0)} · {i.paymentStatus}</option>
            ))}
          </select>
        </label>
        <div className="form-grid form-grid--2" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Amount *</span>
            <input className="input" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} /></label>
          <label className="field"><span className="field-label">Method</span>
            <select className="select" value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}>
              {paymentMethods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select></label>
        </div>
        {form.method === 'card' && (
          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn--block" onClick={collectStripe} disabled={collecting}>
              <Icon name="creditCard" size={15} /> {collecting ? 'Opening Stripe…' : 'Collect via Stripe'}
            </button>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--ink-soft, #6b7280)', fontSize: '0.85rem' }}>
              Opens a secure Stripe payment page in a new tab. The payment is recorded automatically when the guest completes it.
            </p>
          </div>
        )}
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Transaction ID</span>
          <input className="input" value={form.transactionId} onChange={(e) => setForm((f) => ({ ...f, transactionId: e.target.value }))} placeholder="Optional reference" /></label>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete payment?"
        subtitle="This removes the payment record and reopens the invoice."
        footer={<>
          <button className="btn btn--outline" onClick={() => setConfirmDelete(null)}>Keep payment</button>
          <button className="btn btn--danger" onClick={doDelete}><Icon name="trash" size={15} /> Delete payment</button>
        </>}
      >
        <p style={{ margin: 0, color: 'var(--ink-soft, #6b7280)', fontSize: '0.95rem' }}>Are you sure you want to delete this payment? The linked invoice will be marked as pending again unless another payment covers it.</p>
      </Modal>
    </>
  );
}