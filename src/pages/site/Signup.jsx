import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '../../components/common/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { img } from '../../lib/images.js';
import './Login.css';

export default function Signup() {
  const { signup } = useAuth();
  const { notify } = useData();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(''); };

  const submit = (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Please choose a password of at least 6 characters.');
    if (form.password !== form.confirm) return setError('Those passwords do not match.');
    const res = signup({ name: form.name, email: form.email, password: form.password });
    if (res.ok) {
      notify(`Welcome, ${res.user.name.split(' ')[0]} — your account is ready.`);
      navigate('/', { replace: true });
    } else {
      setError(res.error || 'We could not create your account.');
    }
  };

  return (
    <div className="login">
      {/* Visual side */}
      <div className="login__visual grain">
        <div
          className="login__bg"
          style={{ backgroundImage: `url(${img.suiteView(1400, 70)})` }}
        />
        <div className="login__scrim" />
        <motion.div
          className="login__visual-inner"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/" className="login__brand">LuxuryStay</Link>
          <div className="login__visual-copy">
            <p className="eyebrow" style={{ color: 'var(--brass-bright)' }}>Guest Membership</p>
            <h1 className="login__headline">Begin your <span className="serif-italic">stay with us.</span></h1>
            <p className="login__sub">Create an account to reserve suites, manage your bookings, and receive the small courtesies the house is known for.</p>
          </div>
          <Link to="/" className="login__back"><Icon name="arrowLeft" size={15} /> Back to website</Link>
        </motion.div>
      </div>

      {/* Form side */}
      <div className="login__form-side">
        <motion.div
          className="login__form-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="login__title">Create your account</h2>
          <p className="text-muted">Join LuxuryStay — it only takes a moment.</p>

          <form onSubmit={submit} className="login__form">
            <label className="field">
              <span className="field-label">Full name</span>
              <input className="input" type="text" required autoComplete="name"
                value={form.name} onChange={set('name')} placeholder="Jane Doe" />
            </label>
            <label className="field">
              <span className="field-label">Email</span>
              <input className="input" type="email" required autoComplete="email"
                value={form.email} onChange={set('email')} placeholder="you@email.com" />
            </label>
            <label className="field">
              <span className="field-label">Password</span>
              <div className="login__password">
                <input className="input" type={show ? 'text' : 'password'} required autoComplete="new-password"
                  value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
                <button type="button" className="login__peek" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                  <Icon name="eye" size={16} />
                </button>
              </div>
            </label>
            <label className="field">
              <span className="field-label">Confirm password</span>
              <input className="input" type={show ? 'text' : 'password'} required autoComplete="new-password"
                value={form.confirm} onChange={set('confirm')} placeholder="Re-enter your password" />
            </label>

            {error && (
              <motion.p className="login__error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                <Icon name="info" size={15} /> {error}
              </motion.p>
            )}

            <button className="btn btn--block" type="submit">Create account <Icon name="arrowRight" size={16} /></button>
          </form>

          <p className="login__alt">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
