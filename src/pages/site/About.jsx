import PageHero from '../../components/site/PageHero.jsx';
import SmartImage from '../../components/common/SmartImage.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import CountUp from '../../components/common/CountUp.jsx';
import Icon from '../../components/common/Icon.jsx';
import { hotelInfo } from '../../data/hotel.js';
import { img } from '../../lib/images.js';
const values = [
  { icon: 'leaf', title: 'Quiet luxury', text: 'We believe true luxury is calm — space to breathe, details that never shout, service you feel rather than see.' },
  { icon: 'sparkles', title: 'Craft in everything', text: 'From the turndown ritual to the garden menu, each touchpoint is composed by hand and considered twice.' },
  { icon: 'users', title: 'Hospitality as memory', text: 'We keep what matters to you — your tea, your floor, your name — so every return feels like coming home.' },
  { icon: 'waves', title: 'Rooted in place', text: 'A conservatory in the heart of the city: botanical, tropical, and unmistakably of Singapore.' },
];

const timeline = [
  { year: '1926', text: 'The founding Conservatory House opens on Marine Quarter as a botanical retreat for travellers.' },
  { year: '1971', text: 'The Lagoon and Palm Court are added, establishing the resort-in-the-city that defines us today.' },
  { year: '1998', text: 'A landmark restoration reintroduces the original glasshouse and the Fern & Brass dining room.' },
  { year: '2019', text: 'LuxuryStay Hospitality expands across the region while keeping each property singular.' },
  { year: 'Today', text: `${hotelInfo.properties} properties, ${hotelInfo.awards} international awards, and one enduring idea — the art of the unhurried stay.` },
];

export default function About() {
  return (
    <div className="about-page">
      <PageHero
        eyebrow="Est. 1926"
        title="Our Story"
        lead="For nearly a century, LuxuryStay has practised a single craft — hospitality that feels effortless, in a garden that feels endless."
        image={img.exterior(1920, 72)}
        crumbs={[{ label: 'Our Story' }]}
      />

      {/* Intro */}
      <section className="section on-light">
        <div className="container container--wide about-intro">
          <Reveal className="about-intro__text">
            <p className="eyebrow"><span className="rule" style={{ width: 40 }} /> The house</p>
            <h2 className="about-intro__title">A conservatory that learned to keep guests.</h2>
            <p className="lead">
              What began in {hotelInfo.established} as a glasshouse of rare botanicals has become one of the region's most quietly revered addresses. We never set out to be the largest hotel — only the one you think of first when you want to disappear well.
            </p>
            <p className="text-muted" style={{ marginTop: '1.25rem' }}>
              Today the {hotelInfo.name} name spans {hotelInfo.properties} properties, yet the philosophy is unchanged from the first: a green sanctuary, an unhurried welcome, and a standard held so consistently it feels like instinct.
            </p>
          </Reveal>
          <Reveal className="about-intro__media" delay={0.1}>
            <SmartImage src={img.lounge(900, 74)} alt="The Orangery lounge" ratio="4 / 5" label="LuxuryStay" />
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="about-stats">
        <div className="container container--wide about-stats__grid">
          {[
            { end: 2026 - hotelInfo.established, suffix: '', label: 'Years of hospitality' },
            { end: hotelInfo.properties, suffix: '', label: 'Properties worldwide' },
            { end: hotelInfo.awards, suffix: '', label: 'International awards' },
            { end: 4.8, decimals: 1, suffix: '', label: 'Guest satisfaction' },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="about-stat">
              <span className="about-stat__num"><CountUp value={s.end} decimals={s.decimals || 0} suffix={s.suffix} /></span>
              <span className="about-stat__label">{s.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="section on-light">
        <div className="container container--wide">
          <Reveal className="text-center" style={{ maxWidth: 640, margin: '0 auto 3.5rem' }}>
            <p className="eyebrow" style={{ justifyContent: 'center' }}><span className="rule" style={{ width: 40 }} /> What we hold to</p>
            <h2 className="about-h2">Four beliefs, kept quietly.</h2>
          </Reveal>
          <div className="about-values">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={(i % 2) * 0.08} className="about-value">
                <span className="about-value__icon"><Icon name={v.icon} size={24} /></span>
                <h3 className="about-value__title">{v.title}</h3>
                <p className="text-muted">{v.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section about-timeline-sec">
        <div className="container">
          <Reveal className="text-center" style={{ marginBottom: '4rem' }}>
            <p className="eyebrow" style={{ justifyContent: 'center' }}><span className="rule" style={{ width: 40 }} /> A century, briefly</p>
            <h2 className="about-h2" style={{ color: 'var(--bone)' }}>The long view.</h2>
          </Reveal>
          <div className="about-timeline">
            {timeline.map((t, i) => (
              <Reveal key={t.year} delay={i * 0.06} className="about-tl-item">
                <span className="about-tl-year">{t.year}</span>
                <span className="about-tl-dot" />
                <p className="about-tl-text">{t.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
