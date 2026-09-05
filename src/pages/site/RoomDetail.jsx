import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SmartImage from '../../components/common/SmartImage.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import RoomCard from '../../components/site/RoomCard.jsx';
import { roomTypeById, roomTypes, money } from '../../data/hotel.js';
import './RoomDetail.css';

export default function RoomDetail() {
  const { id } = useParams();
  const room = roomTypeById[id];
  const [active, setActive] = useState(0);

  if (!room) {
    return (
      <div className="detail-missing container">
        <p className="eyebrow"><span className="rule" style={{ width: 40 }} /> Not found</p>
        <h1 className="h1">That suite has checked out.</h1>
        <p className="text-muted">We couldn't find the residence you were looking for.</p>
        <Link to="/rooms" className="btn">Back to the collection</Link>
      </div>
    );
  }

  const related = roomTypes.filter((t) => t.id !== room.id).slice(0, 3);
  const gallery = room.gallery;

  return (
    <div className="detail">
      {/* Gallery */}
      <section className="detail-gallery">
        <div className="detail-gallery__main">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%' }}
            >
              <SmartImage src={gallery[active](1400, 74)} alt={`${room.name} view ${active + 1}`} eager label={room.name} />
            </motion.div>
          </AnimatePresence>
          <Link to="/rooms" className="detail-back"><Icon name="arrowLeft" size={16} /> The Collection</Link>
        </div>
        <div className="detail-gallery__thumbs">
          {gallery.map((g, i) => (
            <button
              key={i}
              className={`detail-thumb ${active === i ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
            >
              <SmartImage src={g(400, 55)} alt="" label={room.name} />
            </button>
          ))}
        </div>
      </section>

      <section className="section detail-body on-light">
        <div className="container container--wide detail-grid">
          <div className="detail-main">
            <Reveal>
              <span className="detail-tier">{room.tier}</span>
              <h1 className="detail-title">{room.name} <span className="detail-title__sub">{room.tier}</span></h1>
              <p className="detail-tagline serif-italic">{room.tagline}</p>
            </Reveal>

            <Reveal className="detail-specs" delay={0.05}>
              {[
                { icon: 'ruler', label: 'Size', value: `${room.size} m²` },
                { icon: 'users', label: 'Sleeps', value: `${room.maxGuests} guests` },
                { icon: 'bed', label: 'Bedding', value: room.bed },
                { icon: 'eye', label: 'Outlook', value: room.view },
              ].map((s) => (
                <div className="detail-spec" key={s.label}>
                  <Icon name={s.icon} size={22} />
                  <div>
                    <span className="detail-spec__label">{s.label}</span>
                    <span className="detail-spec__value">{s.value}</span>
                  </div>
                </div>
              ))}
            </Reveal>

            <Reveal className="detail-prose" delay={0.1}>
              <p className="lead">{room.description}</p>
            </Reveal>

            <Reveal className="detail-amenities" delay={0.1}>
              <h3 className="detail-subhead">Appointed with</h3>
              <ul>
                {room.amenities.map((a) => (
                  <li key={a}><Icon name="circleCheck" size={18} /> {a}</li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* Sticky reservation card */}
          <aside className="detail-aside">
            <div className="reserve-card">
              <div className="reserve-card__price">
                <span className="reserve-card__amount">{money(room.price)}</span>
                <span className="reserve-card__per">per night · excl. taxes</span>
              </div>
              <div className="rule" style={{ margin: '1.25rem 0' }} />
              <ul className="reserve-card__list">
                <li><Icon name="circleCheck" size={16} /> Best rate, booked direct</li>
                <li><Icon name="circleCheck" size={16} /> Complimentary welcome ritual</li>
                <li><Icon name="circleCheck" size={16} /> Free cancellation · 48h</li>
              </ul>
              <Link to={`/booking?type=${room.id}`} className="btn btn--block" style={{ marginTop: '1.5rem' }}>
                Reserve this suite
              </Link>
              <a href="tel:+6560218800" className="btn btn--outline btn--block" style={{ marginTop: '0.75rem' }}>
                <Icon name="phone" size={15} /> Speak to a concierge
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* Related */}
      <section className="section on-light detail-related" style={{ paddingTop: 0 }}>
        <div className="container container--wide">
          <div className="rule" style={{ marginBottom: '3.5rem' }} />
          <div className="collection__head">
            <h2 className="sec-head__title">You may also favour</h2>
            <Link to="/rooms" className="btn btn--outline">All suites</Link>
          </div>
          <div className="rooms-grid">
            {related.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.08}><RoomCard room={r} /></Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
