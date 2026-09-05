import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SmartImage from '../../components/common/SmartImage.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { roomTypes, roomTypeById, nights, money, TODAY } from '../../data/hotel.js';
import './Booking.css';

const STEPS = ['Your stay', 'Your details', 'Review', 'Confirmed'];

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
const prettyDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const slide = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addGuest, addReservation, rooms, settings } = useData();
  const { user, isAuthed } = useAuth();
  const rate = (id) => settings.rates?.[id] ?? roomTypeById[id].price;

  const initialType = roomTypeById[params.get('type')] ? params.get('type') : 'palm-court';
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [stay, setStay] = useState({
    typeId: initialType,
    checkIn: TODAY,
    checkOut: addDays(TODAY, 2),
    guests: 2,
  });
  const [guest, setGuest] = useState(() => ({
    name: isAuthed && user.role === 'guest' ? user.name || '' : '',
    email: isAuthed && user.role === 'guest' ? user.email || '' : '',
    phone: '',
    country: '',
    requests: '',
  }));
  const [confirmed, setConfirmed] = useState(null);

  const type = roomTypeById[stay.typeId];
  const nightCount = Math.max(1, nights(stay.checkIn, stay.checkOut));
  const roomTotal = rate(stay.typeId) * nightCount;
  const tax = Math.round(roomTotal * (settings.taxRate / 100));
  const total = roomTotal + tax;

  const go = (next) => { setDir(next > step ? 1 : -1); setStep(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const stayValid = stay.checkIn && stay.checkOut && nights(stay.checkIn, stay.checkOut) >= 1 && stay.guests <= type.maxGuests;
  const guestValid = guest.name.trim() && /\S+@\S+\.\S+/.test(guest.email);

  const availableRoom = useMemo(
    () => rooms.find((r) => r.typeId === stay.typeId && r.status === 'available')?.no || 'On arrival',
    [rooms, stay.typeId]
  );

  const confirm = () => {
    const g = addGuest({ name: guest.name, email: guest.email, phone: guest.phone, country: guest.country || '—' });
    const res = addReservation({
      guestId: g.id,
      guestName: guest.name,
      typeId: stay.typeId,
      roomNo: availableRoom,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      guests: Number(stay.guests),
      amount: total,
      source: 'online',
      requests: guest.requests,
    });
    setConfirmed(res);
    go(3);
  };

  return (
    <div className="booking-page on-light">
      <div className="booking-head">
        <div className="container">
          <Link to="/" className="booking-logo">LuxuryStay</Link>
          <ol className="stepper">
            {STEPS.map((s, i) => (
              <li key={s} className={`stepper__item ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}>
                <span className="stepper__dot">{i < step ? <Icon name="check" size={13} /> : i + 1}</span>
                <span className="stepper__label">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="container booking-body">
        <div className="booking-main">
          <AnimatePresence mode="wait" custom={dir}>
            {/* STEP 1 — stay */}
            {step === 0 && (
              <motion.div key="s0" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <h1 className="booking-h1">Choose your suite</h1>
                <p className="text-muted booking-sub">Select a category, then tell us when you'll arrive.</p>

                <div className="booking-types">
                  {roomTypes.map((t) => (
                    <button
                      key={t.id}
                      className={`booking-type ${stay.typeId === t.id ? 'is-selected' : ''}`}
                      onClick={() => setStay((s) => ({ ...s, typeId: t.id, guests: Math.min(s.guests, t.maxGuests) }))}
                    >
                      <span className="booking-type__media">
                        <SmartImage src={t.hero(360, 55)} alt={t.name} label={t.name} />
                      </span>
                      <span className="booking-type__info">
                        <span className="booking-type__tier">{t.tier}</span>
                        <span className="booking-type__name">{t.name}</span>
                        <span className="booking-type__meta">Up to {t.maxGuests} · {t.bed}</span>
                      </span>
                      <span className="booking-type__price">{money(rate(t.id))}<small>/night</small></span>
                      {stay.typeId === t.id && <span className="booking-type__check"><Icon name="check" size={14} /></span>}
                    </button>
                  ))}
                </div>

                <div className="booking-when">
                  <label className="field">
                    <span className="field-label">Arrival</span>
                    <input className="input" type="date" min={TODAY} value={stay.checkIn}
                      onChange={(e) => setStay((s) => ({ ...s, checkIn: e.target.value, checkOut: e.target.value >= s.checkOut ? addDays(e.target.value, 1) : s.checkOut }))} />
                  </label>
                  <label className="field">
                    <span className="field-label">Departure</span>
                    <input className="input" type="date" min={addDays(stay.checkIn, 1)} value={stay.checkOut}
                      onChange={(e) => setStay((s) => ({ ...s, checkOut: e.target.value }))} />
                  </label>
                  <label className="field">
                    <span className="field-label">Guests</span>
                    <select className="select" value={stay.guests} onChange={(e) => setStay((s) => ({ ...s, guests: Number(e.target.value) }))}>
                      {Array.from({ length: type.maxGuests }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </motion.div>
            )}

            {/* STEP 2 — details */}
            {step === 1 && (
              <motion.div key="s1" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <h1 className="booking-h1">Your details</h1>
                <p className="text-muted booking-sub">We'll use these to prepare your arrival.</p>
                <div className="booking-form">
                  <div className="form-grid">
                    <label className="field">
                      <span className="field-label">Full name</span>
                      <input className="input" value={guest.name} onChange={(e) => setGuest((g) => ({ ...g, name: e.target.value }))} placeholder="e.g. Eleanor Whitfield" />
                    </label>
                    <label className="field">
                      <span className="field-label">Email</span>
                      <input className="input" type="email" value={guest.email} onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))} placeholder="you@email.com" />
                    </label>
                  </div>
                  <div className="form-grid">
                    <label className="field">
                      <span className="field-label">Phone</span>
                      <input className="input" value={guest.phone} onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))} placeholder="+65 …" />
                    </label>
                    <label className="field">
                      <span className="field-label">Country</span>
                      <input className="input" value={guest.country} onChange={(e) => setGuest((g) => ({ ...g, country: e.target.value }))} placeholder="Country of residence" />
                    </label>
                  </div>
                  <label className="field">
                    <span className="field-label">Special requests <span className="field-optional">optional</span></span>
                    <textarea className="textarea" rows={3} value={guest.requests} onChange={(e) => setGuest((g) => ({ ...g, requests: e.target.value }))} placeholder="Dietary needs, celebrations, preferred floor…" />
                  </label>
                </div>
              </motion.div>
            )}

            {/* STEP 3 — review */}
            {step === 2 && (
              <motion.div key="s2" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <h1 className="booking-h1">Review your reservation</h1>
                <p className="text-muted booking-sub">A moment to confirm everything looks right.</p>
                <div className="booking-review">
                  <div className="review-row"><span>Guest</span><strong>{guest.name || '—'}</strong></div>
                  <div className="review-row"><span>Email</span><strong>{guest.email || '—'}</strong></div>
                  <div className="review-row"><span>Suite</span><strong>{type.name} · {type.tier}</strong></div>
                  <div className="review-row"><span>Arrival</span><strong>{prettyDate(stay.checkIn)}</strong></div>
                  <div className="review-row"><span>Departure</span><strong>{prettyDate(stay.checkOut)}</strong></div>
                  <div className="review-row"><span>Guests</span><strong>{stay.guests}</strong></div>
                  {guest.requests && <div className="review-row"><span>Requests</span><strong>{guest.requests}</strong></div>}
                </div>
              </motion.div>
            )}

            {/* STEP 4 — confirmed */}
            {step === 3 && confirmed && (
              <motion.div key="s3" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="booking-done">
                <motion.span className="booking-done__seal" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}>
                  <Icon name="check" size={34} />
                </motion.span>
                <h1 className="booking-h1">You're confirmed.</h1>
                <p className="lead" style={{ maxWidth: 520 }}>
                  Thank you, {guest.name.split(' ')[0] || 'and welcome'}. A confirmation is on its way to {guest.email}. We look forward to welcoming you.
                </p>
                <div className="booking-code">
                  <span>Confirmation</span>
                  <strong>{confirmed.code}</strong>
                </div>
                <div className="booking-done__actions">
                  <Link to="/" className="btn">Return home</Link>
                  <Link to="/rooms" className="btn btn--outline">Browse more suites</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav buttons */}
          {step < 3 && (
            <div className="booking-nav">
              {step > 0 ? (
                <button className="btn btn--ghost" onClick={() => go(step - 1)}><Icon name="arrowLeft" size={16} /> Back</button>
              ) : (
                <button className="btn btn--ghost" onClick={() => navigate(-1)}><Icon name="arrowLeft" size={16} /> Cancel</button>
              )}
              {step < 2 && (
                <button className="btn" disabled={step === 0 ? !stayValid : !guestValid} onClick={() => go(step + 1)}>
                  Continue <Icon name="arrowRight" size={16} />
                </button>
              )}
              {step === 2 && (
                <button className="btn" onClick={confirm}>Confirm reservation <Icon name="arrowRight" size={16} /></button>
              )}
            </div>
          )}
        </div>

        {/* Sticky summary */}
        {step < 3 && (
          <aside className="booking-summary">
            <div className="summary-card">
              <SmartImage src={type.hero(600, 60)} alt={type.name} ratio="16 / 10" label={type.name} />
              <div className="summary-card__body">
                <span className="booking-type__tier">{type.tier}</span>
                <h3 className="summary-card__name">{type.name}</h3>
                <ul className="summary-card__meta">
                  <li><Icon name="calendar" size={15} /> {prettyDate(stay.checkIn)} → {prettyDate(stay.checkOut)}</li>
                  <li><Icon name="moon" size={15} /> {nightCount} {nightCount === 1 ? 'night' : 'nights'}</li>
                  <li><Icon name="users" size={15} /> {stay.guests} {stay.guests === 1 ? 'guest' : 'guests'}</li>
                </ul>
                <div className="rule" style={{ margin: '1.1rem 0' }} />
                <div className="summary-line"><span>{money(rate(stay.typeId))} × {nightCount} nights</span><span>{money(roomTotal)}</span></div>
                <div className="summary-line"><span>Taxes &amp; service ({settings.taxRate}%)</span><span>{money(tax)}</span></div>
                <div className="summary-line summary-line--total"><span>Total</span><span>{money(total)}</span></div>
                <p className="summary-note"><Icon name="shield" size={13} /> Free cancellation up to 48h before arrival</p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
