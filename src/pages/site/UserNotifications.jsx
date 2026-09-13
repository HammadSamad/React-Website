import { Link } from 'react-router-dom';
import PageHero from '../../components/site/PageHero.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { img } from '../../lib/images.js';
const ago = (ts) => {
  const d = ts ? new Date(ts) : null;
  if (!d || isNaN(d.getTime())) return '';
  const minutes = Math.round((Date.now() - d.getTime()) / 60000);
  return minutes < 1 ? 'Just now' : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.round(minutes / 60)}h ago` : `${Math.round(minutes / 1440)}d ago`;
};

const notificationIcon = (n) => {
  if (n.icon) return n.icon;
  const map = { booking: 'calendar', maintenance: 'wrench', housekeeping: 'sparkles', service: 'bell', system: 'info', other: 'bell' };
  return map[n.notificationType] || 'bell';
};

export default function UserNotifications() {
  const { user } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useData();
  const userId = user?.id || user?._id;
  const userEmail = (user?.email || '').toLowerCase();
  const mine = notifications.filter((n) => {
    if (userId && n.userId) {
      const nid = typeof n.userId === 'object' ? (n.userId._id || n.userId.id) : n.userId;
      if (nid === userId) return true;
    }
    if (n.audience) return n.audience === `guest:${userEmail}`;
    return false;
  });
  const unread = mine.filter((n) => !(n.isRead ?? n.read)).length;
  return <div className="account-page">
    <PageHero eyebrow="Your account" title="Notifications" lead="Updates about your reservations and your LuxuryStay account." crumbs={[{ label: 'My account', to: '/account' }, { label: 'Notifications' }]} image={img.lobby(1600, 60)} />
    <section className="section on-light"><div className="container container--narrow">
      <Reveal><div className="acct-card user-notifications">
        <div className="acct-block__head"><div><h2 className="acct-h2">Your updates</h2><p className="profile-form__sub">{unread ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'You are all caught up.'}</p></div><div className="user-notifications__actions">{unread > 0 && <button className="acct-link" onClick={() => markAllNotificationsRead()}>Mark all read</button>}{mine.length > 0 && <button className="acct-link" onClick={() => clearNotifications()}>Clear</button>}<Link className="acct-link" to="/account">Account</Link></div></div>
        {mine.length === 0 ? <div className="acct-empty"><Icon name="bell" size={30} /><p>There are no notifications yet. Reservation updates will appear here.</p></div> : <div className="user-notification-list">{mine.map((n) => <button key={n._id || n.id} onClick={() => markNotificationRead(n._id || n.id)} className={`user-notification ${(n.isRead ?? n.read) ? '' : 'is-unread'}`}><span className="acct-req__icon"><Icon name={notificationIcon(n)} size={17} /></span><span><strong>{n.title}</strong>{(n.message || n.text) && <small>{n.message || n.text}</small>}</span><time>{ago(n.notificationDate || n.ts)}</time>{!(n.isRead ?? n.read) && <i />}</button>)}</div>}
      </div></Reveal>
    </div></section>
  </div>;
}
