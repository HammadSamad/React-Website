import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { serviceTypes, serviceTypeById, staff } from '../../data/hotel.js';
import './Services.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'requested', label: 'Requested' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

const assignable = staff.filter((s) => ['receptionist', 'housekeeping', 'manager'].includes(s.role) && s.status === 'active');
const BLANK = { type: 'room-service', guestId: '', room: '', when: '', detail: '', assignee: '' };

export default function Services() {
  const { services, guests, addService, setServiceStatus, updateService } = useData();
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);

  const guestMap = useMemo(() => Object.fromEntries(guests.map((g) => [g.id, g.name])), [guests]);

  const counts = useMemo(() => {
    const c = { all: services.length };
    for (const s of services) c[s.status] = (c[s.status] || 0) + 1;
    return c;
  }, [services]);

  const filtered = useMemo(
    () => (filter === 'all' ? services : services.filter((s) => s.status === filter)),
    [services, filter]
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const canAdd = form.type && form.detail.trim();
  const submit = () => {
    if (!canAdd) return;
    addService({
      type: form.type,
      guestId: form.guestId || null,
      room: form.room.trim(),
      when: form.when.trim() || 'ASAP',
      detail: form.detail.trim(),
      assignee: form.assignee || null,
    });
    setForm(BLANK);
    setAdding(false);
  };

  return (
    <>
      <DashHeader title="Guest Services" subtitle="Concierge requests — room service, wake-up calls, transport, and more.">
        <button className="btn btn--sm" onClick={() => setAdding(true)}><Icon name="plus" size={15} /> New request</button>
      </DashHeader>

      <div className="dash-toolbar">
        <div className="seg">
          {FILTERS.map((f) => (
            <button key={f.key} className={`seg__btn ${filter === f.key ? 'is-active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}<span className="seg__count">{counts[f.key] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="panel panel--flush">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>Request</th><th>Room</th><th>Guest</th><th>When</th><th>Assignee</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const type = serviceTypeById[s.type];
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="svc-type">
                        <span className="svc-type__icon"><Icon name={type?.icon || 'bell'} size={16} /></span>
                        <div>
                          <div className="svc-type__name">{type?.label || 'Request'}</div>
                          {s.detail && <div className="td-mut svc-type__detail">{s.detail}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="td-strong">{s.room || '—'}</td>
                    <td className="td-mut">{guestMap[s.guestId] || '—'}</td>
                    <td className="td-mut svc-when">{s.when || '—'}</td>
                    <td>
                      <select
                        className="select select--dark svc-assign"
                        value={s.assignee || ''}
                        onChange={(e) => updateService(s.id, { assignee: e.target.value || null })}
                      >
                        <option value="">Unassigned</option>
                        {assignable.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>
                      <div className="row-actions">
                        {s.status === 'requested' && <>
                          <button className="btn btn--sm btn--ghost" onClick={() => setServiceStatus(s.id, 'scheduled')}>Schedule</button>
                          <button className="btn btn--sm" onClick={() => setServiceStatus(s.id, 'in-progress')}>Start</button>
                        </>}
                        {s.status === 'scheduled' && <button className="btn btn--sm" onClick={() => setServiceStatus(s.id, 'in-progress')}>Start</button>}
                        {s.status === 'in-progress' && <button className="btn btn--sm" onClick={() => setServiceStatus(s.id, 'completed')}>Complete</button>}
                        {s.status === 'completed' && <button className="btn btn--sm btn--ghost" onClick={() => setServiceStatus(s.id, 'requested')}>Reopen</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="dash-empty"><Icon name="sparkles" size={30} /><p>No requests here.</p></div>}
        </div>
      </section>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="New service request"
        subtitle="Log a concierge request on behalf of a guest."
        footer={<>
          <button className="btn btn--outline" onClick={() => setAdding(false)}>Cancel</button>
          <button className="btn" onClick={submit} disabled={!canAdd}>Create request</button>
        </>}
      >
        <div className="form-grid form-grid--2">
          <label className="field"><span className="field-label">Service</span>
            <select className="select" value={form.type} onChange={set('type')}>
              {serviceTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select></label>
          <label className="field"><span className="field-label">Room</span>
            <input className="input" value={form.room} onChange={set('room')} placeholder="e.g. 401" /></label>
        </div>
        <div className="form-grid form-grid--2" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Guest</span>
            <select className="select" value={form.guestId} onChange={set('guestId')}>
              <option value="">—</option>
              {guests.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select></label>
          <label className="field"><span className="field-label">When</span>
            <input className="input" value={form.when} onChange={set('when')} placeholder="e.g. 08:00 or ASAP" /></label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Details</span>
          <textarea className="textarea" rows={3} value={form.detail} onChange={set('detail')} placeholder="What does the guest need?" /></label>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Assign to</span>
          <select className="select" value={form.assignee} onChange={set('assignee')}>
            <option value="">Unassigned</option>
            {assignable.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.title}</option>)}
          </select></label>
      </Modal>
    </>
  );
}
