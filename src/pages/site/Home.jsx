import { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import SmartImage from '../../components/common/SmartImage.jsx';
import Reveal, { Words } from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import Select from '../../components/common/Select.jsx';
import CountUp from '../../components/common/CountUp.jsx';
import Stars from '../../components/common/Stars.jsx';
import RoomCard from '../../components/site/RoomCard.jsx';
import { img } from '../../lib/images.js';
import { experiences, testimonials, hotelInfo, todayISO } from '../../data/hotel.js';
import { useData } from '../../context/DataContext.jsx';
function addDays(iso, n) {
  if (!iso || iso.length < 10) return iso || '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function BookingBar({ uniqueRooms }) {
  const nav = useNavigate();
  const [today, setToday] = useState(() => todayISO());
  const [form, setForm] = useState(() => ({ checkIn: todayISO(), checkOut: addDays(todayISO(), 1), guests: '2', type: '' }));
  const [err, setErr] = useState('');
  useEffect(() => {
    const id = setInterval(() => setToday(todayISO()), 60000);
    return () => clearInterval(id);
  }, []);
  const submit = (e) => {
    e.preventDefault();
    // Keep the minimum arrival date live so it tracks the current time.
    setToday(todayISO());
    if (!form.checkIn || form.checkIn < today) {
      setErr('Arrival must be today or a later date.');
      return;
    }
    if (!form.checkOut || form.checkOut <= form.checkIn) {
      setErr('Departure must be at least one day after arrival.');
      return;
    }
    setErr('');
    const q = new URLSearchParams(form).toString();
    nav(`/booking?${q}`);
  };
  return (
    <div className="container container--wide bookbar">
      <motion.form
        className="bookbar__inner"
        onSubmit={submit}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="bookbar__field">
          <label htmlFor="bb-in">Arrival</label>
          <input id="bb-in" type="date" required min={today} value={form.checkIn} onChange={(e) => { const v = e.target.value; if (v && v < today) return; setForm((f) => ({ ...f, checkIn: v, checkOut: v ? addDays(v, 1) : f.checkOut })); }} />
        </div>
        <div className="bookbar__field">
          <label htmlFor="bb-out">Departure</label>
          <input id="bb-out" type="date" required min={addDays(form.checkIn, 1)} value={form.checkOut} onChange={(e) => { const v = e.target.value; if (!v) { setForm((f) => ({ ...f, checkOut: v })); return; } const minOut = addDays(form.checkIn, 1); setForm((f) => ({ ...f, checkOut: v < minOut ? minOut : v })); }} />
        </div>
        <div className="bookbar__field">
          <label>Guests</label>
          <Select
            variant="bare"
            label="Guests"
            value={form.guests}
            onChange={(v) => setForm({ ...form, guests: v })}
            options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} ${n === 1 ? 'guest' : 'guests'}` }))}
          />
        </div>
        <div className="bookbar__field">
          <label>Suite</label>
          <Select
            variant="bare"
            label="Suite"
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v })}
            options={[{ value: '', label: 'Any suite' }, ...uniqueRooms.map((t) => ({ value: t._id || t.id, label: `${t.roomType} (Floor ${t.floor})` }))]}
          />
        </div>
        {err && <p className="bookbar__err">{err}</p>}
        <button className="btn bookbar__btn" type="submit">
          <Icon name="search" size={16} /> Check Availability
        </button>
      </motion.form>
    </div>
  );
}

export default function Home() {
  const { rooms } = useData();
  const bandRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: bandRef, offset: ['start end', 'end start'] });
  const bandY = useTransform(scrollYProgress, [0, 1], ['-12%', '12%']);
  
  const uniqueRooms = useMemo(() => {
    const map = new Map();
    for (const r of rooms) if (!map.has(r.roomType)) map.set(r.roomType, r);
    return Array.from(map.values());
  }, [rooms]);

  const featured = useMemo(() => {
    const list = [];
    const seenType = new Set();
    const seenId = new Set();
    for (const r of rooms) {
      if (list.length >= 8) break;
      if (seenType.has(r.roomType)) continue;
      seenType.add(r.roomType);
      seenId.add(r._id || r.id);
      list.push(r);
    }
    for (const r of rooms) {
      if (list.length >= 8) break;
      const id = r._id || r.id;
      if (seenId.has(id)) continue;
      seenId.add(id);
      list.push(r);
    }
    return list;
  }, [rooms]);

  return (
    <div className="home">
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="hero">
        <div className="hero__media">
          <SmartImage src={img.heroPool(1920, 75)} alt="LuxuryStay lagoon pool at golden hour" eager label="LuxuryStay" />
        </div>
        <div className="hero__scrim" />
        <div className="hero__grain grain" />
        <div className="hero__inner container container--wide">
          <motion.p
            className="eyebrow hero__eyebrow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="rule" style={{ width: 40 }} /> Est. {hotelInfo.established} · {hotelInfo.city}
          </motion.p>

          <h1 className="hero__title">
            <Words text="The art of the" delay={0.5} />{' '}
            <em><Words text="unhurried" delay={0.95} /></em>{' '}
            <Words text="stay." delay={1.25} />
          </h1>

          <div className="hero__meta">
            <motion.p
              className="hero__lead"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              A botanical sanctuary of {hotelInfo.properties} houses, where marble, brass and
              greenery meet service refined over a century.
            </motion.p>
            <motion.div
              className="hero__cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.8 }}
            >
              <Link to="/booking" className="btn">Reserve a Suite</Link>
              <Link to="/rooms" className="btn btn--outline">Explore the Collection</Link>
            </motion.div>
          </div>
        </div>
        <div className="hero__scroll">
          <span>Scroll</span>
          <span className="hero__scroll-line" />
        </div>
      </section>

      <BookingBar uniqueRooms={uniqueRooms} />

      {/* ---------------------------- Welcome ----------------------------- */}
      <section className="section welcome">
        <div className="container container--wide">
          <div className="welcome__grid">
            <Reveal className="welcome__intro">
              <p className="eyebrow eyebrow--muted"><span className="rule" style={{ width: 40 }} /> A word of welcome</p>
              <h2 className="welcome__statement">
                We believe a great stay is not built from grand gestures, but from a
                thousand <em className="serif-italic text-brass">quiet certainties</em>.
              </h2>
            </Reveal>
            <Reveal className="welcome__body" delay={0.15}>
              <p className="lead text-muted">
                From the moment the door opens to the last morning coffee on the terrace,
                LuxuryStay is composed like music — every note deliberate, nothing rushed.
                Our people are the difference: attentive, discreet, and endlessly generous.
              </p>
              <Link to="/about" className="link-underline welcome__link">
                Read our story <Icon name="arrowRight" size={16} />
              </Link>
            </Reveal>
          </div>

          <div className="stats">
            {[
              { end: hotelInfo.established, label: 'Established', fmt: (v) => v },
              { end: hotelInfo.properties, label: 'Houses worldwide', suffix: '' },
              { end: hotelInfo.awards, label: 'Awards & honours', suffix: '' },
              { end: 4.9, label: 'Guest rating', decimals: 1 },
            ].map((s, i) => (
              <Reveal className="stat" key={s.label} delay={i * 0.08}>
                <span className="stat__num">
                  {s.decimals ? (
                    <CountUp value={s.end} decimals={s.decimals} />
                  ) : s.label === 'Established' ? (
                    s.end
                  ) : (
                    <CountUp value={s.end} suffix={s.suffix || ''} />
                  )}
                </span>
                <span className="stat__label">{s.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- Collection --------------------------- */}
      <section className="section collection on-light">
        <div className="container container--wide">
          <div className="collection__head">
            <Reveal className="sec-head">
              <p className="eyebrow eyebrow--muted"><span className="rule" style={{ width: 40 }} /> The Collection</p>
              <h2 className="sec-head__title">Suites composed for the senses</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <Link to="/rooms" className="btn btn--outline">View all suites</Link>
            </Reveal>
          </div>

          <div className="collection__grid">
            {featured.map((room, i) => (
              <Reveal key={room._id || room.id} delay={(i % 4) * 0.08}>
                <RoomCard room={room} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------- Experiences --------------------------- */}
      <section className="section experiences">
        <div className="container container--wide">
          <Reveal className="sec-head" style={{ marginBottom: '3.5rem' }}>
            <p className="eyebrow"><span className="rule" style={{ width: 40 }} /> Beyond the room</p>
            <h2 className="sec-head__title">A day, unhurried</h2>
            <p className="sec-head__lead">
              Six worlds within the walls — from the botanical spa to a restaurant grown
              under glass. Wander, or don't. The choice is the luxury.
            </p>
          </Reveal>

          <div className="exp-grid">
            {experiences.map((x, i) => (
              <Reveal key={x.id} delay={(i % 3) * 0.08} className={`exp-card img-zoom ${i === 0 ? 'exp-card--tall' : ''}`}>
                <SmartImage src={x.image(800, 68)} alt={x.name} ratio={i === 0 ? '4 / 5' : '4 / 3'} label={x.name} />
                <div className="exp-card__scrim" />
                <div className="exp-card__body">
                  <span className="exp-card__kicker">{x.kicker}</span>
                  <h3 className="exp-card__name">{x.name}</h3>
                  <p className="exp-card__blurb">{x.blurb}</p>
                  <span className="exp-card__hours"><Icon name="clock" size={14} /> {x.hours}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="text-center mt-lg" delay={0.1}>
            <Link to="/experiences" className="btn btn--outline">Discover every experience</Link>
          </Reveal>
        </div>
      </section>

      {/* ------------------------- Signature band ------------------------- */}
      <section className="band" ref={bandRef}>
        <motion.div className="band__media" style={{ y: bandY }}>
          <SmartImage src={img.suiteView(1920, 72)} alt="A suite view over the gardens" label="LuxuryStay" />
        </motion.div>
        <div className="band__scrim" />
        <div className="band__grain grain" />
        <div className="container container--wide band__inner">
          <Reveal>
            <Icon name="quote" size={40} className="band__quote" />
            <p className="band__text">
              The most quietly perfect hotel I have stayed in. Every detail felt
              considered — <em className="serif-italic">never fussy.</em>
            </p>
            <p className="band__cite">Meridian — The World's Finest Stays</p>
          </Reveal>
        </div>
      </section>

      {/* --------------------------- Testimonials ------------------------- */}
      <section className="section on-light testimonials">
        <div className="container container--wide">
          <Reveal className="sec-head sec-head--center" style={{ marginBottom: '3.5rem' }}>
            <p className="eyebrow eyebrow--muted"><span className="rule" style={{ width: 40 }} /> In their words</p>
            <h2 className="sec-head__title">Guests who return</h2>
          </Reveal>
          <div className="tst-grid">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1} className="tst-card">
                <Stars value={t.rating} />
                <p className="tst-card__quote">“{t.quote}”</p>
                <div className="tst-card__by">
                  <span className="tst-card__name">{t.name}</span>
                  <span className="tst-card__role">{t.role}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ CTA ------------------------------- */}
      <section className="cta">
        <div className="cta__media">
          <SmartImage src={img.exterior(1920, 72)} alt="LuxuryStay at dusk" label="LuxuryStay" />
        </div>
        <div className="cta__scrim" />
        <div className="container container--wide cta__inner">
          <Reveal>
            <p className="eyebrow"><span className="rule" style={{ width: 40 }} /> Your table by the palms awaits</p>
            <h2 className="cta__title">Begin the <em className="serif-italic text-brass">unhurried</em> stay</h2>
            <p className="cta__lead">
              Rooms for the season are limited. Reserve directly for our best rate, a
              welcome ritual, and complimentary late checkout.
            </p>
            <div className="cta__actions">
              <Link to="/booking" className="btn">Reserve Now</Link>
              <a href={`tel:${hotelInfo.phone.replace(/\s/g, '')}`} className="btn btn--outline">
                <Icon name="phone" size={16} /> {hotelInfo.phone}
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
