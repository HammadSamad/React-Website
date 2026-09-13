import { useCallback, useMemo, useRef, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { roomsApi, apiForm } from '../../lib/api.js';
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'maintenance', label: 'Maintenance' },
];
const SET_STATES = ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'];
const AMENITIES = [
  'Free Wi-Fi', 'Air Conditioning', 'Smart TV', 'Private Bathroom', 'Mini Bar', 'Room Service',
  'Coffee/Tea Maker', 'Hair Dryer', 'Safe', 'Balcony', 'Bathtub', 'City View', 'Sea View',
  'Work Desk', 'Wardrobe', 'Iron', 'Refrigerator',
];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const BLANK = { roomNumber: '', floor: '2', roomType: 'Room', roomStatus: 'available', roomPrice: 300, maxGuests: 2, description: '', amenities: [] };

function AmenityPicker({ value, onChange }) {
  const toggle = (a) => onChange(value.includes(a) ? value.filter((x) => x !== a) : [...value, a]);
  return (
    <div className="room-form__amenities">
      {AMENITIES.map((a) => (
        <button
          type="button"
          key={a}
          className={`amen-chip ${value.includes(a) ? 'amen-chip--on' : ''}`}
          onClick={() => toggle(a)}
          aria-pressed={value.includes(a)}
        >
          <Icon name="check" size={13} />
          {a}
        </button>
      ))}
    </div>
  );
}

