import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  rooms as seedRooms,
  reservations as seedReservations,
  guests as seedGuests,
  staff as seedStaff,
  invoices as seedInvoices,
  housekeeping as seedHousekeeping,
  maintenance as seedMaintenance,
  feedback as seedFeedback,
  services as seedServices,
  analytics,
  roomTypes,
  roomTypeById,
  guestById,
  serviceTypeById,
  TODAY,
} from '../data/hotel.js';

const DataContext = createContext(null);

let seq = 9100;
const nextId = (prefix) => `${prefix}-${++seq}`;

/* A few notifications already waiting in the console on first load. */
const now = Date.now();
const seedNotifications = [
  { id: 'n-1', audience: 'staff', kind: 'booking', icon: 'calendar', title: 'New reservation · LS-8851', body: 'Oliver Bennett — Poolside Cabana, 3 nights', ts: now - 1000 * 60 * 9, read: false },
  { id: 'n-2', audience: 'staff', kind: 'service', icon: 'car', title: 'Service request · Room 301', body: 'Airport transfer — Changi T3, sedan', ts: now - 1000 * 60 * 52, read: false },
  { id: 'n-3', audience: 'staff', kind: 'maintenance', icon: 'wrench', title: 'Maintenance logged · Room 208', body: 'Bathroom faucet dripping', ts: now - 1000 * 60 * 96, read: false },
  { id: 'n-4', audience: 'staff', kind: 'feedback', icon: 'star', title: 'New 5★ review', body: 'Nadia Petrova on the Conservatory Spa', ts: now - 1000 * 60 * 60 * 4, read: true },
];

