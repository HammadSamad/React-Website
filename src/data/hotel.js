/* =====================================================================
   LuxuryStay Hospitality — seed data (mock "database")
   Structured to mirror a real MERN API response so it can be swapped
   for live endpoints later. All figures are illustrative.
   ===================================================================== */
import { img } from '../lib/images.js';

const toISODATE = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const TODAY = toISODATE(new Date());

/* Live "today" — recomputes from the current time so arrival-date
   minimums always reflect the actual date, even across midnight. */
export const todayISO = () => toISODATE(new Date());

export const hotelInfo = {
  name: 'LuxuryStay',
  full: 'LuxuryStay Hospitality',
  established: 1926,
  tagline: 'The Art of the Stay',
  address: '1 Conservatory Row, Marine Quarter',
  city: 'Singapore',
  phone: '+65 6021 8800',
  email: 'reservations@luxurystay.com',
  coords: '1.2831° N, 103.8607° E',
  properties: 14,
  awards: 38,
};

/* --------------------------- Experiences ---------------------------- */
export const experiences = [
  { id: 'spa', name: 'The Conservatory Spa', kicker: 'Wellness', image: img.spa1, blurb: 'Nine treatment suites, a botanical hammam, and a candle-lit vitality pool.', hours: '07:00 – 22:00' },
  { id: 'pool', name: 'The Lagoon', kicker: 'Water', image: img.pool1, blurb: 'A 45-metre heated infinity pool ringed by cabanas and century palms.', hours: '06:00 – 21:00' },
  { id: 'dining', name: 'Fern & Brass', kicker: 'Dining', image: img.dining1, blurb: 'Our flagship restaurant — a seasonal garden menu under a glass canopy.', hours: '18:00 – late' },
  { id: 'bar', name: 'The Palm Bar', kicker: 'Nightcap', image: img.bar, blurb: 'Rare spirits, house botanicals, and live jazz beneath the atrium.', hours: '16:00 – 01:00' },
  { id: 'fitness', name: 'The Movement Studio', kicker: 'Fitness', image: img.fitness, blurb: 'Technogym floor, private training, and dawn yoga in the gardens.', hours: '24 hours' },
  { id: 'events', name: 'The Orangery', kicker: 'Gatherings', image: img.lounge, blurb: 'A light-filled ballroom and salons for weddings and private dinners.', hours: 'By arrangement' },
];

/* --------------------------- Testimonials --------------------------- */
export const testimonials = [
  { quote: 'The most quietly perfect hotel I have stayed in. Every detail felt considered, never fussy.', name: 'Amara Okafor', role: 'Travel Editor, Meridian', rating: 5 },
  { quote: 'From private check-in to the turndown ritual, LuxuryStay treats hospitality as a craft.', name: 'Henrik Sørensen', role: 'Returning guest, 11 stays', rating: 5 },
  { quote: 'The Botanical Penthouse terrace at sunrise is worth the journey on its own.', name: 'Priya Nair', role: 'Architect', rating: 5 },
];

