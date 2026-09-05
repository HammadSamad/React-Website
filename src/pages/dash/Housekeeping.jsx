import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { staff } from '../../data/hotel.js';
import './Housekeeping.css';

const HK_COLUMNS = [
  { key: 'pending', label: 'Pending' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'done', label: 'Done' },
];
const staffMap = Object.fromEntries(staff.map((s) => [s.id, s.name]));
const assignable = staff.filter((s) => s.role === 'maintenance' || s.role === 'housekeeping');
const BLANK = { roomNo: '', issue: '', reportedBy: 'Reception', priority: 'normal', assignee: '' };
const TASK_BLANK = { roomNo: '', task: '', priority: 'normal', assignee: '', note: '' };

function Prio({ level }) {
  return <span className={`prio prio--${level}`}>{level}</span>;
}

export default function Housekeeping() {
  const { housekeeping, maintenance, setTaskStatus, updateTask, addTask, setMaintenanceStatus, addMaintenance } = useData();
  const [view, setView] = useState('tasks');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [addingTask, setAddingTask] = useState(false);
  const [taskForm, setTaskForm] = useState(TASK_BLANK);

  const grouped = useMemo(() => {
    const g = { pending: [], 'in-progress': [], done: [] };
    for (const t of housekeeping) (g[t.status] ||= []).push(t);
    return g;
  }, [housekeeping]);

  const canAdd = form.roomNo.trim() && form.issue.trim();
  const submit = () => {
    if (!canAdd) return;
    addMaintenance({ ...form, assignee: form.assignee || null });
    setForm(BLANK);
    setAdding(false);
  };

  const canAddTask = taskForm.roomNo.trim() && taskForm.task.trim();
  const submitTask = () => {
    if (!canAddTask) return;
    addTask({
      roomNo: taskForm.roomNo.trim(),
      task: taskForm.task.trim(),
      priority: taskForm.priority,
      assignee: taskForm.assignee || null,
      note: taskForm.note.trim(),
    });
    setTaskForm(TASK_BLANK);
    setAddingTask(false);
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
      </div>

      {view === 'tasks' && (
        <div className="hk-board">
          {HK_COLUMNS.map((col) => (
            <div className="hk-col" key={col.key}>
              <div className="hk-col__head">
                <span className={`hk-col__dot hk-col__dot--${col.key}`} />
                <h3 className="hk-col__title">{col.label}</h3>
                <span className="hk-col__count">{grouped[col.key]?.length || 0}</span>
              </div>
              <div className="hk-col__body">
                {(grouped[col.key] || []).map((t) => (
                  <article className="hk-card" key={t.id}>
                    <div className="hk-card__top">
                      <span className="hk-card__room"><Icon name="door" size={14} /> {t.roomNo}</span>
                      <Prio level={t.priority} />
                    </div>
                    <div className="hk-card__task">{t.task}</div>
                    {t.note && <div className="hk-card__note">{t.note}</div>}
                    <div className="hk-card__foot">
                      <select className="select select--dark hk-assign" value={t.assignee || ''} onChange={(e) => updateTask(t.id, { assignee: e.target.value || null })} aria-label="Assign task">
                        <option value="">Unassigned</option>
                        {assignable.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <div className="hk-card__actions">
                        {t.status === 'pending' && <button className="btn btn--sm" onClick={() => setTaskStatus(t.id, 'in-progress')}>Start</button>}
                        {t.status === 'in-progress' && <>
                          <button className="btn btn--sm btn--ghost" onClick={() => setTaskStatus(t.id, 'pending')}>Hold</button>
                          <button className="btn btn--sm" onClick={() => setTaskStatus(t.id, 'done')}>Complete</button>
                        </>}
                        {t.status === 'done' && <button className="btn btn--sm btn--ghost" onClick={() => setTaskStatus(t.id, 'pending')}>Reopen</button>}
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
                <tr><th>Room</th><th>Issue</th><th>Reported by</th><th>Priority</th><th>Assignee</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {maintenance.map((m) => (
                  <tr key={m.id}>
                    <td className="td-strong">{m.roomNo}</td>
                    <td>{m.issue}</td>
                    <td className="td-mut">{m.reportedBy}</td>
                    <td><Prio level={m.priority} /></td>
                    <td className="td-mut">{staffMap[m.assignee] || '—'}</td>
                    <td><StatusBadge status={m.status} /></td>
                    <td>
                      <div className="row-actions">
                        {m.status === 'open' && <button className="btn btn--sm" onClick={() => setMaintenanceStatus(m.id, 'in-progress')}>Start</button>}
                        {m.status === 'in-progress' && <button className="btn btn--sm" onClick={() => setMaintenanceStatus(m.id, 'resolved')}>Resolve</button>}
                        {m.status === 'resolved' && <button className="btn btn--sm btn--ghost" onClick={() => setMaintenanceStatus(m.id, 'open')}>Reopen</button>}
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
        onClose={() => setAdding(false)}
        title="Log maintenance request"
        subtitle="Raise an issue for the facilities team."
        footer={<>
          <button className="btn btn--outline" onClick={() => setAdding(false)}>Cancel</button>
          <button className="btn" onClick={submit} disabled={!canAdd}>Log request</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Room</span>
            <input className="input" value={form.roomNo} onChange={(e) => setForm((f) => ({ ...f, roomNo: e.target.value }))} placeholder="e.g. 305" /></label>
          <label className="field"><span className="field-label">Priority</span>
            <select className="select" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
              <option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option>
            </select></label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Issue</span>
          <textarea className="textarea" rows={3} value={form.issue} onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))} placeholder="Describe the problem…" /></label>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Reported by</span>
            <select className="select" value={form.reportedBy} onChange={(e) => setForm((f) => ({ ...f, reportedBy: e.target.value }))}>
              <option>Reception</option><option>Housekeeping</option><option>Guest</option><option>Maintenance</option>
            </select></label>
          <label className="field"><span className="field-label">Assign to</span>
            <select className="select" value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}>
              <option value="">Unassigned</option>
              {assignable.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.title}</option>)}
            </select></label>
        </div>
      </Modal>

      <Modal
        open={addingTask}
        onClose={() => setAddingTask(false)}
        title="New housekeeping task"
        subtitle="Assign a cleaning or turndown task to the team."
        footer={<>
          <button className="btn btn--outline" onClick={() => setAddingTask(false)}>Cancel</button>
          <button className="btn" onClick={submitTask} disabled={!canAddTask}>Create task</button>
        </>}
      >
        <div className="form-grid">
          <label className="field"><span className="field-label">Room</span>
            <input className="input" value={taskForm.roomNo} onChange={(e) => setTaskForm((f) => ({ ...f, roomNo: e.target.value }))} placeholder="e.g. 204" /></label>
          <label className="field"><span className="field-label">Priority</span>
            <select className="select" value={taskForm.priority} onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))}>
              <option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option>
            </select></label>
        </div>
        <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Task</span>
          <input className="input" value={taskForm.task} onChange={(e) => setTaskForm((f) => ({ ...f, task: e.target.value }))} placeholder="e.g. Full clean & turndown" /></label>
        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <label className="field"><span className="field-label">Assign to</span>
            <select className="select" value={taskForm.assignee} onChange={(e) => setTaskForm((f) => ({ ...f, assignee: e.target.value }))}>
              <option value="">Unassigned</option>
              {assignable.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.title}</option>)}
            </select></label>
          <label className="field"><span className="field-label">Note <span className="field-optional">optional</span></span>
            <input className="input" value={taskForm.note} onChange={(e) => setTaskForm((f) => ({ ...f, note: e.target.value }))} placeholder="Any specifics…" /></label>
        </div>
      </Modal>
    </>
  );
}
