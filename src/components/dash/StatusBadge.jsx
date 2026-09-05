/* Maps any domain status/priority string to a badge style + label. */
const MAP = {
  // rooms
  available: ['available', 'Available'],
  occupied: ['occupied', 'Occupied'],
  cleaning: ['cleaning', 'Cleaning'],
  maintenance: ['maintenance', 'Maintenance'],
  reserved: ['reserved', 'Reserved'],
  // reservations
  'checked-in': ['available', 'Checked in'],
  arriving: ['reserved', 'Arriving'],
  departing: ['cleaning', 'Departing'],
  confirmed: ['occupied', 'Confirmed'],
  'checked-out': ['neutral', 'Checked out'],
  cancelled: ['maintenance', 'Cancelled'],
  // tasks / maintenance / invoices
  pending: ['occupied', 'Pending'],
  'in-progress': ['cleaning', 'In progress'],
  done: ['available', 'Done'],
  open: ['maintenance', 'Open'],
  resolved: ['available', 'Resolved'],
  paid: ['available', 'Paid'],
  // guest services
  requested: ['occupied', 'Requested'],
  scheduled: ['reserved', 'Scheduled'],
  completed: ['available', 'Completed'],
  delivered: ['available', 'Delivered'],
  // priority
  high: ['maintenance', 'High'],
  normal: ['neutral', 'Normal'],
  low: ['cleaning', 'Low'],
};

export default function StatusBadge({ status, label, dot = true, className = '' }) {
  const [cls, text] = MAP[status] || ['neutral', status];
  return (
    <span className={`badge badge--${cls} ${className}`}>
      {dot && <span className="dot" />}
      {label || text}
    </span>
  );
}
