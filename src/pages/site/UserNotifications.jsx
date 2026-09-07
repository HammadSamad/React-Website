import { Link } from 'react-router-dom';
import PageHero from '../../components/site/PageHero.jsx';
import Reveal from '../../components/common/Reveal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { img } from '../../lib/images.js';
import './Account.css';

const ago = (ts) => {
  const minutes = Math.round((Date.now() - ts) / 60000);
  return minutes < 1 ? 'Just now' : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.round(minutes / 60)}h ago` : `${Math.round(minutes / 1440)}d ago`;
};

export default function UserNotifications() {
  const { user } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useData();
  const audience = `guest:${user?.email?.toLowerCase()}`;
  const mine = notifications.filter((notice) => notice.audience === audience);
  const unread = mine.filter((notice) => !notice.read).length;
  return <div className="account-page">
    <PageHero eyebrow="Your account" title="Notifications" lead="Updates about your reservations and your LuxuryStay account." crumbs={[{ label: 'My account', to: '/account' }, { label: 'Notifications' }]} image={img.lobby(1600, 60)} />
    <section className="section on-light"><div className="container container--narrow">
      <Reveal><div className="acct-card user-notifications">
        <div className="acct-block__head"><div><h2 className="acct-h2">Your updates</h2><p className="profile-form__sub">{unread ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'You are all caught up.'}</p></div><div className="user-notifications__actions">{unread > 0 && <button className="acct-link" onClick={() => markAllNotificationsRead(audience)}>Mark all read</button>}{mine.length > 0 && <button className="acct-link" onClick={() => clearNotifications(audience)}>Clear</button>}<Link className="acct-link" to="/account">Account</Link></div></div>
        {mine.length === 0 ? <div className="acct-empty"><Icon name="bell" size={30} /><p>There are no notifications yet. Reservation updates will appear here.</p></div> : <div className="user-notification-list">{mine.map((notice) => <button key={notice.id} onClick={() => markNotificationRead(notice.id)} className={`user-notification ${notice.read ? '' : 'is-unread'}`}><span className="acct-req__icon"><Icon name={notice.icon || 'bell'} size={17} /></span><span><strong>{notice.title}</strong>{notice.body && <small>{notice.body}</small>}</span><time>{ago(notice.ts)}</time>{!notice.read && <i />}</button>)}</div>}
      </div></Reveal>
    </div></section>
  </div>;
}
