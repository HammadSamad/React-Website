export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

function extractErrorMessage(data) {
  if (!data) return 'The request could not be completed.';
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (data.errorMessage) {
    const err = data.errorMessage;
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    if (err.errmsg) return err.errmsg;
    return JSON.stringify(err);
  }
  return 'The request could not be completed.';
}

export async function api(path, { method = 'GET', body, headers } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.errorMessage) {
    let message = extractErrorMessage(data);
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      message = retryAfter
        ? `Too many attempts. Please wait ${retryAfter} seconds before trying again.`
        : 'Too many attempts. Please wait a moment before trying again.';
    }
    const error = new Error(message);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
}

export async function apiForm(path, { method = 'POST', body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.errorMessage) {
    let message = extractErrorMessage(data);
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      message = retryAfter
        ? `Too many attempts. Please wait ${retryAfter} seconds before trying again.`
        : 'Too many attempts. Please wait a moment before trying again.';
    }
    const error = new Error(message);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
}

function extractArray(data, keys = ['data', 'rooms', 'reservations', 'guests', 'staff', 'invoices', 'housekeeping', 'maintenance', 'feedback', 'services', 'notifications', 'payments', 'reports']) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

export const authApi = {
  login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }),
  register: (username, email, password, phone) => api('/auth/register', { method: 'POST', body: { username, email, password, phone } }),
  verifyEmail: (email, otp) => api('/auth/verify-email', { method: 'POST', body: { email, otp } }),
  resendVerification: (email) => api('/auth/resend-verification', { method: 'POST', body: { email } }),
  forgotPassword: (email) => api('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (email, otp, password) => api('/auth/reset-password', { method: 'POST', body: { email, otp, password } }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  me: () => api('/users/me'),
  updateProfile: (data) => api('/users/profile', { method: 'PUT', body: data }),
  updateProfilePicture: (file) => {
    const fd = new FormData();
    fd.append('profileImage', file);
    return apiForm('/users/profile', { method: 'PUT', body: fd });
  },
  changePassword: (currentPassword, newPassword) => api('/users/change-password', { method: 'PUT', body: { currentPassword, newPassword } }),
  listUsers: () => api('/users'),
  createStaffAccount: (data) => api('/users/staff-account', { method: 'POST', body: data }),
  setUserStatus: (id, status) => api(`/users/${id}/status`, { method: 'PUT', body: { isActive: status === 'active' } }),
};

function formDataToNumericJson(fd) {
  const obj = Object.fromEntries(fd);
  const numericFields = ['roomNumber', 'roomPrice', 'floor', 'maxGuests'];
  for (const key of numericFields) {
    if (obj[key] !== undefined && obj[key] !== '') obj[key] = Number(obj[key]);
  }
  return obj;
}

export const roomsApi = {
  list: () => api('/room/viewRoom').then(extractArray),
  get: (id) => api(`/room/viewRoom/${id}`),
  create: (data) => {
    if (data instanceof FormData && !data.has('images')) return api('/room/addRoom', { method: 'POST', body: formDataToNumericJson(data) });
    if (data instanceof FormData) return apiForm('/room/addRoom', { method: 'POST', body: data });
    return api('/room/addRoom', { method: 'POST', body: data });
  },
  update: (id, data) => {
    if (data instanceof FormData && !data.has('images')) return api(`/room/updateRoom/${id}`, { method: 'PUT', body: formDataToNumericJson(data) });
    if (data instanceof FormData) return apiForm(`/room/updateRoom/${id}`, { method: 'PUT', body: data });
    return api(`/room/updateRoom/${id}`, { method: 'PUT', body: data });
  },
  delete: (id) => api(`/room/deleteRoom/${id}`, { method: 'DELETE' }),
  updateStatus: (id, roomStatus) => api(`/room/updateRoomStatus/${id}`, { method: 'PUT', body: { roomStatus } }),
  search: (query) => api('/room/searchRoom', { method: 'POST', body: query }).then(extractArray),
  filter: (filters) => api('/room/filterRoom', { method: 'POST', body: filters }).then(extractArray),
};

export const reservationsApi = {
  list: () => api('/reservation/viewReservation').then(extractArray),
  get: (id) => api(`/reservation/viewReservation/${id}`),
  create: (data) => api('/reservation/addReservation', { method: 'POST', body: data }),
  update: (id, data) => api(`/reservation/updateReservation/${id}`, { method: 'PUT', body: data }),
  delete: (id) => api(`/reservation/deleteReservation/${id}`, { method: 'DELETE' }),
  cancel: (id, reason) => api(`/reservation/cancelReservation/${id}`, { method: 'PUT', body: { reason } }),
  search: (query) => api('/reservation/searchReservation', { method: 'POST', body: query }).then(extractArray),
  filter: (filters) => api('/reservation/filterReservation', { method: 'POST', body: filters }).then(extractArray),
  availableRooms: (checkIn, checkOut, guests) => api(`/reservation/available?checkInDate=${encodeURIComponent(checkIn)}&checkOutDate=${encodeURIComponent(checkOut)}&numberOfGuests=${guests}`).then(extractArray),
};

