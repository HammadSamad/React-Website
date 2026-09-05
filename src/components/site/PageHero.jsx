import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SmartImage from '../common/SmartImage.jsx';
import Icon from '../common/Icon.jsx';

/* Consistent interior page header. Pass `image` for a media hero,
   omit it for a compact text header on the dark background. */
export default function PageHero({ eyebrow, title, lead, image, crumbs = [], align = 'left' }) {
  const media = !!image;
  return (
    <section className={`page-hero ${media ? 'page-hero--media grain' : ''}`}>
      {media && (
        <>
          <div className="page-hero__bg">
            <SmartImage src={image} alt={title} eager label={title} />
          </div>
          <div className="hero__scrim" />
        </>
      )}
      <div className={`container container--wide page-hero__inner ${align === 'center' ? 'text-center' : ''}`}>
        {crumbs.length > 0 && (
          <nav className="breadcrumb" aria-label="Breadcrumb" style={align === 'center' ? { justifyContent: 'center' } : undefined}>
            <Link to="/">Home</Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-sm">
                <Icon name="chevronRight" size={12} />
                {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
              </span>
            ))}
          </nav>
        )}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={align === 'center' ? { maxWidth: 760, marginInline: 'auto' } : undefined}
        >
          {eyebrow && (
            <p className="eyebrow" style={{ marginBottom: '1.5rem', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
              <span className="rule" style={{ width: 40 }} /> {eyebrow}
            </p>
          )}
          <h1 className="page-hero__title">{title}</h1>
          {lead && <p className="page-hero__lead" style={align === 'center' ? { marginInline: 'auto' } : undefined}>{lead}</p>}
        </motion.div>
      </div>
    </section>
  );
}