/* ------------------------------ Guests ------------------------------ */
export const guests = [
  { id: 'g-1042', name: 'Eleanor Whitfield', email: 'e.whitfield@mail.com', phone: '+44 7700 900321', country: 'United Kingdom', vip: true, stays: 14, since: 2019, preferences: ['High floor', 'Sparkling water', 'Feather-free'] },
  { id: 'g-1043', name: 'Rafael Moreno', email: 'rafa.moreno@mail.com', phone: '+34 611 223 344', country: 'Spain', vip: false, stays: 3, since: 2024, preferences: ['Late checkout', 'Espresso'] },
  { id: 'g-1044', name: 'Mei-Ling Chen', email: 'ml.chen@mail.com', phone: '+65 8123 4567', country: 'Singapore', vip: true, stays: 22, since: 2017, preferences: ['Quiet room', 'Green tea', 'Extra pillows'] },
  { id: 'g-1045', name: 'James Okonkwo', email: 'j.okonkwo@mail.com', phone: '+234 802 345 6789', country: 'Nigeria', vip: false, stays: 6, since: 2022, preferences: ['King bed', 'Airport transfer'] },
  { id: 'g-1046', name: 'Sofia Rossi', email: 'sofia.rossi@mail.com', phone: '+39 320 112 2334', country: 'Italy', vip: true, stays: 9, since: 2021, preferences: ['Pool view', 'Prosecco on arrival'] },
  { id: 'g-1047', name: 'Daniel Fischer', email: 'd.fischer@mail.com', phone: '+49 151 2345 678', country: 'Germany', vip: false, stays: 2, since: 2025, preferences: ['Desk', 'Firm mattress'] },
  { id: 'g-1048', name: 'Aisha Al-Farsi', email: 'a.alfarsi@mail.com', phone: '+971 50 123 4567', country: 'UAE', vip: true, stays: 17, since: 2018, preferences: ['Butler', 'Halal menu', 'Adjoining rooms'] },
  { id: 'g-1049', name: 'Thomas Bergström', email: 't.berg@mail.com', phone: '+46 70 123 45 67', country: 'Sweden', vip: false, stays: 4, since: 2023, preferences: ['Sauna access', 'Oat milk'] },
  { id: 'g-1050', name: 'Yuki Tanaka', email: 'yuki.tanaka@mail.com', phone: '+81 90 1234 5678', country: 'Japan', vip: true, stays: 12, since: 2020, preferences: ['Tatami slippers', 'Green tea', 'High floor'] },
  { id: 'g-1051', name: 'Camila Duarte', email: 'c.duarte@mail.com', phone: '+55 21 99876 5432', country: 'Brazil', vip: false, stays: 1, since: 2026, preferences: ['Late checkout'] },
  { id: 'g-1052', name: 'Oliver Bennett', email: 'o.bennett@mail.com', phone: '+1 415 555 0148', country: 'United States', vip: false, stays: 5, since: 2022, preferences: ['Gym', 'Cold brew'] },
  { id: 'g-1053', name: 'Nadia Petrova', email: 'n.petrova@mail.com', phone: '+7 903 123 4567', country: 'Russia', vip: true, stays: 8, since: 2021, preferences: ['Spa daily', 'Champagne'] },
];
export const guestById = Object.fromEntries(guests.map((g) => [g.id, g]));

/* ------------------------------ Staff ------------------------------- */
export const staff = [
  { id: 's-01', name: 'Isabelle Laurent', role: 'admin', title: 'General Manager', email: 'i.laurent@luxurystay.com', phone: '+65 6021 8801', status: 'active', shift: 'Day', since: 2016 },
  { id: 's-02', name: 'Marcus Reed', role: 'manager', title: 'Front Office Manager', email: 'm.reed@luxurystay.com', phone: '+65 6021 8802', status: 'active', shift: 'Day', since: 2018 },
  { id: 's-03', name: 'Priya Sharma', role: 'receptionist', title: 'Senior Receptionist', email: 'p.sharma@luxurystay.com', phone: '+65 6021 8803', status: 'active', shift: 'Morning', since: 2021 },
  { id: 's-04', name: 'Diego Álvarez', role: 'receptionist', title: 'Receptionist', email: 'd.alvarez@luxurystay.com', phone: '+65 6021 8804', status: 'active', shift: 'Evening', since: 2023 },
  { id: 's-05', name: 'Grace Mwangi', role: 'housekeeping', title: 'Head of Housekeeping', email: 'g.mwangi@luxurystay.com', phone: '+65 6021 8805', status: 'active', shift: 'Morning', since: 2019 },
  { id: 's-06', name: 'Tomás Silva', role: 'housekeeping', title: 'Room Attendant', email: 't.silva@luxurystay.com', phone: '+65 6021 8806', status: 'active', shift: 'Morning', since: 2024 },
  { id: 's-07', name: 'Anna Kowalski', role: 'housekeeping', title: 'Room Attendant', email: 'a.kowalski@luxurystay.com', phone: '+65 6021 8807', status: 'active', shift: 'Day', since: 2022 },
  { id: 's-08', name: 'Ravi Kapoor', role: 'maintenance', title: 'Facilities Engineer', email: 'r.kapoor@luxurystay.com', phone: '+65 6021 8808', status: 'active', shift: 'Day', since: 2020 },
  { id: 's-09', name: 'Lena Hoffmann', role: 'manager', title: 'Revenue Manager', email: 'l.hoffmann@luxurystay.com', phone: '+65 6021 8809', status: 'inactive', shift: 'Day', since: 2019 },
];

export const roleLabels = {
  admin: 'Administrator',
  manager: 'Manager',
  receptionist: 'Receptionist',
  housekeeping: 'Housekeeping',
  maintenance: 'Maintenance',
  guest: 'Guest',
};

export const ROLES = ['admin', 'manager', 'receptionist', 'housekeeping', 'maintenance', 'guest'];

export const MODULES = [
  { key: 'overview', label: 'Overview' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'checkinout', label: 'Check-in / out' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'guests', label: 'Guests' },
  { key: 'housekeeping', label: 'Housekeeping' },
  { key: 'services', label: 'Services' },
  { key: 'billing', label: 'Billing' },
  { key: 'payments', label: 'Payments' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'reports', label: 'Reports' },
  { key: 'staff', label: 'Staff' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'settings', label: 'System' },
  { key: 'roles', label: 'Roles & permissions' },
];