/* ── Image Upload Zone ──────────────────────────────────────────── */
function ImageUploadZone({ files, onChange, label = 'Room photos', max = 8 }) {
  const inputRef = useRef(null);

  const handleFiles = useCallback((incoming) => {
    const valid = Array.from(incoming).filter((f) => f.type.startsWith('image/'));
    onChange((prev) => [...prev, ...valid].slice(0, max));
  }, [onChange, max]);

  const remove = (idx) => onChange((prev) => prev.filter((_, i) => i !== idx));

  const onDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };
  const onDragOver = (e) => e.preventDefault();

  return (
    <div className="img-upload" style={{ marginTop: '1.25rem' }}>
      <span className="field-label">{label} <span className="field-optional">up to {max}</span></span>
      <div
        className="img-upload__zone"
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Icon name="image" size={22} />
        <span className="img-upload__hint">Drop images here or <em>click to browse</em></span>
        <span className="img-upload__meta">JPEG · PNG · WebP &nbsp;·&nbsp; max 5 MB each</span>
      </div>
      {files.length > 0 && (
        <div className="img-upload__previews">
          {files.map((f, i) => {
            const url = URL.createObjectURL(f);
            return (
              <div key={i} className="img-upload__thumb">
                <img src={url} alt={f.name} onLoad={() => URL.revokeObjectURL(url)} />
                <button type="button" className="img-upload__remove" title="Remove" onClick={(e) => { e.stopPropagation(); remove(i); }}>×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


export default function DashRooms() {
  const { rooms, setRooms, notify, refreshAll } = useData();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [formImages, setFormImages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editOriginalNo, setEditOriginalNo] = useState('');
  const [editForm, setEditForm] = useState(BLANK);
  const [editImages, setEditImages] = useState([]);
  const [busy, setBusy] = useState(false);

  /* Build FormData for multipart upload (backend field: "images") */
  const buildFormData = (fields, imageFiles) => {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, Array.isArray(v) ? JSON.stringify(v) : String(v)));
    imageFiles.forEach((f) => fd.append('images', f));
    return fd;
  };

  const counts = useMemo(() => {
    const c = { all: rooms.length };
    for (const r of rooms) c[r.roomStatus] = (c[r.roomStatus] || 0) + 1;
    return c;
  }, [rooms]);

  const byFloor = useMemo(() => {
    const filtered = rooms.filter((r) => {
      if (filter !== 'all' && r.roomStatus !== filter) return false;
      if (!q) return true;
      return `${r.roomNumber} ${r.roomType}`.toLowerCase().includes(q.toLowerCase());
    });
    const map = {};
    for (const r of filtered) (map[r.floor] ||= []).push(r);
    return Object.entries(map)
      .map(([floor, list]) => [Number(floor), list.sort((a, b) => a.roomNumber - b.roomNumber)])
      .sort((a, b) => b[0] - a[0]);
  }, [rooms, filter, q]);

  const room = active ? rooms.find((r) => r.roomNumber === active) : null;

  const noTaken = (no, exceptNo) => {
    const clean = String(no).trim();
    return rooms.some((r) => String(r.roomNumber) === clean && String(r.roomNumber) !== String(exceptNo));
  };

  const closeDetail = () => { setActive(null); setConfirmRemove(false); };

  const canCreate = form.roomNumber && !noTaken(form.roomNumber);

  const submitCreate = async () => {
    if (!canCreate || busy) return;
    setBusy(true);
    try {
      const fd = buildFormData(form, formImages);
      await roomsApi.create(fd);
      notify(`Room ${form.roomNumber} added.`);
      setForm(BLANK);
      setFormImages([]);
      setCreating(false);
      refreshAll();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (r) => {
    setEditOriginalNo(String(r.roomNumber));
    setEditForm({ roomNumber: r.roomNumber, floor: String(r.floor), roomType: r.roomType, roomPrice: r.roomPrice, maxGuests: r.maxGuests, roomStatus: r.roomStatus, description: r.description || '', amenities: r.amenities || [] });
    setEditImages([]);
    closeDetail();
    setEditing(r._id || r.id);
  };
  const canSaveEdit = editForm.roomNumber && !noTaken(editForm.roomNumber, editOriginalNo);

  const saveEdit = async () => {
    if (!canSaveEdit || busy) return;
    setBusy(true);
    try {
      const fd = buildFormData(editForm, editImages);
      await roomsApi.update(editing, fd);
      notify('Room updated.');
      setEditing(null);
      setEditImages([]);
      refreshAll();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const removeRoom = async (id) => {
    try {
      await roomsApi.delete(id);
      refreshAll();
      notify('Room retired.');
      closeDetail();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const setRoomStatus = async (id, status) => {
    try {
      await roomsApi.updateStatus(id, status);
      refreshAll();
      notify(`Room marked ${status}.`);
    } catch (e) {
      notify(e.message, 'error');
    }
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
              <button
                className={`room-tile room-tile--${r.roomStatus}`}
                key={r.roomNumber}
                onClick={() => setActive(r.roomNumber)}
                aria-label={`View room ${r.roomNumber}`}
              >
                <span className="room-tile__no">{r.roomNumber}</span>
                <span className="room-tile__type">{r.roomType}</span>
                <span className={`rooms-dot rooms-dot--${r.roomStatus}`} />
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
        title={room ? `Room ${room.roomNumber}` : ''}
        subtitle={room ? `${room.roomType} · Floor ${room.floor}` : ''}
        footer={room && (confirmRemove ? (
          <>
            <span className="room-remove__q">Retire room {room.roomNumber} from inventory?</span>
            <button className="btn btn--outline" onClick={() => setConfirmRemove(false)}>Keep</button>
            <button className="btn" onClick={() => removeRoom(room._id || room.id)}>Retire</button>
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
            {/* Room image gallery */}
            {room.images?.length > 0 && (
              <div className="room-modal__images">
                {room.images.map((img, i) => (
                  <img key={i} src={img.url} alt={`Room ${room.roomNumber}`} className="room-modal__img" />
                ))}
              </div>
            )}
            <div className="room-modal__meta">
              <div><span className="room-modal__k">Rate</span><span className="room-modal__v">${room.roomPrice}<small>/night</small></span></div>
              <div><span className="room-modal__k">Sleeps</span><span className="room-modal__v">{room.maxGuests} guests</span></div>
              <div><span className="room-modal__k">Status</span><StatusBadge status={room.roomStatus} /></div>
            </div>
            {room.description && <p className="room-modal__desc">{room.description}</p>}
            {room.amenities?.length > 0 && (
              <div className="room-modal__amens">
                {room.amenities.map((a) => <span className="amen-chip amen-chip--on" key={a}><Icon name="check" size={12} />{a}</span>)}
              </div>
            )}
            <p className="room-modal__label">Set room status</p>
            <div className="room-modal__actions">
              {SET_STATES.map((s) => (
                <button
                  key={s}
                  className={`chip ${room.roomStatus === s ? 'chip--on' : ''}`}
                  onClick={() => setRoomStatus(room._id || room.id, s)}
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
        onClose={() => { setCreating(false); setFormImages([]); setForm(BLANK); }}
        title="Add room"
        subtitle="Register a new room in the property inventory."
        footer={<>
          <button className="btn btn--outline" onClick={() => { setCreating(false); setFormImages([]); setForm(BLANK); }}>Cancel</button>
          <button className="btn" onClick={submitCreate} disabled={!canCreate || busy}>{busy ? 'Adding…' : 'Add room'}</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Room number</span>
            <input className="input" value={form.roomNumber} onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))} placeholder="e.g. 207" /></label>
          <label className="field"><span className="field-label">Floor</span>
            <input className="input" type="number" min="1" value={form.floor} onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))} /></label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Suite type</span>
          <input className="input" value={form.roomType} onChange={(e) => setForm((f) => ({ ...f, roomType: e.target.value }))} placeholder="e.g. Deluxe Suite" /></label>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Price / Night</span>
            <input className="input" type="number" min="0" value={form.roomPrice} onChange={(e) => setForm((f) => ({ ...f, roomPrice: Number(e.target.value) }))} /></label>
          <label className="field"><span className="field-label">Max Guests</span>
            <input className="input" type="number" min="1" value={form.maxGuests} onChange={(e) => setForm((f) => ({ ...f, maxGuests: Number(e.target.value) }))} /></label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Initial status</span>
          <select className="select" value={form.roomStatus} onChange={(e) => setForm((f) => ({ ...f, roomStatus: e.target.value }))}>
            {SET_STATES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
          </select></label>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Description</span>
          <textarea className="input" rows="3" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Two or three lines that describe the room…" /></label>
        <div className="field" style={{ marginTop: '1rem' }}>
          <span className="field-label">Amenities <span className="field-optional">tap to select many</span></span>
          <AmenityPicker value={form.amenities} onChange={(v) => setForm((f) => ({ ...f, amenities: v }))} />
        </div>

        {/* ── Image Upload ── */}
        <ImageUploadZone files={formImages} onChange={setFormImages} label="Room photos" max={8} />

        {form.roomNumber && noTaken(form.roomNumber) && <p className="room-form__warn"><Icon name="info" size={14} /> Room {form.roomNumber} already exists.</p>}
      </Modal>

      {/* Edit room */}
      <Modal
        open={!!editing}
        onClose={() => { setEditing(null); setEditImages([]); setEditOriginalNo(''); }}
        title={editing ? `Edit room ${editForm.roomNumber}` : ''}
        subtitle="Update the room details."
        footer={<>
          <button className="btn btn--outline" onClick={() => { setEditing(null); setEditImages([]); setEditOriginalNo(''); }}>Cancel</button>
          <button className="btn" onClick={saveEdit} disabled={!canSaveEdit || busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Room number</span>
            <input className="input" value={editForm.roomNumber} onChange={(e) => setEditForm((f) => ({ ...f, roomNumber: e.target.value }))} /></label>
          <label className="field"><span className="field-label">Floor</span>
            <input className="input" type="number" min="1" value={editForm.floor} onChange={(e) => setEditForm((f) => ({ ...f, floor: e.target.value }))} /></label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Suite type</span>
          <input className="input" value={editForm.roomType} onChange={(e) => setEditForm((f) => ({ ...f, roomType: e.target.value }))} placeholder="e.g. Deluxe Suite" /></label>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Price / Night</span>
            <input className="input" type="number" min="0" value={editForm.roomPrice} onChange={(e) => setEditForm((f) => ({ ...f, roomPrice: Number(e.target.value) }))} /></label>
          <label className="field"><span className="field-label">Max Guests</span>
            <input className="input" type="number" min="1" value={editForm.maxGuests} onChange={(e) => setEditForm((f) => ({ ...f, maxGuests: Number(e.target.value) }))} /></label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Status</span>
          <select className="select" value={editForm.roomStatus} onChange={(e) => setEditForm((f) => ({ ...f, roomStatus: e.target.value }))}>
            {SET_STATES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
          </select></label>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Description</span>
          <textarea className="input" rows="3" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} placeholder="Two or three lines that describe the room…" /></label>
        <div className="field" style={{ marginTop: '1rem' }}>
          <span className="field-label">Amenities <span className="field-optional">tap to select many</span></span>
          <AmenityPicker value={editForm.amenities} onChange={(v) => setEditForm((f) => ({ ...f, amenities: v }))} />
        </div>

        {/* ── Replace Images ── */}
        <ImageUploadZone files={editImages} onChange={setEditImages} label="Replace room photos" max={8} />
        <p className="img-upload__replace-note">Uploading new photos will replace all existing ones on the server.</p>

        {editForm.roomNumber && noTaken(editForm.roomNumber, editOriginalNo) && <p className="room-form__warn"><Icon name="info" size={14} /> Room {editForm.roomNumber} already exists.</p>}
      </Modal>
    </>
  );
}