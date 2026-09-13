import { useMemo, useState, useEffect } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatCard from '../../components/dash/StatCard.jsx';
import { AreaChart, Bars, Donut, ChartLegend, SERIES } from '../../components/dash/Charts.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import Modal from '../../components/common/Modal.jsx';
import { useData } from '../../context/DataContext.jsx';
import { money } from '../../data/hotel.js';
import { reportsApi } from '../../lib/api.js';
import { useNow, useToday } from '../../lib/useNow.js';
const PERIODS = [
  { key: 'quarter', label: 'Quarter', months: 3 },
  { key: 'half', label: 'Half-year', months: 6 },
];
const RES_STATUSES = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];
const ROOM_STATUSES = ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'];
const ROOM_FIELD = {
  available: 'availableRooms',
  occupied: 'occupiedRooms',
  reserved: 'reservedRooms',
  cleaning: 'cleaningRooms',
  maintenance: 'maintenanceRooms',
};
const REPORT_TYPES = [
  { key: 'occupancy', label: 'Occupancy' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'booking', label: 'Booking' },
  { key: 'guest', label: 'Guest' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'maintenance', label: 'Maintenance' },
];
const reportTypeLabel = (t) => (REPORT_TYPES.find((x) => x.key === t) || {}).label || t || '—';
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const statusLabel = (s) => s.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase());

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
  const { analytics, reservations, rooms, feedback, notify } = useData();
  const now = useNow();
  const today = useToday();
  const longDate = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const [period, setPeriod] = useState('half');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [liveData, setLiveData] = useState(null);
  const [metrics, setMetrics] = useState({ occupancy: null, revenue: null, booking: null, feedback: null });
  const [savedReports, setSavedReports] = useState([]);
  const [reportType, setReportType] = useState('occupancy');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const k = liveData?.kpis || analytics.kpis;
  const p = PERIODS.find((x) => x.key === period) || PERIODS[1];

  useEffect(() => {
    let active = true;
    reportsApi.dashboard(startDate || undefined, endDate || undefined).then((data) => {
      if (active && data && data.kpis) setLiveData(data);
    }).catch(() => {});
    Promise.all([
      reportsApi.occupancy(startDate || undefined, endDate || undefined).catch(() => null),
      reportsApi.revenue(startDate || undefined, endDate || undefined).catch(() => null),
      reportsApi.booking(startDate || undefined, endDate || undefined).catch(() => null),
      reportsApi.feedback().catch(() => null),
    ]).then(([occupancy, revenue, booking, feedback]) => {
      if (active) setMetrics({ occupancy, revenue, booking, feedback });
    });
    return () => { active = false; };
  }, [startDate, endDate]);

  const loadSavedReports = () => reportsApi.list().then(setSavedReports).catch(() => setSavedReports([]));
  useEffect(() => { loadSavedReports(); }, []);

  const revenueBars = useMemo(() => {
    const months = analytics.months.slice(-p.months);
    const vals = analytics.revenueByMonth.slice(-p.months);
    return months.map((m, i) => ({ label: m, value: vals[i] }));
  }, [analytics, p.months]);
  const periodRevenue = useMemo(() => revenueBars.reduce((s, r) => s + r.value, 0), [revenueBars]);

  const revByType = useMemo(() => {
    const m = {};
    for (const r of reservations) {
      let name = r.roomId?.roomType || r.typeId || 'Unknown';
      if (r.roomId && !r.roomId.roomType) {
         const room = rooms.find(rm => (rm._id || rm.id) === (r.roomId?._id || r.roomId));
         if (room) name = room.roomType;
      }
      m[name] = (m[name] || 0) + (r.amount || r.totalPrice || 0);
    }
    return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [reservations, rooms]);
  const bookedTotal = useMemo(() => revByType.reduce((s, r) => s + r.value, 0), [revByType]);

  const resByStatus = useMemo(() => {
    const b = metrics.booking;
    if (b) {
      const counted = (b.confirmedBookings || 0) + (b.cancelledBookings || 0) + (b.checkedInBookings || 0) + (b.checkedOutBookings || 0);
      const pending = Math.max(0, (b.totalBookings || 0) - counted);
      return [
        { status: 'pending', count: pending },
        { status: 'confirmed', count: b.confirmedBookings || 0 },
        { status: 'checked-in', count: b.checkedInBookings || 0 },
        { status: 'checked-out', count: b.checkedOutBookings || 0 },
        { status: 'cancelled', count: b.cancelledBookings || 0 },
      ].filter((s) => s.count > 0);
    }
    const c = {};
    for (const r of reservations) c[r.bookingStatus || r.status] = (c[r.bookingStatus || r.status] || 0) + 1;
    return RES_STATUSES.filter((s) => c[s]).map((s) => ({ status: s, count: c[s] }));
  }, [metrics.booking, reservations]);

  const roomTotal = metrics.occupancy?.totalRooms ?? rooms.length;
  const roomsByStatus = useMemo(() => {
    const o = metrics.occupancy;
    if (o) {
      return ROOM_STATUSES.map((s) => ({ status: s, count: o[ROOM_FIELD[s]] || 0 }));
    }
    const c = {};
    for (const r of rooms) c[r.roomStatus || r.status] = (c[r.roomStatus || r.status] || 0) + 1;
    return ROOM_STATUSES.map((s) => ({ status: s, count: c[s] || 0 }));
  }, [metrics.occupancy, rooms]);

  const satByCat = useMemo(() => {
    const m = {};
    for (const f of feedback) (m[f.category] ||= []).push(f.rating);
    return Object.entries(m)
      .map(([label, arr]) => ({ label, count: arr.length, avg: arr.reduce((s, x) => s + x, 0) / arr.length }))
      .sort((a, b) => b.avg - a.avg);
  }, [feedback]);

  const exportPdf = async () => {
    try {
      const blob = await reportsApi.exportPdf(startDate || undefined, endDate || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luxurystay-report-${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify('Report exported as PDF.');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

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
    downloadCsv(`luxurystay-report-${period}-${today}.csv`, rows);
    notify('Report exported as CSV.');
  };

  const saveReport = async () => {
    setSaving(true);
    try {
      await reportsApi.create({
        reportType,
        reportTitle: `${p.label} performance report — ${longDate}`,
        reportDescription: startDate || endDate ? `${startDate || '…'} → ${endDate || 'today'}` : 'All time',
        reportData: {
          period,
          generated: new Date().toISOString(),
          kpis: k,
          occupancy: metrics.occupancy,
          revenue: metrics.revenue,
          booking: metrics.booking,
          feedback: metrics.feedback,
          revenueByMonth: revenueBars,
          revenueByRoomType: revByType,
        },
      });
      notify('Current report saved.');
      await loadSavedReports();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    try {
      await reportsApi.delete(confirmDelete);
      notify('Saved report deleted.');
      setConfirmDelete(null);
      await loadSavedReports();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  return (
    <>
      <DashHeader title="Reports & Analytics" subtitle={`Performance summary · generated ${longDate}`}>
        <button className="btn btn--sm btn--outline" onClick={() => window.print()}><Icon name="print" size={15} /> Print</button>
        <button className="btn btn--sm" onClick={exportCsv}><Icon name="download" size={15} /> Export CSV</button>
        <button className="btn btn--sm" onClick={exportPdf}><Icon name="file" size={15} /> Export PDF</button>
      </DashHeader>

      <div className="dash-toolbar rep-toolbar">
        <div className="seg">
          {PERIODS.map((x) => (
            <button key={x.key} className={`seg__btn ${period === x.key ? 'is-active' : ''}`} onClick={() => setPeriod(x.key)}>{x.label}</button>
          ))}
        </div>
        <label className="field">
          <span className="field-label">From</span>
          <input className="input" type="date" max={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">To</span>
          <input className="input" type="date" max={today} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
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
              <p className="panel__sub">{p.label} · in thousands{metrics.revenue ? ` · ${money(metrics.revenue.totalRevenue)} total paid` : ''}</p>
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
          <div className="panel__head"><div><h2 className="panel__title">Room inventory</h2><p className="panel__sub">{roomTotal} rooms</p></div></div>
          <div className="rep-list">
            {roomsByStatus.map((r) => {
              const pct = roomTotal ? Math.round((r.count / roomTotal) * 100) : 0;
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
          <div className="panel__head"><div><h2 className="panel__title">Satisfaction</h2><p className="panel__sub">By category · {metrics.feedback ? `${metrics.feedback.totalFeedback || 0} reviews, ${metrics.feedback.averageRating || 0} overall` : 'overall average'}</p></div></div>
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

      <Reveal as="section" className="panel panel--flush rep-saved-section" delay={0.12}>
        <div className="panel__head rep-saved-head">
          <div>
            <h2 className="panel__title">Saved reports</h2>
            <p className="panel__sub">Snapshots saved to the backend · {savedReports.length} on file</p>
          </div>
          <div className="rep-save">
            <select className="select select--dark" value={reportType} onChange={(e) => setReportType(e.target.value)} aria-label="Report type">
              {REPORT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <button className="btn btn--sm" onClick={saveReport} disabled={saving}>
              <Icon name="plus" size={15} /> {saving ? 'Saving…' : 'Save current'}
            </button>
          </div>
        </div>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>Title</th><th>Type</th><th>Period</th><th>Saved</th><th></th></tr>
            </thead>
            <tbody>
              {savedReports.map((r) => (
                <tr key={r._id || r.id}>
                  <td className="td-strong">{r.reportTitle}</td>
                  <td>{reportTypeLabel(r.reportType)}</td>
                  <td className="td-mut">{r.reportDescription || '—'}</td>
                  <td className="td-mut">{fmtDate(r.reportDate || r.createdAt)}</td>
                  <td className="num">
                    <div className="row-actions">
                      <button className="icon-btn icon-btn--danger" title="Delete saved report" onClick={() => setConfirmDelete(r._id || r.id)}><Icon name="trash" size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {savedReports.length === 0 && <div className="dash-empty"><Icon name="file" size={30} /><p>No saved reports yet. Save the current view to keep a snapshot.</p></div>}
        </div>
      </Reveal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete saved report?"
        subtitle="This permanently removes the snapshot from the backend."
        footer={<>
          <button className="btn btn--outline" onClick={() => setConfirmDelete(null)}>Keep report</button>
          <button className="btn btn--danger" onClick={doDelete}><Icon name="trash" size={15} /> Delete report</button>
        </>}
      >
        <p style={{ margin: 0, color: 'var(--ink-soft, #6b7280)', fontSize: '0.95rem' }}>Are you sure you want to delete this saved report? This action cannot be undone.</p>
      </Modal>
    </>
  );
}