export const DEFAULT_ROLE_POLICIES = {
  admin: { overview: true, reservations: true, checkinout: true, rooms: true, guests: true, housekeeping: true, services: true, billing: true, payments: true, feedback: true, reports: true, staff: true, notifications: true, settings: true, roles: true },
  manager: { overview: true, reservations: true, checkinout: true, rooms: true, guests: true, housekeeping: true, services: true, billing: true, payments: true, feedback: true, reports: true, staff: true, notifications: true, settings: false, roles: false },
  receptionist: { overview: true, reservations: true, checkinout: true, rooms: true, guests: true, housekeeping: true, services: true, billing: true, payments: true, feedback: false, reports: false, staff: false, notifications: true, settings: false, roles: false },
  housekeeping: { overview: true, reservations: false, checkinout: false, rooms: false, guests: false, housekeeping: true, services: true, billing: false, payments: false, feedback: false, reports: false, staff: false, notifications: true, settings: false, roles: false },
  maintenance: { overview: true, reservations: false, checkinout: false, rooms: false, guests: false, housekeeping: true, services: false, billing: false, payments: false, feedback: false, reports: false, staff: false, notifications: true, settings: false, roles: false },
  guest: { overview: false, reservations: false, checkinout: false, rooms: false, guests: false, housekeeping: false, services: false, billing: false, payments: false, feedback: false, reports: false, staff: false, notifications: false, settings: false, roles: false },
};

export const MODULE_BY_ROUTE = {
  '/dashboard': 'overview',
  '/dashboard/reservations': 'reservations',
  '/dashboard/checkinout': 'checkinout',
  '/dashboard/rooms': 'rooms',
  '/dashboard/guests': 'guests',
  '/dashboard/housekeeping': 'housekeeping',
  '/dashboard/services': 'services',
  '/dashboard/billing': 'billing',
  '/dashboard/payments': 'payments',
  '/dashboard/feedback': 'feedback',
  '/dashboard/reports': 'reports',
  '/dashboard/staff': 'staff',
  '/dashboard/notifications': 'notifications',
  '/dashboard/settings': 'settings',
};

/* ------------------------------ Invoices ---------------------------- */
export const invoices = [
  { id: 'inv-5501', number: 'INV-2026-5501', reservationId: 'r-9001', guestId: 'g-1042', issued: '2026-08-24', status: 'pending', items: [ { label: 'Botanical Penthouse × 4 nights', amount: 7400 }, { label: 'Spa — Botanical Hammam', amount: 420 }, { label: 'Fern & Brass — dining', amount: 610 }, { label: 'Chauffeur service', amount: 280 } ] },
  { id: 'inv-5502', number: 'INV-2026-5502', reservationId: 'r-9008', guestId: 'g-1045', issued: '2026-08-24', status: 'paid', items: [ { label: 'Garden Deluxe × 4 nights', amount: 1280 }, { label: 'Airport transfer', amount: 120 }, { label: 'Minibar', amount: 86 } ] },
  { id: 'inv-5503', number: 'INV-2026-5503', reservationId: 'r-9006', guestId: 'g-1043', issued: '2026-08-25', status: 'pending', items: [ { label: 'Poolside Cabana × 3 nights', amount: 1830 }, { label: 'The Palm Bar', amount: 240 }, { label: 'Laundry', amount: 65 } ] },
  { id: 'inv-5504', number: 'INV-2026-5504', reservationId: 'r-9014', guestId: 'g-1042', issued: '2026-08-22', status: 'paid', items: [ { label: 'Conservatory Junior Suite × 4 nights', amount: 2760 }, { label: 'Spa treatments', amount: 540 }, { label: 'Dining', amount: 388 } ] },
  { id: 'inv-5505', number: 'INV-2026-5505', reservationId: 'r-9012', guestId: 'g-1051', issued: '2026-08-25', status: 'pending', items: [ { label: 'Palm Court Suite × 2 nights', amount: 1040 }, { label: 'Room service', amount: 132 } ] },
  { id: 'inv-5506', number: 'INV-2026-5506', reservationId: 'r-9002', guestId: 'g-1044', issued: '2026-08-25', status: 'paid', items: [ { label: 'Conservatory Junior Suite × 4 nights', amount: 2760 }, { label: 'Green tea ceremony', amount: 90 } ] },
];

