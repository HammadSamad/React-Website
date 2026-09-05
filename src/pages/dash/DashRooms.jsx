import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { roomTypes, roomTypeById, money } from '../../data/hotel.js';
import './DashRooms.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'maintenance', label: 'Maintenance' },
];
const SET_STATES = ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const BLANK = { no: '', floor: '2', typeId: roomTypes[0].id, status: 'available' };

export default function DashRooms() {
  const { rooms, setRoomStatus, addRoom, updateRoom, removeRoom } = useData();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ no: '', floor: '2', typeId: roomTypes[0].id });

  const counts = useMemo(() => {
    const c = { all: rooms.length };
    for (const r of rooms) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [rooms]);

  const byFloor = useMemo(() => {
    const filtered = rooms.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!q) return true;
      return `${r.no} ${r.typeName}`.toLowerCase().includes(q.toLowerCase());
    });
    const map = {};
    for (const r of filtered) (map[r.floor] ||= []).push(r);
    return Object.entries(map)
      .map(([floor, list]) => [Number(floor), list.sort((a, b) => a.no - b.no)])
      .sort((a, b) => b[0] - a[0]);
  }, [rooms, filter, q]);

  const room = active ? rooms.find((r) => r.no === active) : null;

  const noTaken = (no, exceptNo) => {
    const clean = String(no).trim();
    return rooms.some((r) => r.no === clean && r.no !== exceptNo);
  };

  const closeDetail = () => { setActive(null); setConfirmRemove(false); };

  const canCreate = form.no.trim() && !noTaken(form.no);
  const submitCreate = () => {
    if (!canCreate) return;
    addRoom({ no: form.no, floor: form.floor, typeId: form.typeId, status: form.status });
    setForm(BLANK);
    setCreating(false);
  };

  const openEdit = (r) => {
    setEditForm({ no: r.no, floor: String(r.floor), typeId: r.typeId });
    closeDetail();
    setEditing(r.no);
  };
  const canSaveEdit = editForm.no.trim() && !noTaken(editForm.no, editing);
  const saveEdit = () => {
    if (!canSaveEdit) return;
    updateRoom(editing, { no: editForm.no.trim(), floor: Number(editForm.floor), typeId: editForm.typeId });
    setEditing(null);
  };

  return (
    <>
      <DashHeader title="Rooms" subtitle="Live status board across every floor of the property.">
        <div className="rooms-head">
          <div className="rooms-legend">
            {FILTERS.slice(1).map((f) => (
              <span className="rooms-legend__item" key={f.key}><span className={`rooms-dot rooms-dot--${f.key}`} />{f.label}</span>
            ))}
          </div>
          <button className="btn btn--sm" onClick={() => setCreating(true)}><Icon name="plus" size={15} /> Add room</button>
        </div>
      </DashHeader>

      <div className="dash-toolbar">
        <div className="dash-search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search room or suite…" />
        </div>
        <div className="seg">
          {FILTERS.map((f) => (
            <button key={f.key} className={`seg__btn ${filter === f.key ? 'is-active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}<span className="seg__count">{counts[f.key] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {byFloor.map(([floor, list]) => (
        <section className="floor" key={floor}>
          <div className="floor__head">
            <h2 className="floor__title">Floor {floor}</h2>
            <span className="floor__meta">{list.length} rooms</span>
          </div>
          <div className="rooms-grid">
            {list.map((r) => (
              <button className={`room-tile room-tile--${r.status}`} key={r.no} onClick={() => setActive(r.no)}>
                <span className="room-tile__no">{r.no}</span>
                <span className="room-tile__type">{r.typeName}</span>
                <span className={`rooms-dot rooms-dot--${r.status}`} />
              </button>
            ))}
          </div>
        </section>
      ))}

      {byFloor.length === 0 && (
        <div className="dash-empty"><Icon name="door" size={30} /><p>No rooms match this filter.</p></div>
      )}

      {/* Room detail + status */}
      <Modal
        open={!!room}
        onClose={closeDetail}
        title={room ? `Room ${room.no}` : ''}
        subtitle={room ? `${room.typeName} · Floor ${room.floor}` : ''}
        footer={room && (confirmRemove ? (
          <>
            <span className="room-remove__q">Retire room {room.no} from inventory?</span>
            <button className="btn btn--outline" onClick={() => setConfirmRemove(false)}>Keep</button>
            <button className="btn" onClick={() => { removeRoom(room.no); closeDetail(); }}>Retire</button>
          </>
        ) : (
          <>
            <button className="btn btn--outline" onClick={() => setConfirmRemove(true)}><Icon name="trash" size={15} /> Retire</button>
            <button className="btn" onClick={() => openEdit(room)}><Icon name="edit" size={15} /> Edit details</button>
          </>
        ))}
      >
        {room && (
          <>
            <div className="room-modal__meta">
              <div><span className="room-modal__k">Rate</span><span className="room-modal__v">{money(room.price)}<small>/night</small></span></div>
              <div><span className="room-modal__k">Sleeps</span><span className="room-modal__v">{room.maxGuests} guests</span></div>
              <div><span className="room-modal__k">Status</span><StatusBadge status={room.status} /></div>
              <div><span className="room-modal__k">Housekeeping</span><StatusBadge status={room.housekeeping} /></div>
            </div>
            <p className="room-modal__label">Set room status</p>
            <div className="room-modal__actions">
              {SET_STATES.map((s) => (
                <button
                  key={s}
                  className={`chip ${room.status === s ? 'chip--on' : ''}`}
                  onClick={() => { setRoomStatus(room.no, s); }}
                >
                  <span className={`rooms-dot rooms-dot--${s}`} />
                  {cap(s)}
                </button>
              ))}
            </div>
          </>
        )}
      </Modal>

      {/* Add room */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Add room"
        subtitle="Register a new room in the property inventory."
        footer={<>
          <button className="btn btn--outline" onClick={() => setCreating(false)}>Cancel</button>
          <button className="btn" onClick={submitCreate} disabled={!canCreate}>Add room</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Room number</span>
            <input className="input" value={form.no} onChange={(e) => setForm((f) => ({ ...f, no: e.target.value }))} placeholder="e.g. 207" /></label>
          <label className="field"><span className="field-label">Floor</span>
            <input className="input" type="number" min="1" value={form.floor} onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))} /></label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Suite type</span>
          <select className="select" value={form.typeId} onChange={(e) => setForm((f) => ({ ...f, typeId: e.target.value }))}>
            {roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name} {t.tier} — {money(t.price)}</option>)}
          </select></label>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Initial status</span>
          <select className="select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            {SET_STATES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
          </select></label>
        {form.no.trim() && noTaken(form.no) && <p className="room-form__warn"><Icon name="info" size={14} /> Room {form.no.trim()} already exists.</p>}
        <div className="room-form__preview">Sleeps {roomTypeById[form.typeId].maxGuests} · {money(roomTypeById[form.typeId].price)}/night</div>
      </Modal>

      {/* Edit room */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit room ${editing}` : ''}
        subtitle="Update the room number, floor, or suite type."
        footer={<>
          <button className="btn btn--outline" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn" onClick={saveEdit} disabled={!canSaveEdit}>Save changes</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Room number</span>
            <input className="input" value={editForm.no} onChange={(e) => setEditForm((f) => ({ ...f, no: e.target.value }))} /></label>
          <label className="field"><span className="field-label">Floor</span>
            <input className="input" type="number" min="1" value={editForm.floor} onChange={(e) => setEditForm((f) => ({ ...f, floor: e.target.value }))} /></label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Suite type</span>
          <select className="select" value={editForm.typeId} onChange={(e) => setEditForm((f) => ({ ...f, typeId: e.target.value }))}>
            {roomTypes.map((t) => <option key={t.id} value={t.id}>{t.name} {t.tier} — {money(t.price)}</option>)}
          </select></label>
        {editForm.no.trim() && noTaken(editForm.no, editing) && <p className="room-form__warn"><Icon name="info" size={14} /> Room {editForm.no.trim()} already exists.</p>}
        <div className="room-form__preview">Sleeps {roomTypeById[editForm.typeId].maxGuests} · {money(roomTypeById[editForm.typeId].price)}/night</div>
      </Modal>
    </>
  );
}
