import { Link } from 'react-router-dom';
import PageHero from '../../components/site/PageHero.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import SmartImage from '../../components/common/SmartImage.jsx';
import Icon from '../../components/common/Icon.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { roomTypeById, serviceTypeById, nights, money, invoiceTotals } from '../../data/hotel.js';
import { img } from '../../lib/images.js';
import './Account.css';

const fmt = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
const initials = (n = '') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
/* Active/upcoming stays first, past and cancelled last. */
const RANK = { 'checked-in': 0, arriving: 1, departing: 1, confirmed: 2, 'checked-out': 4, cancelled: 5 };

export default function Account() {
  const { user, logout } = useAuth();
  const { guests, reservations, invoices, services } = useData();

  // Match the signed-in guest to their profile(s) and records by email.
  const email = (user?.email || '').toLowerCase();
  const myGuests = guests.filter((g) => (g.email || '').toLowerCase() === email);
  const ids = myGuests.map((g) => g.id);
  const profile = myGuests[0];

  const myReservations = reservations
    .filter((r) => ids.includes(r.guestId))
    .sort((a, b) => (RANK[a.status] ?? 3) - (RANK[b.status] ?? 3) || new Date(a.checkIn) - new Date(b.checkIn));
  const myInvoices = invoices.filter((i) => ids.includes(i.guestId));
  const myServices = services.filter((s) => ids.includes(s.guestId) && s.status !== 'completed');

  const firstName = (user?.name || 'Guest').split(' ')[0];
  const upcoming = myReservations.filter((r) => r.status !== 'checked-out' && r.status !== 'cancelled').length;

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
              <span className="acct-avatar">{initials(user?.name) || 'G'}</span>
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
                <div className="acct-res-list">
                  {myReservations.map((r) => {
                    const t = roomTypeById[r.typeId];
                    return (
                      <article className="acct-res" key={r.id}>
                        <span className="acct-res__media">
                          <SmartImage src={t.hero(320, 55)} alt={t.name} ratio="4 / 3" label={t.name} />
                        </span>
                        <div className="acct-res__body">
                          <span className="acct-res__tier">{t.tier} · {r.code}</span>
                          <h3 className="acct-res__name">{t.name}</h3>
                          <ul className="acct-res__meta">
                            <li><Icon name="calendar" size={14} /> {fmt(r.checkIn)} → {fmt(r.checkOut)}</li>
                            <li><Icon name="moon" size={14} /> {nights(r.checkIn, r.checkOut)} nights</li>
                            <li><Icon name="users" size={14} /> {r.guests} {r.guests === 1 ? 'guest' : 'guests'}</li>
                            <li><Icon name="door" size={14} /> Room {r.roomNo}</li>
                          </ul>
                        </div>
                        <div className="acct-res__side">
                          <StatusBadge status={r.status} />
                          <span className="acct-res__amount">{money(r.amount)}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
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
                <div className="acct-inv-list">
                  {myInvoices.map((inv) => {
                    const { total } = invoiceTotals(inv.items);
                    return (
                      <div className="acct-inv" key={inv.id}>
                        <span className="acct-inv__icon"><Icon name="receipt" size={18} /></span>
                        <div className="acct-inv__main">
                          <div className="acct-inv__no">{inv.number}</div>
                          <div className="acct-inv__meta">Issued {fmt(inv.issued)} · {inv.items.length} items</div>
                        </div>
                        <div className="acct-inv__side">
                          <span className="acct-inv__total">{money(total)}</span>
                          <StatusBadge status={inv.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                    <div className="acct-req" key={s.id}>
                      <span className="acct-req__icon"><Icon name="sparkles" size={16} /></span>
                      <div className="acct-req__body">
                        <div className="acct-req__detail">{s.detail || serviceTypeById[s.type]?.label}</div>
                        <div className="acct-req__meta">{serviceTypeById[s.type]?.label}{s.when ? ` · ${s.when}` : ''}{s.room ? ` · Room ${s.room}` : ''}</div>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
