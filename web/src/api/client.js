// Lớp gọi REST API thật tới Backend Spring Boot (hỗ trợ đổi địa chỉ Local / Demo công khai)

const STORAGE_TOKEN_KEY = 'smart_locker_jwt';
const STORAGE_USER_KEY = 'smart_locker_user';
const STORAGE_API_URL_KEY = 'smart_locker_api_url';

// Mặc định trỏ về cổng 8081 (hoặc biến VITE_API_BASE_URL khi deploy online)
const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

let unauthorizedHandler = null;

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export function getApiBaseUrl() {
  return localStorage.getItem(STORAGE_API_URL_KEY) || DEFAULT_API_URL;
}

export function setApiBaseUrl(url) {
  const clean = (url || DEFAULT_API_URL).trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_API_URL_KEY, clean);
  return clean;
}

export function getSavedToken() {
  return localStorage.getItem(STORAGE_TOKEN_KEY) || '';
}

export function getSavedUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem(STORAGE_TOKEN_KEY, token);
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
}

/**
 * Hàm gọi API chung: tự động gắn JWT, đọc lỗi tiếng Việt từ Backend và xử lý hết phiên 401.
 */
async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = getSavedToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      `Không kết nối được tới máy chủ Backend (${getApiBaseUrl()}). Hãy kiểm tra Backend đã bật chưa.`
    );
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (response.status === 401 && auth) {
    clearSession();
    if (unauthorizedHandler) {
      unauthorizedHandler('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    throw new Error(data?.message || 'Phiên đăng nhập đã hết hạn.');
  }

  if (!response.ok) {
    throw new Error(data?.message || `Yêu cầu thất bại (mã lỗi ${response.status}).`);
  }

  return data;
}

export const authApi = {
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (identifier, password) =>
    request('/api/auth/login', { method: 'POST', body: { identifier, password }, auth: false }),
  forgotPassword: (email) =>
    request('/api/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (email, code, newPassword) =>
    request('/api/auth/reset-password', {
      method: 'POST',
      body: { email, code, newPassword },
      auth: false,
    }),
  me: () => request('/api/users/me'),
};

export const lockerApi = {
  list: () => request('/api/lockers'),
};

export const deliveryApi = {
  create: (lockerId, recipientIdentifier, packageSize) =>
    request('/api/deliveries', {
      method: 'POST',
      body: { lockerId, recipientIdentifier, packageSize },
    }),
  myList: () => request('/api/deliveries/my'),
  getOne: (id) => request(`/api/deliveries/${id}`),
  markReady: (id) => request(`/api/deliveries/${id}/ready`, { method: 'POST' }),
  getOtp: (id) => request(`/api/deliveries/${id}/otp`),
  verifyOtp: (id, code) =>
    request(`/api/deliveries/${id}/otp/verify`, { method: 'POST', body: { code } }),
  resendOtp: (id) => request(`/api/deliveries/${id}/otp/resend`, { method: 'POST' }),
};

export const commandApi = {
  getStatus: (correlationId) => request(`/api/commands/${correlationId}`),
};

export const operatorApi = {
  systemStatus: () => request('/api/operator/system-status'),
  manualOpen: (lockerId, number, reason) =>
    request(`/api/operator/lockers/${lockerId}/compartments/${number}/open`, {
      method: 'POST',
      body: { reason },
    }),
  updateCompartmentStatus: (lockerId, number, status) =>
    request(`/api/operator/lockers/${lockerId}/compartments/${number}/status`, {
      method: 'PATCH',
      body: { status },
    }),
  auditLogs: () => request('/api/operator/audit-logs'),
};

export const adminApi = {
  listUsers: () => request('/api/admin/users'),
  createUser: (payload) => request('/api/admin/users', { method: 'POST', body: payload }),
  updateUserRole: (id, role) =>
    request(`/api/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),
  updateUserActive: (id, active) =>
    request(`/api/admin/users/${id}/active`, { method: 'PATCH', body: { active } }),
  createLocker: (payload) => request('/api/admin/lockers', { method: 'POST', body: payload }),
  addCompartment: (lockerId, size) =>
    request(`/api/admin/lockers/${lockerId}/compartments`, { method: 'POST', body: { size } }),
  updateCompartmentSize: (lockerId, number, size) =>
    request(`/api/admin/lockers/${lockerId}/compartments/${number}/size`, {
      method: 'PATCH',
      body: { size },
    }),
};
