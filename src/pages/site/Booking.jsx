import { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SmartImage from '../../components/common/SmartImage.jsx';
import Icon from '../../components/common/Icon.jsx';
import Modal from '../../components/common/Modal.jsx';
import Select from '../../components/common/Select.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi, reservationsApi, myBillingApi, roomsApi } from '../../lib/api.js';
import { nights, money, todayISO, paymentMethods } from '../../data/hotel.js';
const STEPS = ['Your stay', 'Your details', 'Payment', 'Review', 'Confirmed'];

const isHardUnavailable = (r) => r && (r.roomStatus === 'maintenance' || r.roomStatus === 'cleaning');

const PAY_METHODS = [
  { id: 'stripe', label: 'Pay with Stripe', icon: 'creditCard', hint: 'Instant, secure online card payment — Visa, Mastercard, Amex' },
  { id: 'bank_transfer', label: 'Bank transfer', icon: 'landmark', hint: 'Direct transfer to the hotel account' },
  { id: 'cash', label: 'Cash at the hotel', icon: 'banknote', hint: 'Settle in person at check-in or check-out' },
];
const payLabel = (id) => (PAY_METHODS.find((m) => m.id === id) || {}).label || id;

function addDays(iso, n) {
  if (!iso || iso.length < 10) return iso || '';
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const prettyDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const roomId = (r) => (r && (r._id || r.id)) || '';

const slide = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addGuest, updateGuest, guests, rooms, settings, notify, refreshAll } = useData();
  const { user, isAuthed, signup, login } = useAuth();

  // Live "today" so the arrival minimum always tracks the current date.
  const [today, setToday] = useState(() => todayISO());
  useEffect(() => {
    const id = setInterval(() => setToday(todayISO()), 60000);
    return () => clearInterval(id);
  }, []);

  const roomOptions = useMemo(
    () => [...rooms].sort((a, b) => (a.floor - b.floor) || (a.roomNumber - b.roomNumber)),
    [rooms]
  );

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [stay, setStay] = useState(() => {
    const pIn = params.get('checkIn');
    const pOut = params.get('checkOut');
    const cIn = pIn && pIn >= today ? pIn : today;
    const cOut = pOut && pOut >= addDays(cIn, 1) ? pOut : addDays(cIn, 1);
    const pType = params.get('type') || '';
    const initial = roomOptions.find((r) => roomId(r) === pType) || roomOptions.find((r) => r.roomStatus === 'available') || roomOptions[0] || {};
    return {
      typeId: roomId(initial),
      checkIn: cIn,
      checkOut: cOut,
      guests: Math.min(Math.max(1, Number(params.get('guests')) || 2), initial.maxGuests || 6),
    };
  });
  const [guest, setGuest] = useState(() => ({
    name: isAuthed && user.role === 'guest' ? user.name || '' : '',
    email: isAuthed && user.role === 'guest' ? user.email || '' : '',
    phone: '',
    country: '',
    requests: '',
  }));
  const [confirmed, setConfirmed] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [transfer, setTransfer] = useState({ holder: '', bank: '', ref: '' });

  // Room ids with an active reservation overlapping the selected dates. Fetched
  // live as soon as the dates change so availability reflects real bookings.
  const [dateUnavailable, setDateUnavailable] = useState(() => new Set());
  const availReq = useRef(0);
  useEffect(() => {
    const { checkIn, checkOut } = stay;
    const id = ++availReq.current;
    if (!(checkIn && checkOut && checkOut > checkIn)) { setDateUnavailable(new Set()); return; }
    roomsApi.available(checkIn, checkOut)
      .then((list) => {
        if (availReq.current !== id) return;
        setDateUnavailable(new Set(
          list
            .filter((r) => r && r.available === false && !isHardUnavailable(r))
            .map((r) => roomId(r))
            .filter(Boolean)
        ));
      })
      .catch(() => { if (availReq.current === id) setDateUnavailable(new Set()); });
  }, [stay.checkIn, stay.checkOut]);

  // Inline email verification for first-time (anonymous) bookings: the account
  // is created, then the guest enters the emailed code so a session can be
  // established before the reservation is created.
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const pendingVerify = useRef(null);

  const openVerify = (email, password) => new Promise((resolve) => {
    pendingVerify.current = { email, password, resolve };
    setVerifyCode('');
    setVerifyError('');
    setVerifyMessage('');
    setVerifyOpen(true);
  });

  const submitVerifyCode = async () => {
    const pending = pendingVerify.current;
    if (!pending) return;
    try {
      await authApi.verifyEmail(pending.email, verifyCode);
      const loginResult = await login(pending.email, pending.password);
      if (!loginResult.ok) {
        setVerifyError(loginResult.error || 'Sign-in failed after verification.');
        return;
      }
      setVerifyOpen(false);
      pending.resolve(true);
    } catch (e) {
      setVerifyError(e.message);
    }
  };

  const resendVerifyCode = async () => {
    const pending = pendingVerify.current;
    if (!pending) return;
    try {
      const result = await authApi.resendVerification(pending.email);
      setVerifyMessage(result.message);
      setVerifyError('');
    } catch (e) {
      setVerifyError(e.message);
    }
  };

  const cancelVerify = () => {
    if (pendingVerify.current) { pendingVerify.current.resolve(false); pendingVerify.current = null; }
    setVerifyOpen(false);
  };

  useEffect(() => {
    if (!roomOptions.length) return;
    const current = roomOptions.find((r) => roomId(r) === stay.typeId);
    const chosen = (current && !isHardUnavailable(current) && !dateUnavailable.has(roomId(current)))
      ? current
      : (roomOptions.find((r) => !isHardUnavailable(r) && !dateUnavailable.has(roomId(r))) || current || roomOptions[0]);
    setStay((s) => {
      const nextGuests = Math.min(s.guests, chosen.maxGuests || 2);
      if (s.typeId === roomId(chosen) && s.guests === nextGuests) return s;
      return { ...s, typeId: roomId(chosen), guests: nextGuests };
    });
  }, [roomOptions, dateUnavailable, stay.typeId]);

  const type = roomOptions.find((r) => roomId(r) === stay.typeId) || roomOptions[0] || {};
  const roomPrice = type.roomPrice || 0;
  const bookableRoom = (r) => !isHardUnavailable(r) && !dateUnavailable.has(roomId(r));

  const nightCount = Math.max(1, nights(stay.checkIn, stay.checkOut));
  const roomTotal = roomPrice * nightCount;
  const tax = Math.round(roomTotal * (settings.taxPercentage / 100));
  const total = roomTotal + tax;

  const go = (next) => { setDir(next > step ? 1 : -1); setStep(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const checkInInvalid = !stay.checkIn || stay.checkIn < today;
  const checkOutInvalid = !stay.checkIn || !stay.checkOut || stay.checkOut <= stay.checkIn;

  const stayValid = !checkInInvalid && !checkOutInvalid && stay.guests <= (type.maxGuests || 2) && bookableRoom(type);
  const guestValid = guest.name.trim() && /\S+@\S+\.\S+/.test(guest.email);

const transferValid = paymentMethod !== 'bank_transfer' || (
    transfer.bank.trim() &&
    transfer.ref.trim()
  );
  const paymentValid = transferValid;

  const confirm = async () => {
    const chosen = roomOptions.find((r) => roomId(r) === stay.typeId);
    if (!chosen) {
      notify('That room is no longer available. Please choose another room.', 'error');
      return;
    }
    if (dateUnavailable.has(roomId(chosen))) {
      notify('This room is not available for the selected dates.', 'error');
      return;
    }
    if (isHardUnavailable(chosen)) {
      notify('That room is no longer available. Please choose another room.', 'error');
      return;
    }

    try {
      if (!isAuthed) {
        const password = Math.random().toString(36).slice(-8) + 'A1!'; // generate secure random password
        const res = await signup({ name: guest.name, email: guest.email, password, phone: guest.phone });
        if (!res.ok) {
          notify('Could not create an account for booking. Are you already registered? Please log in.', 'error');
          return;
        }
        // Verify the emailed code, then sign in so the backend can resolve the
        // guest from the session when the reservation is created below.
        const verified = await openVerify(guest.email, password);
        if (!verified) return;
      }

      const res = await reservationsApi.create({
        roomId: roomId(chosen),
        checkInDate: stay.checkIn,
        checkOutDate: stay.checkOut,
        numberOfGuests: Number(stay.guests),
        specialRequest: guest.requests,
      });

      // An invoice is generated server-side with the booking; use its exact
      // total for payment so amounts always line up.
      const invoice = res.invoice;
      if (invoice?._id && typeof invoice._id === 'string') {
        if (paymentMethod === 'stripe') {
          try {
            const { url } = await myBillingApi.stripeCheckout({ invoiceId: invoice._id, amount: Number(invoice.totalAmount || total) });
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
          } catch (e) {
            notify(e.message || 'Could not open Stripe checkout — you can pay later from Billing.', 'error');
          }
        } else if (paymentMethod === 'bank_transfer' || paymentMethod === 'cash') {
          try {
            await myBillingApi.pay({
              invoiceId: invoice._id,
              amount: Number(invoice.totalAmount || total),
              paymentMethod,
              transactionId: paymentMethod === 'bank_transfer' && transfer.ref.trim() ? transfer.ref.trim() : undefined,
              paymentNotes: paymentMethod === 'bank_transfer' ? `${transfer.bank || 'Bank transfer'} · ${transfer.holder || ''}`.trim() : undefined,
            });
          } catch (e) {
            notify(e.message || 'Payment could not be recorded — you can pay later from Billing.', 'error');
          }
        }
      }

      // Refresh reservations/invoices immediately so the new booking (and any
      // payment) shows up on the account page without a manual reload.
      await refreshAll();

      setConfirmed({
        code: res.reservation?.confirmationCode || res.confirmationCode || 'Confirmed',
        method: invoice?._id ? paymentMethod : null,
        invoiceId: invoice?._id || null,
      });
      go(4);
    } catch (e) {
      notify(e.message || 'Failed to book reservation', 'error');
    }
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
          <AnimatePresence mode="sync" custom={dir}>
            {/* STEP 1 — stay */}
            {step === 0 && (
              <motion.div key="s0" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <h1 className="booking-h1">Choose your room</h1>
                <p className="text-muted booking-sub">Select a room, then tell us when you'll arrive.</p>

                <div className="booking-types">
                  {roomOptions.map((t) => {
                    const isDateTaken = dateUnavailable.has(roomId(t));
                    const avail = !isHardUnavailable(t) && !isDateTaken;
                    return (
                      <button
                        key={roomId(t)}
                        className={`booking-type ${stay.typeId === roomId(t) ? 'is-selected' : ''} ${!avail ? 'is-unavailable' : ''}`}
                        disabled={!avail}
                        onClick={() => setStay((s) => ({ ...s, typeId: roomId(t), guests: Math.min(s.guests, t.maxGuests) }))}
                      >
                        <span className="booking-type__media">
                          <div className="smart-img" data-loaded="true">
                            {t.images?.[0]?.url
                              ? <img src={t.images[0].url} alt={`Room ${t.roomNumber}`} />
                              : <span className="booking-type__media--fallback"><Icon name="bed" size={24} /></span>}
                          </div>
                        </span>
                        <span className="booking-type__info">
                          <span className="booking-type__tier">Room {t.roomNumber} · Floor {t.floor}</span>
                          <span className="booking-type__name">{t.roomType}</span>
                          <span className="booking-type__meta">
                            {avail ? `Up to ${t.maxGuests} guests` : <em className="booking-type__tag">{isDateTaken ? 'This room is not available for the selected dates.' : 'Not available'}</em>}
                          </span>
                        </span>
                        <span className="booking-type__price">${t.roomPrice}<small>/night</small></span>
                        {stay.typeId === roomId(t) && <span className="booking-type__check"><Icon name="check" size={14} /></span>}
                      </button>
                    );
                  })}
                </div>

                <div className="booking-when">
                  <label className="field">
                    <span className="field-label">Arrival</span>
                    <input className={`input ${checkInInvalid && stay.checkIn ? 'is-invalid' : ''}`} type="date" min={today} value={stay.checkIn}
                      onChange={(e) => setStay((s) => ({ ...s, checkIn: e.target.value, checkOut: e.target.value ? addDays(e.target.value, 1) : s.checkOut }))} />
                    {checkInInvalid && <span className="field-error">Arrival must be today or a later date.</span>}
                  </label>
                  <label className="field">
                    <span className="field-label">Departure</span>
                    <input className={`input ${checkOutInvalid && stay.checkOut ? 'is-invalid' : ''}`} type="date" min={addDays(stay.checkIn, 1)} value={stay.checkOut}
                      onChange={(e) => setStay((s) => ({ ...s, checkOut: e.target.value }))} />
                    {checkOutInvalid && <span className="field-error">Departure must be at least one day after arrival.</span>}
                  </label>
                  <label className="field">
                    <span className="field-label">Guests</span>
                    <Select
                      label="Guests"
                      value={stay.guests}
                      onChange={(v) => setStay((s) => ({ ...s, guests: v }))}
                      options={Array.from({ length: type.maxGuests }, (_, i) => i + 1).map((n) => ({ value: n, label: `${n} ${n === 1 ? 'guest' : 'guests'}` }))}
                    />
                  </label>
                </div>
              </motion.div>
            )}

            {/* STEP 2 — details */}
            {step === 1 && (
              <motion.div key="s1" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <h1 className="booking-h1">Your details</h1>
                <p className="text-muted booking-sub">We'll use these to prepare your arrival.</p>
                <form id="form-step-1" className="booking-form" onSubmit={(e) => { e.preventDefault(); go(2); }}>
                  <div className="form-grid">
                    <label className="field">
                      <span className="field-label">Full name</span>
                      <input className="input" required pattern="^[a-zA-Z\s]{2,50}$" title="Please enter a valid full name (letters only)" value={guest.name} onChange={(e) => setGuest((g) => ({ ...g, name: e.target.value }))} placeholder="e.g. Eleanor Whitfield" />
                    </label>
                    <label className="field">
                      <span className="field-label">Email</span>
                      <input className="input" type="email" required pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$" title="Please enter a valid email address" value={guest.email} onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))} placeholder="you@email.com" />
                    </label>
                  </div>
                  <div className="form-grid">
                    <label className="field">
                      <span className="field-label">Phone</span>
                      <input className="input" required pattern="^(?=(?:\D*\d){11,15}\D*$)[\d\s.+\-\/]*$" title="Phone number must contain 11 to 15 digits" value={guest.phone} onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))} placeholder="+65 …" />
                    </label>
                    <label className="field">
                      <span className="field-label">Country</span>
                      <input className="input" required pattern="^[a-zA-Z\s]{2,50}$" title="Please enter a valid country name" value={guest.country} onChange={(e) => setGuest((g) => ({ ...g, country: e.target.value }))} placeholder="Country of residence" />
                    </label>
                  </div>
                  <label className="field">
                    <span className="field-label">Special requests <span className="field-optional">optional</span></span>
                    <textarea className="textarea" rows={3} value={guest.requests} onChange={(e) => setGuest((g) => ({ ...g, requests: e.target.value }))} placeholder="Dietary needs, celebrations, preferred floor…" />
                  </label>
                </form>
              </motion.div>
            )}

            {/* STEP 2 — payment */}
            {step === 2 && (
              <motion.div key="s2" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <h1 className="booking-h1">Secure payment</h1>
                <p className="text-muted booking-sub">Choose how you'd like to settle your booking.</p>

                <div className="booking-pay">
                  {PAY_METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`booking-pay__option ${paymentMethod === m.id ? 'is-selected' : ''}`}
                      onClick={() => setPaymentMethod(m.id)}
                    >
                      <span className="booking-pay__icon"><Icon name={m.icon} size={20} /></span>
                      <span className="booking-pay__info">
                        <span className="booking-pay__label">{m.label}</span>
                        <span className="booking-pay__hint">{m.hint}</span>
                      </span>
                      {paymentMethod === m.id && <span className="booking-type__check"><Icon name="check" size={14} /></span>}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'stripe' && (
                  <div className="booking-pay__form">
                    <div className="booking-pay__details">
                      <p>You'll be redirected to a secure <strong>Stripe</strong> checkout when you confirm. Pay instantly by card — Visa, Mastercard, American Express.</p>
                    </div>
                    <p className="booking-pay__note">
                      <Icon name="shield" size={14} /> After confirming, the secure Stripe checkout opens in a new tab. Your card details never touch our servers.
                    </p>
                  </div>
                )}
                {paymentMethod === 'bank_transfer' && (
                  <div className="booking-pay__form">
                    <div className="booking-pay__details">
                      <p>Transfer to LuxuryStay Hospitality Ltd · IBAN SG11 0136 4028 12 5487 · SWIFT LSHOSGSG</p>
                    </div>
                    <label className="field">
                      <span className="field-label">Account holder name</span>
                      <input className="input" value={transfer.holder} onChange={(e) => setTransfer((t) => ({ ...t, holder: e.target.value }))} placeholder="Name on the account" />
                    </label>
                    <label className="field">
                      <span className="field-label">Bank name</span>
                      <input className="input" value={transfer.bank} onChange={(e) => setTransfer((t) => ({ ...t, bank: e.target.value }))} placeholder="e.g. Standard Bank" />
                    </label>
                    <label className="field">
                      <span className="field-label">Transfer reference</span>
                      <input className="input" value={transfer.ref} onChange={(e) => setTransfer((t) => ({ ...t, ref: e.target.value }))} placeholder="Reference or payment note" />
                    </label>
                  </div>
                )}
                {paymentMethod === 'cash' && (
                  <p className="booking-pay__note">
                    <Icon name="banknote" size={14} /> Settle your bill in person at check-in or check-out. No payment details are needed now.
                  </p>
                )}
                {!paymentValid && (
                  <p className="field-error">Please complete the {payLabel(paymentMethod).toLowerCase()} details before continuing.</p>
                )}
              </motion.div>
            )}

            {/* STEP 3 — review */}
            {step === 3 && (
              <motion.div key="s3" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <h1 className="booking-h1">Review your reservation</h1>
                <p className="text-muted booking-sub">A moment to confirm everything looks right.</p>
                <div className="booking-review">
                  <div className="review-row"><span>Guest</span><strong>{guest.name || '—'}</strong></div>
                  <div className="review-row"><span>Email</span><strong>{guest.email || '—'}</strong></div>
                  <div className="review-row"><span>Suite</span><strong>{type.roomNumber ? `Room ${type.roomNumber} · ${type.roomType}` : type.roomType} · Floor {type.floor}</strong></div>
                  <div className="review-row"><span>Arrival</span><strong>{prettyDate(stay.checkIn)}</strong></div>
                  <div className="review-row"><span>Departure</span><strong>{prettyDate(stay.checkOut)}</strong></div>
                  <div className="review-row"><span>Guests</span><strong>{stay.guests}</strong></div>
                  <div className="review-row"><span>Payment</span><strong>{payLabel(paymentMethod)}</strong></div>
                  {guest.requests && <div className="review-row"><span>Requests</span><strong>{guest.requests}</strong></div>}
                </div>
              </motion.div>
            )}

            {/* STEP 4 — confirmed */}
            {step === 4 && confirmed && (
              <motion.div key="s4" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="booking-done">
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
                {confirmed.method === 'stripe' && confirmed.invoiceId && (
                  <p className="booking-pay__note" style={{ maxWidth: 440, textAlign: 'center', justifyContent: 'center' }}>
                    <Icon name="creditCard" size={14} /> A payment page was opened for this reservation — complete checkout there to secure your stay.
                  </p>
                )}
                <div className="booking-done__actions">
                  <Link to="/" className="btn">Return home</Link>
                  {isAuthed && user?.role === 'guest' && <Link to="/notifications" className="btn btn--outline">View notifications</Link>}
                  <Link to="/rooms" className="btn btn--outline">Browse more suites</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav buttons */}
          {step < 4 && (
            <div className="booking-nav">
              {step > 0 ? (
                <button className="btn btn--ghost" onClick={() => go(step - 1)}><Icon name="arrowLeft" size={16} /> Back</button>
              ) : (
                <button className="btn btn--ghost" onClick={() => navigate(-1)}><Icon name="arrowLeft" size={16} /> Cancel</button>
              )}
              {step < 3 && (
                <button className="btn" form={step === 1 ? 'form-step-1' : undefined} type={step === 1 ? 'submit' : 'button'} disabled={step === 0 ? !stayValid : step === 2 ? !paymentValid : false} onClick={step === 0 || step === 2 ? () => go(step + 1) : undefined}>
                  Continue <Icon name="arrowRight" size={16} />
                </button>
              )}
              {step === 3 && (
                <button className="btn" disabled={!paymentValid} onClick={confirm}>Confirm reservation <Icon name="arrowRight" size={16} /></button>
              )}
            </div>
          )}
        </div>

        {/* Sticky summary */}
        {step < 4 && (
          <aside className="booking-summary">
            <div className="summary-card">
              <div className="smart-img" data-loaded="true" style={{ width: '100%', height: '240px' }}>
                {type.images?.[0]?.url
                  ? <img src={type.images[0].url} alt={type.roomType} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span className="booking-type__media--fallback"><Icon name="bed" size={28} /></span>}
              </div>
              <div className="summary-card__body">
                <span className="booking-type__tier">{type.roomNumber ? `Room ${type.roomNumber} · Floor ${type.floor}` : `Floor ${type.floor}`}</span>
                <h3 className="summary-card__name">{type.roomType}</h3>
                <ul className="summary-card__meta">
                  <li><Icon name="calendar" size={15} /> {prettyDate(stay.checkIn)} → {prettyDate(stay.checkOut)}</li>
                  <li><Icon name="moon" size={15} /> {nightCount} {nightCount === 1 ? 'night' : 'nights'}</li>
                  <li><Icon name="users" size={15} /> {stay.guests} {stay.guests === 1 ? 'guest' : 'guests'}</li>
                </ul>
                <div className="rule" style={{ margin: '1.1rem 0' }} />
                <div className="summary-line"><span>{money(roomPrice)} × {nightCount} nights</span><span>{money(roomTotal)}</span></div>
                <div className="summary-line"><span>Taxes &amp; service ({settings.taxPercentage}%)</span><span>{money(tax)}</span></div>
                <div className="summary-line summary-line--total"><span>Total</span><span>{money(total)}</span></div>
                <p className="summary-note"><Icon name="shield" size={13} /> Free cancellation up to 48h before arrival</p>
                <div className="summary-pay">
                  <span className="summary-pay__label">Pay by</span>
                  <div className="summary-pay__methods">
                    {paymentMethods.map((m) => (
                      <span className={`summary-pay__chip ${paymentMethod === m.id ? 'is-selected' : ''}`} key={m.id}><Icon name={m.icon} size={13} /> {m.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* First-time booking: verify the emailed code before continuing */}
      <Modal
        open={verifyOpen}
        onClose={cancelVerify}
        title="Verify your email"
        subtitle={`Enter the six-digit code we sent to ${guest.email || 'your inbox'} to confirm your booking.`}
        footer={<>
          <button className="btn btn--outline" onClick={cancelVerify}>Cancel</button>
          <button className="btn" disabled={!/^\d{6}$/.test(verifyCode)} onClick={submitVerifyCode}>Verify &amp; continue <Icon name="arrowRight" size={16} /></button>
        </>}
      >
        <label className="field">
          <span className="field-label">Verification code</span>
          <input className="input" inputMode="numeric" maxLength="6" value={verifyCode} onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, '')); setVerifyError(''); }} placeholder="6-digit code" />
        </label>
        {verifyError && <p className="field-error"><Icon name="info" size={14} /> {verifyError}</p>}
        {verifyMessage && <p className="verify-saved"><Icon name="circleCheck" size={16} /> {verifyMessage}</p>}
        <button type="button" className="verify-resend" onClick={resendVerifyCode}>Send a new code</button>
      </Modal>
    </div>
  );
}