/* --------------------------- Housekeeping --------------------------- */
export const housekeeping = [
  { id: 'hk-01', roomNo: '204', task: 'Departure clean', assignee: 's-06', priority: 'high', status: 'in-progress', note: 'Guest arriving 15:00' },
  { id: 'hk-02', roomNo: '102', task: 'Departure clean', assignee: 's-07', priority: 'high', status: 'pending', note: 'Checkout 12:00' },
  { id: 'hk-03', roomNo: '401', task: 'Turndown service', assignee: 's-06', priority: 'normal', status: 'pending', note: 'VIP — extra pillows' },
  { id: 'hk-04', roomNo: '305', task: 'Departure clean', assignee: 's-07', priority: 'high', status: 'pending', note: '' },
  { id: 'hk-05', roomNo: '601', task: 'Refresh & restock', assignee: 's-05', priority: 'normal', status: 'done', note: 'Penthouse — champagne restock' },
  { id: 'hk-06', roomNo: '206', task: 'Deep clean', assignee: 's-07', priority: 'low', status: 'done', note: '' },
  { id: 'hk-07', roomNo: '403', task: 'Stayover service', assignee: 's-06', priority: 'normal', status: 'pending', note: '' },
  { id: 'hk-08', roomNo: '501', task: 'Pre-arrival setup', assignee: 's-05', priority: 'high', status: 'in-progress', note: 'Adjoining rooms — VIP' },
];

export const maintenance = [
  { id: 'mn-01', roomNo: '303', issue: 'Air-conditioning not cooling', reportedBy: 'Reception', priority: 'high', status: 'in-progress', date: '2026-08-24', assignee: 's-08' },
  { id: 'mn-02', roomNo: '208', issue: 'Bathroom faucet dripping', reportedBy: 'Housekeeping', priority: 'normal', status: 'open', date: '2026-08-25', assignee: null },
  { id: 'mn-03', roomNo: '104', issue: 'Terrace door lock stiff', reportedBy: 'Guest', priority: 'normal', status: 'open', date: '2026-08-25', assignee: 's-08' },
  { id: 'mn-04', roomNo: '402', issue: 'Flickering pendant light', reportedBy: 'Housekeeping', priority: 'low', status: 'resolved', date: '2026-08-22', assignee: 's-08' },
  { id: 'mn-05', roomNo: '507', issue: 'TV not connecting to cast', reportedBy: 'Guest', priority: 'low', status: 'open', date: '2026-08-25', assignee: null },
];

/* ------------------------------ Feedback ---------------------------- */
export const feedback = [
  { id: 'fb-01', guestId: 'g-1042', rating: 5, category: 'Overall', room: 'Botanical Penthouse', date: '2026-08-22', comment: 'Faultless from arrival to departure. The terrace at sunrise is unforgettable.' },
  { id: 'fb-02', guestId: 'g-1044', rating: 5, category: 'Service', room: 'Conservatory Junior Suite', date: '2026-08-21', comment: 'The team remembered my tea preference from last year. That is real hospitality.' },
  { id: 'fb-03', guestId: 'g-1045', rating: 4, category: 'Room', room: 'Garden Deluxe', date: '2026-08-24', comment: 'Beautiful room, though the garden view was partly obscured. Still lovely.' },
  { id: 'fb-04', guestId: 'g-1046', rating: 5, category: 'Dining', room: 'Palm Court Suite', date: '2026-08-20', comment: 'Fern & Brass is a destination in itself. The tasting menu was extraordinary.' },
  { id: 'fb-05', guestId: 'g-1043', rating: 3, category: 'Maintenance', room: 'Poolside Cabana', date: '2026-08-25', comment: 'The room was gorgeous but the AC struggled on the first night.' },
  { id: 'fb-06', guestId: 'g-1053', rating: 5, category: 'Spa', room: 'Conservatory Junior Suite', date: '2026-08-19', comment: 'The Conservatory Spa is the best I have experienced in Asia. Book the hammam.' },
  { id: 'fb-07', guestId: 'g-1050', rating: 4, category: 'Overall', room: 'Garden Deluxe', date: '2026-08-23', comment: 'Impeccable service and calm. Would have loved a higher floor.' },
];

/* ----------------------- Guest services ---------------------------- */
/* Catalogue of concierge services guests can request (room service,
   wake-up calls, transportation, etc.) — shared by the public request
   form and the dashboard services board. */
