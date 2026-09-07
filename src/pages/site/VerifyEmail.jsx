import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/common/Icon.jsx';
import { api } from '../../lib/api.js';
import './Login.css';

export default function VerifyEmail() {
  const [params] = useSearchParams(); const navigate = useNavigate();
  const [email, setEmail] = useState(params.get('email') || ''); const [otp, setOtp] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const verify = async (event) => { event.preventDefault(); try { const result = await api('/auth/verify-email', { method: 'POST', body: { email, otp } }); setMessage(result.message); setTimeout(() => navigate('/login'), 1000); } catch (e) { setError(e.message); } };
  const resend = async () => { try { const result = await api('/auth/resend-verification', { method: 'POST', body: { email } }); setMessage(result.message); setError(''); } catch (e) { setError(e.message); } };
  return <div className="login"><div className="login__form-side" style={{ gridColumn: '1 / -1' }}><div className="login__form-wrap"><Link to="/" className="login__brand" style={{ color: 'var(--ink-text)' }}>LuxuryStay</Link><h1 className="login__title" style={{ marginTop: '2rem' }}>Verify your email</h1><p className="text-muted">Enter the six-digit code sent to your inbox before signing in.</p><form className="login__form" onSubmit={verify}><label className="field"><span className="field-label">Email</span><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label className="field"><span className="field-label">Verification code</span><input className="input" inputMode="numeric" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="6-digit code" required /></label>{error && <p className="login__error"><Icon name="info" size={15} /> {error}</p>}{message && <p className="profile-form__saved"><Icon name="circleCheck" size={16} /> {message}</p>}<button className="btn btn--block" disabled={!/^\d{6}$/.test(otp)}>Verify email <Icon name="check" size={16} /></button></form><button className="login__forgot" onClick={resend} disabled={!email}>Send a new code</button><p className="login__alt"><Link to="/login">Back to sign in</Link></p></div></div></div>;
}
