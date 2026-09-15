import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams()],
}));

vi.mock('../../context/DataContext.jsx', () => ({
  useData: vi.fn(),
}));

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../lib/api.js', () => ({
  authApi: { verifyEmail: vi.fn(), resendVerification: vi.fn() },
  reservationsApi: { create: vi.fn() },
  myBillingApi: { stripeCheckout: vi.fn(), pay: vi.fn() },
  roomsApi: { available: vi.fn() },
}));

vi.mock('framer-motion', () => {
  const MotionDiv = ({ children, variants, custom, initial, animate, exit, transition, ...rest }) => (
    <div {...rest}>{children}</div>
  );
  return {
    AnimatePresence: ({ children }) => <div>{children}</div>,
    motion: { div: MotionDiv, span: ({ children }) => <span>{children}</span> },
  };
});

vi.mock('../../components/common/Icon.jsx', () => ({
  default: ({ name }) => <span>{name}</span>,
}));

vi.mock('../../components/common/Modal.jsx', () => ({
  default: ({ open, title, subtitle, children, footer }) => (
    open ? (
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
        <div>{children}</div>
        <div>{footer}</div>
      </div>
    ) : null
  ),
}));

vi.mock('../../components/common/Select.jsx', () => ({
  default: ({ value, onChange, options = [], label }) => (
    <select aria-label={label} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

import Booking from './Booking.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { roomsApi } from '../../lib/api.js';

const roomA = { _id: 'room-a', id: 'room-a', roomNumber: 1, floor: 1, roomType: 'Deluxe King', roomStatus: 'available', roomPrice: 220, maxGuests: 2 };
const roomB = { _id: 'room-b', id: 'room-b', roomNumber: 2, floor: 1, roomType: 'Superior Twin', roomStatus: 'reserved', roomPrice: 180, maxGuests: 2 };
const roomC = { _id: 'room-c', id: 'room-c', roomNumber: 3, floor: 1, roomType: 'Standard', roomStatus: 'maintenance', roomPrice: 120, maxGuests: 2 };

const DATE_TAKEN_MESSAGE = 'This room is not available for the selected dates.';

function setup({ rooms, availability }) {
  useData.mockReturnValue({
    rooms,
    settings: { taxPercentage: 9 },
    notify: vi.fn(),
    refreshAll: vi.fn(),
    addGuest: vi.fn(),
    updateGuest: vi.fn(),
    guests: [],
  });
  useAuth.mockReturnValue({ user: null, isAuthed: false, signup: vi.fn(), login: vi.fn() });
  roomsApi.available.mockResolvedValue(availability);
  render(<Booking />);
}

const cardButton = (roomType) => screen.getByRole('button', { name: new RegExp(roomType) });
const continueButton = () => screen.getByRole('button', { name: /Continue/ });

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Booking date-aware availability', () => {
  it('blocks a room that overlaps an existing reservation and shows the date message', async () => {
    setup({
      rooms: [roomA, roomC],
      availability: [
        { ...roomA, available: false },
        { ...roomC, available: false },
      ],
    });

    expect(await screen.findByText(DATE_TAKEN_MESSAGE)).toBeInTheDocument();
    expect(cardButton('Deluxe King')).toBeDisabled();
    expect(continueButton()).toBeDisabled();
  });

  it('moves the selection to a date-available room when the current one is taken', async () => {
    setup({
      rooms: [roomA, roomB],
      availability: [
        { ...roomA, available: false },
        { ...roomB, available: true },
      ],
    });

    await waitFor(() => expect(cardButton('Superior Twin')).toHaveClass('is-selected'));
    expect(await screen.findByText(DATE_TAKEN_MESSAGE)).toBeInTheDocument();
    expect(cardButton('Superior Twin')).toBeEnabled();
    expect(cardButton('Deluxe King')).toBeDisabled();
    expect(continueButton()).toBeEnabled();
  });

  it('keeps maintenance rooms unavailable with the generic label regardless of dates', async () => {
    setup({
      rooms: [roomB, roomC],
      availability: [
        { ...roomB, available: true },
        { ...roomC, available: false },
      ],
    });

    await screen.findByText('Not available');
    expect(cardButton('Standard')).toBeDisabled();
    expect(cardButton('Superior Twin')).toBeEnabled();
  });
});