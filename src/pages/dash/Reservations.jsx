import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { checkInOutApi, reservationsApi } from '../../lib/api.js';
import { useToday } from '../../lib/useNow.js';
import { nights, money, guestById } from '../../data/hotel.js';
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Upcoming' },
  { key: 'checked-in', label: 'In-house' },
  { key: 'checked-out', label: 'Departed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const fmt = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const addDays = (iso, n) => {
  if (!iso || iso.length < 10) return iso || '';
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function Reservations() {
  const { reservations, setReservations, notify, guests, rooms, refreshAll } = useData();
  const today = useToday();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ guestId: guests[0]?._id || guests[0]?.id || '', roomId: rooms[0]?._id || rooms[0]?.id || '', checkInDate: today, checkOutDate: addDays(today, 2), numberOfGuests: 2 });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ roomId: '', checkInDate: today, checkOutDate: addDays(today, 2), numberOfGuests: 2 });
  const [confirmCancel, setConfirmCancel] = useState(null);

  const uniqueRooms = useMemo(() => {
    const map = new Map();
    for (const r of rooms) if (!map.has(r.roomType)) map.set(r.roomType, r);
    return Array.from(map.values());
  }, [rooms]);

  const nameOf = (r) => r.guestId?.guestName || r.guestId?.username || guestById[r.guestId]?.name || 'Guest';
  const emailOf = (r) => r.guestId?.guestEmail || r.guestId?.email || guestById[r.guestId]?.email || '';

  const counts = useMemo(() => {
    const c = { all: reservations.length };
    for (const r of reservations) c[r.bookingStatus || r.status] = (c[r.bookingStatus || r.status] || 0) + 1;
    return c;
  }, [reservations]);

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (tab !== 'all' && (r.bookingStatus || r.status) !== tab) return false;
      if (!q) return true;
      const hay = `${nameOf(r)} ${r.confirmationCode} ${r.roomId?.roomNumber || ''}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [reservations, tab, q]);

  const amountCalc = (roomId, checkIn, checkOut) => {
    const r = rooms.find(rm => (rm._id || rm.id) === roomId);
    if (!r) return 0;
    const nn = Math.max(1, nights(checkIn.split('T')[0], checkOut.split('T')[0]));
    return r.roomPrice * nn;
  };

  const submit = async () => {
    try {
      await reservationsApi.create(form);
      refreshAll();
      notify('Reservation created successfully');
      setOpen(false);
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const openEdit = (r) => {
    setEditForm({ 
      roomId: r.roomId?._id || r.roomId, 
      checkInDate: r.checkInDate.split('T')[0], 
      checkOutDate: r.checkOutDate.split('T')[0], 
      numberOfGuests: r.numberOfGuests 
    });
    setEditing(r._id || r.id);
  };

  const saveEdit = async () => {
    try {
      await reservationsApi.update(editing, editForm);
      refreshAll();
      notify('Reservation updated successfully');
      setEditing(null);
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const checkInGuest = async (r) => {
    try {
      await checkInOutApi.checkIn({
        guestId: r.guestId?._id || r.guestId,
        roomId: r.roomId?._id || r.roomId,
        reservationId: r._id || r.id,
        checkInDate: today,
        numberOfGuests: r.numberOfGuests || 1,
      });
      await refreshAll();
      notify('Guest checked in successfully');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const checkOutGuest = async (r) => {
    try {
      const checkIns = await checkInOutApi.listCheckIns();
      const record = checkIns.find((c) => (c.reservationId?._id || c.reservationId) === (r._id || r.id));
      if (!record) return notify('No check-in record found for this reservation.', 'error');
      const res = await checkInOutApi.checkOut(record._id || record.id);
      await refreshAll();
      notify('Guest checked out');
      if (res?.invoice) notify(`Invoice #${String(res.invoice._id).slice(-6).toUpperCase()} created`, 'warn');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const cancelRes = async () => {
    try {
      await reservationsApi.cancel(confirmCancel, 'Cancelled by staff');
      setConfirmCancel(null);
      refreshAll();
      notify('Reservation cancelled');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  return (
    <>
      <DashHeader title="Reservations" subtitle="Manage arrivals, in-house guests, and departures.">
        <button className="btn btn--sm" onClick={() => setOpen(true)}><Icon name="plus" size={15} /> New reservation</button>
      </DashHeader>

      <div className="dash-toolbar">
        <div className="dash-search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guest, code, or room…" />
        </div>
        <div className="seg">
          {TABS.map((t) => (
            <button key={t.key} className={`seg__btn ${tab === t.key ? 'is-active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}<span className="seg__count">{counts[t.key] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="panel panel--flush">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Guest</th><th>Code</th><th>Suite</th><th>Room</th><th>Stay</th><th className="num">Guests</th><th className="num">Amount</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id || r.id}>
                  <td>
                    <div className="cell-user">
                      <span className="cell-avatar">{nameOf(r).split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                      <div>
                        <div className="cell-user__name">{nameOf(r)}</div>
                        <div className="cell-user__sub">{emailOf(r)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td-mut">{r.confirmationCode}</td>
                  <td>{r.roomId?.roomType}</td>
                  <td className="td-mut">{r.roomId?.roomNumber}</td>
                  <td>
                    <div className="td-strong">{fmt(r.checkInDate)} → {fmt(r.checkOutDate)}</div>
                    <div className="td-mut">{nights(r.checkInDate.split('T')[0], r.checkOutDate.split('T')[0])} nights</div>
                  </td>
                  <td className="num">{r.numberOfGuests}</td>
                  <td className="num td-strong">{money(amountCalc(r.roomId?._id, r.checkInDate, r.checkOutDate))}</td>
                  <td><StatusBadge status={r.bookingStatus || r.status} /></td>
                  <td>
                    <div className="row-actions">
                      {['confirmed', 'pending'].includes(r.bookingStatus || r.status) && (
                        <button className="btn btn--sm" onClick={() => checkInGuest(r)}>Check in</button>
                      )}
                      {(r.bookingStatus || r.status) === 'checked-in' && (
                        <button className="btn btn--sm btn--outline" onClick={() => checkOutGuest(r)}>Check out</button>
                      )}
                      {!['checked-out', 'cancelled'].includes(r.bookingStatus || r.status) && (
                        <button className="icon-btn" title="Edit reservation" onClick={() => openEdit(r)}><Icon name="edit" size={15} /></button>
                      )}
                      {!['checked-out', 'cancelled'].includes(r.bookingStatus || r.status) && (
                        <button className="icon-btn icon-btn--danger" title="Cancel reservation" onClick={() => setConfirmCancel(r._id || r.id)}><Icon name="close" size={15} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="dash-empty"><Icon name="calendar" size={30} /><p>No reservations match your view.</p></div>
          )}
        </div>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New reservation"
        subtitle="Create a booking on behalf of a guest."
        footer={<>
          <button className="btn btn--outline" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn" onClick={submit}>Create · {money(amountCalc(form.roomId, form.checkInDate, form.checkOutDate))}</button>
        </>}
      >
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Guest</span>
            <select className="select" value={form.guestId} onChange={(e) => setForm((f) => ({ ...f, guestId: e.target.value }))}>
              <option value="">Select guest</option>
              {guests.map((g) => <option key={g._id || g.id} value={g._id || g.id}>{g.guestName || g.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Room</span>
            <select className="select" value={form.roomId} onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}>
              {rooms.map((t) => <option key={t._id || t.id} value={t._id || t.id}>Room {t.roomNumber} - {t.roomType} (${t.roomPrice})</option>)}
            </select>
          </label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field">
            <span className="field-label">Arrival</span>
            <input className="input" type="date" min={today} value={form.checkInDate}
              onChange={(e) => setForm((f) => ({ ...f, checkInDate: e.target.value, checkOutDate: e.target.value >= f.checkOutDate ? addDays(e.target.value, 1) : f.checkOutDate }))} />
          </label>
          <label className="field">
            <span className="field-label">Departure</span>
            <input className="input" type="date" min={addDays(form.checkInDate, 1)} value={form.checkOutDate}
              onChange={(e) => setForm((f) => ({ ...f, checkOutDate: e.target.value }))} />
          </label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}>
          <span className="field-label">Guests</span>
          <select className="select" value={form.numberOfGuests} onChange={(e) => setForm((f) => ({ ...f, numberOfGuests: Number(e.target.value) }))}>
            {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit reservation"
        subtitle="Update dates, room, or party size."
        footer={<>
          <button className="btn btn--outline" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn" onClick={saveEdit}>Save · {money(amountCalc(editForm.roomId, editForm.checkInDate, editForm.checkOutDate))}</button>
        </>}
      >
        <div className="form-grid">
          <label className="field" style={{ gridColumn: 'span 2' }}>
            <span className="field-label">Room</span>
            <select className="select" value={editForm.roomId} onChange={(e) => setEditForm((f) => ({ ...f, roomId: e.target.value }))}>
              {rooms.map((t) => <option key={t._id || t.id} value={t._id || t.id}>Room {t.roomNumber} - {t.roomType} (${t.roomPrice})</option>)}
            </select>
          </label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field">
            <span className="field-label">Arrival</span>
            <input className="input" type="date" value={editForm.checkInDate}
              onChange={(e) => setEditForm((f) => ({ ...f, checkInDate: e.target.value, checkOutDate: e.target.value >= f.checkOutDate ? addDays(e.target.value, 1) : f.checkOutDate }))} />
          </label>
          <label className="field">
            <span className="field-label">Departure</span>
            <input className="input" type="date" min={addDays(editForm.checkInDate, 1)} value={editForm.checkOutDate}
              onChange={(e) => setEditForm((f) => ({ ...f, checkOutDate: e.target.value }))} />
          </label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}>
          <span className="field-label">Guests</span>
          <select className="select" value={editForm.numberOfGuests} onChange={(e) => setEditForm((f) => ({ ...f, numberOfGuests: Number(e.target.value) }))}>
            {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </Modal>

      <Modal
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        title="Cancel reservation?"
        subtitle="This will cancel the booking and release the room. This action cannot be undone."
        footer={<>
          <button className="btn btn--outline" onClick={() => setConfirmCancel(null)}>Keep reservation</button>
          <button className="btn btn--danger" onClick={cancelRes}><Icon name="close" size={15} /> Cancel reservation</button>
        </>}
      >
        <p style={{ margin: 0, color: 'var(--ink-soft, #6b7280)', fontSize: '0.95rem' }}>Are you sure you want to cancel this reservation? Any checked-in guests must be checked out first.</p>
      </Modal>
    </>
  );
}