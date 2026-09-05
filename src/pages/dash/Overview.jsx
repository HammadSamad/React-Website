import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatCard from '../../components/dash/StatCard.jsx';
import { AreaChart, Bars, Donut, ChartLegend, SERIES } from '../../components/dash/Charts.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { roomTypeById } from '../../data/hotel.js';
import './Overview.css';

const ROOM_STATES = [
  { key: 'available', label: 'Available' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'maintenance', label: 'Maintenance' },
];

export default function Overview() {
  const { analytics, reservations, rooms, guests, feedback } = useData();
  const k = analytics.kpis;

  const guestMap = useMemo(() => Object.fromEntries(guests.map((g) => [g.id, g.name])), [guests]);
  const nameOf = (r) => r.guestName || guestMap[r.guestId] || 'Guest';

  const arrivals = reservations.filter((r) => r.status === 'arriving');
  const departures = reservations.filter((r) => r.status === 'departing');

  const roomCounts = useMemo(() => {
    const c = {};
    for (const r of rooms) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rooms]);

  const revenueBars = analytics.months.map((m, i) => ({ label: m, value: analytics.revenueByMonth[i] }));
  const avgRating = (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1);

  return (
    <>
      <DashHeader title="Overview" subtitle="A live pulse of the property — occupancy, revenue, and today's movements.">
        <Link to="/dashboard/reservations" className="btn btn--sm">New reservation</Link>
      </DashHeader>

      <div className="kpi-grid">
        <StatCard label="Occupancy" value={k.occupancy} suffix="%" delta={k.occupancyDelta} icon="door" />
        <StatCard label="ADR" value={k.adr} prefix="$" delta={k.adrDelta} icon="trendingUp" />
        <StatCard label="RevPAR" value={k.revpar} prefix="$" delta={k.revparDelta} icon="chart" />
        <StatCard label="Revenue · MTD" value={k.revenueMTD} prefix="$" delta={k.revenueDelta} icon="receipt" />
        <StatCard label="Satisfaction" value={k.satisfaction} decimals={1} delta={k.satisfactionDelta} icon="star" />
      </div>

      <div className="dash-grid dash-grid--2" style={{ marginBottom: '1.5rem' }}>
        <Reveal as="section" className="panel">
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Occupancy</h2>
              <p className="panel__sub">Last 14 days · currently {k.occupancy}%</p>
            </div>
            <span className="badge badge--available"><span className="dot" />+{k.occupancyDelta}%</span>
          </div>
          <AreaChart data={analytics.occupancySeries} height={240} labels={['-14d', '-10d', '-6d', '-3d', 'Today']} />
        </Reveal>

        <Reveal as="section" className="panel" delay={0.08}>
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Booking source</h2>
              <p className="panel__sub">Share of reservations</p>
            </div>
          </div>
          <div className="overview-donut">
            <Donut data={analytics.bookingSource} centerValue={`${analytics.bookingSource[0].value}%`} centerLabel="Direct" />
            <ChartLegend items={analytics.bookingSource.map((b, i) => ({ label: b.label, value: b.value, suffix: '%', color: SERIES[i % SERIES.length] }))} />
          </div>
        </Reveal>
      </div>

      <div className="dash-grid dash-grid--2" style={{ marginBottom: '1.5rem' }}>
        <Reveal as="section" className="panel">
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Revenue</h2>
              <p className="panel__sub">Trailing six months</p>
            </div>
            <span className="td-mut">in thousands</span>
          </div>
          <Bars data={revenueBars} height={240} format={(v) => `$${v}k`} />
        </Reveal>

        <Reveal as="section" className="panel" delay={0.08}>
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Today</h2>
              <p className="panel__sub">Arrivals &amp; departures</p>
            </div>
            <Link to="/dashboard/reservations" className="panel__link">All <Icon name="arrowRight" size={13} /></Link>
          </div>
          <div className="today-counts">
            <div className="today-count"><span className="today-count__n">{arrivals.length}</span><span className="today-count__l"><Icon name="arrowRight" size={13} /> Arriving</span></div>
            <div className="today-count"><span className="today-count__n">{departures.length}</span><span className="today-count__l"><Icon name="arrowUpRight" size={13} /> Departing</span></div>
          </div>
          <div className="mini-list">
            {[...arrivals, ...departures].slice(0, 5).map((r) => (
              <div className="mini-item" key={r.id}>
                <span className="cell-avatar">{nameOf(r).split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                <div className="mini-item__main">
                  <div className="mini-item__title">{nameOf(r)}</div>
                  <div className="mini-item__sub">{roomTypeById[r.typeId]?.name} · Room {r.roomNo}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="dash-grid dash-grid--halves">
        <Reveal as="section" className="panel">
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Room status</h2>
              <p className="panel__sub">{rooms.length} rooms across the property</p>
            </div>
            <Link to="/dashboard/rooms" className="panel__link">Board <Icon name="arrowRight" size={13} /></Link>
          </div>
          <div className="room-status-list">
            {ROOM_STATES.map((s) => {
              const n = roomCounts[s.key] || 0;
              const pct = Math.round((n / rooms.length) * 100);
              return (
                <div className="room-status-row" key={s.key}>
                  <StatusBadge status={s.key} label={s.label} />
                  <div className="pbar" style={{ flex: 1 }}><div className="pbar__fill" style={{ width: `${pct}%` }} /></div>
                  <span className="room-status-row__n">{n}</span>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal as="section" className="panel" delay={0.08}>
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Recent feedback</h2>
              <p className="panel__sub">Average {avgRating} / 5</p>
            </div>
            <Link to="/dashboard/feedback" className="panel__link">All <Icon name="arrowRight" size={13} /></Link>
          </div>
          <div className="mini-list">
            {feedback.slice(0, 3).map((f) => (
              <div className="mini-item" key={f.id} style={{ alignItems: 'flex-start' }}>
                <div className="mini-item__main">
                  <div className="mini-item__sub" style={{ marginBottom: '0.3rem' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon key={i} name="star" size={12} style={{ color: i < f.rating ? 'var(--brass)' : 'var(--forest-2)' }} />
                    ))}
                    <span style={{ marginLeft: '0.5rem' }}>{guestMap[f.guestId] || 'Guest'} · {f.category}</span>
                  </div>
                  <div className="mini-item__title" style={{ fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--sage)' }}>“{f.comment}”</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </>
  );
}
