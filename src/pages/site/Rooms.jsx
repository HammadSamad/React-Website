import { useMemo, useState } from 'react';
import PageHero from '../../components/site/PageHero.jsx';
import RoomCard from '../../components/site/RoomCard.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { roomTypes } from '../../data/hotel.js';
import { img } from '../../lib/images.js';
import './Rooms.css';

const tiers = ['All', 'Room', 'Suite', 'Junior Suite', 'Executive Suite', 'Penthouse', 'Cabana'];
const sorts = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price · Low to High' },
  { id: 'price-desc', label: 'Price · High to Low' },
  { id: 'size', label: 'Largest first' },
];

export default function Rooms() {
  const [tier, setTier] = useState('All');
  const [guests, setGuests] = useState(0);
  const [sort, setSort] = useState('featured');

  const list = useMemo(() => {
    let r = roomTypes.filter((t) => (tier === 'All' ? true : t.tier === tier));
    if (guests) r = r.filter((t) => t.maxGuests >= guests);
    switch (sort) {
      case 'price-asc': r = [...r].sort((a, b) => a.price - b.price); break;
      case 'price-desc': r = [...r].sort((a, b) => b.price - a.price); break;
      case 'size': r = [...r].sort((a, b) => b.size - a.size); break;
      default: r = [...r].sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return r;
  }, [tier, guests, sort]);

  return (
    <div className="rooms-page">
      <PageHero
        eyebrow="The Collection"
        title="Suites & Rooms"
        lead="Six categories, each a distinct world — from a garden-facing retreat to a wraparound sky penthouse. Every room is dressed in the same quiet standard."
        image={img.room5(1920, 72)}
        crumbs={[{ label: 'Suites' }]}
      />

      <section className="section--tight rooms-toolbar-wrap on-light">
        <div className="container container--wide">
          <div className="rooms-toolbar">
            <div className="rooms-filters" role="group" aria-label="Filter by category">
              {tiers.map((t) => (
                <button
                  key={t}
                  className={`chip ${tier === t ? 'chip--active' : ''}`}
                  onClick={() => setTier(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="rooms-controls">
              <label className="rooms-select">
                <Icon name="users" size={16} />
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} aria-label="Minimum guests">
                  <option value={0}>Any guests</option>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+ guests</option>)}
                </select>
              </label>
              <label className="rooms-select">
                <Icon name="filter" size={16} />
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
                  {sorts.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="section on-light" style={{ paddingTop: 0 }}>
        <div className="container container--wide">
          <p className="rooms-count">{list.length} {list.length === 1 ? 'residence' : 'residences'} available</p>
          {list.length === 0 ? (
            <div className="rooms-empty">
              <Icon name="search" size={28} />
              <p>No suites match those filters. Try widening your search.</p>
              <button className="btn btn--outline btn--sm" onClick={() => { setTier('All'); setGuests(0); }}>Reset filters</button>
            </div>
          ) : (
            <div className="rooms-grid">
              {list.map((room, i) => (
                <Reveal key={room.id} delay={(i % 3) * 0.08}>
                  <RoomCard room={room} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
