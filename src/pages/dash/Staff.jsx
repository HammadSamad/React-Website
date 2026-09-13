import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { staffApi } from '../../lib/api.js';
import { roleLabels } from '../../data/hotel.js';
const ROLES = ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance'];
const SHIFTS = ['Day', 'Morning', 'Evening', 'Night'];
const PHONE_RE = /^(?=(?:\D*\d){11,15}\D*$)[\d\s().+/-]*$/;
const initials = (n = '') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const BLANK = { staffName: '', staffTitle: '', staffRole: 'receptionist', staffEmail: '', staffPhone: '', staffShift: 'Day', password: '' };
const randomPassword = (len = 12) => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%^&*';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export default function Staff() {
  const { staff, toggleStaffStatus, notify, refreshAll } = useData();
  const [q, setQ] = useState('');
  const [roleTab, setRoleTab] = useState('all');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(BLANK);
  const [showPass, setShowPass] = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);

  const counts = useMemo(() => {
    const c = { all: staff.length };
    for (const s of staff) c[s.staffRole] = (c[s.staffRole] || 0) + 1;
    return c;
  }, [staff]);

  const filtered = useMemo(() => staff.filter((s) => {
    if (roleTab !== 'all' && s.staffRole !== roleTab) return false;
    if (!q) return true;
    return `${s.staffName} ${s.staffTitle} ${s.staffEmail}`.toLowerCase().includes(q.toLowerCase());
  }), [staff, roleTab, q]);

  const canAdd = form.staffName.trim() && form.staffEmail.trim() && PHONE_RE.test(form.staffPhone.trim()) && form.password.trim().length >= 8;
  const submit = async () => {
    if (!canAdd) return;
    try {
      const fd = new FormData();
      const clean = { ...form, staffName: form.staffName.trim(), staffEmail: form.staffEmail.trim(), staffPhone: form.staffPhone.trim() };
      Object.entries(clean).forEach(([k, v]) => fd.append(k, String(v)));
      await staffApi.create(fd);
      setForm(BLANK);
      setAdding(false);
      refreshAll();
      notify('Staff member added — they can now sign in');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const openEdit = (s) => {
    setEditForm({ staffName: s.staffName || '', staffTitle: s.staffTitle || '', staffRole: s.staffRole || 'receptionist', staffEmail: s.staffEmail || '', staffPhone: s.staffPhone || '', staffShift: s.staffShift || 'Day', password: '' });
    setEditingId(s._id || s.id);
    setShowEditPass(false);
  };
  const canSaveEdit = editForm.staffName.trim() && editForm.staffEmail.trim() && PHONE_RE.test(editForm.staffPhone.trim());
  const saveEdit = async () => {
    if (!canSaveEdit) return;
    try {
      const fd = new FormData();
      const clean = { ...editForm, staffName: editForm.staffName.trim(), staffEmail: editForm.staffEmail.trim(), staffPhone: editForm.staffPhone.trim() };
      Object.entries(clean).forEach(([k, v]) => fd.append(k, String(v)));
      await staffApi.update(editingId, fd);
      setEditingId(null);
      refreshAll();
      notify('Staff member updated');
    } catch (e) {
      notify(e.message, 'error');
    }
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
              <tr><th>Member</th><th>Role</th><th>Contact</th><th>Shift</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id || s.id}>
                  <td>
                    <div className="cell-user">
                      <span className="cell-avatar">{initials(s.staffName)}</span>
                      <div>
                        <div className="cell-user__name">{s.staffName}</div>
                        <div className="cell-user__sub">{s.staffTitle}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`role-badge role-badge--${s.staffRole}`}>{roleLabels[s.staffRole]}</span></td>
                  <td>
                    <div className="staff-contact">
                      <span>{s.staffEmail}</span>
                      <span className="td-mut">{s.staffPhone}</span>
                    </div>
                  </td>
                  <td className="td-mut">{s.staffShift}</td>
                  <td>
                    <button
                      className={`status-toggle ${s.staffStatus === 'active' ? 'is-active' : ''}`}
                      onClick={() => toggleStaffStatus(s._id || s.id)}
                      title="Toggle status"
                    >
                      <span className="status-toggle__dot" />
                      {s.staffStatus === 'active' ? 'Active' : 'Inactive'}
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
        onClose={() => { setAdding(false); setForm(BLANK); }}
        title="Add staff member"
        subtitle="Create a team account and assign a role."
        footer={<>
          <button className="btn btn--outline" onClick={() => { setAdding(false); setForm(BLANK); }}>Cancel</button>
          <button className="btn" onClick={submit} disabled={!canAdd}>Add member</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Full name *</span>
            <input className="input" required value={form.staffName} onChange={(e) => setForm((f) => ({ ...f, staffName: e.target.value }))} placeholder="Alex Tan" /></label>
          <label className="field"><span className="field-label">Title</span>
            <input className="input" value={form.staffTitle} onChange={(e) => setForm((f) => ({ ...f, staffTitle: e.target.value }))} placeholder="Receptionist" /></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Role *</span>
            <select className="select" value={form.staffRole} onChange={(e) => setForm((f) => ({ ...f, staffRole: e.target.value }))}>
              {ROLES.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
            </select></label>
          <label className="field"><span className="field-label">Shift</span>
            <select className="select" value={form.staffShift} onChange={(e) => setForm((f) => ({ ...f, staffShift: e.target.value }))}>
              {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Email *</span>
            <input className="input" type="email" name="staffEmail" autoComplete="off" required value={form.staffEmail} onChange={(e) => setForm((f) => ({ ...f, staffEmail: e.target.value }))} placeholder="alex@luxurystay.com" /></label>
          <label className="field"><span className="field-label">Phone *</span>
            <input className="input" name="staffPhone" autoComplete="off" pattern={PHONE_RE.source} required value={form.staffPhone} onChange={(e) => setForm((f) => ({ ...f, staffPhone: e.target.value }))} placeholder="+65 8123 4567" /></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Password * <em style={{ fontWeight: 400, opacity: 0.7 }}>(sign-in)</em></span>
            <div className="pass-wrap">
              <input className="input" name="staffPassword" autoComplete="new-password" type={showPass ? 'text' : 'password'} required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="At least 8 characters" />
              <button type="button" className="icon-btn" onClick={() => setShowPass((v) => !v)} title={showPass ? 'Hide password' : 'Show password'}><Icon name={showPass ? 'eye-off' : 'eye'} size={16} /></button>
            </div>
            <button type="button" className="btn btn--sm btn--outline" style={{ marginTop: 6 }} onClick={() => setForm((f) => ({ ...f, password: randomPassword() }))}>Generate password</button>
          </label>
        </div>
        {!form.staffName.trim() && <p className="room-form__warn"><Icon name="info" size={14} /> Staff name is required.</p>}
        {!form.staffEmail.trim() && <p className="room-form__warn"><Icon name="info" size={14} /> Staff email is required.</p>}
        {form.staffPhone.trim() && !PHONE_RE.test(form.staffPhone.trim()) && <p className="room-form__warn"><Icon name="info" size={14} /> Enter a phone number with 11 to 15 digits, e.g. +65 8123 4567.</p>}
        {!form.staffPhone.trim() && <p className="room-form__warn"><Icon name="info" size={14} /> Staff phone is required.</p>}
        {form.password.trim().length > 0 && form.password.trim().length < 8 && <p className="room-form__warn"><Icon name="info" size={14} /> Password must be at least 8 characters.</p>}
      </Modal>

      <Modal
        open={!!editingId}
        onClose={() => { setEditingId(null); setEditForm(BLANK); }}
        title="Edit staff member"
        subtitle="Update details, role, or shift assignment."
        footer={<>
          <button className="btn btn--outline" onClick={() => { setEditingId(null); setEditForm(BLANK); }}>Cancel</button>
          <button className="btn" onClick={saveEdit} disabled={!canSaveEdit}>Save changes</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Full name *</span>
            <input className="input" required value={editForm.staffName} onChange={(e) => setEditForm((f) => ({ ...f, staffName: e.target.value }))} placeholder="Alex Tan" /></label>
          <label className="field"><span className="field-label">Title</span>
            <input className="input" value={editForm.staffTitle} onChange={(e) => setEditForm((f) => ({ ...f, staffTitle: e.target.value }))} placeholder="Receptionist" /></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Role *</span>
            <select className="select" value={editForm.staffRole} onChange={(e) => setEditForm((f) => ({ ...f, staffRole: e.target.value }))}>
              {ROLES.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
            </select></label>
          <label className="field"><span className="field-label">Shift</span>
            <select className="select" value={editForm.staffShift} onChange={(e) => setEditForm((f) => ({ ...f, staffShift: e.target.value }))}>
              {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Email *</span>
            <input className="input" type="email" name="staffEmail" autoComplete="off" required value={editForm.staffEmail} onChange={(e) => setEditForm((f) => ({ ...f, staffEmail: e.target.value }))} placeholder="alex@luxurystay.com" /></label>
          <label className="field"><span className="field-label">Phone *</span>
            <input className="input" name="staffPhone" autoComplete="off" pattern={PHONE_RE.source} required value={editForm.staffPhone} onChange={(e) => setEditForm((f) => ({ ...f, staffPhone: e.target.value }))} placeholder="+65 8123 4567" /></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Reset password</span>
            <div className="pass-wrap">
              <input className="input" name="staffPassword" autoComplete="new-password" type={showEditPass ? 'text' : 'password'} value={editForm.password} onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))} placeholder="Leave blank to keep current password" />
              <button type="button" className="icon-btn" onClick={() => setShowEditPass((v) => !v)} title={showEditPass ? 'Hide password' : 'Show password'}><Icon name={showEditPass ? 'eye-off' : 'eye'} size={16} /></button>
            </div>
            <small style={{ display: 'block', marginTop: 5, fontSize: '0.78rem', opacity: 0.65 }}>Sets the sign-in password. If none exists yet, saving one creates the account.</small>
          </label>
        </div>
        {editForm.staffPhone.trim() && !PHONE_RE.test(editForm.staffPhone.trim()) && <p className="room-form__warn"><Icon name="info" size={14} /> Enter a phone number with 11 to 15 digits, e.g. +65 8123 4567.</p>}
      </Modal>
    </>
  );
}
