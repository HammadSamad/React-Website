import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatCard from '../../components/dash/StatCard.jsx';
import { AreaChart, Bars, Donut, ChartLegend, SERIES } from '../../components/dash/Charts.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import Stars from '../../components/common/Stars.jsx';
import { useData } from '../../context/DataContext.jsx';
import { reportsApi } from '../../lib/api.js';
const ROOM_STATES = [
  { key: 'available', label: 'Available' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'maintenance', label: 'Maintenance' },
];

export default function Overview() {
  const { reservations, rooms, guests, feedback, invoices } = useData();
  const [liveData, setLiveData] = useState(null);
  const live = Boolean(liveData);

  useEffect(() => {
    let active = true;
    reportsApi.dashboard().then((d) => { if (active && d && d.kpis) setLiveData(d); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const kp = liveData?.kpis || { occupancy: 0, adr: 0, revpar: 0, revenueMTD: 0, satisfaction: 0 };

  const guestMap = useMemo(() => Object.fromEntries(guests.map((g) => [g._id || g.id, g.guestName || g.name || g.username])), [guests]);
  const nameOf = (r) => r.guestId?.guestName || r.guestId?.username || guestMap[r.guestId] || 'Guest';

  const arrivals = reservations.filter((r) => r.bookingStatus === 'confirmed' || r.status === 'arriving');
  const departures = reservations.filter((r) => r.bookingStatus === 'checked-in' || r.status === 'departing');

  const roomCounts = useMemo(() => {
    const c = {};
    for (const r of rooms) c[r.roomStatus] = (c[r.roomStatus] || 0) + 1;
    return c;
  }, [rooms]);

  const occSeries = useMemo(() => {
    if (reservations.length === 0) return Array(14).fill(0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const active = reservations.filter((r) => (r.bookingStatus || r.status || '').match(/^(confirmed|checked-in)$/));
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date(today); day.setDate(today.getDate() - i);
      const t = day.getTime();
      let n = 0;
      for (const r of active) {
        const ci = new Date(r.checkInDate).getTime();
        const co = new Date(r.checkOutDate).getTime();
        if (!Number.isNaN(ci) && !Number.isNaN(co) && ci <= t && co > t) n += 1;
      }
      out.push(n);
    }
    return out;
  }, [reservations]);

  const bookingDonut = useMemo(() => {
    const order = ['confirmed', 'checked-in', 'checked-out', 'cancelled', 'pending'];
    const labelOf = { confirmed: 'Confirmed', 'checked-in': 'Checked in', 'checked-out': 'Checked out', cancelled: 'Cancelled', pending: 'Pending' };
    const st = {};
    for (const r of reservations) {
      const s = r.bookingStatus || r.status || 'pending';
      st[s] = (st[s] || 0) + 1;
    }
    const arr = order.filter((s) => (st[s] || 0) > 0).map((s) => ({ label: labelOf[s] || s, value: st[s] }));
    const total = arr.reduce((s, d) => s + d.value, 0);
    const confirmed = st.confirmed || 0;
    return {
      data: arr.length ? arr : [{ label: 'Pending', value: 0 }],
      pct: total ? Math.round((confirmed / total) * 100) : 0,
      count: total,
    };
  }, [reservations]);

  const revenueBars = useMemo(() => {
    const now = new Date();
    const buckets = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets[d.getFullYear() + '-' + d.getMonth()] = { label: d.toLocaleString('en-US', { month: 'short' }), value: 0 };
    }
    for (const inv of invoices) {
      if ((inv.paymentStatus || inv.status) !== 'paid') continue;
      const d = new Date(inv.createdAt || inv.date || now);
      const key = d.getFullYear() + '-' + d.getMonth();
      if (buckets[key]) buckets[key].value += Number(inv.totalAmount || inv.amount || 0);
    }
    return Object.values(buckets);
  }, [invoices]);

  const avgRating = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : '0.0';
  const initials = (n = '') => (String(n || '').split(' ').map((w) => w[0]).slice(0, 2).join('') || 'G').toUpperCase();

  return (
    <>
      <DashHeader title="Overview" subtitle="A live pulse of the property — occupancy, revenue, and today's movements.">
        <Link to="/dashboard/reservations" className="btn btn--sm">New reservation</Link>
      </DashHeader>

      <div className="kpi-grid">
        <StatCard label="Occupancy" value={kp.occupancy} suffix="%" icon="door" />
        <StatCard label="ADR" value={kp.adr} prefix="$" icon="trendingUp" />
        <StatCard label="RevPAR" value={kp.revpar} prefix="$" icon="chart" />
        <StatCard label="Revenue · MTD" value={kp.revenueMTD} prefix="$" icon="receipt" />
        <StatCard label="Satisfaction" value={kp.satisfaction} decimals={1} icon="star" />
      </div>

      <div className="dash-grid dash-grid--2" style={{ marginBottom: '1.5rem' }}>
        <Reveal as="section" className="panel">
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Occupancy</h2>
              <p className="panel__sub">Last 14 days · currently {kp.occupancy}%</p>
            </div>
            {live
              ? <span className="badge badge--available"><span className="dot" />Live</span>
              : <span className="badge badge--neutral">Syncing…</span>}
          </div>
          <AreaChart data={occSeries} height={240} labels={['-14d', '-10d', '-6d', '-3d', 'Today']} />
        </Reveal>

        <Reveal as="section" className="panel" delay={0.08}>
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Bookings</h2>
              <p className="panel__sub">Share of reservations by status</p>
            </div>
          </div>
          <div className="overview-donut">
            <Donut data={bookingDonut.data} centerValue={`${bookingDonut.pct}%`} centerLabel="Confirmed" />
            <ChartLegend items={bookingDonut.data.map((b, i) => ({ label: b.label, value: bookingDonut.count ? Math.round((b.value / bookingDonut.count) * 100) : 0, suffix: '%', color: SERIES[i % SERIES.length] }))} />
          </div>
        </Reveal>
      </div>

      <div className="dash-grid dash-grid--2" style={{ marginBottom: '1.5rem' }}>
        <Reveal as="section" className="panel">
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Revenue</h2>
              <p className="panel__sub">Trailing six months · paid invoices</p>
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
              <div className="mini-item" key={r._id || r.id}>
                <span className="cell-avatar">{nameOf(r).split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                <div className="mini-item__main">
                  <div className="mini-item__title">{nameOf(r)}</div>
                  <div className="mini-item__sub">{r.roomId?.roomType || 'Suite'} · Room {r.roomId?.roomNumber || 'On arrival'}</div>
                </div>
                <StatusBadge status={r.bookingStatus || r.status} />
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
          <div className="fb-mini-list">
            {feedback.slice(0, 3).map((f) => (
              <article className="fb-mini" key={f._id || f.id}>
                <div className="fb-mini__head">
                  <span className="fb-mini__avatar">{initials(nameOf(f))}</span>
                  <div className="fb-mini__meta">
                    <div className="fb-mini__name">
                      {nameOf(f)}
                      <span className="fb-mini__cat">{f.category || 'Website'}</span>
                    </div>
                    <Stars value={f.rating} size={12} />
                  </div>
                  <span className="fb-mini__score">{f.rating}<small>/5</small></span>
                </div>
                <p className="fb-mini__comment">{f.feedbackMessage || f.comment}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </div>
    </>
  );
}
