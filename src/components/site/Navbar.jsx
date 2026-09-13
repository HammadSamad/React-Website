import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from '../common/Logo.jsx';
import Icon from '../common/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const links = [
  { to: '/rooms', label: 'Suites' },
  { to: '/experiences', label: 'Experiences' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/about', label: 'Our Story' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar({ solid = false }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAuthed, user } = useAuth();
  const account = user?.role === 'guest' ? '/account' : '/dashboard';

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Close mobile menu whenever route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className={`nav ${scrolled || solid ? 'nav--solid' : ''}`}>
      <div className="nav__inner container container--wide">

        {/* Logo */}
        <div className="nav__logo">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <nav className="nav__links" aria-label="Primary navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav__link link-underline ${
                  isActive ? 'is-active' : ''
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="nav__actions">

          {/* Staff Portal / account */}
          {isAuthed ? (
            <Link
              to={account}
              className="nav__portal link-underline"
            >
              <Icon name={user.role === 'guest' ? 'users' : 'dashboard'} size={16} />
              <span>{user.role === 'guest' ? (user.name?.split(' ')[0] || 'My account') : 'Console'}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="nav__portal link-underline"
            >
              <Icon name="key" size={16} />
              <span>Staff Portal</span>
            </Link>
          )}

          {/* Reserve */}
          <Link
            to="/booking"
            className="btn btn--sm nav__reserve"
          >
            Reserve
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="nav__burger"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            <Icon
              name={open ? 'close' : 'menu'}
              size={24}
            />
          </button>

        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-navigation"
            className="nav__mobile grain"
            initial={{
              opacity: 0,
              clipPath: 'inset(0 0 100% 0)',
            }}
            animate={{
              opacity: 1,
              clipPath: 'inset(0 0 0% 0)',
            }}
            exit={{
              opacity: 0,
              clipPath: 'inset(0 0 100% 0)',
            }}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <nav
              className="nav__mobile-links"
              aria-label="Mobile navigation"
            >
              {links.map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={{
                    opacity: 0,
                    y: 30,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.12 + index * 0.06,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    to={link.to}
                    className="nav__mobile-link"
                    onClick={() => setOpen(false)}
                  >
                    <span className="nav__mobile-idx">
                      0{index + 1}
                    </span>

                    <span>{link.label}</span>
                  </Link>
                </motion.div>
              ))}

              <motion.div
                className="nav__mobile-cta"
                initial={{
                  opacity: 0,
                  y: 30,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.12 + links.length * 0.06,
                  duration: 0.5,
                }}
              >
                <Link
                  to="/booking"
                  className="btn btn--block"
                  onClick={() => setOpen(false)}
                >
                  Reserve a Suite
                </Link>

                <Link
                  to={isAuthed ? account : '/login'}
                  className="btn btn--outline btn--block"
                  onClick={() => setOpen(false)}
                >
                  {isAuthed ? (user.role === 'guest' ? 'My account' : 'Management console') : 'Staff Portal'}
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}