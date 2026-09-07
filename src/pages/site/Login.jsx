import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '../../components/common/Icon.jsx';
import Modal from '../../components/common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';
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
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    if (res.ok) navigate(res.user.role === 'guest' ? '/account' : from, { replace: true });
    else { setError(res.error || 'Those credentials were not recognised.'); if (res.code === 'EMAIL_NOT_VERIFIED') navigate(`/verify-email?email=${encodeURIComponent(email)}`); }
  };
  const requestReset = async () => { try { await api('/auth/forgot-password', { method: 'POST', body: { email: resetEmail } }); setSent(true); setResetError(''); } catch (e) { setResetError(e.message); } };
  const resetPassword = async () => { try { await api('/auth/reset-password', { method: 'POST', body: { email: resetEmail, otp, password: newPassword } }); setForgot(false); setError('Password reset. You can now sign in.'); } catch (e) { setResetError(e.message); } };

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

          <p className="login__alt">
            New to LuxuryStay? <Link to="/signup">Create an account</Link>
          </p>
        </motion.div>
      </div>

      <Modal
        open={forgot}
        onClose={() => setForgot(false)}
        title={sent ? 'Enter your reset code' : 'Reset your password'}
        subtitle={sent ? 'Use the six-digit code sent to your email.' : 'We’ll send a secure reset code to your email.'}
        footer={sent
          ? <><button className="btn btn--outline" onClick={() => setForgot(false)}>Cancel</button><button className="btn" disabled={!/^\d{6}$/.test(otp) || newPassword.length < 8} onClick={resetPassword}>Reset password</button></>
          : <>
              <button className="btn btn--outline" onClick={() => setForgot(false)}>Cancel</button>
              <button className="btn" disabled={!/\S+@\S+\.\S+/.test(resetEmail)} onClick={requestReset}>Send code</button>
            </>}
      >
        {sent ? (
          <p className="text-muted" style={{ lineHeight: 1.7 }}>
            <label className="field"><span className="field-label">Verification code</span><input className="input" inputMode="numeric" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" /></label>
            <label className="field" style={{ marginTop: '1rem' }}><span className="field-label">New password</span><input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" /></label>
          </p>
        ) : (
          <label className="field">
            <span className="field-label">Email</span>
            <input className="input" type="email" autoComplete="username" value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)} placeholder="you@email.com" />
          </label>
        )}
        {resetError && <p className="login__error" style={{ marginTop: '1rem' }}><Icon name="info" size={15} /> {resetError}</p>}
      </Modal>
    </div>
  );
}
