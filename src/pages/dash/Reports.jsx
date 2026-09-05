import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatCard from '../../components/dash/StatCard.jsx';
import { AreaChart, Bars, Donut, ChartLegend, SERIES } from '../../components/dash/Charts.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { money, TODAY } from '../../data/hotel.js';
import './Reports.css';

const PERIODS = [
  { key: 'quarter', label: 'Quarter', months: 3 },
  { key: 'half', label: 'Half-year', months: 6 },
];
const RES_STATUSES = ['confirmed', 'arriving', 'checked-in', 'departing', 'checked-out', 'cancelled'];
const ROOM_STATUSES = ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'];
const statusLabel = (s) => s.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase());
const longDate = new Date(TODAY + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

function downloadCsv(filename, rows) {
  const csv = rows
    .map((r) => r.map((cell) => {
      const s = String(cell ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { analytics, reservations, rooms, feedback, roomTypeById, notify } = useData();
  const [period, setPeriod] = useState('half');
  const k = analytics.kpis;
  const p = PERIODS.find((x) => x.key === period) || PERIODS[1];

  const revenueBars = useMemo(() => {
    const months = analytics.months.slice(-p.months);
    const vals = analytics.revenueByMonth.slice(-p.months);
    return months.map((m, i) => ({ label: m, value: vals[i] }));
  }, [analytics, p.months]);
  const periodRevenue = useMemo(() => revenueBars.reduce((s, r) => s + r.value, 0), [revenueBars]);

  const revByType = useMemo(() => {
    const m = {};
    for (const r of reservations) {
      const name = roomTypeById[r.typeId]?.name || r.typeId;
      m[name] = (m[name] || 0) + (r.amount || 0);
    }
    return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [reservations, roomTypeById]);
  const bookedTotal = useMemo(() => revByType.reduce((s, r) => s + r.value, 0), [revByType]);

  const resByStatus = useMemo(() => {
    const c = {};
    for (const r of reservations) c[r.status] = (c[r.status] || 0) + 1;
    return RES_STATUSES.filter((s) => c[s]).map((s) => ({ status: s, count: c[s] }));
  }, [reservations]);

  const roomsByStatus = useMemo(() => {
    const c = {};
    for (const r of rooms) c[r.status] = (c[r.status] || 0) + 1;
    return ROOM_STATUSES.map((s) => ({ status: s, count: c[s] || 0 }));
  }, [rooms]);

  const satByCat = useMemo(() => {
    const m = {};
    for (const f of feedback) (m[f.category] ||= []).push(f.rating);
    return Object.entries(m)
      .map(([label, arr]) => ({ label, count: arr.length, avg: arr.reduce((s, x) => s + x, 0) / arr.length }))
      .sort((a, b) => b.avg - a.avg);
  }, [feedback]);

  const exportCsv = () => {
    const rows = [
      ['LuxuryStay Hospitality — Performance report'],
      ['Generated', longDate],
      ['Period', p.label],
      [],
      ['Key metrics'],
      ['Occupancy (%)', k.occupancy],
      ['ADR ($)', k.adr],
      ['RevPAR ($)', k.revpar],
      ['Revenue MTD ($)', k.revenueMTD],
      ['Guest satisfaction (/5)', k.satisfaction],
      [],
      ['Revenue by month ($k)'],
      ['Month', 'Revenue'],
      ...revenueBars.map((r) => [r.label, r.value]),
      ['Total', periodRevenue],
      [],
      ['Booked revenue by room type ($)'],
      ['Room type', 'Revenue'],
      ...revByType.map((r) => [r.label, r.value]),
      ['Total', bookedTotal],
      [],
      ['Reservations by status'],
      ['Status', 'Count'],
      ...resByStatus.map((r) => [statusLabel(r.status), r.count]),
      [],
      ['Room inventory by status'],
      ['Status', 'Count'],
      ...roomsByStatus.map((r) => [statusLabel(r.status), r.count]),
      [],
      ['Guest satisfaction by category'],
      ['Category', 'Reviews', 'Average rating'],
      ...satByCat.map((r) => [r.label, r.count, r.avg.toFixed(2)]),
    ];
    downloadCsv(`luxurystay-report-${period}-${TODAY}.csv`, rows);
    notify('Report exported as CSV.');
  };

  return (
    <>
      <DashHeader title="Reports &amp; Analytics" subtitle={`Performance summary · generated ${longDate}`}>
        <button className="btn btn--sm btn--outline" onClick={() => window.print()}><Icon name="print" size={15} /> Print</button>
        <button className="btn btn--sm" onClick={exportCsv}><Icon name="download" size={15} /> Export CSV</button>
      </DashHeader>

      <div className="dash-toolbar">
        <div className="seg">
          {PERIODS.map((x) => (
            <button key={x.key} className={`seg__btn ${period === x.key ? 'is-active' : ''}`} onClick={() => setPeriod(x.key)}>{x.label}</button>
          ))}
        </div>
        <span className="rep-meta">Revenue this period · <strong>${periodRevenue}k</strong></span>
      </div>

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
              <h2 className="panel__title">Revenue</h2>
              <p className="panel__sub">{p.label} · in thousands</p>
            </div>
            <span className="td-mut">${periodRevenue}k total</span>
          </div>
          <Bars data={revenueBars} height={240} format={(v) => `$${v}k`} />
        </Reveal>

        <Reveal as="section" className="panel" delay={0.08}>
          <div className="panel__head">
            <div>
              <h2 className="panel__title">Occupancy trend</h2>
              <p className="panel__sub">Last 14 days · currently {k.occupancy}%</p>
            </div>
          </div>
          <AreaChart data={analytics.occupancySeries} height={240} labels={['-14d', '-10d', '-6d', '-3d', 'Today']} />
        </Reveal>
      </div>

      <div className="dash-grid dash-grid--2" style={{ marginBottom: '1.5rem' }}>
        <Reveal as="section" className="panel panel--flush">
          <div className="panel__head" style={{ padding: '1.5rem 1.5rem 0' }}>
            <div><h2 className="panel__title">Booked revenue by room type</h2><p className="panel__sub">Total {money(bookedTotal)}</p></div>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead><tr><th>Room type</th><th className="num">Revenue</th><th className="num">Share</th></tr></thead>
              <tbody>
                {revByType.map((r) => (
                  <tr key={r.label}>
                    <td className="td-strong">{r.label}</td>
                    <td className="num">{money(r.value)}</td>
                    <td className="num td-mut">{bookedTotal ? Math.round((r.value / bookedTotal) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal as="section" className="panel" delay={0.08}>
          <div className="panel__head">
            <div><h2 className="panel__title">Booking source</h2><p className="panel__sub">Share of reservations</p></div>
          </div>
          <div className="rep-donut">
            <Donut data={analytics.bookingSource} centerValue={`${analytics.bookingSource[0].value}%`} centerLabel="Direct" />
            <ChartLegend items={analytics.bookingSource.map((b, i) => ({ label: b.label, value: b.value, suffix: '%', color: SERIES[i % SERIES.length] }))} />
          </div>
        </Reveal>
      </div>

      <div className="dash-grid dash-grid--3">
        <Reveal as="section" className="panel">
          <div className="panel__head"><div><h2 className="panel__title">Reservations</h2><p className="panel__sub">By status</p></div></div>
          <div className="rep-list">
            {resByStatus.map((r) => (
              <div className="rep-row" key={r.status}>
                <span className="rep-row__label">{statusLabel(r.status)}</span>
                <span className="rep-row__val">{r.count}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="panel" delay={0.06}>
          <div className="panel__head"><div><h2 className="panel__title">Room inventory</h2><p className="panel__sub">{rooms.length} rooms</p></div></div>
          <div className="rep-list">
            {roomsByStatus.map((r) => {
              const pct = rooms.length ? Math.round((r.count / rooms.length) * 100) : 0;
              return (
                <div className="rep-row" key={r.status}>
                  <span className="rep-row__label">{statusLabel(r.status)}</span>
                  <div className="pbar" style={{ flex: 1 }}><div className="pbar__fill" style={{ width: `${pct}%` }} /></div>
                  <span className="rep-row__val">{r.count}</span>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal as="section" className="panel" delay={0.12}>
          <div className="panel__head"><div><h2 className="panel__title">Satisfaction</h2><p className="panel__sub">By category</p></div></div>
          <div className="rep-list">
            {satByCat.map((r) => (
              <div className="rep-row" key={r.label}>
                <span className="rep-row__label">{r.label}</span>
                <span className="rep-row__star"><Icon name="star" size={12} style={{ color: 'var(--brass)' }} /> {r.avg.toFixed(1)}</span>
                <span className="rep-row__val td-mut">{r.count}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </>
  );
}
