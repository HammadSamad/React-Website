import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import './Guests.css';

const BLANK = { name: '', email: '', phone: '', country: '' };
const initials = (n = '') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function Guests() {
  const { guests, toggleVip, addGuest, updateGuest } = useData();
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
    return `${g.name} ${g.email} ${g.country}`.toLowerCase().includes(q.toLowerCase());
  }), [guests, tab, q]);

  const guest = detail ? guests.find((g) => g.id === detail) : null;

  const canAdd = form.name.trim() && form.email.trim();
  const submit = () => {
    if (!canAdd) return;
    addGuest({ ...form });
    setForm(BLANK);
    setAdding(false);
  };

  const openEdit = (g) => {
    setEditForm({ name: g.name, email: g.email, phone: g.phone || '', country: g.country || '' });
    setEditingId(g.id);
    setDetail(null);
  };
  const canSaveEdit = editForm.name.trim() && editForm.email.trim();
  const saveEdit = () => {
    if (!canSaveEdit) return;
    updateGuest(editingId, { ...editForm });
    setEditingId(null);
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
              <tr><th>Guest</th><th>Country</th><th className="num">Stays</th><th>Member since</th><th>VIP</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id}>
                  <td>
                    <div className="cell-user">
                      <span className="cell-avatar">{initials(g.name)}</span>
                      <div>
                        <div className="cell-user__name">{g.name}</div>
                        <div className="cell-user__sub">{g.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td-mut">{g.country}</td>
                  <td className="num td-strong">{g.stays}</td>
                  <td className="td-mut">{g.since}</td>
                  <td>
                    <button className={`vip-toggle ${g.vip ? 'is-on' : ''}`} onClick={() => toggleVip(g.id)} title={g.vip ? 'Remove VIP' : 'Mark VIP'}>
                      <Icon name="star" size={15} />
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn--sm btn--ghost" onClick={() => setDetail(g.id)}>View</button>
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
      <Modal open={!!guest} onClose={() => setDetail(null)} title={guest?.name || ''} subtitle={guest?.vip ? 'VIP member' : 'Guest'}>
        {guest && (
          <>
            <div className="guest-detail__grid">
              <div><span className="guest-detail__k">Email</span><span className="guest-detail__v">{guest.email}</span></div>
              <div><span className="guest-detail__k">Phone</span><span className="guest-detail__v">{guest.phone}</span></div>
              <div><span className="guest-detail__k">Country</span><span className="guest-detail__v">{guest.country}</span></div>
              <div><span className="guest-detail__k">Member since</span><span className="guest-detail__v">{guest.since}</span></div>
              <div><span className="guest-detail__k">Total stays</span><span className="guest-detail__v">{guest.stays}</span></div>
              <div><span className="guest-detail__k">Loyalty</span><span className="guest-detail__v">{guest.vip ? 'VIP' : 'Standard'}</span></div>
            </div>
            {guest.preferences?.length > 0 && (
              <>
                <p className="guest-detail__label">Preferences</p>
                <div className="guest-prefs">
                  {guest.preferences.map((p) => <span className="guest-pref" key={p}><Icon name="check" size={13} />{p}</span>)}
                </div>
              </>
            )}
            <div className="guest-detail__foot">
              <button className="btn btn--outline btn--sm" onClick={() => openEdit(guest)}>
                <Icon name="edit" size={14} /> Edit profile
              </button>
              <button className="btn btn--outline btn--sm" onClick={() => toggleVip(guest.id)}>
                <Icon name="star" size={14} /> {guest.vip ? 'Remove VIP status' : 'Mark as VIP'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Add */}
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add guest"
        subtitle="Create a new guest profile."
        footer={<>
          <button className="btn btn--outline" onClick={() => setAdding(false)}>Cancel</button>
          <button className="btn" onClick={submit} disabled={!canAdd}>Add guest</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Full name</span>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" /></label>
          <label className="field"><span className="field-label">Country</span>
            <input className="input" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="Singapore" /></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Email</span>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@email.com" /></label>
          <label className="field"><span className="field-label">Phone</span>
            <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+65 …" /></label>
        </div>
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editingId}
        onClose={() => setEditingId(null)}
        title="Edit guest"
        subtitle="Update this guest's contact details."
        footer={<>
          <button className="btn btn--outline" onClick={() => setEditingId(null)}>Cancel</button>
          <button className="btn" onClick={saveEdit} disabled={!canSaveEdit}>Save changes</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Full name</span>
            <input className="input" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" /></label>
          <label className="field"><span className="field-label">Country</span>
            <input className="input" value={editForm.country} onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value }))} placeholder="Singapore" /></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Email</span>
            <input className="input" type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@email.com" /></label>
          <label className="field"><span className="field-label">Phone</span>
            <input className="input" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+65 …" /></label>
        </div>
      </Modal>
    </>
  );
}
