import PageHero from '../../components/site/PageHero.jsx';
import SmartImage from '../../components/common/SmartImage.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { experiences } from '../../data/hotel.js';
import { img } from '../../lib/images.js';
const iconFor = { spa: 'sparkles', pool: 'waves', dining: 'dining', bar: 'glass', fitness: 'fitness', events: 'award' };

export default function Experiences() {
  return (
    <div className="exp-page">
      <PageHero
        eyebrow="Beyond the Room"
        title="Experiences"
        lead="A day at LuxuryStay unfolds at its own pace — from a dawn swim in the lagoon to a nightcap beneath the atrium palms. Six worlds, one address."
        image={img.spa1(1920, 72)}
        crumbs={[{ label: 'Experiences' }]}
      />

      <section className="section on-light">
        <div className="container container--wide">
          <div className="exp-list">
            {experiences.map((e, i) => (
              <Reveal key={e.id} className={`exp-row ${i % 2 ? 'exp-row--flip' : ''}`}>
                <div className="exp-row__media">
                  <SmartImage src={e.image(1100, 72)} alt={e.name} ratio="4 / 3" label={e.name} imgClassName="img-zoom" />
                  <span className="exp-row__index">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="exp-row__body">
                  <span className="eyebrow"><Icon name={iconFor[e.id] || 'leaf'} size={16} /> {e.kicker}</span>
                  <h2 className="exp-row__title">{e.name}</h2>
                  <p className="lead">{e.blurb}</p>
                  <p className="exp-row__hours"><Icon name="clock" size={15} /> {e.hours}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="exp-cta grain">
        <div className="container exp-cta__inner text-center">
          <Reveal>
            <p className="eyebrow" style={{ justifyContent: 'center' }}><span className="rule" style={{ width: 40 }} /> Concierge</p>
            <h2 className="exp-cta__title">Let us compose your stay.</h2>
            <p className="lead" style={{ maxWidth: 620, margin: '1.25rem auto 2.5rem', color: 'rgba(245,239,227,0.82)' }}>
              Our concierge curates each itinerary by hand — spa rituals, private dining, and moments you didn't know to ask for.
            </p>
            <a href="mailto:reservations@luxurystay.com" className="btn btn--light">Speak to the concierge</a>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
