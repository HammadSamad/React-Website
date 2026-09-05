import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { roleLabels } from '../../data/hotel.js';
import './Staff.css';

const ROLES = ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance'];
const SHIFTS = ['Day', 'Morning', 'Evening', 'Night'];
const initials = (n = '') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const BLANK = { name: '', title: '', role: 'receptionist', email: '', phone: '', shift: 'Day' };

export default function Staff() {
  const { staff, addStaff, updateStaff, toggleStaffStatus } = useData();
  const [q, setQ] = useState('');
  const [roleTab, setRoleTab] = useState('all');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(BLANK);

  const counts = useMemo(() => {
    const c = { all: staff.length };
    for (const s of staff) c[s.role] = (c[s.role] || 0) + 1;
    return c;
  }, [staff]);

  const filtered = useMemo(() => staff.filter((s) => {
    if (roleTab !== 'all' && s.role !== roleTab) return false;
    if (!q) return true;
    return `${s.name} ${s.title} ${s.email}`.toLowerCase().includes(q.toLowerCase());
  }), [staff, roleTab, q]);

  const canAdd = form.name.trim() && form.title.trim() && form.email.trim();
  const submit = () => {
    if (!canAdd) return;
    addStaff({ ...form });
    setForm(BLANK);
    setAdding(false);
  };

  const openEdit = (s) => {
    setEditForm({ name: s.name, title: s.title, role: s.role, email: s.email, phone: s.phone || '', shift: s.shift || 'Day' });
    setEditingId(s.id);
  };
  const canSaveEdit = editForm.name.trim() && editForm.title.trim() && editForm.email.trim();
  const saveEdit = () => {
    if (!canSaveEdit) return;
    updateStaff(editingId, { ...editForm });
    setEditingId(null);
  };

  return (
    <>
      <DashHeader title="Staff" subtitle="Team directory, roles, and access.">
        <button className="btn btn--sm" onClick={() => setAdding(true)}><Icon name="plus" size={15} /> Add staff</button>
      </DashHeader>

      <div className="dash-toolbar">
        <div className="dash-search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, title, email…" />
        </div>
        <div className="seg">
          <button className={`seg__btn ${roleTab === 'all' ? 'is-active' : ''}`} onClick={() => setRoleTab('all')}>All<span className="seg__count">{staff.length}</span></button>
          {ROLES.map((r) => (
            <button key={r} className={`seg__btn ${roleTab === r ? 'is-active' : ''}`} onClick={() => setRoleTab(r)}>
              {roleLabels[r]}<span className="seg__count">{counts[r] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="panel panel--flush">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>Member</th><th>Role</th><th>Contact</th><th>Shift</th><th className="num">Since</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="cell-user">
                      <span className="cell-avatar">{initials(s.name)}</span>
                      <div>
                        <div className="cell-user__name">{s.name}</div>
                        <div className="cell-user__sub">{s.title}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`role-badge role-badge--${s.role}`}>{roleLabels[s.role]}</span></td>
                  <td>
                    <div className="staff-contact">
                      <span>{s.email}</span>
                      <span className="td-mut">{s.phone}</span>
                    </div>
                  </td>
                  <td className="td-mut">{s.shift}</td>
                  <td className="num td-mut">{s.since}</td>
                  <td>
                    <button
                      className={`status-toggle ${s.status === 'active' ? 'is-active' : ''}`}
                      onClick={() => toggleStaffStatus(s.id)}
                      title="Toggle status"
                    >
                      <span className="status-toggle__dot" />
                      {s.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => openEdit(s)} title="Edit member"><Icon name="edit" size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="dash-empty"><Icon name="shield" size={30} /><p>No staff found.</p></div>}
        </div>
      </section>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add staff member"
        subtitle="Create a team account and assign a role."
        footer={<>
          <button className="btn btn--outline" onClick={() => setAdding(false)}>Cancel</button>
          <button className="btn" onClick={submit} disabled={!canAdd}>Add member</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Full name</span>
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Alex Tan" /></label>
          <label className="field"><span className="field-label">Title</span>
            <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Receptionist" /></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Role</span>
            <select className="select" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              {ROLES.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
            </select></label>
          <label className="field"><span className="field-label">Shift</span>
            <select className="select" value={form.shift} onChange={(e) => setForm((f) => ({ ...f, shift: e.target.value }))}>
              {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Email</span>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="alex@luxurystay.com" /></label>
          <label className="field"><span className="field-label">Phone</span>
            <input className="input" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+65 …" /></label>
        </div>
      </Modal>

      <Modal
        open={!!editingId}
        onClose={() => setEditingId(null)}
        title="Edit staff member"
        subtitle="Update details, role, or shift assignment."
        footer={<>
          <button className="btn btn--outline" onClick={() => setEditingId(null)}>Cancel</button>
          <button className="btn" onClick={saveEdit} disabled={!canSaveEdit}>Save changes</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Full name</span>
            <input className="input" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Alex Tan" /></label>
          <label className="field"><span className="field-label">Title</span>
            <input className="input" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} placeholder="Receptionist" /></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Role</span>
            <select className="select" value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
              {ROLES.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
            </select></label>
          <label className="field"><span className="field-label">Shift</span>
            <select className="select" value={editForm.shift} onChange={(e) => setEditForm((f) => ({ ...f, shift: e.target.value }))}>
              {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Email</span>
            <input className="input" type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} placeholder="alex@luxurystay.com" /></label>
          <label className="field"><span className="field-label">Phone</span>
            <input className="input" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+65 …" /></label>
        </div>
      </Modal>
    </>
  );
}