export const guestsApi = {
  list: () => api('/guest/viewGuest').then(extractArray),
  get: (id) => api(`/guest/viewGuest/${id}`),
  create: (formData) => apiForm('/guest/addGuest', { method: 'POST', body: formData }),
  update: (id, formData) => apiForm(`/guest/updateGuest/${id}`, { method: 'PUT', body: formData }),
  delete: (id) => api(`/guest/deleteGuest/${id}`, { method: 'DELETE' }),
  search: (query) => api('/guest/searchGuest', { method: 'POST', body: query }).then(extractArray),
};

export const staffApi = {
  list: () => api('/staff/viewStaff').then(extractArray),
  get: (id) => api(`/staff/viewStaff/${id}`),
  create: (formData) => apiForm('/staff/addStaff', { method: 'POST', body: formData }),
  update: (id, formData) => apiForm(`/staff/updateStaff/${id}`, { method: 'PUT', body: formData }),
  delete: (id) => api(`/staff/deleteStaff/${id}`, { method: 'DELETE' }),
  search: (query) => api('/staff/searchStaff', { method: 'POST', body: query }).then(extractArray),
  filter: (filters) => api('/staff/filterStaff', { method: 'POST', body: filters }).then(extractArray),
  updateStatus: (id, status) => api(`/staff/status/${id}`, { method: 'PUT', body: { staffStatus: status } }),
};

export const servicesApi = {
  list: () => api('/service/viewService').then(extractArray),
  get: (id) => api(`/service/viewService/${id}`),
  create: (data) => api('/service/addService', { method: 'POST', body: data }),
  update: (id, data) => api(`/service/updateService/${id}`, { method: 'PUT', body: data }),
  delete: (id) => api(`/service/deleteService/${id}`, { method: 'DELETE' }),
  updateStatus: (id, status) => api(`/service/updateServiceStatus/${id}`, { method: 'PUT', body: { serviceStatus: status } }),
  filter: (filters) => api('/service/filterServices', { method: 'POST', body: filters }).then(extractArray),
};

export const feedbackApi = {
  list: () => api('/feedback/viewFeedback').then(extractArray),
  get: (id) => api(`/feedback/viewFeedback/${id}`),
  create: (data) => api('/feedback/addFeedback', { method: 'POST', body: data }),
  update: (id, data) => api(`/feedback/updateFeedback/${id}`, { method: 'PUT', body: data }),
  delete: (id) => api(`/feedback/deleteFeedback/${id}`, { method: 'DELETE' }),
  filter: (filters) => api('/feedback/filterFeedback', { method: 'POST', body: filters }).then(extractArray),
};

export const checkInOutApi = {
  checkIn: (data) => api('/checkInOut/checkIn', { method: 'POST', body: data }),
  checkOut: (id) => api(`/checkInOut/checkOut/${id}`, { method: 'PUT' }),
  listCheckIns: () => api('/checkInOut/viewCheckIns').then(extractArray),
  listCheckOuts: () => api('/checkInOut/viewCheckOuts').then(extractArray),
  getCheckIn: (id) => api(`/checkInOut/viewCheckIn/${id}`),
};

export const housekeepingApi = {
  list: () => api('/housekeeping/viewHousekeeping').then(extractArray),
  get: (id) => api(`/housekeeping/viewHousekeeping/${id}`),
  create: (data) => api('/housekeeping/addHousekeeping', { method: 'POST', body: data }),
  update: (id, data) => api(`/housekeeping/updateHousekeeping/${id}`, { method: 'PUT', body: data }),
  delete: (id) => api(`/housekeeping/deleteHousekeeping/${id}`, { method: 'DELETE' }),
  updateStatus: (id, status) => api(`/housekeeping/updateHousekeepingStatus/${id}`, { method: 'PUT', body: { taskStatus: status } }),
  filter: (filters) => api('/housekeeping/filterHousekeeping', { method: 'POST', body: filters }).then(extractArray),
};

export const maintenanceApi = {
  list: () => api('/maintenance/viewMaintenance').then(extractArray),
  get: (id) => api(`/maintenance/viewMaintenance/${id}`),
  create: (data) => api('/maintenance/addMaintenance', { method: 'POST', body: data }),
  update: (id, data) => api(`/maintenance/updateMaintenance/${id}`, { method: 'PUT', body: data }),
  delete: (id) => api(`/maintenance/deleteMaintenance/${id}`, { method: 'DELETE' }),
  filter: (filters) => api('/maintenance/filterMaintenance', { method: 'POST', body: filters }).then(extractArray),
};

