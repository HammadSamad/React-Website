import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHero from '../../components/site/PageHero.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { img } from '../../lib/images.js';
export default function Profile() {
  const { user, updateProfile, updateProfilePicture } = useAuth();
  const { notify } = useData();
  const navigate = useNavigate();
  const profile = user?.guestId && typeof user.guestId === 'object' ? user.guestId : null;
  const [form, setForm] = useState(() => ({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || profile?.guestPhone || '', country: profile?.guestCountry || '',
    preferences: profile?.guestPreferences || '',
  }));
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.profileImage?.url || null);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef(null);

  const set = (key) => (event) => { setSaved(false); setForm((value) => ({ ...value, [key]: event.target.value })); };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Immediate local preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setUploading(true);
    const result = await updateProfilePicture(file);
    setUploading(false);
    URL.revokeObjectURL(previewUrl);
    if (result.ok) {
      setAvatarPreview(result.profileImage?.url || previewUrl);
      notify('Profile picture updated.');
    } else {
      notify(result.error || 'Could not upload photo.', 'warn');
      setAvatarPreview(user?.profileImage?.url || null);
    }
  };

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

  const initials = (user?.name || user?.email || 'U').slice(0, 2).toUpperCase();

  return <div className="account-page">
    <PageHero eyebrow="Your account" title="Profile details" lead="Keep your contact details and stay preferences ready for every visit." crumbs={[{ label: 'My account', to: '/account' }, { label: 'Profile' }]} image={img.lobby(1600, 60)} />
    <section className="section on-light"><div className="container container--narrow">
      <Reveal><form className="profile-form acct-card" onSubmit={save}>
        <div className="acct-block__head"><div><h2 className="acct-h2">Personal details</h2><p className="profile-form__sub">These details are used to personalise your reservations.</p></div><Link className="acct-link" to="/account">Back to account <Icon name="arrowRight" size={14} /></Link></div>

        {/* ── Profile Picture ── */}
        <div className="profile-avatar-row">
          <div className="profile-avatar" onClick={() => avatarInputRef.current?.click()} title="Change photo">
            {avatarPreview
              ? <img src={avatarPreview} alt="Profile" className="profile-avatar__img" />
              : <span className="profile-avatar__initials">{initials}</span>
            }
            <span className="profile-avatar__overlay">
              {uploading ? <Icon name="loader" size={18} /> : <Icon name="camera" size={18} />}
            </span>
          </div>
          <div className="profile-avatar-info">
            <p className="profile-avatar-info__title">Profile photo</p>
            <p className="profile-avatar-info__hint">Click your avatar to upload a new photo. JPEG, PNG or WebP · max 5 MB.</p>
            <button type="button" className="acct-link" onClick={() => avatarInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Change photo'}
            </button>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>

        <div className="form-grid">
          <label className="field"><span className="field-label">Full name</span><input className="input" value={form.name} onChange={set('name')} required /></label>
          <label className="field"><span className="field-label">Email address</span><input className="input" type="email" value={form.email} onChange={set('email')} required /></label>
          <label className="field"><span className="field-label">Phone</span><input className="input" pattern="^(?=(?:\D*\d){11,15}\D*$)[\d\s.+\-\/]*$" title="Phone number must contain 11 to 15 digits" value={form.phone} onChange={set('phone')} placeholder="+65 …" /></label>
          <label className="field"><span className="field-label">Country of residence</span><input className="input" value={form.country} onChange={set('country')} placeholder="Country" /></label>
        </div>
        <label className="field profile-form__prefs"><span className="field-label">Stay preferences <span className="field-optional">optional</span></span><input className="input" value={form.preferences} onChange={set('preferences')} placeholder="e.g. High floor, Feather-free pillows" /><small>Separate preferences with commas.</small></label>
        <div className="profile-form__foot">{saved && <span className="profile-form__saved"><Icon name="circleCheck" size={16} /> Saved</span>}<button className="btn" type="submit"><Icon name="check" size={16} /> Save profile</button></div>
      </form></Reveal>
    </div></section>
  </div>;
}

