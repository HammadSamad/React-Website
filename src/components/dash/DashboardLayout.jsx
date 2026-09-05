import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../common/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { TODAY } from '../../data/hotel.js';
import '../../styles/dashboard.css';

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: 'dashboard', end: true },
  { to: '/dashboard/reservations', label: 'Reservations', icon: 'calendar', roles: ['admin', 'manager', 'receptionist'] },
  { to: '/dashboard/rooms', label: 'Rooms', icon: 'door' },
  { to: '/dashboard/guests', label: 'Guests', icon: 'users', roles: ['admin', 'manager', 'receptionist'] },
  { to: '/dashboard/housekeeping', label: 'Housekeeping', icon: 'broom', roles: ['admin', 'manager', 'housekeeping', 'maintenance'] },
  { to: '/dashboard/services', label: 'Services', icon: 'sparkles', roles: ['admin', 'manager', 'receptionist', 'housekeeping'] },
  { to: '/dashboard/billing', label: 'Billing', icon: 'receipt', roles: ['admin', 'manager', 'receptionist'] },
  { to: '/dashboard/feedback', label: 'Feedback', icon: 'chat', roles: ['admin', 'manager'] },
  { to: '/dashboard/reports', label: 'Reports', icon: 'chart', roles: ['admin', 'manager'] },
  { to: '/dashboard/staff', label: 'Staff', icon: 'shield', roles: ['admin', 'manager'] },
  { to: '/dashboard/settings', label: 'System', icon: 'settings', roles: ['admin'] },
];

const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};
const longDate = new Date(TODAY + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function timeAgo(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setOpen(false);
    setNotifOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  // Close the notifications panel on outside-click / Escape.
  useEffect(() => {
    if (!notifOpen) return;
    const onDown = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setNotifOpen(false); };
    const onKey = (e) => e.key === 'Escape' && setNotifOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey); };
  }, [notifOpen]);

  const links = NAV.filter((n) => !n.roles || n.roles.includes(user?.role));

  const doLogout = () => { logout(); navigate('/'); };

  const Sidebar = (
    <>
      <div className="dash-side__head">
        <Link to="/dashboard" className="dash-side__brand">
          LuxuryStay <span>Console</span>
        </Link>
      </div>
      <nav className="dash-nav">
        {links.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `dash-nav__link ${isActive ? 'is-active' : ''}`}>
            <Icon name={n.icon} size={18} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="dash-side__foot">
        <div className="dash-user">
          <span className="dash-user__avatar">{initials(user?.name)}</span>
          <div className="dash-user__meta">
            <span className="dash-user__name">{user?.name}</span>
            <span className="dash-user__role">{user?.roleLabel}</span>
          </div>
        </div>
        <button className="dash-logout" onClick={doLogout} aria-label="Sign out"><Icon name="logout" size={18} /></button>
      </div>
    </>
  );

  return (
    <div className="dash">
      {/* Desktop sidebar */}
      <aside className="dash-side">{Sidebar}</aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="dash-side__overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="dash-side dash-side--mobile"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {Sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="dash-main">
        <header className="dash-top">
          <button className="dash-top__burger" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" size={20} /></button>
          <div className="dash-top__greet">
            <span className="dash-top__hi">{greeting()}, {user?.name?.split(' ')[0]}</span>
            <span className="dash-top__date">{longDate}</span>
          </div>
          <div className="dash-top__actions">
            <Link to="/" className="dash-top__site"><Icon name="arrowUpRight" size={15} /> View website</Link>
            <div className="dash-bell" ref={bellRef}>
              <button className="dash-top__bell" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications" aria-expanded={notifOpen}>
                <Icon name="bell" size={18} />
                {unread > 0 && <span className="dash-top__badge" />}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    className="notif-panel"
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    role="dialog"
                    aria-label="Notifications"
                  >
                    <div className="notif-panel__head">
                      <div>
                        <h3 className="notif-panel__title">Notifications</h3>
                        <span className="notif-panel__sub">{unread > 0 ? `${unread} unread` : 'All caught up'}</span>
                      </div>
                      {unread > 0 && (
                        <button className="notif-panel__action" onClick={markAllNotificationsRead}>Mark all read</button>
                      )}
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 && (
                        <div className="notif-empty"><Icon name="bell" size={24} /><p>No notifications yet.</p></div>
                      )}
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          className={`notif-item ${n.read ? '' : 'is-unread'}`}
                          onClick={() => markNotificationRead(n.id)}
                        >
                          <span className="notif-item__icon"><Icon name={n.icon || 'bell'} size={16} /></span>
                          <span className="notif-item__main">
                            <span className="notif-item__title">{n.title}</span>
                            {n.body && <span className="notif-item__body">{n.body}</span>}
                            <span className="notif-item__time">{timeAgo(n.ts)}</span>
                          </span>
                          {!n.read && <span className="notif-item__dot" />}
                        </button>
                      ))}
                    </div>
                    {notifications.length > 0 && (
                      <div className="notif-panel__foot">
                        <button className="notif-panel__action" onClick={clearNotifications}>Clear all</button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <main className="dash-content">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
