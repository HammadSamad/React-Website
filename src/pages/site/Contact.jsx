import { useState } from 'react';
import PageHero from '../../components/site/PageHero.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { hotelInfo } from '../../data/hotel.js';
import './Contact.css';

const details = (info) => [
  { icon: 'mapPin', label: 'Visit', lines: [info.address, `${info.city}`] },
  { icon: 'phone', label: 'Call', lines: [info.phone, 'Concierge · 24 hours'] },
  { icon: 'mail', label: 'Write', lines: [info.email, 'Reply within 24 hours'] },
  { icon: 'clock', label: 'Reception', lines: ['Check-in 15:00', 'Check-out 12:00'] },
];

export default function Contact() {
  const { notify } = useData();
  const [form, setForm] = useState({ name: '', email: '', subject: 'Reservation enquiry', message: '' });
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
    notify('Thank you — your message has reached our concierge.', 'success');
    setForm({ name: '', email: '', subject: 'Reservation enquiry', message: '' });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="contact-page">
      <PageHero
        eyebrow="At Your Service"
        title="Contact"
        lead="Whether you're planning a stay or a celebration, our team is ready. Reach us any hour — we answer quickly, and we answer ourselves."
        crumbs={[{ label: 'Contact' }]}
      />

      <section className="section on-light">
        <div className="container container--wide contact-grid">
          {/* Form */}
          <Reveal className="contact-form-wrap">
            <h2 className="contact-h2">Send a note</h2>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>
              Tell us a little about what you have in mind. A concierge will follow up personally.
            </p>
            <form onSubmit={submit} className="contact-form">
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Full name</span>
                  <input className="input" required value={form.name} onChange={set('name')} placeholder="Your name" />
                </label>
                <label className="field">
                  <span className="field-label">Email</span>
                  <input className="input" type="email" required value={form.email} onChange={set('email')} placeholder="you@email.com" />
                </label>
              </div>
              <label className="field">
                <span className="field-label">Subject</span>
                <select className="select" value={form.subject} onChange={set('subject')}>
                  <option>Reservation enquiry</option>
                  <option>Private event or wedding</option>
                  <option>Dining reservation</option>
                  <option>Press &amp; partnerships</option>
                  <option>Something else</option>
                </select>
              </label>
              <label className="field">
                <span className="field-label">Message</span>
                <textarea className="textarea" rows={5} required value={form.message} onChange={set('message')} placeholder="How can we help?" />
              </label>
              <button className="btn" type="submit" disabled={sent}>
                {sent ? (<><Icon name="check" size={16} /> Message sent</>) : 'Send message'}
              </button>
            </form>
          </Reveal>

          {/* Details */}
          <Reveal className="contact-aside" delay={0.1}>
            <div className="contact-map" aria-hidden="true">
              <div className="contact-map__grid" />
              <span className="contact-map__pin"><Icon name="mapPin" size={20} /></span>
              <span className="contact-map__coords">{hotelInfo.coords}</span>
            </div>
            <ul className="contact-details">
              {details(hotelInfo).map((d) => (
                <li key={d.label} className="contact-detail">
                  <span className="contact-detail__icon"><Icon name={d.icon} size={18} /></span>
                  <div>
                    <span className="contact-detail__label">{d.label}</span>
                    {d.lines.map((l, i) => (
                      <span key={i} className="contact-detail__line">{l}</span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
