import { useMemo, useState } from 'react';
import PageHero from '../../components/site/PageHero.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Stars from '../../components/common/Stars.jsx';
import Icon from '../../components/common/Icon.jsx';
import Select from '../../components/common/Select.jsx';
import { useData } from '../../context/DataContext.jsx';
import { testimonials } from '../../data/hotel.js';
const CATEGORIES = ['Overall', 'Service', 'Room', 'Dining', 'Spa', 'Amenities'];
const initials = (n = '') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const fmt = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};
const BLANK = { rating: 5, name: '', category: 'Overall', comment: '' };

export default function Reviews() {
  const { feedback, addFeedback } = useData();
  const [form, setForm] = useState(BLANK);
  const [hover, setHover] = useState(0);
  const [sent, setSent] = useState(false);

  const nameOf = (f) => f.guestId?.guestName || f.name || 'Guest';

  const total = feedback.length;
  const avg = useMemo(() => (total ? feedback.reduce((s, f) => s + f.rating, 0) / total : 0), [feedback, total]);
  const dist = useMemo(() => {
    const d = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const f of feedback) d[f.rating] = (d[f.rating] || 0) + 1;
    return d;
  }, [feedback]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.comment.trim()) return;
    addFeedback({
      rating: form.rating,
      feedbackMessage: form.comment.trim(),
      category: form.category,
    });
    setForm(BLANK);
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="reviews-page">
      <PageHero
        eyebrow="Guest Voices"
        title="Reviews"
        lead="The measure of a house is how its guests remember it. Here is what ours say — unedited — alongside an invitation to share your own stay."
        crumbs={[{ label: 'Reviews' }]}
      />

      {/* Summary + editorial testimonials */}
      <section className="section on-light">
        <div className="container container--wide">
          <Reveal className="rv-summary">
            <div className="rv-score">
              <span className="rv-score__num">{avg.toFixed(1)}</span>
              <Stars value={Math.round(avg)} size={20} />
              <span className="rv-score__count">Based on {total} guest {total === 1 ? 'review' : 'reviews'}</span>
            </div>
            <div className="rv-dist">
              {[5, 4, 3, 2, 1].map((r) => {
                const n = dist[r] || 0;
                const pct = total ? Math.round((n / total) * 100) : 0;
                return (
                  <div className="rv-dist__row" key={r}>
                    <span className="rv-dist__label">{r} <Icon name="star" size={12} style={{ color: 'var(--brass)' }} /></span>
                    <div className="rv-bar"><div className="rv-bar__fill" style={{ width: `${pct}%` }} /></div>
                    <span className="rv-dist__n">{n}</span>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal className="sec-head sec-head--center" style={{ margin: '4.5rem 0 3rem' }}>
            <p className="eyebrow eyebrow--muted"><span className="rule" style={{ width: 40 }} /> In their words</p>
            <h2 className="sec-head__title">Guests who return</h2>
          </Reveal>
          <div className="tst-grid">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1} className="tst-card">
                <Stars value={t.rating} />
                <p className="tst-card__quote">“{t.quote}”</p>
                <div className="tst-card__by">
                  <span className="tst-card__name">{t.name}</span>
                  <span className="tst-card__role">{t.role}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Live reviews wall + submission form */}
      <section className="section rv-wall">
        <div className="container container--wide on-dark">
          <div className="rv-wall-grid">
            <div className="rv-wall-main">
              <Reveal className="sec-head" style={{ marginBottom: '2.5rem' }}>
                <p className="eyebrow"><span className="rule" style={{ width: 40 }} /> Recent stays</p>
                <h2 className="sec-head__title">What guests are saying</h2>
              </Reveal>
              <div className="rv-list">
                {feedback.slice(0, 9).map((f, i) => (
                  <Reveal as="article" className="rv-card" key={f._id || f.id} delay={(i % 3) * 0.08}>
                    <div className="rv-card__top">
                      <span className="rv-card__avatar">{initials(nameOf(f))}</span>
                      <div className="rv-card__id">
                        <div className="rv-card__name">{nameOf(f)}</div>
                        <div className="rv-card__meta">{f.category || 'Overall'} · {fmt((f.feedbackDate || '').split('T')[0])}</div>
                      </div>
                    </div>
                    <Stars value={f.rating} size={13} />
                    <p className="rv-card__comment">“{f.feedbackMessage}”</p>
                  </Reveal>
                ))}
              </div>
            </div>

            <aside className="rv-form-card">
              <h3 className="rv-form-card__title">Share your experience</h3>
              <p className="rv-form-card__sub">Recently stayed with us? We would love to hear how it went.</p>
              <form onSubmit={submit} className="rv-form">
                <div className="field">
                  <span className="field-label">Your rating</span>
                  <div className="rv-stars-pick" role="radiogroup" aria-label="Your rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        type="button"
                        key={n}
                        className="rv-stars-pick__btn"
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        aria-checked={form.rating === n}
                        role="radio"
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setForm((f) => ({ ...f, rating: n }))}
                      >
                        <Icon name="star" size={26} style={{ color: (hover || form.rating) >= n ? 'var(--brass)' : 'var(--forest-line-2)' }} />
                      </button>
                    ))}
                  </div>
                </div>
                <label className="field">
                  <span className="field-label">Name</span>
                  <input className="input" value={form.name} onChange={set('name')} placeholder="Your name (optional)" />
                </label>
                <label className="field">
                  <span className="field-label">Category</span>
                  <Select
                    variant="dark"
                    label="Category"
                    value={form.category}
                    onChange={set('category')}
                    options={CATEGORIES}
                  />
                </label>
                <label className="field">
                  <span className="field-label">Your review</span>
                  <textarea className="textarea" rows={4} required value={form.comment} onChange={set('comment')} placeholder="Tell us about your stay…" />
                </label>
                <button className="btn btn--block" type="submit" disabled={sent}>
                  {sent ? (<><Icon name="check" size={16} /> Thank you</>) : (<>Submit review <Icon name="arrowRight" size={16} /></>)}
                </button>
              </form>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