export const serviceTypes = [
  { id: 'room-service', label: 'Room Service', icon: 'coffee', hint: 'In-room dining, day or night' },
  { id: 'wake-up-call', label: 'Wake-up Call', icon: 'clock', hint: 'A gentle call at your chosen hour' },
  { id: 'transportation', label: 'Transportation', icon: 'car', hint: 'Airport transfer or chauffeur' },
  { id: 'food', label: 'Dining Reservation', icon: 'dining', hint: 'A table at Fern & Brass' },
  { id: 'laundry', label: 'Laundry Service', icon: 'sparkles', hint: 'Wash, dry-clean, and press' },
  { id: 'other', label: 'Other Request', icon: 'glass', hint: 'Extra pillows, champagne, and more' },
];
export const serviceTypeById = Object.fromEntries(serviceTypes.map((s) => [s.id, s]));

export const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: 'banknote', hint: 'Pay at check-in or checkout in person' },
  { id: 'card', label: 'Card', icon: 'creditCard', hint: 'Visa · Mastercard · American Express' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: 'landmark', hint: 'Direct transfer to the hotel account' },
];
export const paymentMethodById = Object.fromEntries(paymentMethods.map((m) => [m.id, m]));

export const services = [
  { id: 'sv-01', guestId: 'g-1042', type: 'room-service', room: '601', detail: 'Breakfast for two — Continental, 08:00', when: '08:00', status: 'scheduled', assignee: 's-03', date: '2026-08-25' },
  { id: 'sv-02', guestId: 'g-1044', type: 'wake-up', room: '401', detail: 'Wake-up call', when: '06:30', status: 'scheduled', assignee: 's-04', date: '2026-08-25' },
  { id: 'sv-03', guestId: 'g-1046', type: 'transport', room: '301', detail: 'Airport transfer — Changi T3, sedan', when: '14:00', status: 'requested', assignee: null, date: '2026-08-25' },
  { id: 'sv-04', guestId: 'g-1048', type: 'amenity', room: '501', detail: 'Extra pillows (feather-free) & sparkling water', when: 'ASAP', status: 'in-progress', assignee: 's-05', date: '2026-08-25' },
  { id: 'sv-05', guestId: 'g-1053', type: 'spa', room: '403', detail: 'Botanical Hammam for one, afternoon', when: '16:00', status: 'requested', assignee: null, date: '2026-08-25' },
  { id: 'sv-06', guestId: 'g-1043', type: 'dining', room: '102', detail: 'Table for two, Fern & Brass', when: '20:00', status: 'completed', assignee: 's-03', date: '2026-08-24' },
  { id: 'sv-07', guestId: 'g-1050', type: 'room-service', room: '204', detail: 'Green tea service & fruit plate', when: '10:00', status: 'completed', assignee: 's-06', date: '2026-08-24' },
];

/* --------------------------- Analytics ------------------------------ */
export const analytics = {
  kpis: {
    occupancy: 87,
    occupancyDelta: 4.2,
    adr: 642,
    adrDelta: 3.1,
    revpar: 559,
    revparDelta: 6.5,
    revenueMTD: 1284500,
    revenueDelta: 8.4,
    satisfaction: 4.8,
    satisfactionDelta: 0.2,
  },
  // last 14 days
  occupancySeries: [72, 74, 78, 76, 81, 85, 88, 84, 79, 82, 86, 90, 87, 87],
  revenueSeries: [82, 79, 91, 88, 96, 110, 121, 104, 92, 99, 113, 128, 119, 124], // in $k
  bookingSource: [
    { label: 'Direct / Website', value: 46 },
    { label: 'Travel partners', value: 27 },
    { label: 'Corporate', value: 16 },
    { label: 'Walk-in', value: 11 },
  ],
  months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
  revenueByMonth: [980, 1040, 1120, 1180, 1225, 1284], // $k
};

/* --------------------------- Demo accounts -------------------------- */
export const demoAccounts = [
  { email: 'admin@luxurystay.com', role: 'admin', name: 'Isabelle Laurent', title: 'General Manager' },
  { email: 'manager@luxurystay.com', role: 'manager', name: 'Marcus Reed', title: 'Front Office Manager' },
  { email: 'reception@luxurystay.com', role: 'receptionist', name: 'Priya Sharma', title: 'Senior Receptionist' },
  { email: 'housekeeping@luxurystay.com', role: 'housekeeping', name: 'Grace Mwangi', title: 'Head of Housekeeping' },
  { email: 'e.whitfield@mail.com', role: 'guest', name: 'Eleanor Whitfield', title: 'Guest' },
];

/* ------------------------------ Helpers ----------------------------- */
export function nights(checkIn, checkOut) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b - a) / 86400000));
}
export function money(n) {
  return '$' + Number(n).toLocaleString('en-US');
}
export function invoiceTotals(items, taxRate = 9) {
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const tax = Math.round(subtotal * (taxRate / 100));
  return { subtotal, tax, total: subtotal + tax };
}
