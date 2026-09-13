import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PageHero from '../../components/site/PageHero.jsx';
import SmartImage from '../../components/common/SmartImage.jsx';
import Icon from '../../components/common/Icon.jsx';
import { galleryImages, img } from '../../lib/images.js';
export default function Gallery() {
  const [open, setOpen] = useState(null); // index or null

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (dir) => setOpen((i) => (i === null ? i : (i + dir + galleryImages.length) % galleryImages.length)),
    []
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close, step]);

  return (
    <div className="gallery-page">
      <PageHero
        eyebrow="A Portrait"
        title="Gallery"
        lead="Light, water, and green — a look inside the conservatory and the rooms that surround it."
        image={img.lobby(1920, 72)}
        crumbs={[{ label: 'Gallery' }]}
      />

      <section className="section on-light">
        <div className="container container--wide">
          <div className="gallery-grid">
            {galleryImages.map((g, i) => (
              <motion.button
                key={i}
                className="gallery-item"
                onClick={() => setOpen(i)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.6, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                aria-label={`Open image ${i + 1}`}
              >
                <SmartImage src={g(700, 66)} alt="" label="LuxuryStay" imgClassName="img-zoom" />
                <span className="gallery-item__view"><Icon name="plus" size={18} /></span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
          >
            <button className="lightbox__close" onClick={close} aria-label="Close"><Icon name="close" size={22} /></button>
            <button className="lightbox__nav lightbox__nav--prev" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Previous"><Icon name="arrowLeft" size={22} /></button>
            <motion.div
              className="lightbox__stage"
              key={open}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={galleryImages[open](1600, 78)} alt={`Gallery image ${open + 1}`} />
              <span className="lightbox__count">{String(open + 1).padStart(2, '0')} / {String(galleryImages.length).padStart(2, '0')}</span>
            </motion.div>
            <button className="lightbox__nav lightbox__nav--next" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Next"><Icon name="arrowRight" size={22} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
