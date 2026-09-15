import { useMemo, useState, useEffect } from 'react';
import DashHeader from '../../components/dash/DashHeader.jsx';
import StatusBadge from '../../components/dash/StatusBadge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useData } from '../../context/DataContext.jsx';
import { checkInOutApi } from '../../lib/api.js';
import { useToday } from '../../lib/useNow.js';
import { money } from '../../data/hotel.js';
export default function CheckInOut() {
    const { guests, rooms, reservations, notify, refreshAll } = useData();
    const today = useToday();
    const [checkIns, setCheckIns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('checkin');
    const [form, setForm] = useState({ guestId: '', roomId: '', reservationId: '', checkInDate: today, numberOfGuests: 1 });
    const [processing, setProcessing] = useState(false);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await checkInOutApi.listCheckIns();
            setCheckIns(data);
        } catch (e) {
            setError(e.message || 'Could not load active stays.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    const nameOf = (id) => {
        const g = guests.find((x) => (x._id || x.id) === id);
        return g?.guestName || 'Guest';
    };
    const roomNum = (id) => {
        const r = rooms.find((x) => (x._id || x.id) === id);
        return r ? `Room ${r.roomNumber}` : '—';
    };
    const guestLabel = (ci) => nameOf(ci.guestId?._id || ci.guestId) || ci.guestId?.guestName || 'Guest';
    const roomLabel = (ci) => (ci.roomId?.roomNumber ? `Room ${ci.roomId.roomNumber}` : roomNum(ci.roomId));

    // Resolve the populated ids and labels from a reservation so the modal
    // auto-fills the correct guest + room instead of forcing a hand match.
    const guestOf = (r) => r.guestId?.guestName || nameOf(r.guestId?._id || r.guestId) || 'Guest';
    const roomOf = (r) => {
        const id = r.roomId?._id || r.roomId;
        const ro = rooms.find((x) => (x._id || x.id) === id);
        return ro ? `Room ${ro.roomNumber} · ${ro.roomType}` : '—';
    };
    const pickReservation = (value) => {
        const r = reservations.find((x) => (x._id || x.id) === value);
        if (!r) { setForm((f) => ({ ...f, reservationId: value })); return; }
        setForm((f) => ({
            ...f,
            reservationId: value,
            guestId: r.guestId?._id || r.guestId || f.guestId,
            roomId: r.roomId?._id || r.roomId || f.roomId,
            numberOfGuests: Number(r.numberOfGuests) || f.numberOfGuests || 1,
        }));
    };

    const doCheckIn = async () => {
        if (!form.guestId || !form.roomId || !form.reservationId) return notify('Fill in all fields', 'error');
        try {
            setProcessing(true);
            await checkInOutApi.checkIn({ guestId: form.guestId, roomId: form.roomId, reservationId: form.reservationId, checkInDate: form.checkInDate, numberOfGuests: Number(form.numberOfGuests) || 1 });
            notify('Guest checked in successfully');
            setModalOpen(false);
            setForm({ guestId: '', roomId: '', reservationId: '', checkInDate: today, numberOfGuests: 1 });
            await Promise.all([load(), refreshAll()]);
        } catch (e) {
            notify(e.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const doCheckOut = async (id) => {
        try {
            const res = await checkInOutApi.checkOut(id);
            notify('Guest checked out');
            setCheckIns((list) => list.filter((c) => (c._id || c.id) !== id));
            if (res?.invoice) notify(`Invoice #${String(res.invoice._id).slice(-6).toUpperCase()} created`, 'warn');
            refreshAll();
        } catch (e) {
            notify(e.message, 'error');
        }
    };

    const sorted = useMemo(() =>
        [...checkIns].sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate)),
    [checkIns]);

    return (
        <>
            <DashHeader title="Check-in / Check-out" subtitle="Process arrivals and departures.">
                <button className="btn btn--sm" onClick={() => { setModalType('checkin'); setModalOpen(true); }}>
                    <Icon name="key" size={15} /> Check in guest
                </button>
            </DashHeader>

            <div className="dash-toolbar">
                <div className="dash-search">
                    <Icon name="search" size={16} />
                    <input placeholder="Active stays are pulled live from the check-in register…" disabled />
                </div>
            </div>

            <section className="panel panel--flush">
                <div className="dash-table-wrap">
                    <table className="dash-table">
                        <thead>
                            <tr><th>Guest</th><th>Room</th><th>Check-in</th><th>Key</th><th>Status</th><th></th></tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="dash-empty"><Icon name="loader" size={22} /> Loading active stays…</td></tr>
                            ) : error ? (
                                <tr><td colSpan={6} className="dash-empty"><Icon name="wifi" size={22} /> {error} <button className="btn btn--sm btn--outline" style={{ marginLeft: 12 }} onClick={load}>Retry</button></td></tr>
                            ) : sorted.length === 0 ? (
                                <tr><td colSpan={6} className="dash-empty"><Icon name="door" size={22} /> No checked-in guests right now.</td></tr>
                            ) : sorted.map((ci) => (
                                <tr key={ci._id || ci.id}>
                                    <td>{guestLabel(ci)}</td>
                                    <td>{roomLabel(ci)}</td>
                                    <td>{new Date(ci.checkInDate).toLocaleDateString()}</td>
                                    <td><code>{ci.keyReference || '—'}</code></td>
                                    <td><StatusBadge status="checked-in" /></td>
                                    <td>
                                        <button className="btn btn--sm btn--outline" onClick={() => doCheckOut(ci._id || ci.id)}>
                                            <Icon name="logout" size={14} /> Check out
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <Modal
                open={modalOpen && modalType === 'checkin'}
                onClose={() => setModalOpen(false)}
                title="Check in guest"
                subtitle="Assign a room and issue a digital key."
                footer={<>
                    <button className="btn btn--outline" onClick={() => setModalOpen(false)}>Cancel</button>
                    <button className="btn" onClick={doCheckIn} disabled={processing}>
                        <Icon name="key" size={15} /> {processing ? 'Checking in…' : 'Check in'}
                    </button>
                </>}
            >
                <label className="field"><span className="field-label">Guest *</span>
                    <select className="select" value={form.guestId} disabled={!!form.reservationId} onChange={(e) => setForm((f) => ({ ...f, guestId: e.target.value }))}>
                        <option value="">Select guest…</option>
                        {guests.map((g) => <option key={g._id || g.id} value={g._id || g.id}>{g.guestName}</option>)}
                    </select>
                    {form.reservationId && <small className="field-hint">Auto-filled from the selected reservation.</small>}
                </label>
                <label className="field"><span className="field-label">Room *</span>
                    <select className="select" value={form.roomId} disabled={!!form.reservationId} onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}>
                        <option value="">Select room…</option>
                        {rooms.filter((r) => r.roomStatus === 'available' || r.roomStatus === 'reserved').map((r) => <option key={r._id || r.id} value={r._id || r.id}>Room {r.roomNumber} — {r.roomType}</option>)}
                    </select>
                    {form.reservationId && <small className="field-hint">Auto-filled from the selected reservation.</small>}
                </label>
                <label className="field"><span className="field-label">Reservation *</span>
                    <select className="select" value={form.reservationId} onChange={(e) => pickReservation(e.target.value)}>
                        <option value="">Select reservation…</option>
                        {reservations.filter((r) => r.bookingStatus === 'confirmed').map((r) => <option key={r._id || r.id} value={r._id || r.id}>#{r.confirmationCode} · {guestOf(r)} · {roomOf(r)}</option>)}
                    </select>
                    <small className="field-hint">Only confirmed reservations appear here.</small>
                </label>
                <label className="field"><span className="field-label">Guests *</span>
                    <input className="input" type="number" min="1" step="1" value={form.numberOfGuests} onChange={(e) => setForm((f) => ({ ...f, numberOfGuests: e.target.value }))} />
                    {form.reservationId && <small className="field-hint">Pre-filled from the reservation — adjust if the party differs.</small>}
                </label>
            </Modal>
        </>
    );
}