export function DataProvider({ children }) {
  const [rooms, setRooms] = useState(seedRooms);
  const [reservations, setReservations] = useState(seedReservations);
  const [guests, setGuests] = useState(seedGuests);
  const [staff, setStaff] = useState(seedStaff);
  const [invoices, setInvoices] = useState(seedInvoices);
  const [housekeeping, setHousekeeping] = useState(seedHousekeeping);
  const [maintenance, setMaintenance] = useState(seedMaintenance);
  const [feedback, setFeedback] = useState(seedFeedback);
  const [services, setServices] = useState(seedServices);
  const [notifications, setNotifications] = useState(seedNotifications);
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState({
    currency: 'USD',
    taxRate: 9,
    checkIn: '15:00',
    checkOut: '12:00',
    rates: Object.fromEntries(roomTypes.map((t) => [t.id, t.price])),
    policies: {
      cancellation: 'Free cancellation up to 48 hours before arrival.',
      pets: 'Assistance animals welcome; other pets by arrangement.',
      smoking: 'Non-smoking throughout, including all terraces.',
    },
    notifications: { newBooking: true, maintenance: true, lowInventory: false, dailyReport: true },
  });

  // Latest settings without re-creating every action callback.
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const notify = useCallback((message, kind = 'success') => {
    setToast({ message, kind, id: Date.now() });
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(null), 3200);
  }, []);

  /* ----------------------- Notifications ------------------------ */
  const pushNotification = useCallback((n) => {
    setNotifications((list) => [
      { id: nextId('n'), ts: Date.now(), read: false, audience: 'staff', kind: 'system', icon: 'bell', ...n },
      ...list,
    ].slice(0, 40));
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback((audience) => {
    setNotifications((list) => list.map((n) => (!audience || n.audience === audience ? { ...n, read: true } : n)));
  }, []);

  const clearNotifications = useCallback((audience) => setNotifications((list) =>
    audience ? list.filter((n) => n.audience !== audience) : []
  ), []);

  // Low-availability alert — fires once per high-occupancy episode.
  const lowAlerted = useRef(false);
  useEffect(() => {
    const occ = rooms.filter((r) => r.status === 'occupied').length;
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

  /* --------------------------- Rooms ---------------------------- */
  const setRoomStatus = useCallback((no, status) => {
    setRooms((rs) =>
      rs.map((r) =>
        r.no === no
          ? { ...r, status, housekeeping: status === 'cleaning' ? 'in-progress' : r.housekeeping }
          : r
      )
    );
    notify(`Room ${no} marked ${status}.`);
  }, [notify]);

  const addRoom = useCallback((payload) => {
    const t = roomTypeById[payload.typeId];
    const room = {
      status: 'available',
      housekeeping: 'clean',
      ...payload,
      no: String(payload.no).trim(),
      floor: Number(payload.floor),
      typeName: t ? `${t.name} ${t.tier}` : payload.typeName || '',
      price: t ? t.price : Number(payload.price) || 0,
      maxGuests: t ? t.maxGuests : Number(payload.maxGuests) || 2,
    };
    setRooms((rs) => [...rs, room]);
    notify(`Room ${room.no} added to inventory.`);
    return room;
  }, [notify]);

  const updateRoom = useCallback((no, patch) => {
    setRooms((rs) => rs.map((r) => {
      if (r.no !== no) return r;
      const next = { ...r, ...patch };
      if (patch.typeId && patch.typeId !== r.typeId) {
        const t = roomTypeById[patch.typeId];
        if (t) { next.typeName = `${t.name} ${t.tier}`; next.price = t.price; next.maxGuests = t.maxGuests; }
      }
      if (patch.floor != null) next.floor = Number(patch.floor);
      return next;
    }));
    notify('Room details updated.');
  }, [notify]);

  const removeRoom = useCallback((no) => {
    setRooms((rs) => rs.filter((r) => r.no !== no));
    notify(`Room ${no} retired from inventory.`, 'warn');
  }, [notify]);

  /* ----------------------- Reservations ------------------------- */
  const checkIn = useCallback((id) => {
    setReservations((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'checked-in' } : r)));
    setReservations((cur) => {
      const res = cur.find((r) => r.id === id);
      if (res) setRooms((rms) => rms.map((rm) => (rm.no === res.roomNo ? { ...rm, status: 'occupied' } : rm)));
      return cur;
    });
    notify('Guest checked in. Room set to occupied.');
  }, [notify]);

  const checkOut = useCallback((id) => {
    setReservations((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'checked-out' } : r)));
    setReservations((cur) => {
      const res = cur.find((r) => r.id === id);
      if (res) setRooms((rms) => rms.map((rm) => (rm.no === res.roomNo ? { ...rm, status: 'cleaning', housekeeping: 'in-progress' } : rm)));
      return cur;
    });
    notify('Guest checked out. Room sent to housekeeping.');
  }, [notify]);

  const addReservation = useCallback((payload) => {
    const id = nextId('r');
    const code = 'LS-' + Math.floor(8860 + Math.random() * 130);
    const res = { id, code, status: 'confirmed', source: payload.source || 'online', paid: false, ...payload };
    setReservations((rs) => [res, ...rs]);
    notify(`Reservation ${code} created.`);
    if (settingsRef.current.notifications.newBooking) {
      const who = res.guestName || guestById[res.guestId]?.name || 'Guest';
      pushNotification({
        kind: 'booking', icon: 'calendar',
        title: `New reservation · ${code}`,
        body: `${who} — ${roomTypeById[res.typeId]?.name || 'suite'}, ${res.roomNo || 'room on arrival'}`,
      });
    }
    if (res.guestEmail) {
      pushNotification({
        audience: `guest:${res.guestEmail.toLowerCase()}`,
        kind: 'booking', icon: 'calendar',
        title: `Reservation confirmed · ${code}`,
        body: `${roomTypeById[res.typeId]?.name || 'Your stay'} · ${res.checkIn} to ${res.checkOut}`,
      });
    }
    return res;
  }, [notify, pushNotification]);

  const updateReservation = useCallback((id, patch) => {
    setReservations((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    notify('Reservation updated.');
  }, [notify]);

  const cancelReservation = useCallback((id) => {
    setReservations((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)));
    notify('Reservation cancelled.', 'warn');
  }, [notify]);

  /* -------------------------- Guests ---------------------------- */
  const addGuest = useCallback((payload) => {
    const id = nextId('g');
    const guest = { id, vip: false, stays: 0, since: 2026, preferences: [], ...payload };
    setGuests((gs) => [guest, ...gs]);
    notify('Guest profile created.');
    return guest;
  }, [notify]);

  const updateGuest = useCallback((id, patch) => {
    setGuests((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    notify('Guest profile updated.');
  }, [notify]);

  const toggleVip = useCallback((id) => {
    setGuests((gs) => gs.map((g) => (g.id === id ? { ...g, vip: !g.vip } : g)));
  }, []);

  /* --------------------------- Staff ---------------------------- */
  const addStaff = useCallback((payload) => {
    const id = nextId('s');
    setStaff((ss) => [{ id, status: 'active', shift: 'Day', since: 2026, ...payload }, ...ss]);
    notify('Staff account created.');
  }, [notify]);

  const updateStaff = useCallback((id, patch) => {
    setStaff((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    notify('Staff account updated.');
  }, [notify]);

  const toggleStaffStatus = useCallback((id) => {
    setStaff((ss) => ss.map((s) => (s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s)));
    notify('Staff account updated.');
  }, [notify]);

  /* --------------------- Housekeeping / maint ------------------- */
  const setTaskStatus = useCallback((id, status) => {
    setHousekeeping((hk) => hk.map((t) => (t.id === id ? { ...t, status } : t)));
    if (status === 'done') notify('Task completed.');
  }, [notify]);

  const addTask = useCallback((payload) => {
    const id = nextId('hk');
    setHousekeeping((hk) => [
      { id, status: 'pending', assignee: null, priority: 'normal', note: '', task: 'Cleaning', ...payload },
      ...hk,
    ]);
    notify('Housekeeping task created.');
  }, [notify]);

  const updateTask = useCallback((id, patch) => {
    setHousekeeping((hk) => hk.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const addMaintenance = useCallback((payload) => {
    const id = nextId('mn');
    setMaintenance((m) => [{ id, status: 'open', date: TODAY, assignee: null, ...payload }, ...m]);
    notify('Maintenance request logged.');
    if (settingsRef.current.notifications.maintenance) {
      pushNotification({
        kind: 'maintenance', icon: 'wrench',
        title: `Maintenance logged · Room ${payload.roomNo}`,
        body: payload.issue || 'New issue reported',
      });
    }
  }, [notify, pushNotification]);

  const setMaintenanceStatus = useCallback((id, status) => {
    setMaintenance((m) => m.map((r) => (r.id === id ? { ...r, status } : r)));
    notify(`Request marked ${status}.`);
  }, [notify]);

  /* ----------------------- Guest services ----------------------- */
  const addService = useCallback((payload) => {
    const id = nextId('sv');
    const svc = { id, status: 'requested', assignee: null, date: TODAY, ...payload };
    setServices((s) => [svc, ...s]);
    notify('Service request received.');
    pushNotification({
      kind: 'service', icon: serviceTypeById[svc.type]?.icon || 'bell',
      title: `Service request · ${svc.room ? 'Room ' + svc.room : serviceTypeById[svc.type]?.label || 'Concierge'}`,
      body: svc.detail || serviceTypeById[svc.type]?.label || 'New request',
    });
    return svc;
  }, [notify, pushNotification]);

  const setServiceStatus = useCallback((id, status) => {
    setServices((s) => s.map((v) => (v.id === id ? { ...v, status } : v)));
    if (status !== 'requested') notify(`Service marked ${status}.`);
  }, [notify]);

  const updateService = useCallback((id, patch) => {
    setServices((s) => s.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }, []);

  /* ------------------------- Feedback --------------------------- */
  const addFeedback = useCallback((payload) => {
    const id = nextId('fb');
    setFeedback((f) => [{ id, date: TODAY, ...payload }, ...f]);
    notify('Thank you — your feedback has been received.');
    pushNotification({
      kind: 'feedback', icon: 'star',
      title: `New ${payload.rating}★ review`,
      body: (payload.comment || '').slice(0, 60) + ((payload.comment || '').length > 60 ? '…' : ''),
    });
  }, [notify, pushNotification]);

  const replyFeedback = useCallback((id, reply) => {
    setFeedback((f) => f.map((r) => (r.id === id ? { ...r, reply, repliedAt: TODAY } : r)));
    notify('Reply sent to guest.');
  }, [notify]);

  const toggleFeedbackResolved = useCallback((id) => {
    setFeedback((f) => f.map((r) => (r.id === id ? { ...r, resolved: !r.resolved } : r)));
  }, []);

  /* ------------------------- Billing ---------------------------- */
  const markInvoicePaid = useCallback((id) => {
    setInvoices((inv) => inv.map((i) => (i.id === id ? { ...i, status: 'paid' } : i)));
    notify('Invoice marked as paid.');
  }, [notify]);

  const addInvoice = useCallback((payload) => {
    const id = nextId('inv');
    let number = '';
    setInvoices((inv) => {
      number = 'INV-2026-' + (5500 + inv.length + 1);
      return [{ id, number, status: 'pending', issued: TODAY, items: [], ...payload }, ...inv];
    });
    notify('Invoice created.');
    return id;
  }, [notify]);

  /* ------------------------- Settings --------------------------- */
  const updateSettings = useCallback((patch) => {
    setSettings((s) => ({ ...s, ...patch }));
    notify('Settings saved.');
  }, [notify]);

  const value = useMemo(
    () => ({
      rooms, reservations, guests, staff, invoices, housekeeping, maintenance, feedback, services, notifications,
      analytics, roomTypes, roomTypeById, settings, toast,
      setRoomStatus, addRoom, updateRoom, removeRoom, checkIn, checkOut, addReservation, updateReservation, cancelReservation,
      addGuest, updateGuest, toggleVip, addStaff, updateStaff, toggleStaffStatus,
      setTaskStatus, addTask, updateTask, addMaintenance, setMaintenanceStatus,
      addService, setServiceStatus, updateService,
      addFeedback, replyFeedback, toggleFeedbackResolved,
      markInvoicePaid, addInvoice, updateSettings, notify,
      pushNotification, markNotificationRead, markAllNotificationsRead, clearNotifications,
    }),
    [rooms, reservations, guests, staff, invoices, housekeeping, maintenance, feedback, services, notifications, settings, toast,
     setRoomStatus, addRoom, updateRoom, removeRoom, checkIn, checkOut, addReservation, updateReservation, cancelReservation, addGuest, updateGuest, toggleVip,
     addStaff, updateStaff, toggleStaffStatus, setTaskStatus, addTask, updateTask, addMaintenance, setMaintenanceStatus,
     addService, setServiceStatus, updateService, addFeedback, replyFeedback, toggleFeedbackResolved,
     markInvoicePaid, addInvoice, updateSettings, notify,
     pushNotification, markNotificationRead, markAllNotificationsRead, clearNotifications]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
