import { useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { roomTypes, money } from '../../data/hotel.js';
import './Settings.css';

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
  const { settings, updateSettings } = useData();
  const [draft, setDraft] = useState(settings);

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
                <input className="input" type="number" min="0" max="30" value={draft.taxRate} onChange={(e) => set({ taxRate: Number(e.target.value) })} /></label>
            </div>
            <div className="form-grid" style={{ marginTop: '1rem' }}>
              <label className="field"><span className="field-label">Check-in time</span>
                <input className="input" type="time" value={draft.checkIn} onChange={(e) => set({ checkIn: e.target.value })} /></label>
              <label className="field"><span className="field-label">Check-out time</span>
                <input className="input" type="time" value={draft.checkOut} onChange={(e) => set({ checkOut: e.target.value })} /></label>
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
          <div className="panel__head"><div><h2 className="panel__title">Room rates</h2><p className="panel__sub">Nightly base rates by category.</p></div></div>
          <div className="rate-grid on-dark">
            {roomTypes.map((t) => (
              <div className="rate-row" key={t.id}>
                <div className="rate-row__name">{t.name}<span>{t.tier}</span></div>
                <div className="rate-input">
                  <span className="rate-input__cur">$</span>
                  <input className="input" type="number" min="0" step="10" value={draft.rates[t.id]} onChange={(e) => setRate(t.id, e.target.value)} />
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
