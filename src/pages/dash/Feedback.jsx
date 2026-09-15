import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import { useData } from '../../context/DataContext.jsx';
import { feedbackApi } from '../../lib/api.js';
const initials = (n = '') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

function Stars({ rating, size = 14 }) {
  const value = Number(rating) || 0;
  return (
    <span className="stars" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="star" size={size} style={{ color: i < value ? 'var(--brass)' : 'var(--forest-2)' }} />
      ))}
    </span>
  );
}

export default function FeedbackPage() {
  const { feedback, setFeedback, guests, notify, refreshAll } = useData();
  const [rating, setRating] = useState('all');
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const guestMap = useMemo(() => Object.fromEntries(guests.map((g) => [g._id || g.id, g.guestName || g.name])), [guests]);
  const nameOf = (f) => {
    if (f.guestName) return f.guestName;
    if (f.guestId?.guestName) return f.guestId.guestName;
    if (f.guestId?.name) return f.guestId.name;
    return guestMap[f.guestId] || 'Guest';
  };

  const rated = useMemo(() => feedback.filter((f) => f.rating), [feedback]);
  const avg = useMemo(() => (rated.length ? rated.reduce((s, f) => s + f.rating, 0) / rated.length : 0), [rated]);
  const dist = useMemo(() => {
    const d = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const f of rated) d[f.rating] = (d[f.rating] || 0) + 1;
    return d;
  }, [rated]);

  const filtered = useMemo(() => feedback.filter((f) => {
    if (rating === 'all') return true;
    if (rating === 'low') return f.rating && f.rating <= 3;
    return f.rating === Number(rating);
  }), [feedback, rating]);

  const openReply = (f) => { setReplyText(f.reply || ''); setReplyingId(f._id || f.id); };
  const activeReply = replyingId ? feedback.find((f) => (f._id || f.id) === replyingId) : null;
  const sendReply = async () => {
    if (!replyText.trim()) return;
    try {
      const replyDate = new Date().toISOString().split('T')[0];
      await feedbackApi.update(replyingId, { reply: replyText.trim(), repliedAt: replyDate });
      refreshAll();
      setReplyingId(null);
      notify('Reply sent');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const toggleResolved = (f) => {
    const fid = f._id || f.id;
    const newStatus = f.feedbackStatus === 'resolved' ? 'new' : 'resolved';
    feedbackApi.update(fid, { feedbackStatus: newStatus }).then(() => {
      refreshAll();
    }).catch(() => {});
  };

  return (
    <>
      <DashHeader title="Feedback" subtitle="Guest reviews, ratings, and sentiment." />

      <div className="dash-grid dash-grid--2" style={{ marginBottom: '1.5rem' }}>
        <Reveal as="section" className="panel fb-score">
          <div className="fb-score__num">{avg.toFixed(1)}</div>
          <div className="fb-score__stars"><Stars rating={Math.round(avg)} size={20} /></div>
          <div className="fb-score__sub">Average across {rated.length} reviews</div>
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
      </div>

      <div className="fb-grid">
        {filtered.map((f) => {
          const isResolved = f.feedbackStatus === 'resolved';
          return (
            <article className={`fb-card ${isResolved ? 'is-resolved' : ''}`} key={f._id || f.id}>
              <div className="fb-card__top">
                <span className="cell-avatar">{initials(nameOf(f))}</span>
                <div className="fb-card__id">
                  <div className="fb-card__name">{nameOf(f)}</div>
                  <div className="fb-card__meta">{f.subject || f.room || 'Website'} · {fmtDate(f.feedbackDate)}</div>
                </div>
                {f.category && <span className="fb-card__cat">{f.category}</span>}
              </div>
              <Stars rating={f.rating} />
              <p className="fb-card__comment">"{f.feedbackMessage}"</p>
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
                <button className={`fb-resolve ${isResolved ? 'is-on' : ''}`} onClick={() => toggleResolved(f)}>
                  <Icon name={isResolved ? 'circleCheck' : 'check'} size={14} /> {isResolved ? 'Resolved' : 'Mark resolved'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="dash-empty"><Icon name="chat" size={30} /><p>No reviews match this filter.</p></div>}

      <Modal
        open={!!activeReply}
        onClose={() => setReplyingId(null)}
        title="Reply to guest"
        subtitle={activeReply ? nameOf(activeReply) : ''}
        footer={<>
          <button className="btn btn--outline" onClick={() => setReplyingId(null)}>Cancel</button>
          <button className="btn" onClick={sendReply} disabled={!replyText.trim()}><Icon name="reply" size={15} /> Send reply</button>
        </>}
      >
        {activeReply && (
          <>
            <div className="fb-reply-quote">
              <Stars rating={activeReply.rating} />
              <p>"{activeReply.feedbackMessage}"</p>
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
