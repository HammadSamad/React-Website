import { motion } from 'framer-motion';

/* Per-page header inside the dashboard content area. */
export default function DashHeader({ title, subtitle, children }) {
  return (
    <motion.header
      className="dash-header"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div>
        <h1 className="dash-header__title">{title}</h1>
        {subtitle && <p className="dash-header__sub">{subtitle}</p>}
      </div>
      {children && <div className="dash-header__actions">{children}</div>}
    </motion.header>
  );
}
