import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { housekeepingApi, maintenanceApi } from '../../lib/api.js';
const HK_STATUSES = [
  { key: 'pending', label: 'Pending' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];
const MAINT_STATUSES = [
  { key: 'pending', label: 'Pending' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];
const BLANK_MAINT = { roomId: '', issueTitle: '', issueDescription: '', priority: 'medium', staffId: '' };
const BLANK_TASK = { roomId: '', taskType: 'cleaning', notes: '', staffId: '' };

function Prio({ level }) {
  return <span className={`prio prio--${level}`}>{level}</span>;
}

export default function Housekeeping() {
  const { housekeeping, setHousekeeping, maintenance, setMaintenance, rooms, staff, notify, refreshAll } = useData();
  const [view, setView] = useState('tasks');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK_MAINT);
  const [addingTask, setAddingTask] = useState(false);
  const [taskForm, setTaskForm] = useState(BLANK_TASK);
  const [floor, setFloor] = useState('all');

  const roomMap = useMemo(() => Object.fromEntries(rooms.map((r) => [r._id || r.id, r.roomNumber])), [rooms]);
  const floorMap = useMemo(() => Object.fromEntries(rooms.map((r) => [r._id || r.id, r.floor])), [rooms]);
  const staffMap = useMemo(() => Object.fromEntries(staff.map((s) => [s._id || s.id, s.staffName || s.name])), [staff]);
  const assignable = useMemo(() => staff.filter((s) => (s.staffRole === 'maintenance' || s.staffRole === 'housekeeping') && s.staffStatus !== 'inactive'), [staff]);
  const floors = useMemo(() => [...new Set(rooms.map((r) => r.floor).filter((f) => typeof f === 'number'))].sort((a, b) => a - b), [rooms]);
  const taskFloor = (t) => t.roomId?.floor ?? floorMap[t.roomId];

  const boardTasks = useMemo(() => housekeeping.filter((t) => floor === 'all' || taskFloor(t) === floor), [housekeeping, floor, floorMap]);

  const grouped = useMemo(() => {
    const g = { pending: [], 'in-progress': [], completed: [] };
    for (const t of boardTasks) (g[t.taskStatus] ||= []).push(t);
    return g;
  }, [boardTasks]);

  const groupedMaint = useMemo(() => {
    const g = { pending: [], 'in-progress': [], completed: [] };
    for (const m of maintenance) (g[m.maintenanceStatus] ||= []).push(m);
    return g;
  }, [maintenance]);

  const canAddMaint = form.roomId && form.issueTitle.trim();
  const submitMaint = async () => {
    if (!canAddMaint) return;
    try {
      const payload = {
        roomId: form.roomId,
        issueTitle: form.issueTitle.trim(),
        issueDescription: form.issueDescription.trim(),
        priority: form.priority,
        staffId: form.staffId || null,
      };
      await maintenanceApi.create(payload);
      setForm(BLANK_MAINT);
      setAdding(false);
      refreshAll();
      notify('Maintenance request logged');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const canAddTask = taskForm.roomId && taskForm.taskType;
  const submitTask = async () => {
    if (!canAddTask) return;
    try {
      const payload = {
        roomId: taskForm.roomId,
        taskType: taskForm.taskType,
        taskDate: new Date().toISOString(),
        notes: taskForm.notes.trim(),
        staffId: taskForm.staffId || null,
      };
      await housekeepingApi.create(payload);
      setTaskForm(BLANK_TASK);
      setAddingTask(false);
      refreshAll();
      notify('Housekeeping task created');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const updateMaintStatus = (id, status) => {
    maintenanceApi.update(id, { maintenanceStatus: status }).then(() => refreshAll()).catch(() => {});
  };

  return (
    <>
      <DashHeader title="Housekeeping" subtitle="Cleaning tasks and maintenance across the property.">
        <button className="btn btn--sm" onClick={() => (view === 'tasks' ? setAddingTask(true) : setAdding(true))}>
          <Icon name={view === 'tasks' ? 'broom' : 'wrench'} size={15} /> {view === 'tasks' ? 'New task' : 'Log request'}
        </button>
      </DashHeader>

      <div className="dash-toolbar">
        <div className="seg">
          <button className={`seg__btn ${view === 'tasks' ? 'is-active' : ''}`} onClick={() => setView('tasks')}>Tasks<span className="seg__count">{housekeeping.length}</span></button>
          <button className={`seg__btn ${view === 'maint' ? 'is-active' : ''}`} onClick={() => setView('maint')}>Maintenance<span className="seg__count">{maintenance.length}</span></button>
        </div>
        {view === 'tasks' && (
          <div className="seg seg--floors">
            <button className={`seg__btn ${floor === 'all' ? 'is-active' : ''}`} onClick={() => setFloor('all')}>All floors</button>
            {floors.map((f) => (
              <button key={f} className={`seg__btn ${floor === f ? 'is-active' : ''}`} onClick={() => setFloor(f)}>Floor {f}</button>
            ))}
          </div>
        )}
      </div>

      {view === 'tasks' && (
        <div className="hk-board">
          {HK_STATUSES.map((col) => (
            <div className="hk-col" key={col.key}>
              <div className="hk-col__head">
                <span className={`hk-col__dot hk-col__dot--${col.key}`} />
                <h3 className="hk-col__title">{col.label}</h3>
                <span className="hk-col__count">{grouped[col.key]?.length || 0}</span>
              </div>
              <div className="hk-col__body">
                {(grouped[col.key] || []).map((t) => (
                  <article className="hk-card" key={t._id || t.id}>
                    <div className="hk-card__top">
                      <span className="hk-card__room"><Icon name="door" size={14} /> {t.roomId?.roomNumber || roomMap[t.roomId] || '—'}</span>
                      <span className="hk-card__floor"><Icon name="building" size={12} /> Floor {taskFloor(t) ?? '—'}</span>
                    </div>
                    <div className="hk-card__task">{t.taskType}</div>
                    {t.notes && <div className="hk-card__note">{t.notes}</div>}
                    <div className="hk-card__foot">
                      <select className="select select--dark hk-assign" value={t.staffId?._id || t.staffId || ''} onChange={(e) => { const tid = t._id || t.id; housekeepingApi.update(tid, { staffId: e.target.value || null }).then(() => refreshAll()).catch(() => {}); }} aria-label="Assign task">
                        <option value="">Unassigned</option>
                        {assignable.map((s) => <option key={s._id || s.id} value={s._id || s.id}>{s.staffName || s.name}</option>)}
                      </select>
                      <div className="hk-card__actions">
                        {t.taskStatus === 'pending' && <button className="btn btn--sm" onClick={() => { const tid = t._id || t.id; housekeepingApi.updateStatus(tid, 'in-progress').then(() => refreshAll()).catch(() => {}); }}>Start</button>}
                        {t.taskStatus === 'in-progress' && <>
                          <button className="btn btn--sm btn--ghost" onClick={() => { const tid = t._id || t.id; housekeepingApi.updateStatus(tid, 'pending').then(() => refreshAll()).catch(() => {}); }}>Hold</button>
                          <button className="btn btn--sm" onClick={() => { const tid = t._id || t.id; housekeepingApi.updateStatus(tid, 'completed').then(() => refreshAll()).catch(() => {}); }}>Complete</button>
                        </>}
                        {t.taskStatus === 'completed' && <button className="btn btn--sm btn--ghost" onClick={() => { const tid = t._id || t.id; housekeepingApi.updateStatus(tid, 'pending').then(() => refreshAll()).catch(() => {}); }}>Reopen</button>}
                      </div>
                    </div>
                  </article>
                ))}
                {(grouped[col.key] || []).length === 0 && <div className="hk-col__empty">Nothing here</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'maint' && (
        <section className="panel panel--flush">
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr><th>Room</th><th>Issue</th><th>Priority</th><th>Assignee</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {maintenance.map((m) => (
                  <tr key={m._id || m.id}>
                    <td className="td-strong">{m.roomId?.roomNumber || roomMap[m.roomId] || '—'}</td>
                    <td>{m.issueTitle}</td>
                    <td><Prio level={m.priority} /></td>
                    <td className="td-mut">{m.staffId?.staffName || staffMap[m.staffId] || '—'}</td>
                    <td><StatusBadge status={m.maintenanceStatus} /></td>
                    <td>
                      <div className="row-actions">
                        {m.maintenanceStatus === 'pending' && <button className="btn btn--sm" onClick={() => updateMaintStatus(m._id || m.id, 'in-progress')}>Start</button>}
                        {m.maintenanceStatus === 'in-progress' && <button className="btn btn--sm" onClick={() => updateMaintStatus(m._id || m.id, 'completed')}>Resolve</button>}
                        {m.maintenanceStatus === 'completed' && <button className="btn btn--sm btn--ghost" onClick={() => updateMaintStatus(m._id || m.id, 'pending')}>Reopen</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {maintenance.length === 0 && <div className="dash-empty"><Icon name="wrench" size={30} /><p>No maintenance requests.</p></div>}
          </div>
        </section>
      )}

      <Modal
        open={adding}
        onClose={() => { setAdding(false); setForm(BLANK_MAINT); }}
        title="Log maintenance request"
        subtitle="Raise an issue for the facilities team."
        footer={<>
          <button className="btn btn--outline" onClick={() => { setAdding(false); setForm(BLANK_MAINT); }}>Cancel</button>
          <button className="btn" onClick={submitMaint} disabled={!canAddMaint}>Log request</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Room *</span>
            <select className="select" value={form.roomId} onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}>
              <option value="" disabled>Select room…</option>
              {rooms.map((r) => <option key={r._id || r.id} value={r._id || r.id}>Room {r.roomNumber}</option>)}
            </select></label>
          <label className="field"><span className="field-label">Priority</span>
            <select className="select" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select></label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Issue title *</span>
          <input className="input" value={form.issueTitle} onChange={(e) => setForm((f) => ({ ...f, issueTitle: e.target.value }))} placeholder="e.g. Thermostat unresponsive" /></label>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Description</span>
          <textarea className="textarea" rows={3} value={form.issueDescription} onChange={(e) => setForm((f) => ({ ...f, issueDescription: e.target.value }))} placeholder="Describe the problem…" /></label>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Assign to</span>
          <select className="select" value={form.staffId} onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}>
            <option value="">Unassigned</option>
            {assignable.filter(s => s.staffRole === 'maintenance').map((s) => <option key={s._id || s.id} value={s._id || s.id}>{s.staffName || s.name}</option>)}
          </select></label>
      </Modal>

      <Modal
        open={addingTask}
        onClose={() => { setAddingTask(false); setTaskForm(BLANK_TASK); }}
        title="New housekeeping task"
        subtitle="Assign a cleaning or turndown task to the team."
        footer={<>
          <button className="btn btn--outline" onClick={() => { setAddingTask(false); setTaskForm(BLANK_TASK); }}>Cancel</button>
          <button className="btn" onClick={submitTask} disabled={!canAddTask}>Create task</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Room *</span>
            <select className="select" value={taskForm.roomId} onChange={(e) => setTaskForm((f) => ({ ...f, roomId: e.target.value }))}>
              <option value="" disabled>Select room…</option>
              {rooms.map((r) => <option key={r._id || r.id} value={r._id || r.id}>Room {r.roomNumber}</option>)}
            </select></label>
          <label className="field"><span className="field-label">Task type *</span>
            <select className="select" value={taskForm.taskType} onChange={(e) => setTaskForm((f) => ({ ...f, taskType: e.target.value }))}>
              <option value="cleaning">Cleaning</option><option value="deep-cleaning">Deep Cleaning</option><option value="inspection">Inspection</option>
            </select></label>
        </div>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Assign to</span>
            <select className="select" value={taskForm.staffId} onChange={(e) => setTaskForm((f) => ({ ...f, staffId: e.target.value }))}>
              <option value="">Unassigned</option>
              {assignable.filter(s => s.staffRole === 'housekeeping').map((s) => <option key={s._id || s.id} value={s._id || s.id}>{s.staffName || s.name}</option>)}
            </select></label>
          <label className="field"><span className="field-label">Notes <span className="field-optional">optional</span></span>
            <input className="input" value={taskForm.notes} onChange={(e) => setTaskForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any specifics…" /></label>
        </div>
      </Modal>
    </>
  );
}
