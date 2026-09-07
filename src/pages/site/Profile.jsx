import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHero from '../../components/site/PageHero.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { img } from '../../lib/images.js';
import './Account.css';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { notify } = useData();
  const navigate = useNavigate();
  const profile = user?.guestId && typeof user.guestId === 'object' ? user.guestId : null;
  const [form, setForm] = useState(() => ({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || profile?.guestPhone || '', country: profile?.guestCountry || '',
    preferences: profile?.guestPreferences || '',
  }));
  const [saved, setSaved] = useState(false);
  const set = (key) => (event) => { setSaved(false); setForm((value) => ({ ...value, [key]: event.target.value })); };

  const save = async (event) => {
    event.preventDefault();
    const authResult = await updateProfile({
      name: form.name, email: form.email, phone: form.phone,
      country: form.country, preferences: form.preferences.split(',').map((item) => item.trim()).filter(Boolean),
    });
    if (!authResult.ok) return notify(authResult.error, 'warn');
    notify('Your profile has been saved.');
    setSaved(true);
    if (authResult.verificationRequired) navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
  };

  return <div className="account-page">
    <PageHero eyebrow="Your account" title="Profile details" lead="Keep your contact details and stay preferences ready for every visit." crumbs={[{ label: 'My account', to: '/account' }, { label: 'Profile' }]} image={img.lobby(1600, 60)} />
    <section className="section on-light"><div className="container container--narrow">
      <Reveal><form className="profile-form acct-card" onSubmit={save}>
        <div className="acct-block__head"><div><h2 className="acct-h2">Personal details</h2><p className="profile-form__sub">These details are used to personalise your reservations.</p></div><Link className="acct-link" to="/account">Back to account <Icon name="arrowRight" size={14} /></Link></div>
        <div className="form-grid">
          <label className="field"><span className="field-label">Full name</span><input className="input" value={form.name} onChange={set('name')} required /></label>
          <label className="field"><span className="field-label">Email address</span><input className="input" type="email" value={form.email} onChange={set('email')} required /></label>
          <label className="field"><span className="field-label">Phone</span><input className="input" value={form.phone} onChange={set('phone')} placeholder="+65 …" /></label>
          <label className="field"><span className="field-label">Country of residence</span><input className="input" value={form.country} onChange={set('country')} placeholder="Country" /></label>
        </div>
        <label className="field profile-form__prefs"><span className="field-label">Stay preferences <span className="field-optional">optional</span></span><input className="input" value={form.preferences} onChange={set('preferences')} placeholder="e.g. High floor, Feather-free pillows" /><small>Separate preferences with commas.</small></label>
        <div className="profile-form__foot">{saved && <span className="profile-form__saved"><Icon name="circleCheck" size={16} /> Saved</span>}<button className="btn" type="submit"><Icon name="check" size={16} /> Save profile</button></div>
      </form></Reveal>
    </div></section>
  </div>;
}