export const notificationsApi = {
  list: () => api('/notification/viewNotification').then(extractArray),
  get: (id) => api(`/notification/viewNotification/${id}`),
  create: (data) => api('/notification/addNotification', { method: 'POST', body: data }),
  markAsRead: (id) => api(`/notification/markAsRead/${id}`, { method: 'PUT' }),
  delete: (id) => api(`/notification/deleteNotification/${id}`, { method: 'DELETE' }),
  listUnread: () => api('/notification/viewUnreadNotifications').then(extractArray),
};

export const paymentsApi = {
  list: () => api('/payment/viewPayment').then(extractArray),
  get: (id) => api(`/payment/viewPayment/${id}`),
  create: (data) => api('/payment/addPayment', { method: 'POST', body: data }),
  update: (id, data) => api(`/payment/updatePayment/${id}`, { method: 'PUT', body: data }),
  delete: (id) => api(`/payment/deletePayment/${id}`, { method: 'DELETE' }),
  markPaid: (id) => api(`/payment/markPaid/${id}`, { method: 'PUT' }),
  refund: (id) => api(`/payment/refundPayment/${id}`, { method: 'PUT' }),
  stripeCheckout: (data) => api('/stripe/checkout', { method: 'POST', body: data }),
};

export const myBillingApi = {
  invoices: () => api('/billing/invoices').then(extractArray),
  payments: () => api('/billing/payments').then(extractArray),
  pay: (data) => api('/billing/pay', { method: 'POST', body: data }),
  stripeCheckout: (data) => api('/stripe/checkout', { method: 'POST', body: data }),
};

function buildRange(startDate, endDate) {
  const parts = [];
  if (startDate) parts.push(`startDate=${encodeURIComponent(startDate)}`);
  if (endDate) parts.push(`endDate=${encodeURIComponent(endDate)}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export const reportsApi = {
  list: () => api('/report/viewReports').then(extractArray),
  get: (id) => api(`/report/viewReport/${id}`),
  create: (data) => api('/report/createReport', { method: 'POST', body: data }),
  delete: (id) => api(`/report/deleteReport/${id}`, { method: 'DELETE' }),
  occupancy: (startDate, endDate) => api(`/report/occupancyReport${buildRange(startDate, endDate)}`),
  revenue: (startDate, endDate) => api(`/report/revenueReport${buildRange(startDate, endDate)}`),
  booking: (startDate, endDate) => api(`/report/bookingReport${buildRange(startDate, endDate)}`),
  feedback: () => api('/report/feedbackReport'),
  dashboard: (startDate, endDate) => api(`/report/dashboard${buildRange(startDate, endDate)}`),
  exportPdf: (startDate, endDate) => {
    const q = buildRange(startDate, endDate);
    return fetch(`${API_URL}/report/exportPdf${q}`, { credentials: 'include' }).then((r) => {
      if (!r.ok) throw new Error('Could not generate the PDF report.');
      return r.blob();
    });
  },
};

export const invoicesApi = {
  list: () => api('/invoice/viewInvoice').then(extractArray),
  get: (id) => api(`/invoice/viewInvoice/${id}`),
  create: (data) => api('/invoice/addInvoice', { method: 'POST', body: data }),
  update: (id, data) => api(`/invoice/updateInvoice/${id}`, { method: 'PUT', body: data }),
  delete: (id) => api(`/invoice/deleteInvoice/${id}`, { method: 'DELETE' }),
  updatePaymentStatus: (id, status) => api(`/invoice/updatePaymentStatus/${id}`, { method: 'PUT', body: { paymentStatus: status } }),
  downloadPdf: (id) => {
    return fetch(`${API_URL}/invoice/${id}/pdf`, { credentials: 'include' }).then(r => r.blob());
  },
  emailPdf: (id, email) => api(`/invoice/${id}/email`, { method: 'POST', body: { email } }),
};

export const settingsApi = {
  get: () => api('/settings/viewSettings'),
  create: (data) => api('/settings/addSettings', { method: 'POST', body: data }),
  update: (data) => api('/settings/updateSettings', { method: 'PUT', body: data }),
  updateTax: (taxRate) => api('/settings/updateTax', { method: 'PUT', body: { taxPercentage: taxRate } }),
  updateRoomRate: (rate) => api('/settings/updateRoomRate', { method: 'PUT', body: { defaultRoomRate: rate } }),
  getRoles: () => api('/settings/roles'),
  updateRoles: (rolePolicies) => api('/settings/roles', { method: 'PUT', body: { rolePolicies } }),
};

export const aboutApi = {
  get: () => api('/about/viewAbout'),
  create: (formData) => apiForm('/about/addAbout', { method: 'POST', body: formData }),
  update: (formData) => apiForm('/about/editAbout', { method: 'PUT', body: formData }),
};