import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);
  return null;
}

export default function SiteLayout() {
  const { pathname } = useLocation();
  // Immersive full-screen flows carry their own brand + back-to-site link,
  // so the fixed site chrome is hidden on them (it would otherwise blend
  // into their light backgrounds and sit unreadable over their headers).
  const bare = ['/login', '/signup', '/booking'].includes(pathname);
  return (
    <>
      <ScrollToTop />
      {!bare && <Navbar />}
      <main>
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
      {!bare && <Footer />}
    </>
  );
}
