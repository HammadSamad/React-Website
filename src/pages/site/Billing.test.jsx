import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock('../../context/DataContext.jsx', () => ({
  useData: vi.fn(),
}));

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../lib/api.js', () => ({
  myBillingApi: { invoices: vi.fn(), payments: vi.fn(), pay: vi.fn(), stripeCheckout: vi.fn() },
}));

vi.mock('framer-motion', () => {
  const node = ({ children, ...rest }) => <div>{children}</div>;
  return { motion: { div: node }, AnimatePresence: ({ children }) => <div>{children}</div> };
});

vi.mock('../../components/common/Icon.jsx', () => ({
  default: ({ name }) => <span>[{name}]</span>,
}));

vi.mock('../../components/site/PageHero.jsx', () => ({
  default: () => <header />,
}));

vi.mock('../../components/common/Reveal.jsx', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../components/dash/StatusBadge.jsx', () => ({
  default: ({ status, label }) => <span className={`badge badge--${status}`}>{label || status}</span>,
}));

import Billing from './Billing.jsx';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { myBillingApi } from '../../lib/api.js';

const room = { _id: 'room-501', roomType: 'Superior Twin', roomNumber: 501 };

const CARD_PENDING_INV = { _id: '6aa7108a52c72b5da503c8ed', paymentStatus: 'pending', createdAt: '2026-09-13T21:07:22.284Z', totalAmount: 320000, roomCharges: 32000, foodCharges: 0, laundryCharges: 0, otherCharges: 0, tax: 288000, roomId: room };
const DEEP_LINK_INV = { _id: '6aa711bf52c72b5da503c964', paymentStatus: 'pending', createdAt: '2026-09-13T21:12:31.506Z', totalAmount: 40000, roomCharges: 4000, foodCharges: 0, laundryCharges: 0, otherCharges: 0, tax: 36000, roomId: room };
// A full pending CASH payment still means "awaiting collection at the hotel".
const CASH_AWAIT_INV = { _id: 'cash-inv-001', paymentStatus: 'pending', createdAt: '2026-09-13T22:00:00.000Z', totalAmount: 10000, roomCharges: 10000, foodCharges: 0, laundryCharges: 0, otherCharges: 0, tax: 0, roomId: room };

const invoices = [CARD_PENDING_INV, DEEP_LINK_INV, CASH_AWAIT_INV];
const payments = [
  { _id: 'p1', paymentStatus: 'pending', paymentMethod: 'card', amount: 320000, invoiceId: CARD_PENDING_INV._id },
  { _id: 'p2', paymentStatus: 'pending', paymentMethod: 'card', amount: 40000, invoiceId: DEEP_LINK_INV._id },
  { _id: 'p3', paymentStatus: 'pending', paymentMethod: 'cash', amount: 10000, invoiceId: CASH_AWAIT_INV._id },
];

beforeEach(() => {
  window.history.replaceState({}, '', '/billing');
  useData.mockReturnValue({ notify: vi.fn() });
  useAuth.mockReturnValue({ user: { email: 'moon@example.com' } });
  myBillingApi.invoices.mockResolvedValue(invoices);
  myBillingApi.payments.mockResolvedValue(payments);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SiteBilling payment flow', () => {
  it('renders all invoices with their charge rows', async () => {
    render(<Billing />);

    expect((await screen.findAllByText('Invoice #03C8ED')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Invoice #03C964').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Invoice #NV-001').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Room charges').length).toBe(3);
    expect(screen.getAllByText('$320,000').length).toBeGreaterThanOrEqual(1);
  });

  it('keeps Pay now available when a pending CARD payment covers the balance', async () => {
    render(<Billing />);

    await screen.findAllByText('Invoice #03C8ED');
    const payButtons = screen.getAllByRole('button', { name: /Pay now/ });
    expect(payButtons.length).toBe(2);
  });

  it('shows awaiting collection when a pending CASH payment covers the balance', async () => {
    render(<Billing />);

    await screen.findAllByText('Invoice #NV-001');
    expect(screen.getAllByText('Awaiting collection at the hotel').length).toBe(1);
  });

  it('opens the specific invoice payment panel when deep-linked with ?invoice=', async () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: scrollTo });
    window.history.replaceState({}, '', `/billing?invoice=${DEEP_LINK_INV._id}`);
    render(<Billing />);

    await screen.findByText('Amount to pay');
    expect(screen.getByText('Pay with Stripe')).toBeInTheDocument();
    const amountInput = screen.getByLabelText('Amount to pay');
    expect(amountInput.value).toBe('40000');
    expect(window.location.search).toBe(`?invoice=${DEEP_LINK_INV._id}`);
    await waitFor(() => {
      const call = scrollTo.mock.calls.find(([o]) => o && typeof o === 'object');
      expect(call).toBeDefined();
      expect(call[0].top).toBeGreaterThanOrEqual(0);
    });
    // The ?invoice= param is kept in the URL, so a page reload re-opens the
    // same invoice panel instead of dropping back to a collapsed list.
    window.history.replaceState({}, '', `/billing?invoice=${DEEP_LINK_INV._id}`);
    cleanup();
    render(<Billing />);
    expect(await screen.findByText('Amount to pay')).toBeInTheDocument();
    expect(screen.getByText('Pay with Stripe')).toBeInTheDocument();
  });

  it('opens the payment panel when the Pay now button is clicked', async () => {
    render(<Billing />);

    await screen.findAllByText('Invoice #03C8ED');
    fireEvent.click(screen.getAllByRole('button', { name: /Pay now/ })[0]);
    expect(await screen.findByText('Amount to pay')).toBeInTheDocument();
    expect(screen.getByText(/Invoice total \$320,000/)).toBeInTheDocument();
  });
});