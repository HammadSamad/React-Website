import { useMemo, useState } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import './Notifications.css';

function timeAgo(ts) {
  const minutes = Math.round((Date.now() - ts) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useData();
  const [filter, setFilter] = useState('all');
  const staffNotifications = useMemo(() => notifications.filter((n) => n.audience === 'staff' || !n.audience), [notifications]);
  const shown = staffNotifications.filter((n) => filter === 'all' || (filter === 'unread' ? !n.read : n.kind === filter));
  const unread = staffNotifications.filter((n) => !n.read).length;
  const types = [...new Set(staffNotifications.map((n) => n.kind))];

  return (
    <>
      <DashHeader title="Notifications" subtitle="Booking, operations, and guest activity across the property.">
        {staffNotifications.length > 0 && <button className="btn btn--outline btn--sm" onClick={() => clearNotifications('staff')}><Icon name="trash" size={15} /> Clear all</button>}
        {unread > 0 && <button className="btn btn--sm" onClick={() => markAllNotificationsRead('staff')}><Icon name="check" size={15} /> Mark all read</button>}
      </DashHeader>

      <div className="dash-toolbar">
        <div className="seg" aria-label="Notification filter">
          <button className={`seg__btn ${filter === 'all' ? 'is-active' : ''}`} onClick={() => setFilter('all')}>All <span className="seg__count">{staffNotifications.length}</span></button>
          <button className={`seg__btn ${filter === 'unread' ? 'is-active' : ''}`} onClick={() => setFilter('unread')}>Unread <span className="seg__count">{unread}</span></button>
          {types.map((type) => <button key={type} className={`seg__btn ${filter === type ? 'is-active' : ''}`} onClick={() => setFilter(type)}>{type}</button>)}
        </div>
      </div>

      <section className="panel panel--flush notification-page-list">
        {shown.length === 0 ? <div className="dash-empty"><Icon name="bell" size={34} /><p>No notifications in this view.</p></div> : shown.map((n) => (
          <button key={n.id} className={`notification-page-item ${n.read ? '' : 'is-unread'}`} onClick={() => markNotificationRead(n.id)}>
            <span className="notification-page-item__icon"><Icon name={n.icon || 'bell'} size={19} /></span>
            <span className="notification-page-item__body"><strong>{n.title}</strong>{n.body && <span>{n.body}</span>}</span>
            <time>{timeAgo(n.ts)}</time>
            {!n.read && <span className="notification-page-item__dot" aria-label="Unread" />}
          </button>
        ))}
      </section>
    </>
  );
}
