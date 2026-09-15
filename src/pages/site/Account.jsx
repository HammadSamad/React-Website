import { Link } from 'react-router-dom';
import { useState } from 'react';
import PageHero from '../../components/site/PageHero.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import SmartImage from '../../components/common/SmartImage.jsx';
import Icon from '../../components/common/Icon.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { myBillingApi, reservationsApi } from '../../lib/api.js';
import { serviceTypeById, nights, money, paymentMethods, paymentMethodById } from '../../data/hotel.js';
import { img } from '../../lib/images.js';
const fmt = (value) => {
  if (!value) return '—';
  const iso = String(value).split('T')[0];
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.valueOf())) return '—';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};
const initials = (n = '') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
/* Active/upcoming stays first, past and cancelled last. */
const RANK = { 'checked-in': 0, arriving: 1, departing: 1, confirmed: 2, pending: 3, 'checked-out': 4, cancelled: 5 };
const CANCEL_REASONS = ['Change of plans', 'Travel dates changed', 'Found another hotel', 'Medical or family emergency', 'Other'];
const canCancel = (r) => ['pending', 'confirmed'].includes(r.bookingStatus || r.status);

export default function Account() {
  const { user, logout } = useAuth();
  const { guests, reservations, invoices, services, notify, refreshAll } = useData();
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelDetail, setCancelDetail] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [resTab, setResTab] = useState('all');
  const [billTab, setBillTab] = useState('all');

  const confirmCancel = async () => {
    const id = cancelTarget?._id || cancelTarget?.id;
    if (!id) return;
    setCancellingId(id);
    try {
      const reason = `${cancelReason}${cancelDetail.trim() ? ` — ${cancelDetail.trim()}` : ''}`;
      await reservationsApi.cancel(id, reason);
      notify('Your reservation has been cancelled.', 'success');
      setCancelTarget(null);
      setCancelDetail('');
      refreshAll();
    } catch (error) {
      notify(error.message || 'The reservation could not be cancelled.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const downloadInvoice = async (inv) => {
    try {
      const blob = await myBillingApi.invoicePdf(inv._id || inv.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luxurystay-invoice-${inv.invoiceNumber || String(inv._id || inv.id).slice(-6).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      notify(error.message || 'The invoice could not be downloaded.', 'error');
    }
  };

  // The signed-in user's own guest profile (populated by /users/me) is the
  // authoritative identity. The full guest list is staff-only, so matching by
  // email alone breaks for regular guest accounts — always include our own id.
  const ownGuest = user?.guestId && typeof user.guestId === 'object' ? user.guestId : null;
  const ownGuestId = user?.guestId ? (ownGuest ? ownGuest._id || ownGuest.id : String(user.guestId)) : null;
  const email = (user?.email || '').toLowerCase();
  const myGuests = guests.filter((g) => (
    (ownGuestId && String(g._id || g.id) === String(ownGuestId)) ||
    (g.guestEmail || '').toLowerCase() === email
  ));
  const ids = [...new Set([ownGuestId, ...myGuests.map((g) => g._id || g.id)].filter(Boolean).map(String))];
  const profile = ownGuest || myGuests[0] || null;

  const guestIdOf = (item) => {
    const gid = item.guestId;
    if (!gid) return null;
    return typeof gid === 'object' ? String(gid._id || gid.id) : String(gid);
  };

  const myReservations = reservations
    .filter((r) => ids.includes(guestIdOf(r)))
    .sort((a, b) => (RANK[a.bookingStatus] ?? 3) - (RANK[b.bookingStatus] ?? 3) || new Date(a.checkInDate) - new Date(b.checkInDate));
  const myInvoices = invoices.filter((i) => ids.includes(guestIdOf(i)));
  const myServices = services.filter((s) => ids.includes(guestIdOf(s)) && s.serviceStatus !== 'completed');

  const RES_TABS = [
    { id: 'all', label: 'All' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'checked-in', label: 'Checked in' },
    { id: 'checked-out', label: 'Checked out' },
    { id: 'cancelled', label: 'Cancelled' },
  ];
  const BILL_TABS = [
    { id: 'all', label: 'All' },
    { id: 'paid', label: 'Paid' },
    { id: 'pending', label: 'Pending' },
    { id: 'cancelled', label: 'Cancelled' },
  ];
  const resGroup = (r) => {
    const st = r.bookingStatus || r.status;
    return ['checked-in', 'checked-out', 'cancelled'].includes(st) ? st : 'upcoming';
  };
  const countRes = (id) => (id === 'all' ? myReservations.length : myReservations.filter((r) => resGroup(r) === id).length);
  const countBill = (id) => (id === 'all' ? myInvoices.length : myInvoices.filter((i) => (i.paymentStatus || 'pending') === id).length);
  const visibleReservations = resTab === 'all' ? myReservations : myReservations.filter((r) => resGroup(r) === resTab);
  const visibleInvoices = billTab === 'all' ? myInvoices : myInvoices.filter((i) => (i.paymentStatus || 'pending') === billTab);

  const firstName = (user?.name || 'Guest').split(' ')[0];
  const upcoming = myReservations.filter((r) => r.bookingStatus !== 'checked-out' && r.bookingStatus !== 'cancelled').length;

  return (
    <div className="account-page">
      <PageHero
        eyebrow="Your account"
        title={`Welcome back, ${firstName}`}
        lead="Your reservations, billing, and concierge requests — gathered in one quiet place."
        crumbs={[{ label: 'My account' }]}
        image={img.lobby(1600, 60)}
      />

      <section className="section on-light">
        <div className="container container--wide acct-grid">
          {/* Profile */}
          <Reveal className="acct-side">
            <div className="acct-card acct-profile">
              {user?.profileImage?.url
                ? <img src={user.profileImage.url} alt={user?.name || 'Guest'} className="acct-avatar acct-avatar--img" />
                : <span className="acct-avatar">{initials(user?.name) || 'G'}</span>
              }
              <h2 className="acct-profile__name">{user?.name || 'Guest'}</h2>
              <p className="acct-profile__email">{user?.email}</p>
              <div className="acct-profile__tags">
                <span className="badge badge--neutral"><span className="dot" />{user?.roleLabel || 'Guest'}</span>
                {profile?.vip && <span className="badge badge--reserved"><span className="dot" />VIP guest</span>}
              </div>

              <div className="acct-stats">
                <div className="acct-stat"><span className="acct-stat__n">{upcoming}</span><span className="acct-stat__l">Upcoming</span></div>
                <div className="acct-stat"><span className="acct-stat__n">{profile?.stays ?? myReservations.length}</span><span className="acct-stat__l">Total stays</span></div>
                {profile?.since && <div className="acct-stat"><span className="acct-stat__n">{profile.since}</span><span className="acct-stat__l">Member since</span></div>}
              </div>

              {profile?.preferences?.length > 0 && (
                <div className="acct-prefs">
                  <span className="acct-label">Your preferences</span>
                  <div className="acct-chips">
                    {profile.preferences.map((p) => <span key={p} className="acct-chip">{p}</span>)}
                  </div>
                </div>
              )}

              <div className="acct-side__actions">
                <Link to="/booking" className="btn btn--block"><Icon name="calendar" size={16} /> Reserve a stay</Link>
                <Link to="/profile" className="btn btn--outline btn--block"><Icon name="edit" size={16} /> Edit profile</Link>
                <Link to="/notifications" className="btn btn--outline btn--block"><Icon name="bell" size={16} /> Notifications</Link>
                <Link to="/billing" className="btn btn--outline btn--block"><Icon name="receipt" size={16} /> Billing & payments</Link>
                <button className="btn btn--outline btn--block" onClick={logout}><Icon name="logout" size={16} /> Sign out</button>
              </div>
            </div>
          </Reveal>

          {/* Records */}
          <div className="acct-main">
            {/* Reservations */}
            <Reveal className="acct-block">
              <div className="acct-block__head">
                <h2 className="acct-h2">Your reservations</h2>
                <Link to="/booking" className="acct-link">New reservation <Icon name="arrowRight" size={14} /></Link>
              </div>

              {myReservations.length === 0 ? (
                <div className="acct-empty">
                  <Icon name="calendar" size={30} />
                  <p>You have no reservations yet.</p>
                  <Link to="/booking" className="btn">Reserve your first stay</Link>
                </div>
              ) : (
                <>
                  <div className="acct-seg" role="tablist" aria-label="Filter reservations">
                    {RES_TABS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={resTab === t.id}
                        className={`acct-seg__btn ${resTab === t.id ? 'is-active' : ''}`}
                        onClick={() => setResTab(t.id)}
                      >
                        {t.label}<span className="acct-seg__count">{countRes(t.id)}</span>
                      </button>
                    ))}
                  </div>
                  {visibleReservations.length === 0 ? (
                    <div className="acct-empty acct-empty--sm">
                      <Icon name="calendar" size={22} />
                      <p>No {RES_TABS.find((t) => t.id === resTab)?.label.toLowerCase()} reservations.</p>
                    </div>
                  ) : (
                    <div className="acct-res-list">
                      {visibleReservations.map((r) => {
                        return (
                          <article className="acct-res" key={r._id || r.id}>
                            <span className="acct-res__media">
                              <SmartImage src={r.roomId?.images?.[0]?.url || img.room1(320, 55)} alt={r.roomId?.roomType || 'Suite'} ratio="4 / 3" label={r.roomId?.roomType || 'Suite'} />
                            </span>
                            <div className="acct-res__body">
                              <span className="acct-res__tier">Room · {r.confirmationCode || r.code}</span>
                              <h3 className="acct-res__name">{r.roomId?.roomType || 'Suite'}</h3>
                              <ul className="acct-res__meta">
                                <li><Icon name="calendar" size={14} /> {fmt(r.checkInDate || r.checkIn)} → {fmt(r.checkOutDate || r.checkOut)}</li>
                                <li><Icon name="moon" size={14} /> {nights((r.checkInDate || r.checkIn).split('T')[0], (r.checkOutDate || r.checkOut).split('T')[0])} nights</li>
                                <li><Icon name="users" size={14} /> {r.numberOfGuests || r.guests} {(r.numberOfGuests || r.guests) === 1 ? 'guest' : 'guests'}</li>
                                <li><Icon name="door" size={14} /> Room {r.roomId?.roomNumber || r.roomNo}</li>
                              </ul>
                            </div>
                            <div className="acct-res__side">
                              <StatusBadge status={r.bookingStatus || r.status} />
                              <span className="acct-res__amount">{money(r.amount || ((r.roomId?.roomPrice || 0) * nights((r.checkInDate || r.checkIn).split('T')[0], (r.checkOutDate || r.checkOut).split('T')[0])))}</span>
                              {canCancel(r) && (
                                <button className="btn btn--danger btn--sm" onClick={() => { setCancelTarget(r); setCancelReason(CANCEL_REASONS[0]); setCancelDetail(''); }}>
                                  <Icon name="ban" size={14} /> Cancel
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </Reveal>

            {/* Billing */}
            <Reveal className="acct-block" delay={0.08}>
              <div className="acct-block__head">
                <h2 className="acct-h2">Billing</h2>
                {myInvoices.length > 0 && <span className="acct-link acct-link--static">{myInvoices.length} {myInvoices.length === 1 ? 'invoice' : 'invoices'}</span>}
              </div>

              {myInvoices.length === 0 ? (
                <div className="acct-empty">
                  <Icon name="receipt" size={30} />
                  <p>No billing history yet — invoices appear here after your stay.</p>
                </div>
              ) : (
                <>
                  <div className="acct-seg" role="tablist" aria-label="Filter invoices">
                    {BILL_TABS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={billTab === t.id}
                        className={`acct-seg__btn ${billTab === t.id ? 'is-active' : ''}`}
                        onClick={() => setBillTab(t.id)}
                      >
                        {t.label}<span className="acct-seg__count">{countBill(t.id)}</span>
                      </button>
                    ))}
                  </div>
                  {visibleInvoices.length === 0 ? (
                    <div className="acct-empty acct-empty--sm">
                      <Icon name="receipt" size={22} />
                      <p>No {BILL_TABS.find((t) => t.id === billTab)?.label.toLowerCase()} invoices.</p>
                    </div>
                  ) : (
                    <div className="acct-inv-list">
                      {visibleInvoices.map((inv) => {
                        const total = inv.totalAmount || (inv.roomCharges || 0) + (inv.foodCharges || 0) + (inv.laundryCharges || 0) + (inv.otherCharges || 0) + (inv.tax || 0);
                        const created = inv.createdAt || inv.updatedAt;
                        return (
                          <div className="acct-inv" key={inv._id || inv.id}>
                            <span className="acct-inv__icon"><Icon name="receipt" size={18} /></span>
                            <div className="acct-inv__main">
                              <div className="acct-inv__no">Invoice · {inv.invoiceNumber || inv._id?.slice(-6) || inv.id?.slice(-6) || '—'}</div>
                              <div className="acct-inv__meta">{created ? `Issued ${fmt(created.split('T')[0])}` : ''}{inv.paymentMethod ? ` · ${paymentMethodById[inv.paymentMethod]?.label || inv.paymentMethod}` : ''}</div>
                            </div>
                            <div className="acct-inv__side">
                              <span className="acct-inv__total">{money(total)}</span>
                              <StatusBadge status={inv.paymentStatus} />
                              <button className="acct-link" onClick={() => downloadInvoice(inv)}>
                                <Icon name="download" size={14} /> PDF
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              <div className="acct-pay">
                <div className="acct-pay__head">
                  <h3 className="acct-pay__title">Accepted payment methods</h3>
                  <span className="acct-pay__sub">Settle at check-in, at checkout, by bank transfer — or pay your bill online.</span>
                </div>
                <div className="acct-pay__list">
                  {paymentMethods.map((m) => (
                    <div className="acct-pay__item" key={m.id}>
                      <span className="acct-pay__icon"><Icon name={m.icon} size={18} /></span>
                      <span className="acct-pay__label">{m.label}</span>
                      <span className="acct-pay__hint">{m.hint}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Concierge requests */}
            {myServices.length > 0 && (
              <Reveal className="acct-block" delay={0.12}>
                <div className="acct-block__head">
                  <h2 className="acct-h2">Concierge requests</h2>
                  <Link to="/experiences" className="acct-link">Explore services <Icon name="arrowRight" size={14} /></Link>
                </div>
                <div className="acct-req-list">
                  {myServices.map((s) => (
                    <div className="acct-req" key={s._id || s.id}>
                      <span className="acct-req__icon"><Icon name="sparkles" size={16} /></span>
                      <div className="acct-req__body">
                        <div className="acct-req__detail">{s.serviceDescription || serviceTypeById[s.serviceType]?.label || s.serviceType}</div>
                        <div className="acct-req__meta">{serviceTypeById[s.serviceType]?.label || s.serviceType}{s.requestDate ? ` · ${fmt(s.requestDate.split('T')[0])}` : ''}{s.roomId?.roomNumber ? ` · Room ${s.roomId.roomNumber}` : ''}</div>
                      </div>
                      <StatusBadge status={s.serviceStatus} />
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel this reservation?"
        subtitle={cancelTarget ? `${cancelTarget.roomId?.roomType || 'Suite'} · ${fmt((cancelTarget.checkInDate || cancelTarget.checkIn).split('T')[0])} → ${fmt((cancelTarget.checkOutDate || cancelTarget.checkOut).split('T')[0])}` : ''}
        footer={
          <>
            <button className="btn btn--outline" onClick={() => setCancelTarget(null)}>Keep reservation</button>
            <button className="btn btn--danger" disabled={!!cancellingId} onClick={confirmCancel}>
              {cancellingId ? <Icon name="loader" size={16} /> : <Icon name="ban" size={16} />}
              {cancellingId ? 'Cancelling…' : 'Yes, cancel'}
            </button>
          </>
        }
      >
        <div className="acct-cancel">
          <div>
            <label className="acct-cancel__label" htmlFor="cancel-reason">Reason for cancelling</label>
            <select id="cancel-reason" className="acct-cancel__select" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
              {CANCEL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <input
            className="acct-cancel__input"
            placeholder="Additional details (optional)"
            value={cancelDetail}
            onChange={(e) => setCancelDetail(e.target.value)}
          />
          <p className="acct-cancel__hint">Free cancellation up to 48 hours before arrival. Once cancelled, the room is released back to our inventory.</p>
        </div>
      </Modal>
    </div>
  );
}
