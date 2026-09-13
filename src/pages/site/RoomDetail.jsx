import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SmartImage from '../../components/common/SmartImage.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import RoomCard from '../../components/site/RoomCard.jsx';
import { money } from '../../data/hotel.js';
import { roomsApi } from '../../lib/api.js';
export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [related, setRelated] = useState([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    roomsApi.get(id).then(data => {
      if (active) {
        setRoom(data.room || data);
        setLoading(false);
      }
    }).catch(() => {
      if (active) {
        setRoom(null);
        setLoading(false);
      }
    });

    // Fetch related (all rooms for now, filter out current)
    roomsApi.list().then(data => {
      if (active) {
        const all = data;
        setRelated(all.filter(r => (r._id || r.id) !== id).slice(0, 3));
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <div className="detail-missing container"><p>Loading residence details...</p></div>;
  }

  if (!room) {
    return (
      <div className="detail-missing container">
        <p className="eyebrow"><span className="rule" style={{ width: 40 }} /> Not found</p>
        <h1 className="h1">That suite has checked out.</h1>
        <p className="text-muted">The room you're looking for doesn't exist in our live inventory, or the server could not be reached.</p>
        <Link to="/rooms" className="btn">Back to the collection</Link>
      </div>
    );
  }

  // Use images from the API, or a branded fallback if none are set
  const galleryUrls = room.images?.length ? room.images.map(img => img.url) : [];

  return (
    <div className="detail">
      {/* Gallery */}
      <section className="detail-gallery">
        <div className="detail-gallery__main">
          <AnimatePresence mode="sync">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%' }}
            >
              <div className="smart-img" data-loaded="true" style={{ width: '100%', height: '100%' }}>
                {galleryUrls[active]
                  ? <img src={galleryUrls[active]} alt={`${room.roomType} view ${active + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span className="room-card__media--fallback"><Icon name="bed" size={44} /><span>{room.roomType}</span></span>}
              </div>
            </motion.div>
          </AnimatePresence>
          <Link to="/rooms" className="detail-back"><Icon name="arrowLeft" size={16} /> The Collection</Link>
        </div>
        <div className="detail-gallery__thumbs">
          {galleryUrls.map((g, i) => (
            <button
              key={i}
              className={`detail-thumb ${active === i ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
            >
              <div className="smart-img" data-loaded="true" style={{ width: '100%', height: '100%' }}>
                <img src={g} alt="" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="section detail-body on-light">
        <div className="container container--wide detail-grid">
          <div className="detail-main">
            <Reveal>
              <span className="detail-tier">Floor {room.floor}</span>
              <h1 className="detail-title">{room.roomType} <span className="detail-title__sub">Room {room.roomNumber}</span></h1>
              <p className="detail-tagline serif-italic">Experience luxury in our {room.roomType} collection.</p>
            </Reveal>

            <Reveal className="detail-specs" delay={0.05}>
              {[
                { icon: 'users', label: 'Sleeps', value: `${room.maxGuests} guests` },
                { icon: 'tag', label: 'Status', value: room.roomStatus },
                { icon: 'hash', label: 'Room Number', value: room.roomNumber },
                { icon: 'building', label: 'Floor', value: room.floor },
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
              <p className="lead">The {room.roomType} room offers a comfortable stay with premium amenities and excellent service. Situated on floor {room.floor}, it is perfect for up to {room.maxGuests} guests.</p>
            </Reveal>

          </div>

          {/* Sticky reservation card */}
          <aside className="detail-aside">
            <div className="reserve-card">
              <div className="reserve-card__price">
                <span className="reserve-card__amount">${room.roomPrice}</span>
                <span className="reserve-card__per">per night · excl. taxes</span>
              </div>
              <div className="rule" style={{ margin: '1.25rem 0' }} />
              <ul className="reserve-card__list">
                <li><Icon name="circleCheck" size={16} /> Best rate, booked direct</li>
                <li><Icon name="circleCheck" size={16} /> Complimentary welcome ritual</li>
                <li><Icon name="circleCheck" size={16} /> Free cancellation · 48h</li>
              </ul>
              <Link to={`/booking?type=${room._id || room.id}`} className="btn btn--block" style={{ marginTop: '1.5rem' }}>
                Reserve this suite
              </Link>
              <a href="tel:+6560218800" className="btn btn--outline btn--block" style={{ marginTop: '0.75rem', color: '#f5efe3', borderColor: 'rgba(245,239,227,0.3)' }}>
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
              <Reveal key={r._id || r.id} delay={i * 0.08}><RoomCard room={r} /></Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}