import { useState, useMemo, useEffect } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { money, MODULES, ROLES, roleLabels } from '../../data/hotel.js';
const CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD'];

function Switch({ on, onChange, label, hint }) {
  return (
    <button type="button" className={`switch-row ${on ? 'is-on' : ''}`} onClick={onChange}>
      <span className="switch-row__text">
        <span className="switch-row__label">{label}</span>
        {hint && <span className="switch-row__hint">{hint}</span>}
      </span>
      <span className="switch"><span className="switch__knob" /></span>
    </button>
  );
}

export default function Settings() {
  const { settings, updateSettings, rooms, rolePolicies, updateRolePolicies } = useData();
  const [draft, setDraft] = useState(settings);
  const [roleDraft, setRoleDraft] = useState(rolePolicies);

  useEffect(() => { setRoleDraft(rolePolicies); }, [rolePolicies]);

  const uniqueRooms = useMemo(() => {
    const map = new Map();
    for (const r of rooms) if (!map.has(r.roomType)) map.set(r.roomType, r);
    return Array.from(map.values());
  }, [rooms]);

  const policyKeys = useMemo(() => {
    const labels = new Map(MODULES.map((m) => [m.key, m.label]));
    return Object.keys(rolePolicies?.manager || {}).filter((k) => labels.has(k));
  }, [rolePolicies]);

  const roleDirty = JSON.stringify(roleDraft) !== JSON.stringify(rolePolicies);
  const toggleCell = (role, key) => setRoleDraft((d) => ({ ...d, [role]: { ...d[role], [key]: !d[role][key] } }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setRate = (id, v) => setDraft((d) => ({ ...d, rates: { ...d.rates, [id]: Number(v) || 0 } }));
  const setPolicy = (k, v) => setDraft((d) => ({ ...d, policies: { ...d.policies, [k]: v } }));
  const toggleNotif = (k) => setDraft((d) => ({ ...d, notifications: { ...d.notifications, [k]: !d.notifications[k] } }));

  const save = () => updateSettings(draft);

  return (
    <>
      <DashHeader title="System" subtitle="Property configuration, rates, policies, and alerts.">
        <div className="dash-header__actions">
          <button className="btn btn--outline btn--sm" onClick={() => setDraft(settings)} disabled={!dirty}>Reset</button>
          <button className="btn btn--sm" onClick={save} disabled={!dirty}><Icon name="check" size={15} /> Save changes</button>
        </div>
      </DashHeader>

      <div className="settings-grid">
        {/* Property */}
        <section className="panel">
          <div className="panel__head"><div><h2 className="panel__title">Property</h2><p className="panel__sub">Currency, tax, and front-desk times.</p></div></div>
          <div className="settings-fields on-dark">
            <div className="form-grid">
              <label className="field"><span className="field-label">Currency</span>
                <select className="select" value={draft.currency} onChange={(e) => set({ currency: e.target.value })}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select></label>
              <label className="field"><span className="field-label">Tax &amp; service (%)</span>
                <input className="input" type="number" min="0" max="30" value={draft.taxPercentage} onChange={(e) => set({ taxPercentage: Number(e.target.value) })} /></label>
            </div>
            <div className="form-grid" style={{ marginTop: '1rem' }}>
              <label className="field"><span className="field-label">Check-in time</span>
                <input className="input" type="time" value={draft.checkInTime} onChange={(e) => set({ checkInTime: e.target.value })} /></label>
              <label className="field"><span className="field-label">Check-out time</span>
                <input className="input" type="time" value={draft.checkOutTime} onChange={(e) => set({ checkOutTime: e.target.value })} /></label>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="panel">
          <div className="panel__head"><div><h2 className="panel__title">Notifications</h2><p className="panel__sub">What the console alerts you about.</p></div></div>
          <div className="switch-list">
            <Switch on={draft.notifications.newBooking} onChange={() => toggleNotif('newBooking')} label="New bookings" hint="Alert on every confirmed reservation" />
            <Switch on={draft.notifications.maintenance} onChange={() => toggleNotif('maintenance')} label="Maintenance requests" hint="When a new issue is logged" />
            <Switch on={draft.notifications.lowInventory} onChange={() => toggleNotif('lowInventory')} label="Low availability" hint="When occupancy exceeds 90%" />
            <Switch on={draft.notifications.dailyReport} onChange={() => toggleNotif('dailyReport')} label="Daily report" hint="Morning summary at 07:00" />
          </div>
        </section>

        {/* Rates */}
        <section className="panel settings-span">
          <div className="panel__head"><div><h2 className="panel__title">Room rates</h2><p className="panel__sub">Prices are managed in the API for individual rooms now. Below are typical base rates.</p></div></div>
          <div className="rate-grid on-dark">
            {uniqueRooms.map((t) => (
              <div className="rate-row" key={t._id || t.id}>
                <div className="rate-row__name">{t.roomType}</div>
                <div className="rate-input">
                  <span className="rate-input__cur">$</span>
                  <input className="input" type="number" value={t.roomPrice} disabled />
                  <span className="rate-input__per">/night</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Policies */}
        <section className="panel settings-span">
          <div className="panel__head"><div><h2 className="panel__title">Guest policies</h2><p className="panel__sub">Shown on the website and confirmations.</p></div></div>
          <div className="settings-fields on-dark">
            <label className="field"><span className="field-label">Cancellation</span>
              <textarea className="textarea" rows={2} value={draft.policies.cancellation} onChange={(e) => setPolicy('cancellation', e.target.value)} /></label>
            <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Pets</span>
              <textarea className="textarea" rows={2} value={draft.policies.pets} onChange={(e) => setPolicy('pets', e.target.value)} /></label>
            <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">Smoking</span>
              <textarea className="textarea" rows={2} value={draft.policies.smoking} onChange={(e) => setPolicy('smoking', e.target.value)} /></label>
          </div>
        </section>

        {/* Roles & permissions */}
        <section className="panel settings-span">
          <div className="panel__head">
            <div><h2 className="panel__title">Roles &amp; permissions</h2><p className="panel__sub">Which modules each role can access in the console. Route-level checks on the server remain the security boundary.</p></div>
            {roleDirty && (
              <div className="dash-header__actions">
                <button className="btn btn--outline btn--sm" onClick={() => setRoleDraft(rolePolicies)}>Reset</button>
                <button className="btn btn--sm" onClick={() => updateRolePolicies(roleDraft)}><Icon name="check" size={15} /> Save roles</button>
              </div>
            )}
          </div>
          <div className="perm-table on-dark">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Module</th>
                  {ROLES.map((r) => <th key={r}>{roleLabels[r]}</th>)}
                </tr>
              </thead>
              <tbody>
                {policyKeys.map((k) => (
                  <tr key={k}>
                    <td className="td-strong">{MODULES.find((m) => m.key === k)?.label || k}</td>
                    {ROLES.map((r) => (
                      <td key={r} className="perm-cell">
                        <button
                          type="button"
                          className={`perm-toggle ${roleDraft[r]?.[k] ? 'is-on' : ''}`}
                          disabled={r === 'admin'}
                          onClick={() => toggleCell(r, k)}
                          aria-label={`${roleLabels[r]} — ${MODULES.find((m) => m.key === k)?.label || k}`}
                        >
                          {roleDraft[r]?.[k] && <Icon name="check" size={13} />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {dirty && (
        <div className="settings-savebar">
          <span>You have unsaved changes.</span>
          <div className="settings-savebar__actions">
            <button className="btn btn--outline btn--sm" onClick={() => setDraft(settings)}>Discard</button>
            <button className="btn btn--sm" onClick={save}>Save changes</button>
          </div>
        </div>
      )}
    </>
  );
}
