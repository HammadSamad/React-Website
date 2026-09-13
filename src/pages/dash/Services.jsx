import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { serviceTypes, serviceTypeById } from '../../data/hotel.js';
import { servicesApi } from '../../lib/api.js';
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'requested', label: 'Requested' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const BLANK = { serviceType: 'room-service', guestId: '', roomId: '', serviceDescription: '' };

export default function Services() {
  const { services, setServices, guests, rooms, staff, notify, refreshAll } = useData();
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const guestMap = useMemo(() => Object.fromEntries(guests.map((g) => [g._id || g.id, g.guestName || g.name])), [guests]);
  const staffMap = useMemo(() => Object.fromEntries(staff.map((s) => [s._id || s.id, s.staffName || s.name])), [staff]);

  const counts = useMemo(() => {
    const c = { all: services.length };
    for (const s of services) c[s.serviceStatus] = (c[s.serviceStatus] || 0) + 1;
    return c;
  }, [services]);

  const filtered = useMemo(
    () => (filter === 'all' ? services : services.filter((s) => s.serviceStatus === filter)),
    [services, filter]
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const canAdd = form.serviceType && form.serviceDescription.trim();
  const submit = async () => {
    if (!canAdd) return;
    try {
      const payload = {
        serviceType: form.serviceType,
        guestId: form.guestId || null,
        roomId: form.roomId || null,
        serviceDescription: form.serviceDescription.trim(),
      };
      await servicesApi.create(payload);
      setForm(BLANK);
      setAdding(false);
      refreshAll();
      notify('Service request created');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const getStatusActions = (s) => {
    const sid = s._id || s.id;
    const update = (status) => servicesApi.updateStatus(sid, status).then(() => refreshAll()).catch(() => {});
    switch (s.serviceStatus) {
      case 'requested': return <><button className="btn btn--sm" onClick={() => update('in-progress')}>Start</button></>;
      case 'in-progress': return <button className="btn btn--sm" onClick={() => update('completed')}>Complete</button>;
      case 'completed': return <button className="btn btn--sm btn--ghost" onClick={() => update('cancelled')}>Cancel</button>;
      default: return null;
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await servicesApi.delete(confirmDelete._id || confirmDelete.id);
      setConfirmDelete(null);
      refreshAll();
      notify('Service request deleted');
    } catch (e) {
      notify(e.message, 'error');
    }
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
              <tr><th>Request</th><th>Room</th><th>Guest</th><th>Description</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const type = serviceTypeById[s.serviceType];
                const roomNum = s.roomId?.roomNumber || '—';
                const guestName = s.guestId?.guestName || guestMap[s.guestId] || '—';
                return (
                  <tr key={s._id || s.id}>
                    <td>
                      <div className="svc-type">
                        <span className="svc-type__icon"><Icon name={type?.icon || 'bell'} size={16} /></span>
                        <div>
                          <div className="svc-type__name">{type?.label || s.serviceType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="td-strong">{roomNum}</td>
                    <td className="td-mut">{guestName}</td>
                    <td className="td-mut">{s.serviceDescription || '—'}</td>
                    <td><StatusBadge status={s.serviceStatus} /></td>
                    <td>
                      <div className="row-actions">
                        {getStatusActions(s)}
                        <button className="icon-btn icon-btn--danger" title="Delete request" onClick={() => setConfirmDelete(s)}><Icon name="trash" size={15} /></button>
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
        onClose={() => { setAdding(false); setForm(BLANK); }}
        title="New service request"
        subtitle="Log a concierge request on behalf of a guest."
        footer={<>
          <button className="btn btn--outline" onClick={() => { setAdding(false); setForm(BLANK); }}>Cancel</button>
          <button className="btn" onClick={submit} disabled={!canAdd}>Create request</button>
        </>}
      >
        <div className="form-grid form-grid--2">
          <label className="field"><span className="field-label">Service type *</span>
            <select className="select" value={form.serviceType} onChange={set('serviceType')}>
              {serviceTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select></label>
          <label className="field"><span className="field-label">Room</span>
            <select className="select" value={form.roomId} onChange={set('roomId')}>
              <option value="">—</option>
              {rooms.map((r) => <option key={r._id || r.id} value={r._id || r.id}>Room {r.roomNumber}</option>)}
            </select></label>
        </div>
        <div className="form-grid form-grid--2" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Guest</span>
            <select className="select" value={form.guestId} onChange={set('guestId')}>
              <option value="">—</option>
              {guests.map((g) => <option key={g._id || g.id} value={g._id || g.id}>{g.guestName || g.name}</option>)}
            </select></label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Description *</span>
          <textarea className="textarea" rows={3} value={form.serviceDescription} onChange={set('serviceDescription')} placeholder="What does the guest need?" /></label>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete service request?"
        subtitle="This permanently removes the request record."
        footer={<>
          <button className="btn btn--outline" onClick={() => setConfirmDelete(null)}>Keep request</button>
          <button className="btn btn--danger" onClick={doDelete}><Icon name="trash" size={15} /> Delete request</button>
        </>}
      >
        <p style={{ margin: 0, color: 'var(--ink-soft, #6b7280)', fontSize: '0.95rem' }}>
          Are you sure you want to delete this request? {confirmDelete?.serviceDescription ? `“${confirmDelete.serviceDescription}”` : ''}
        </p>
      </Modal>
    </>
  );
}
