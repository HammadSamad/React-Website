import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '../../components/common/Icon.jsx';
import Modal from '../../components/common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { demoAccounts, roleLabels } from '../../data/hotel.js';
import { img } from '../../lib/images.js';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const res = login(email, password);
    if (res.ok) navigate(res.user.role === 'guest' ? '/account' : from, { replace: true });
    else setError(res.error || 'Those credentials were not recognised.');
  };

  const quick = (acc) => {
    setEmail(acc.email);
    setPassword('demo1234');
    setError('');
  };

  return (
    <div className="login">
      {/* Visual side */}
      <div className="login__visual grain">
        <div
          className="login__bg"
          style={{ backgroundImage: `url(${img.lobby(1400, 70)})` }}
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
            <p className="eyebrow" style={{ color: 'var(--brass-bright)' }}>Staff Portal</p>
            <h1 className="login__headline">The house, <span className="serif-italic">behind the scenes.</span></h1>
            <p className="login__sub">One console for reservations, rooms, housekeeping, billing, and the analytics that keep it all in tune.</p>
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
          <h2 className="login__title">Welcome back</h2>
          <p className="text-muted">Sign in to the management console.</p>

          <form onSubmit={submit} className="login__form">
            <label className="field">
              <span className="field-label">Email</span>
              <input className="input" type="email" required autoComplete="username"
                value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="you@luxurystay.com" />
            </label>
            <label className="field">
              <span className="field-label">Password</span>
              <div className="login__password">
                <input className="input" type={show ? 'text' : 'password'} required autoComplete="current-password"
                  value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="••••••••" />
                <button type="button" className="login__peek" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                  <Icon name="eye" size={16} />
                </button>
              </div>
            </label>

            {error && (
              <motion.p className="login__error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                <Icon name="info" size={15} /> {error}
              </motion.p>
            )}

            <button className="btn btn--block" type="submit">Sign in <Icon name="arrowRight" size={16} /></button>
          </form>

          <button type="button" className="login__forgot" onClick={() => { setResetEmail(email); setSent(false); setForgot(true); }}>
            Forgot your password?
          </button>

          <div className="login__demo">
            <p className="login__demo-label"><span className="rule" style={{ flex: 1 }} /> Demo accounts <span className="rule" style={{ flex: 1 }} /></p>
            <div className="login__demo-grid">
              {demoAccounts.map((a) => (
                <button key={a.email} className="login__demo-btn" onClick={() => quick(a)}>
                  <span className="login__demo-role">{roleLabels[a.role]}</span>
                  <span className="login__demo-email">{a.email}</span>
                </button>
              ))}
            </div>
            <p className="login__hint">Pick an account, then sign in — any password works for the demo.</p>
          </div>

          <p className="login__alt">
            New to LuxuryStay? <Link to="/signup">Create an account</Link>
          </p>
        </motion.div>
      </div>

      <Modal
        open={forgot}
        onClose={() => setForgot(false)}
        title={sent ? 'Check your inbox' : 'Reset your password'}
        subtitle={sent ? undefined : 'We’ll send a secure reset link to your email.'}
        footer={sent
          ? <button className="btn" onClick={() => setForgot(false)}>Done</button>
          : <>
              <button className="btn btn--outline" onClick={() => setForgot(false)}>Cancel</button>
              <button className="btn" disabled={!/\S+@\S+\.\S+/.test(resetEmail)} onClick={() => setSent(true)}>Send reset link</button>
            </>}
      >
        {sent ? (
          <p className="text-muted" style={{ lineHeight: 1.7 }}>
            If an account exists for <strong style={{ color: 'var(--ink-text)' }}>{resetEmail}</strong>, a link to
            reset your password is on its way. It expires in 30 minutes.
          </p>
        ) : (
          <label className="field">
            <span className="field-label">Email</span>
            <input className="input" type="email" autoComplete="username" value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)} placeholder="you@email.com" />
          </label>
        )}
      </Modal>
    </div>
  );
}
