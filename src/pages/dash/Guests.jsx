import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { guestsApi } from '../../lib/api.js';
const BLANK = { guestName: '', guestEmail: '', guestPhone: '', guestCountry: '' };
const PHONE_RE = /^(?=(?:\D*\d){11,15}\D*$)[\d\s().+/-]*$/;
const initials = (n = '') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function Guests() {
  const { guests, toggleVip, notify, refreshAll } = useData();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [detail, setDetail] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(BLANK);

  const vipCount = useMemo(() => guests.filter((g) => g.vip).length, [guests]);

  const filtered = useMemo(() => guests.filter((g) => {
    if (tab === 'vip' && !g.vip) return false;
    if (!q) return true;
    return `${g.guestName} ${g.guestEmail} ${g.guestCountry}`.toLowerCase().includes(q.toLowerCase());
  }), [guests, tab, q]);

  const guest = detail ? guests.find((g) => (g._id || g.id) === detail) : null;

  const canAdd = form.guestName.trim() && PHONE_RE.test(form.guestPhone.trim());
  const submit = async () => {
    if (!canAdd) return;
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      await guestsApi.create(fd);
      setForm(BLANK);
      setAdding(false);
      refreshAll();
      notify('Guest added successfully');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const openEdit = (g) => {
    setEditForm({ guestName: g.guestName || '', guestEmail: g.guestEmail || '', guestPhone: g.guestPhone || '', guestCountry: g.guestCountry || '' });
    setEditingId(g._id || g.id);
    setDetail(null);
  };
  const canSaveEdit = editForm.guestName.trim() && PHONE_RE.test(editForm.guestPhone.trim());
  const saveEdit = async () => {
    if (!canSaveEdit) return;
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => fd.append(k, String(v)));
      await guestsApi.update(editingId, fd);
      setEditingId(null);
      refreshAll();
      notify('Guest updated');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  return (
    <>
      <DashHeader title="Guests" subtitle="Guest directory, loyalty, and stay history.">
        <button className="btn btn--sm" onClick={() => setAdding(true)}><Icon name="plus" size={15} /> Add guest</button>
      </DashHeader>

      <div className="dash-toolbar">
        <div className="dash-search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, country…" />
        </div>
        <div className="seg">
          <button className={`seg__btn ${tab === 'all' ? 'is-active' : ''}`} onClick={() => setTab('all')}>All<span className="seg__count">{guests.length}</span></button>
          <button className={`seg__btn ${tab === 'vip' ? 'is-active' : ''}`} onClick={() => setTab('vip')}>VIP<span className="seg__count">{vipCount}</span></button>
        </div>
      </div>

      <section className="panel panel--flush">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>Guest</th><th>Country</th><th>VIP</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g._id || g.id}>
                  <td>
                    <div className="cell-user">
                      <span className="cell-avatar">{initials(g.guestName)}</span>
                      <div>
                        <div className="cell-user__name">{g.guestName}</div>
                        <div className="cell-user__sub">{g.guestEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td-mut">{g.guestCountry}</td>
                  <td>
                    <button className={`vip-toggle ${g.vip ? 'is-on' : ''}`} onClick={() => toggleVip(g._id || g.id)} title={g.vip ? 'Remove VIP' : 'Mark VIP'}>
                      <Icon name="star" size={15} />
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn--sm btn--ghost" onClick={() => setDetail(g._id || g.id)}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="dash-empty"><Icon name="users" size={30} /><p>No guests found.</p></div>}
        </div>
      </section>

      {/* Detail */}
      <Modal open={!!guest} onClose={() => setDetail(null)} title={guest?.guestName || ''} subtitle={guest?.vip ? 'VIP member' : 'Guest'}>
        {guest && (
          <>
            <div className="guest-detail__grid">
              <div><span className="guest-detail__k">Email</span><span className="guest-detail__v">{guest.guestEmail}</span></div>
              <div><span className="guest-detail__k">Phone</span><span className="guest-detail__v">{guest.guestPhone}</span></div>
              <div><span className="guest-detail__k">Country</span><span className="guest-detail__v">{guest.guestCountry}</span></div>
              <div><span className="guest-detail__k">Loyalty</span><span className="guest-detail__v">{guest.vip ? 'VIP' : 'Standard'}</span></div>
            </div>
            {guest.guestPreferences && (
              <>
                <p className="guest-detail__label">Preferences</p>
                <div className="guest-prefs">
                  {guest.guestPreferences.split(',').map((p) => <span className="guest-pref" key={p.trim()}><Icon name="check" size={13} />{p.trim()}</span>)}
                </div>
              </>
            )}
            <div className="guest-detail__foot">
              <button className="btn btn--outline btn--sm" onClick={() => openEdit(guest)}>
                <Icon name="edit" size={14} /> Edit profile
              </button>
              <button className="btn btn--outline btn--sm" onClick={() => toggleVip(guest._id || guest.id)}>
                <Icon name="star" size={14} /> {guest.vip ? 'Remove VIP status' : 'Mark as VIP'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Add */}
      <Modal
        open={adding}
        onClose={() => { setAdding(false); setForm(BLANK); }}
        title="Add guest"
        subtitle="Create a new guest profile."
        footer={<>
          <button className="btn btn--outline" onClick={() => { setAdding(false); setForm(BLANK); }}>Cancel</button>
          <button className="btn" onClick={submit} disabled={!canAdd}>Add guest</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Full name *</span>
            <input className="input" required value={form.guestName} onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))} placeholder="Jane Doe" /></label>
          <label className="field"><span className="field-label">Country</span>
            <input className="input" value={form.guestCountry} onChange={(e) => setForm((f) => ({ ...f, guestCountry: e.target.value }))} placeholder="Singapore" /></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Email</span>
            <input className="input" type="email" value={form.guestEmail} onChange={(e) => setForm((f) => ({ ...f, guestEmail: e.target.value }))} placeholder="jane@email.com" /></label>
          <label className="field"><span className="field-label">Phone *</span>
            <input className="input" required pattern={PHONE_RE.source} title="Phone number must contain 11 to 15 digits" value={form.guestPhone} onChange={(e) => setForm((f) => ({ ...f, guestPhone: e.target.value }))} placeholder="+65 …" /></label>
        </div>
        {!form.guestName.trim() && <p className="room-form__warn"><Icon name="info" size={14} /> Guest name is required.</p>}
        {!form.guestPhone.trim() && <p className="room-form__warn"><Icon name="info" size={14} /> Guest phone is required.</p>}
        {form.guestPhone.trim() && !PHONE_RE.test(form.guestPhone.trim()) && <p className="room-form__warn"><Icon name="info" size={14} /> Enter a phone number with 11 to 15 digits, e.g. +65 8123 4567.</p>}
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editingId}
        onClose={() => { setEditingId(null); setEditForm(BLANK); }}
        title="Edit guest"
        subtitle="Update this guest's contact details."
        footer={<>
          <button className="btn btn--outline" onClick={() => { setEditingId(null); setEditForm(BLANK); }}>Cancel</button>
          <button className="btn" onClick={saveEdit} disabled={!canSaveEdit}>Save changes</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Full name *</span>
            <input className="input" required value={editForm.guestName} onChange={(e) => setEditForm((f) => ({ ...f, guestName: e.target.value }))} placeholder="Jane Doe" /></label>
          <label className="field"><span className="field-label">Country</span>
            <input className="input" value={editForm.guestCountry} onChange={(e) => setEditForm((f) => ({ ...f, guestCountry: e.target.value }))} placeholder="Singapore" /></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Email</span>
            <input className="input" type="email" value={editForm.guestEmail} onChange={(e) => setEditForm((f) => ({ ...f, guestEmail: e.target.value }))} placeholder="jane@email.com" /></label>
          <label className="field"><span className="field-label">Phone *</span>
            <input className="input" required pattern={PHONE_RE.source} title="Phone number must contain 11 to 15 digits" value={editForm.guestPhone} onChange={(e) => setEditForm((f) => ({ ...f, guestPhone: e.target.value }))} placeholder="+65 …" /></label>
        </div>
        {editForm.guestPhone.trim() && !PHONE_RE.test(editForm.guestPhone.trim()) && <p className="room-form__warn"><Icon name="info" size={14} /> Enter a phone number with 11 to 15 digits, e.g. +65 8123 4567.</p>}
      </Modal>
    </>
  );
}
