import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
export default function NotFound() {
  return (
    <section className="notfound on-light">
      <div className="container">
        <motion.div
          className="notfound__inner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="notfound__num">404</span>
          <span className="eyebrow">Off the garden path</span>
          <h1 className="notfound__title">This page has wandered off.</h1>
          <p className="notfound__lead">
            The page you’re looking for may have been moved or never existed. Let us guide you back to more familiar surroundings.
          </p>
          <div className="notfound__actions">
            <Link to="/" className="btn">Return home</Link>
            <Link to="/rooms" className="btn btn--outline">Browse rooms</Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
