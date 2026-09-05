import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { roomTypes, roomTypeById, guestById, nights, money, TODAY } from '../../data/hotel.js';
import './Reservations.css';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'arriving', label: 'Arriving' },
  { key: 'checked-in', label: 'In-house' },
  { key: 'departing', label: 'Departing' },
  { key: 'confirmed', label: 'Upcoming' },
  { key: 'checked-out', label: 'Departed' },
];
const fmt = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export default function Reservations() {
  const { reservations, guests, rooms, checkIn, checkOut, cancelReservation, addReservation, updateReservation, settings } = useData();
  const rate = (id) => settings.rates?.[id] ?? roomTypeById[id].price;
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ guestId: guests[0]?.id, typeId: 'palm-court', checkIn: TODAY, checkOut: addDays(TODAY, 2), guests: 2 });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ typeId: 'palm-court', roomNo: '', checkIn: TODAY, checkOut: addDays(TODAY, 2), guests: 2 });

  const guestMap = useMemo(() => Object.fromEntries(guests.map((g) => [g.id, g])), [guests]);
  const nameOf = (r) => r.guestName || guestMap[r.guestId]?.name || guestById[r.guestId]?.name || 'Guest';
  const emailOf = (r) => guestMap[r.guestId]?.email || guestById[r.guestId]?.email || '';

  const counts = useMemo(() => {
    const c = { all: reservations.length };
    for (const r of reservations) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [reservations]);

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (tab !== 'all' && r.status !== tab) return false;
      if (!q) return true;
      const hay = `${nameOf(r)} ${r.code} ${r.roomNo}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [reservations, tab, q]); // eslint-disable-line

  const type = roomTypeById[form.typeId];
  const nn = Math.max(1, nights(form.checkIn, form.checkOut));
  const amount = rate(form.typeId) * nn;

  const submit = () => {
    const roomNo = rooms.find((r) => r.typeId === form.typeId && r.status === 'available')?.no || 'On arrival';
    addReservation({
      guestId: form.guestId,
      typeId: form.typeId,
      roomNo,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      guests: Number(form.guests),
      amount,
      source: 'staff',
    });
    setOpen(false);
  };

  const editType = roomTypeById[editForm.typeId];
  const editNn = Math.max(1, nights(editForm.checkIn, editForm.checkOut));
  const editAmount = rate(editForm.typeId) * editNn;
  const openEdit = (r) => {
    setEditForm({ typeId: r.typeId, roomNo: r.roomNo || '', checkIn: r.checkIn, checkOut: r.checkOut, guests: r.guests });
    setEditing(r.id);
  };
  const saveEdit = () => {
    updateReservation(editing, {
      typeId: editForm.typeId,
      roomNo: editForm.roomNo.trim() || 'On arrival',
      checkIn: editForm.checkIn,
      checkOut: editForm.checkOut,
      guests: Number(editForm.guests),
      amount: editAmount,
    });
    setEditing(null);
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
                <tr key={r.id}>
                  <td>
                    <div className="cell-user">
                      <span className="cell-avatar">{nameOf(r).split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                      <div>
                        <div className="cell-user__name">{nameOf(r)}</div>
                        <div className="cell-user__sub">{emailOf(r)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td-mut">{r.code}</td>
                  <td>{roomTypeById[r.typeId]?.name}</td>
                  <td className="td-mut">{r.roomNo}</td>
                  <td>
                    <div className="td-strong">{fmt(r.checkIn)} → {fmt(r.checkOut)}</div>
                    <div className="td-mut">{nights(r.checkIn, r.checkOut)} nights</div>
                  </td>
                  <td className="num">{r.guests}</td>
                  <td className="num td-strong">{money(r.amount)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <div className="row-actions">
                      {(r.status === 'arriving' || r.status === 'confirmed') && (
                        <button className="btn btn--sm" onClick={() => checkIn(r.id)}>Check in</button>
                      )}
                      {(r.status === 'checked-in' || r.status === 'departing') && (
                        <button className="btn btn--sm btn--outline" onClick={() => checkOut(r.id)}>Check out</button>
                      )}
                      {r.status !== 'checked-out' && r.status !== 'cancelled' && (
                        <button className="icon-btn" title="Edit reservation" onClick={() => openEdit(r)}><Icon name="edit" size={15} /></button>
                      )}
                      {r.status !== 'checked-out' && r.status !== 'cancelled' && (
                        <button className="icon-btn icon-btn--danger" title="Cancel reservation" onClick={() => cancelReservation(r.id)}><Icon name="close" size={15} /></button>
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
          <button className="btn" onClick={submit}>Create · {money(amount)}</button>
        </>}
      >
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Guest</span>
            <select className="select" value={form.guestId} onChange={(e) => setForm((f) => ({ ...f, guestId: e.target.value }))}>
              {guests.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Suite</span>
            <select className="select" value={form.typeId} onChange={(e) => setForm((f) => ({ ...f, typeId: e.target.value, guests: Math.min(f.guests, roomTypeById[e.target.value].maxGuests) }))}>
              {roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name} — {money(rate(t.id))}</option>)}
            </select>
          </label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field">
            <span className="field-label">Arrival</span>
            <input className="input" type="date" min={TODAY} value={form.checkIn}
              onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value, checkOut: e.target.value >= f.checkOut ? addDays(e.target.value, 1) : f.checkOut }))} />
          </label>
          <label className="field">
            <span className="field-label">Departure</span>
            <input className="input" type="date" min={addDays(form.checkIn, 1)} value={form.checkOut}
              onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))} />
          </label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}>
          <span className="field-label">Guests</span>
          <select className="select" value={form.guests} onChange={(e) => setForm((f) => ({ ...f, guests: Number(e.target.value) }))}>
            {Array.from({ length: type.maxGuests }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <div className="res-summary">
          <span>{money(rate(form.typeId))} × {nn} nights</span>
          <strong>{money(amount)}</strong>
        </div>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit reservation"
        subtitle="Update suite, dates, room, or party size."
        footer={<>
          <button className="btn btn--outline" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn" onClick={saveEdit}>Save · {money(editAmount)}</button>
        </>}
      >
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Suite</span>
            <select className="select" value={editForm.typeId} onChange={(e) => setEditForm((f) => ({ ...f, typeId: e.target.value, guests: Math.min(f.guests, roomTypeById[e.target.value].maxGuests) }))}>
              {roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name} — {money(rate(t.id))}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Room</span>
            <input className="input" value={editForm.roomNo} onChange={(e) => setEditForm((f) => ({ ...f, roomNo: e.target.value }))} placeholder="On arrival" />
          </label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field">
            <span className="field-label">Arrival</span>
            <input className="input" type="date" value={editForm.checkIn}
              onChange={(e) => setEditForm((f) => ({ ...f, checkIn: e.target.value, checkOut: e.target.value >= f.checkOut ? addDays(e.target.value, 1) : f.checkOut }))} />
          </label>
          <label className="field">
            <span className="field-label">Departure</span>
            <input className="input" type="date" min={addDays(editForm.checkIn, 1)} value={editForm.checkOut}
              onChange={(e) => setEditForm((f) => ({ ...f, checkOut: e.target.value }))} />
          </label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}>
          <span className="field-label">Guests</span>
          <select className="select" value={editForm.guests} onChange={(e) => setEditForm((f) => ({ ...f, guests: Number(e.target.value) }))}>
            {Array.from({ length: editType.maxGuests }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <div className="res-summary">
          <span>{money(rate(editForm.typeId))} × {editNn} nights</span>
          <strong>{money(editAmount)}</strong>
        </div>
      </Modal>
    </>
  );
}
