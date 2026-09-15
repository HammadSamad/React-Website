import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import {
  analytics,
  serviceTypeById,
  todayISO,
  DEFAULT_ROLE_POLICIES,
} from '../data/hotel.js';
import {
  roomsApi,
  reservationsApi,
  guestsApi,
  staffApi,
  servicesApi,
  feedbackApi,
  housekeepingApi,
  maintenanceApi,
  notificationsApi,
  invoicesApi,
  myBillingApi,
  settingsApi,
} from '../lib/api.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
// withCredentials sends the httpOnly auth cookie on the handshake so the
// server can join staff/guest rooms. We reconnect whenever the identity
// changes so a fresh cookie is presented after login/logout.
const socket = io(API_URL.replace('/api', ''), { autoConnect: false, withCredentials: true });

const notificationIcon = (type = '') => {
  const t = String(type).toLowerCase();
  if (t.includes('reservation') || t.includes('booking')) return 'calendar';
  if (t.includes('housekeeping') || t.includes('cleaning')) return 'broom';
  if (t.includes('maintenance')) return 'wrench';
  if (t.includes('service')) return 'sparkles';
  if (t.includes('feedback') || t.includes('review')) return 'star';
  if (t.includes('payment') || t.includes('invoice')) return 'creditCard';
  return 'bell';
};

// Normalize a notification timestamp to a numeric epoch ms so relative
// "… ago" formatters never receive raw ISO strings.
const toTs = (value) => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value) { const ms = new Date(value).getTime(); if (!Number.isNaN(ms)) return ms; }
  return Date.now();
};
const normalizeNotifications = (list) => (list || []).map((n) => ({ ...n, ts: toTs(n.notificationDate || n.date || n.createdAt || n.ts) }));

const DataContext = createContext(null);

