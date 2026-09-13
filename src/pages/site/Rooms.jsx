import { useMemo, useState, useEffect } from 'react';
import PageHero from '../../components/site/PageHero.jsx';
import RoomCard from '../../components/site/RoomCard.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import Select from '../../components/common/Select.jsx';
import { img } from '../../lib/images.js';
import { roomsApi } from '../../lib/api.js';
const sorts = [
  { id: 'number', label: 'Room Number' },
  { id: 'price-asc', label: 'Price · Low to High' },
  { id: 'price-desc', label: 'Price · High to Low' },
];

export default function Rooms() {
  const [tier, setTier] = useState('All');
  const [guests, setGuests] = useState(0);
  const [sort, setSort] = useState('number');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = () => {
    setLoading(true);
    setError('');
    roomsApi.list().then(data => {
      setRooms(data);
      setLoading(false);
    }).catch(() => {
      setError('We could not reach the room inventory service. Check that the backend server is running.');
      setLoading(false);
    });
  };
  useEffect(() => { reload(); }, []);

  const tiers = useMemo(() => {
    const types = new Set(rooms.map(r => r.roomType));
    return ['All', ...Array.from(types)];
  }, [rooms]);

  const list = useMemo(() => {
    let r = rooms.filter((t) => (tier === 'All' ? true : t.roomType === tier));
    if (guests) r = r.filter((t) => t.maxGuests >= guests);
    switch (sort) {
      case 'price-asc': r = [...r].sort((a, b) => a.roomPrice - b.roomPrice); break;
      case 'price-desc': r = [...r].sort((a, b) => b.roomPrice - a.roomPrice); break;
      default: r = [...r].sort((a, b) => a.roomNumber - b.roomNumber);
    }
    return r;
  }, [tier, guests, sort, rooms]);

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
              <Select
                variant="toolbar"
                icon="users"
                label="Minimum guests"
                value={guests}
                onChange={setGuests}
                options={[{ value: 0, label: 'Any guests' }, ...[1, 2, 3, 4].map((n) => ({ value: n, label: `${n}+ guests` }))]}
              />
              <Select
                variant="toolbar"
                icon="filter"
                label="Sort by"
                value={sort}
                onChange={setSort}
                options={sorts.map((s) => ({ value: s.id, label: s.label }))}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section on-light" style={{ paddingTop: 0 }}>
        <div className="container container--wide">
          {loading ? (
            <div className="rooms-empty">
              <Icon name="loader" size={28} />
              <p>Loading the collection…</p>
            </div>
          ) : error ? (
            <div className="rooms-empty">
              <Icon name="wifi" size={28} />
              <p>{error}</p>
              <button className="btn btn--outline btn--sm" onClick={reload}>Try again</button>
            </div>
          ) : (
            <>            <p className="rooms-count">{list.length} {list.length === 1 ? 'residence' : 'residences'} available</p>
            {list.length === 0 ? (
              <div className="rooms-empty">
                <Icon name="search" size={28} />
                <p>No suites match those filters. Try widening your search.</p>
                <button className="btn btn--outline btn--sm" onClick={() => { setTier('All'); setGuests(0); }}>Reset filters</button>
              </div>
            ) : (
              <div className="rooms-grid">
                {list.map((room, i) => (
                  <Reveal key={room._id || room.id} delay={(i % 3) * 0.08}>
                    <RoomCard room={room} />
                  </Reveal>
                ))}
              </div>
            )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}