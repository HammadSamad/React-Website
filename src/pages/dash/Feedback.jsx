import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import { useData } from '../../context/DataContext.jsx';
import { guestById } from '../../data/hotel.js';
import './Feedback.css';

const initials = (n = '') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const fmt = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

function Stars({ rating, size = 14 }) {
  return (
    <span className="stars" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="star" size={size} style={{ color: i < rating ? 'var(--brass)' : 'var(--forest-2)' }} />
      ))}
    </span>
  );
}

export default function FeedbackPage() {
  const { feedback, replyFeedback, toggleFeedbackResolved } = useData();
  const [rating, setRating] = useState('all');
  const [category, setCategory] = useState('all');
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const nameOf = (f) => f.name || guestById[f.guestId]?.name || 'Guest';

  const avg = useMemo(() => (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length || 0), [feedback]);
  const dist = useMemo(() => {
    const d = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const f of feedback) d[f.rating] = (d[f.rating] || 0) + 1;
    return d;
  }, [feedback]);
  const categories = useMemo(() => ['all', ...Array.from(new Set(feedback.map((f) => f.category)))], [feedback]);

  const filtered = useMemo(() => feedback.filter((f) => {
    if (category !== 'all' && f.category !== category) return false;
    if (rating === 'all') return true;
    if (rating === 'low') return f.rating <= 3;
    return f.rating === Number(rating);
  }), [feedback, rating, category]);

  const openReply = (f) => { setReplyText(f.reply || ''); setReplyingId(f.id); };
  const activeReply = replyingId ? feedback.find((f) => f.id === replyingId) : null;
  const sendReply = () => {
    if (!replyText.trim()) return;
    replyFeedback(replyingId, replyText.trim());
    setReplyingId(null);
  };

  return (
    <>
      <DashHeader title="Feedback" subtitle="Guest reviews, ratings, and sentiment." />

      <div className="dash-grid dash-grid--2" style={{ marginBottom: '1.5rem' }}>
        <Reveal as="section" className="panel fb-score">
          <div className="fb-score__num">{avg.toFixed(1)}</div>
          <div className="fb-score__stars"><Stars rating={Math.round(avg)} size={20} /></div>
          <div className="fb-score__sub">Average across {feedback.length} reviews</div>
        </Reveal>

        <Reveal as="section" className="panel" delay={0.08}>
          <div className="panel__head"><div><h2 className="panel__title">Rating distribution</h2></div></div>
          <div className="fb-dist">
            {[5, 4, 3, 2, 1].map((r) => {
              const n = dist[r] || 0;
              const pct = feedback.length ? Math.round((n / feedback.length) * 100) : 0;
              return (
                <div className="fb-dist__row" key={r}>
                  <span className="fb-dist__label">{r} <Icon name="star" size={12} style={{ color: 'var(--brass)' }} /></span>
                  <div className="pbar" style={{ flex: 1 }}><div className="pbar__fill" style={{ width: `${pct}%` }} /></div>
                  <span className="fb-dist__n">{n}</span>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>

      <div className="dash-toolbar">
        <div className="seg">
          {['all', '5', '4', 'low'].map((r) => (
            <button key={r} className={`seg__btn ${rating === r ? 'is-active' : ''}`} onClick={() => setRating(r)}>
              {r === 'all' ? 'All' : r === 'low' ? '≤ 3★' : `${r}★`}
            </button>
          ))}
        </div>
        <div className="fb-cats">
          {categories.map((c) => (
            <button key={c} className={`fb-cat ${category === c ? 'is-on' : ''}`} onClick={() => setCategory(c)}>
              {c === 'all' ? 'All categories' : c}
            </button>
          ))}
        </div>
      </div>

      <div className="fb-grid">
        {filtered.map((f) => (
          <article className={`fb-card ${f.resolved ? 'is-resolved' : ''}`} key={f.id}>
            <div className="fb-card__top">
              <span className="cell-avatar">{initials(nameOf(f))}</span>
              <div className="fb-card__id">
                <div className="fb-card__name">{nameOf(f)}</div>
                <div className="fb-card__meta">{f.room || 'Website'} · {fmt(f.date)}</div>
              </div>
              <span className="fb-card__cat">{f.category}</span>
            </div>
            <Stars rating={f.rating} />
            <p className="fb-card__comment">“{f.comment}”</p>
            {f.reply && (
              <div className="fb-card__reply">
                <span className="fb-card__reply-label"><Icon name="reply" size={13} /> Response sent</span>
                <p>{f.reply}</p>
              </div>
            )}
            <div className="fb-card__actions">
              <button className="btn btn--sm btn--outline" onClick={() => openReply(f)}>
                <Icon name="reply" size={14} /> {f.reply ? 'Edit reply' : 'Reply'}
              </button>
              <button className={`fb-resolve ${f.resolved ? 'is-on' : ''}`} onClick={() => toggleFeedbackResolved(f.id)}>
                <Icon name={f.resolved ? 'circleCheck' : 'check'} size={14} /> {f.resolved ? 'Resolved' : 'Mark resolved'}
              </button>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && <div className="dash-empty"><Icon name="chat" size={30} /><p>No reviews match this filter.</p></div>}

      <Modal
        open={!!activeReply}
        onClose={() => setReplyingId(null)}
        title="Reply to guest"
        subtitle={activeReply ? `${nameOf(activeReply)} · ${activeReply.category}` : ''}
        footer={<>
          <button className="btn btn--outline" onClick={() => setReplyingId(null)}>Cancel</button>
          <button className="btn" onClick={sendReply} disabled={!replyText.trim()}><Icon name="reply" size={15} /> Send reply</button>
        </>}
      >
        {activeReply && (
          <>
            <div className="fb-reply-quote">
              <Stars rating={activeReply.rating} />
              <p>“{activeReply.comment}”</p>
            </div>
            <label className="field">
              <span className="field-label">Your response</span>
              <textarea className="textarea" rows={5} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Thank the guest and address their feedback…" />
            </label>
          </>
        )}
      </Modal>
    </>
  );
}