const now = Date.now();

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [housekeeping, setHousekeeping] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [services, setServices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const role = user?.role;
    const isStaffList = role && ['admin', 'manager', 'receptionist'].includes(role);
    const isAdminManager = role && ['admin', 'manager'].includes(role);
    const isHousekeepingScope = role && ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance'].includes(role);
    const isMaintenanceScope = role && ['admin', 'manager', 'receptionist', 'maintenance', 'guest'].includes(role);
    const isReservationScope = role && ['admin', 'manager', 'receptionist', 'guest'].includes(role);
    const isFeedbackScope = role && ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance'].includes(role);
    const guestWithId = role === 'guest' && user.guestId;
    const loadAll = async () => {
      const settle = (p) => p.then((d) => ({ ok: true, data: d })).catch(() => ({ ok: false, data: null }));
      const noop = () => Promise.resolve({ ok: false, data: null });
      const [
        roomsResult,
        reservationsResult,
        guestsResult,
        staffResult,
        invoicesResult,
        housekeepingResult,
        maintenanceResult,
        feedbackResult,
        servicesResult,
        notificationsResult,
      ] = await Promise.all([
        settle(roomsApi.list()),
        isReservationScope ? settle(reservationsApi.list()) : noop(),
        isStaffList ? settle(guestsApi.list()) : noop(),
        isAdminManager ? settle(staffApi.list()) : noop(),
        guestWithId ? settle(myBillingApi.invoices()) : (isStaffList ? settle(invoicesApi.list()) : noop()),
        isHousekeepingScope ? settle(housekeepingApi.list()) : noop(),
        isMaintenanceScope ? settle(maintenanceApi.list()) : noop(),
        isFeedbackScope ? settle(feedbackApi.list()) : noop(),
        role ? settle(servicesApi.list()) : noop(),
        role ? settle(notificationsApi.list()) : noop(),
      ]);

      if (active) {
        if (roomsResult.ok) setRooms(roomsResult.data);
        if (reservationsResult.ok) setReservations(reservationsResult.data);
        if (guestsResult.ok) setGuests(guestsResult.data);
        if (staffResult.ok) setStaff(staffResult.data);
        if (invoicesResult.ok) setInvoices(invoicesResult.data);
        if (housekeepingResult.ok) setHousekeeping(housekeepingResult.data);
        if (maintenanceResult.ok) setMaintenance(maintenanceResult.data);
        if (feedbackResult.ok) setFeedback(feedbackResult.data);
        if (servicesResult.ok) setServices(servicesResult.data);
        if (notificationsResult.ok) setNotifications(normalizeNotifications(notificationsResult.data));
        setLoading(false);
      }
    };
    loadAll();
    return () => { active = false; };
  }, [user?.id, user?.role]);

  const [settings, setSettings] = useState({
    currency: 'USD',
    taxPercentage: 9,
    checkInTime: '15:00',
    checkOutTime: '12:00',
    rates: {},
    policies: {
      cancellation: 'Free cancellation up to 48 hours before arrival.',
      pets: 'Assistance animals welcome; other pets by arrangement.',
      smoking: 'Non-smoking throughout, including all terraces.',
    },
    notifications: { newBooking: true, maintenance: true, lowInventory: false, dailyReport: true },
  });

  const [rolePolicies, setRolePolicies] = useState(() =>
    Object.fromEntries(Object.entries(DEFAULT_ROLE_POLICIES).map(([role, modules]) => [role, { ...modules }]))
  );

  useEffect(() => {
    settingsApi.get().then(data => {
      if (data) setSettings(prev => ({ ...prev, ...data }));
    }).catch(() => {});
  }, []);

  const roleForPolicies = user?.role;
  useEffect(() => {
    if (!roleForPolicies) return;
    settingsApi.getRoles().then((data) => {
      if (data) {
        setRolePolicies((current) => {
          const next = {};
          for (const role of Object.keys(DEFAULT_ROLE_POLICIES)) {
            next[role] = { ...(current[role] || DEFAULT_ROLE_POLICIES[role]), ...(data[role] || {}) };
          }
          return next;
        });
      }
    }).catch(() => {});
  }, [roleForPolicies]);

  const userIdRef = useRef(user?.id || user?._id || null);
  useEffect(() => { userIdRef.current = user?.id || user?._id || null; }, [user]);

  const roleRef = useRef(user?.role || null);
  useEffect(() => { roleRef.current = user?.role || null; }, [user]);

  // Connect with the (possibly refreshed) auth cookie from the browser. Runs
  // again after login/logout so the server can put us in the right rooms.
  const userKey = user?.id || user?._id || 'anon';
  useEffect(() => {
    socket.connect();
    return () => { socket.disconnect(); };
  }, [userKey]);

  useEffect(() => {
    socket.on('room:status-changed', ({ roomId, roomStatus }) => {
      setRooms((rs) => rs.map((r) => (r._id || r.id) === roomId ? { ...r, roomStatus } : r));
    });
    socket.on('notification', (n) => {
      const actor = n.userId?._id || n.userId;
      // A notification may be delivered to a specific user or to every active
      // member of a role. The reader is always the socket's own user, so the
      // audience is derived from the logged-in role rather than the payload.
      const isStaffReader = roleRef.current && roleRef.current !== 'guest';
      pushNotification({
        _id: n._id || `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: n.title || 'Notification',
        body: n.message || n.body || '',
        kind: n.notificationType || 'system',
        read: !!(n.isRead ?? false),
        ts: n.notificationDate ? new Date(n.notificationDate).getTime() : Date.now(),
        icon: notificationIcon(n.notificationType),
        role: n.role || null,
        audience: (isStaffReader || n.role) ? 'staff' : (actor ? 'guest' : 'staff'),
      });
      if (!actor || String(actor) !== String(userIdRef.current || '')) {
        notify(n.title || 'Notification', 'info');
      }
    });
    socket.on('reservation:created', () => {
      refreshAll();
      notify('A new reservation just came in.', 'warn');
    });
    return () => {
      socket.off('room:status-changed');
      socket.off('notification');
      socket.off('reservation:created');
    };
  }, []);

  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const refreshAll = useCallback(async () => {
    const settle = (p) => p.then((d) => ({ ok: true, data: d })).catch(() => ({ ok: false, data: null }));
    const noop = () => Promise.resolve({ ok: false, data: null });
    const { role, guestId } = userRef.current || {};
    const isStaffList = role && ['admin', 'manager', 'receptionist'].includes(role);
    const isAdminManager = role && ['admin', 'manager'].includes(role);
    const isHousekeepingScope = role && ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance'].includes(role);
    const isMaintenanceScope = role && ['admin', 'manager', 'receptionist', 'maintenance', 'guest'].includes(role);
    const isReservationScope = role && ['admin', 'manager', 'receptionist', 'guest'].includes(role);
    const isFeedbackScope = role && ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance'].includes(role);
    const [roomsResult, reservationsResult, guestsResult, staffResult, invoicesResult, housekeepingResult, maintenanceResult, feedbackResult, servicesResult, notificationsResult] = await Promise.all([
      settle(roomsApi.list()),
      isReservationScope ? settle(reservationsApi.list()) : noop(),
      isStaffList ? settle(guestsApi.list()) : noop(),
      isAdminManager ? settle(staffApi.list()) : noop(),
      role === 'guest' && guestId ? settle(myBillingApi.invoices()) : (isStaffList ? settle(invoicesApi.list()) : noop()),
      isHousekeepingScope ? settle(housekeepingApi.list()) : noop(),
      isMaintenanceScope ? settle(maintenanceApi.list()) : noop(),
      isFeedbackScope ? settle(feedbackApi.list()) : noop(),
      role ? settle(servicesApi.list()) : noop(),
      role ? settle(notificationsApi.list()) : noop(),
    ]);
    if (roomsResult.ok) setRooms(roomsResult.data);
    if (reservationsResult.ok) setReservations(reservationsResult.data);
    if (guestsResult.ok) setGuests(guestsResult.data);
    if (staffResult.ok) setStaff(staffResult.data);
    if (invoicesResult.ok) setInvoices(invoicesResult.data);
    if (housekeepingResult.ok) setHousekeeping(housekeepingResult.data);
    if (maintenanceResult.ok) setMaintenance(maintenanceResult.data);
    if (feedbackResult.ok) setFeedback(feedbackResult.data);
    if (servicesResult.ok) setServices(servicesResult.data);
    if (notificationsResult.ok) setNotifications(normalizeNotifications(notificationsResult.data));
  }, []);

  const notify = useCallback((message, kind = 'success') => {
    setToast({ message, kind, id: Date.now() });
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const pushNotification = useCallback((n) => {
    setNotifications((list) => [
      { id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: Date.now(), read: false, audience: 'staff', kind: 'system', icon: 'bell', ...n },
      ...list,
    ].slice(0, 40));
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((list) => list.map((n) => ((n._id || n.id) === id ? { ...n, isRead: true, read: true } : n)));
    } catch (error) {
      setNotifications((list) => list.map((n) => ((n._id || n.id) === id ? { ...n, isRead: true, read: true } : n)));
    }
  }, []);

  const withinAudience = useCallback((n, audience) => {
    if (!audience) return true;
    const aud = String(n.audience ?? '');
    const guestish = aud.startsWith('guest:');
    if (audience === 'guest') return aud === 'guest' || guestish;
    if (audience === 'staff') return aud === '' || aud === 'staff' || (!guestish && aud !== 'guest');
    return true;
  }, []);

  const markAllNotificationsRead = useCallback(async (audience) => {
    const current = notifications;
    const targets = audience ? current.filter((n) => withinAudience(n, audience)) : current;
    const unread = targets.filter((n) => !(n.isRead ?? n.read));
    await Promise.allSettled(unread.map((n) => notificationsApi.markAsRead(n._id || n.id)));
    setNotifications((list) => list.map((n) => (withinAudience(n, audience) ? { ...n, isRead: true, read: true } : n)));
  }, [notifications, withinAudience]);

  const clearNotifications = useCallback(async (audience) => {
    const current = notifications;
    const targets = audience ? current.filter((n) => withinAudience(n, audience)) : current;
    await Promise.allSettled(targets.map((n) => notificationsApi.delete(n._id || n.id)));
    setNotifications((list) => (audience ? list.filter((n) => !withinAudience(n, audience)) : []));
  }, [notifications, withinAudience]);

  const lowAlerted = useRef(false);
  useEffect(() => {
    const occ = rooms.filter((r) => r.roomStatus === 'occupied').length;
    const pct = rooms.length ? Math.round((occ / rooms.length) * 100) : 0;
    if (pct >= 90 && settings.notifications.lowInventory) {
      if (!lowAlerted.current) {
        lowAlerted.current = true;
        pushNotification({ kind: 'system', icon: 'info', title: 'Low availability', body: `Occupancy at ${pct}% — few rooms remain.` });
      }
    } else if (pct < 90) {
      lowAlerted.current = false;
    }
  }, [rooms, settings.notifications.lowInventory, pushNotification]);

  const setRoomStatus = useCallback(async (id, status) => {
    try {
      await roomsApi.updateStatus(id, status);
      setRooms((rs) =>
        rs.map((r) =>
          (r._id || r.id) === id
            ? { ...r, roomStatus: status, housekeeping: status === 'cleaning' ? 'in-progress' : r.housekeeping }
            : r
        )
      );
      notify(`Room ${id} marked ${status}.`);
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const cancelReservation = useCallback(async (id) => {
    try {
      const result = await reservationsApi.cancel(id, 'Cancelled by staff');
      setReservations((rs) => rs.map((r) => ((r._id || r.id) === id ? { ...r, bookingStatus: 'cancelled', cancellationReason: 'Cancelled by staff' } : r)));
      notify('Reservation cancelled.', 'warn');
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const addGuest = useCallback(async (payload) => {
    try {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));
      const guest = await guestsApi.create(fd);
      setGuests((gs) => [guest, ...gs]);
      notify('Guest profile created.');
      return guest;
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const updateGuest = useCallback(async (id, patch) => {
    try {
      const fd = new FormData();
      Object.entries(patch).forEach(([k, v]) => fd.append(k, String(v)));
      const guest = await guestsApi.update(id, fd);
      setGuests((gs) => gs.map((g) => ((g._id || g.id) === id ? guest : g)));
      notify('Guest profile updated.');
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const toggleVip = useCallback((id) => {
    let next = false;
    setGuests((gs) => gs.map((g) => {
      if ((g._id || g.id) !== id) return g;
      next = !g.vip;
      return { ...g, vip: next };
    }));
    const fd = new FormData();
    fd.append('vip', String(next));
    guestsApi.update(id, fd).catch((error) => notify(error.message, 'error'));
  }, [notify]);

  const addStaff = useCallback(async (payload) => {
    try {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));
      const staffMember = await staffApi.create(fd);
      setStaff((ss) => [staffMember, ...ss]);
      notify('Staff account created.');
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const updateStaff = useCallback(async (id, patch) => {
    try {
      const fd = new FormData();
      Object.entries(patch).forEach(([k, v]) => fd.append(k, String(v)));
      const staffMember = await staffApi.update(id, fd);
      setStaff((ss) => ss.map((s) => ((s._id || s.id) === id ? staffMember : s)));
      notify('Staff account updated.');
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const toggleStaffStatus = useCallback(async (id) => {
    try {
      const current = staff.find(s => (s._id || s.id) === id);
      const newStatus = current.staffStatus === 'active' ? 'inactive' : 'active';
      await staffApi.updateStatus(id, newStatus);
      setStaff((ss) => ss.map((s) => ((s._id || s.id) === id ? { ...s, staffStatus: newStatus } : s)));
      notify('Staff account updated.');
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify, staff]);

  const setTaskStatus = useCallback(async (id, status) => {
    try {
      await housekeepingApi.updateStatus(id, status);
      setHousekeeping((hk) => hk.map((t) => ((t._id || t.id) === id ? { ...t, taskStatus: status } : t)));
      if (status === 'completed') notify('Task completed.');
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const addTask = useCallback(async (payload) => {
    try {
      const task = await housekeepingApi.create(payload);
      setHousekeeping((hk) => [task, ...hk]);
      notify('Housekeeping task created.');
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const updateTask = useCallback(async (id, patch) => {
    try {
      const task = await housekeepingApi.update(id, patch);
      setHousekeeping((hk) => hk.map((t) => ((t._id || t.id) === id ? task : t)));
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const addMaintenance = useCallback(async (payload) => {
    try {
      const task = await maintenanceApi.create(payload);
      setMaintenance((m) => [task, ...m]);
      notify('Maintenance request logged.');
      if (settingsRef.current.notifications.maintenance) {
        pushNotification({
          kind: 'maintenance', icon: 'wrench',
          title: `Maintenance logged · Room ${payload.roomId}`,
          body: payload.issueTitle || 'New issue reported',
        });
      }
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify, pushNotification]);

  const setMaintenanceStatus = useCallback(async (id, status) => {
    try {
      await maintenanceApi.update(id, { maintenanceStatus: status });
      setMaintenance((m) => m.map((r) => ((r._id || r.id) === id ? { ...r, maintenanceStatus: status } : r)));
      notify(`Request marked ${status}.`);
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const addService = useCallback(async (payload) => {
    try {
      const svc = await servicesApi.create(payload);
      setServices((s) => [svc, ...s]);
      notify('Service request received.');
      pushNotification({
        kind: 'service', icon: serviceTypeById[svc.serviceType]?.icon || 'bell',
        title: `Service request · ${svc.roomId?.roomNumber ? 'Room ' + svc.roomId.roomNumber : serviceTypeById[svc.serviceType]?.label || 'Concierge'}`,
        body: svc.serviceDescription || serviceTypeById[svc.serviceType]?.label || 'New request',
      });
      return svc;
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify, pushNotification]);

  const setServiceStatus = useCallback(async (id, status) => {
    try {
      await servicesApi.updateStatus(id, status);
      setServices((s) => s.map((v) => ((v._id || v.id) === id ? { ...v, serviceStatus: status } : v)));
      if (status !== 'requested') notify(`Service marked ${status}.`);
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const updateService = useCallback(async (id, patch) => {
    try {
      const svc = await servicesApi.update(id, patch);
      setServices((s) => s.map((v) => ((v._id || v.id) === id ? svc : v)));
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const addFeedback = useCallback(async (payload) => {
    try {
      const fb = await feedbackApi.create(payload);
      setFeedback((f) => [fb, ...f]);
      notify('Thank you — your feedback has been received.');
      pushNotification({
        kind: 'feedback', icon: 'star',
        title: `New ${payload.rating}★ review`,
        body: (payload.feedbackMessage || '').slice(0, 60) + ((payload.feedbackMessage || '').length > 60 ? '…' : ''),
      });
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify, pushNotification]);

  const replyFeedback = useCallback(async (id, reply) => {
    try {
      const replyDate = todayISO();
      await feedbackApi.update(id, { reply, repliedAt: replyDate });
      setFeedback((f) => f.map((r) => ((r._id || r.id) === id ? { ...r, reply, repliedAt: replyDate } : r)));
      notify('Reply sent to guest.');
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const toggleFeedbackResolved = useCallback(async (id) => {
    try {
      const current = feedback.find(f => (f._id || f.id) === id);
      const newStatus = current.feedbackStatus === 'resolved' ? 'new' : 'resolved';
      await feedbackApi.update(id, { feedbackStatus: newStatus });
      setFeedback((f) => f.map((r) => ((r._id || r.id) === id ? { ...r, feedbackStatus: newStatus } : r)));
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify, feedback]);

  const markInvoicePaid = useCallback(async (id) => {
    try {
      await invoicesApi.updatePaymentStatus(id, 'paid');
      setInvoices((inv) => inv.map((i) => ((i._id || i.id) === id ? { ...i, paymentStatus: 'paid' } : i)));
      notify('Invoice marked as paid.');
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const addInvoice = useCallback(async (payload) => {
    try {
      const invoice = await invoicesApi.create(payload);
      setInvoices((inv) => [invoice, ...inv]);
      notify('Invoice created.');
      return invoice;
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const updateSettings = useCallback(async (patch) => {
    try {
      await settingsApi.update(patch);
      setSettings((s) => ({ ...s, ...patch }));
      notify('Settings saved.');
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const updateRolePolicies = useCallback(async (next) => {
    try {
      await settingsApi.updateRoles(next);
      setRolePolicies({ ...next });
      notify('Role permissions saved.');
    } catch (error) {
      notify(error.message, 'error');
    }
  }, [notify]);

  const value = useMemo(
    () => ({
      rooms, reservations, guests, staff, invoices, housekeeping, maintenance, feedback, services, notifications,
      analytics, settings, rolePolicies, toast, loading, refreshAll,
      setRooms, setRoomStatus,
      setReservations, cancelReservation,
      addGuest, updateGuest, toggleVip, addStaff, updateStaff, toggleStaffStatus,
      setTaskStatus, addTask, updateTask, addMaintenance, setMaintenanceStatus,
      addService, setServiceStatus, updateService,
      addFeedback, replyFeedback, toggleFeedbackResolved,
      markInvoicePaid, addInvoice, updateSettings, updateRolePolicies, notify,
      pushNotification, markNotificationRead, markAllNotificationsRead, clearNotifications,
    }),
    [rooms, reservations, guests, staff, invoices, housekeeping, maintenance, feedback, services, notifications, settings, rolePolicies, toast, loading, refreshAll,
     setRooms, setRoomStatus,
     setReservations, cancelReservation, addGuest, updateGuest, toggleVip,
     addStaff, updateStaff, toggleStaffStatus, setTaskStatus, addTask, updateTask, addMaintenance, setMaintenanceStatus,
     addService, setServiceStatus, updateService, addFeedback, replyFeedback, toggleFeedbackResolved,
     markInvoicePaid, addInvoice, updateSettings, updateRolePolicies, notify,
     pushNotification, markNotificationRead, markAllNotificationsRead, clearNotifications]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}