import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Route changes must jump to the top INSTANTLY. `html { scroll-behavior:
    // smooth }` would otherwise turn a scrollTo() into a slow animation that
    // races with the landing page's own scroll logic (e.g. the billing
    // `?invoice=` deep-link), leaving the new page at the wrong scroll offset.
    const root = document.scrollingElement || document.documentElement;
    try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch { /* older engines: direct assignment is always instant */ }
    if (root.scrollTop !== 0) root.scrollTop = 0;
  }, [pathname]);
  return null;
}

export default function SiteLayout() {
  const { pathname } = useLocation();
  // Immersive full-screen flows carry their own brand + back-to-site link,
  // so the fixed site chrome is hidden on them (it would otherwise blend
  // into their light backgrounds and sit unreadable over their headers).
  const bare = ['/login', '/signup'].includes(pathname);
  // The booking flow is a light checkout page — render it instantly (no
  // opacity fade) so it doesn't blink on open, and keep a solid navbar on top.
  const instant = pathname === '/booking';
  return (
    <>
      <ScrollToTop />
      {!bare && <Navbar solid={instant} />}
      <main>
        {instant ? (
          <Outlet />
        ) : (
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        )}
      </main>
      {!bare && <Footer />}
    </>
  );
}
