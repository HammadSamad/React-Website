import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/site/PageHero.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { myBillingApi } from '../../lib/api.js';
import { money, paymentMethods, paymentMethodById } from '../../data/hotel.js';
import { img } from '../../lib/images.js';
const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};
const refOf = (id) => `#${String(id || '').slice(-6).toUpperCase()}`;
const totalOf = (inv) =>
  (inv && inv.totalAmount != null)
    ? Number(inv.totalAmount)
    : (inv?.roomCharges || 0) + (inv?.foodCharges || 0) + (inv?.laundryCharges || 0) + (inv?.otherCharges || 0) + (inv?.tax || 0);
const invIdOf = (p) => p?.invoiceId?._id || p?.invoiceId;

export default function Billing() {
  const { user } = useAuth();
  const { notify } = useData();
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [payMethod, setPayMethod] = useState('card');
  const [payAmount, setPayAmount] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [invTab, setInvTab] = useState('all');
  const [payTab, setPayTab] = useState('all');

  const load = () => {
    setLoading(true);
    Promise.all([myBillingApi.invoices(), myBillingApi.payments()])
      .then(([inv, pay]) => { setInvoices(inv); setPayments(pay); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const paid = new URLSearchParams(window.location.search).get('paid');
    if (paid) {
      notify('Your payment was received. Thank you.', 'success');
      window.history.replaceState({}, '', window.location.pathname);
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paidFor = useMemo(() => {
    const m = {};
    for (const p of payments) {
      if (p.paymentStatus !== 'paid') continue;
      const k = String(invIdOf(p) || '');
      m[k] = (m[k] || 0) + Number(p.amount || 0);
    }
    return m;
  }, [payments]);
  const pendingFor = useMemo(() => {
    const m = {};
    for (const p of payments) {
      if (p.paymentStatus !== 'pending') continue;
      const k = String(invIdOf(p) || '');
      m[k] = (m[k] || 0) + Number(p.amount || 0);
    }
    return m;
  }, [payments]);
  const dueOf = (inv) => Math.max(0, Math.round((totalOf(inv) - (paidFor[String(inv._id)] || 0)) * 100) / 100);

  const outstanding = invoices.reduce((s, i) => s + dueOf(i), 0);
  const openInvoice = invoices.find((i) => i._id === payingId);
  const due = openInvoice ? dueOf(openInvoice) : 0;

  const INV_TABS = [
    { id: 'all', label: 'All' },
    { id: 'paid', label: 'Paid' },
    { id: 'pending', label: 'Pending' },
    { id: 'cancelled', label: 'Cancelled' },
  ];
  const PAY_TABS = [
    { id: 'all', label: 'All' },
    { id: 'paid', label: 'Paid' },
    { id: 'pending', label: 'Pending' },
    { id: 'failed', label: 'Failed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];
  const invStatus = (inv) => inv.paymentStatus || 'pending';
  const countInv = (id) => (id === 'all' ? invoices.length : invoices.filter((i) => invStatus(i) === id).length);
  const countPay = (id) => (id === 'all' ? payments.length : payments.filter((p) => (p.paymentStatus || 'pending') === id).length);
  const visibleInvoices = invTab === 'all' ? invoices : invoices.filter((i) => invStatus(i) === invTab);
  const visiblePayments = payTab === 'all' ? payments : payments.filter((p) => (p.paymentStatus || 'pending') === payTab);

  const openPay = (inv) => {
    setPayingId(inv._id);
    const d = dueOf(inv);
    setPayAmount(d > 0 ? String(d) : '');
    setPayMethod('card');
    setTxnRef('');
  };

  const startStripe = async () => {
    if (!openInvoice) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return notify('Enter a valid amount.', 'error');
    if (amount > due) return notify(`You only owe ${money(due)} on this invoice.`, 'error');
    setSubmitting(true);
    try {
      const { url } = await myBillingApi.stripeCheckout({ invoiceId: openInvoice._id, amount });
      if (!url) throw new Error('Stripe returned no checkout URL.');
      window.location.href = url;
    } catch (error) {
      notify(error.message || 'Stripe checkout could not be started.', 'error');
      setSubmitting(false);
    }
  };

  const submitPayment = async () => {
    if (!openInvoice) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return notify('Enter a valid amount.', 'error');
    if (amount > due) return notify(`You only owe ${money(due)} on this invoice.`, 'error');
    setSubmitting(true);
    try {
      await myBillingApi.pay({
        invoiceId: openInvoice._id,
        amount,
        paymentMethod: payMethod,
        transactionId: payMethod === 'bank_transfer' && txnRef.trim() ? txnRef.trim() : undefined,
      });
      notify(
        payMethod === 'cash'
          ? `Payment of ${money(amount)} scheduled — settle in cash at the hotel.`
          : `Payment of ${money(amount)} received. Thank you.`,
        'success'
      );
      setPayingId(null);
      load();
    } catch (error) {
      notify(error.message || 'Payment could not be completed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="billing-page">
      <PageHero
        eyebrow="Your account"
        title="Billing & payments"
        lead="Review your invoices and settle any outstanding balance online, securely."
        crumbs={[{ label: 'My account', to: '/account' }, { label: 'Billing' }]}
        image={img.lobby(1600, 60)}
      />

      <section className="section on-light">
        <div className="container container--wide bill-wrap">
          <Reveal>
            <div className="bill-overview">
              <div className="bill-stat">
                <span className="bill-stat__icon"><Icon name="banknote" size={18} /></span>
                <div>
                  <span className="bill-stat__l">Outstanding balance</span>
                  <span className="bill-stat__n">{money(outstanding)}</span>
                </div>
              </div>
              <div className="bill-stat">
                <span className="bill-stat__icon"><Icon name="receipt" size={18} /></span>
                <div>
                  <span className="bill-stat__l">Invoices</span>
                  <span className="bill-stat__n">{invoices.length}</span>
                </div>
              </div>
              <div className="bill-stat">
                <span className="bill-stat__icon"><Icon name="circleCheck" size={18} /></span>
                <div>
                  <span className="bill-stat__l">Payments received</span>
                  <span className="bill-stat__n">{payments.length}</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Invoices */}
          <Reveal className="bill-block" delay={0.08}>
            <div className="acct-block__head">
              <h2 className="acct-h2">Your invoices</h2>
              <span className="acct-link acct-link--static">{user?.email}</span>
            </div>

            {loading ? (
              <div className="acct-empty"><Icon name="loader" size={30} /><p>Loading your billing details…</p></div>
            ) : invoices.length === 0 ? (
              <div className="acct-empty">
                <Icon name="receipt" size={30} />
                <p>No invoices yet — they will appear here once placed by our front desk.</p>
                <Link to="/booking" className="btn">Reserve a stay</Link>
              </div>
            ) : (
              <>
                <div className="acct-seg" role="tablist" aria-label="Filter invoices">
                  {INV_TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={invTab === t.id}
                      className={`acct-seg__btn ${invTab === t.id ? 'is-active' : ''}`}
                      onClick={() => setInvTab(t.id)}
                    >
                      {t.label}<span className="acct-seg__count">{countInv(t.id)}</span>
                    </button>
                  ))}
                </div>
                {visibleInvoices.length === 0 ? (
                  <div className="acct-empty acct-empty--sm">
                    <Icon name="receipt" size={22} />
                    <p>No {INV_TABS.find((t) => t.id === invTab)?.label.toLowerCase()} invoices.</p>
                  </div>
                ) : (
                  <div className="bill-inv-list">
                    {visibleInvoices.map((inv) => {
                  const total = totalOf(inv);
                  const paid = paidFor[String(inv._id)] || 0;
                  const due = dueOf(inv);
                  const pending = pendingFor[String(inv._id)] || 0;
                  const awaiting = pending > 0 && pending >= due;
                  const open = payingId === inv._id;
                  return (
                    <article className={`bill-inv${open ? ' is-open' : ''}`} key={inv._id}>
                      <div className="bill-inv__head">
                        <span className="bill-inv__no">Invoice {refOf(inv._id)}</span>
                        <span className="bill-inv__date">Issued {inv.createdAt ? fmt(inv.createdAt.split('T')[0]) : '—'}</span>
                        {inv.roomId?.roomType ? <span className="bill-inv__room">{inv.roomId.roomType}{inv.roomId.roomNumber ? ` · Room ${inv.roomId.roomNumber}` : ''}</span> : null}
                      </div>

                      <dl className="bill-inv__rows">
                        <div><dt>Room charges</dt><dd>{money(inv.roomCharges || 0)}</dd></div>
                        <div><dt>Food & beverage</dt><dd>{money(inv.foodCharges || 0)}</dd></div>
                        <div><dt>Laundry</dt><dd>{money(inv.laundryCharges || 0)}</dd></div>
                        <div><dt>Other services</dt><dd>{money(inv.otherCharges || 0)}</dd></div>
                        <div><dt>Taxes & fees</dt><dd>{money(inv.tax || 0)}</dd></div>
                        <div className="bill-inv__totalrow"><dt>Total</dt><dd>{money(total)}</dd></div>
                      </dl>

                      <div className="bill-inv__foot">
                        <div className="bill-inv__status">
                          {paid > 0 && <span className="bill-inv__paid">{money(paid)} paid</span>}
                          <StatusBadge status={inv.paymentStatus} />
                          {due > 0 && <span className="bill-inv__due">Balance due {money(due)}</span>}
                        </div>
                        {awaiting ? (
                          <span className="bill-inv__awaiting"><Icon name="clock" size={15} /> Awaiting collection at the hotel</span>
                        ) : due > 0 && !open ? (
                          <button className="btn" onClick={() => openPay(inv)}>
                            <Icon name="creditCard" size={16} /> Pay now
                          </button>
                        ) : null}
                      </div>

                      {open && (
                        <div className="bill-pay">
                          <div className="bill-pay__methods">
                            {paymentMethods.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                className={`bill-pay__method${payMethod === m.id ? ' is-active' : ''}`}
                                onClick={() => setPayMethod(m.id)}
                              >
                                <Icon name={m.icon} size={18} />
                                <span>
                                  {m.label}
                                  <small>{m.hint}</small>
                                </span>
                              </button>
                            ))}
                          </div>

                          {payMethod === 'bank_transfer' && (
                            <p className="bill-pay__banks">
                              Transfer to LuxuryStay Hospitality Ltd · IBAN SG11 0136 4028 12 5487 · SWIFT LSHOSGSG — then confirm below.
                            </p>
                          )}

                          {payMethod === 'cash' && (
                            <p className="bill-pay__banks">
                              Choose this to pay in person. We will keep your amount as <strong>pending</strong> until the front desk records the cash collection.
                            </p>
                          )}

                          <div className="bill-pay__fields">
                            <label className="bill-field">
                              <span className="bill-field__label">Amount to pay</span>
                              <input type="number" min="0" step="0.01" value={payAmount} max={due}
                                onChange={(e) => setPayAmount(e.target.value)} />
                            </label>
                            {payMethod === 'card' ? (
                              <div className="bill-pay__stripe">
                                <p>Your card is processed on Stripe's secure hosted checkout — we never see your card details.</p>
                                <button type="button" className="btn" onClick={startStripe} disabled={submitting}>
                                  {submitting ? <Icon name="loader" size={16} /> : <Icon name="creditCard" size={16} />}
                                  {submitting ? 'Opening Stripe…' : 'Pay with Stripe'}
                                </button>
                              </div>
                            ) : payMethod === 'bank_transfer' ? (
                              <label className="bill-field bill-field--wide">
                                <span className="bill-field__label">Transfer reference (optional)</span>
                                <input placeholder="e.g. our bill reference or your transfer note" value={txnRef}
                                  onChange={(e) => setTxnRef(e.target.value)} />
                              </label>
                            ) : null}
                          </div>

                          <div className="bill-pay__foot">
                            <span className="bill-pay__due">Invoice total {money(total)} · Balance {money(due)}</span>
                            <div className="bill-pay__actions">
                              <button className="btn btn--outline" onClick={() => setPayingId(null)}>Cancel</button>
                              {payMethod !== 'card' && (
                                <button className="btn" disabled={submitting} onClick={submitPayment}>
                                  {submitting ? <Icon name="loader" size={16} /> : <Icon name="check" size={16} />}
                                  {submitting ? 'Processing…' : `Pay ${payAmount ? money(Number(payAmount)) : money(0)}`}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
                  </div>
                )}
                </>
              )}
          </Reveal>

          {/* Payment history */}
          <Reveal className="bill-block" delay={0.12}>
            <div className="acct-block__head">
              <h2 className="acct-h2">Payment history</h2>
              <Link to="/account" className="acct-link">Back to account <Icon name="arrowRight" size={14} /></Link>
            </div>

            {payments.length === 0 ? (
              <div className="acct-empty">
                <Icon name="clock" size={30} />
                <p>No payments yet.</p>
              </div>
            ) : (
              <>
                <div className="acct-seg" role="tablist" aria-label="Filter payments">
                  {PAY_TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={payTab === t.id}
                      className={`acct-seg__btn ${payTab === t.id ? 'is-active' : ''}`}
                      onClick={() => setPayTab(t.id)}
                    >
                      {t.label}<span className="acct-seg__count">{countPay(t.id)}</span>
                    </button>
                  ))}
                </div>
                {visiblePayments.length === 0 ? (
                  <div className="acct-empty acct-empty--sm">
                    <Icon name="clock" size={22} />
                    <p>No {PAY_TABS.find((t) => t.id === payTab)?.label.toLowerCase()} payments.</p>
                  </div>
                ) : (
                  <div className="bill-paylist">
                    {visiblePayments.map((p) => (
                      <div className="bill-payrow" key={p._id || p.id}>
                        <span className="bill-payrow__icon">
                          <Icon name={paymentMethodById[p.paymentMethod]?.icon || 'creditCard'} size={16} />
                        </span>
                        <div className="bill-payrow__main">
                          <div className="bill-payrow__top">
                            {money(p.amount)}
                            <span className="bill-payrow__inv">Invoice {refOf(invIdOf(p))}</span>
                          </div>
                          <div className="bill-payrow__meta">
                            {paymentMethodById[p.paymentMethod]?.label || p.paymentMethod}
                            {p.transactionId ? ` · ${p.transactionId}` : ''}
                            {p.paymentDate ? ` · ${fmt(p.paymentDate)}` : ''}
                          </div>
                        </div>
                        <StatusBadge status={p.paymentStatus} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  );
}