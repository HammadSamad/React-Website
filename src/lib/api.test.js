import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, apiForm, roomsApi, API_URL, apiClient } from './api.js';

const mockRequest = vi.fn();

function resolveWith(data, status = 200) {
  mockRequest.mockResolvedValue({ data, status });
}

function rejectWith(message, status, extraHeaders = {}, data) {
  if (data === undefined) data = { errorMessage: message };
  mockRequest.mockRejectedValue({
    response: { data, status, headers: { ...extraHeaders } },
  });
}

beforeEach(() => {
  mockRequest.mockReset();
  vi.spyOn(apiClient, 'request').mockImplementation(mockRequest);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('API_URL', () => {
  it('defaults to localhost:3000/api', () => {
    expect(API_URL).toBe('http://localhost:3000/api');
  });
});

describe('apiClient', () => {
  it('uses the backend base URL and preserves cookie credentials', () => {
    expect(apiClient.defaults.baseURL).toBe(API_URL);
    expect(apiClient.defaults.withCredentials).toBe(true);
  });
});

describe('api()', () => {
  it('returns response data on success', async () => {
    resolveWith({ data: 'ok' });
    const result = await api('/test');
    expect(result).toEqual({ data: 'ok' });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/test', method: 'GET' })
    );
  });

  it('sends POST request with JSON body', async () => {
    resolveWith({ success: true });
    await api('/test', { method: 'POST', body: { name: 'test' } });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/test', method: 'POST', data: { name: 'test' } })
    );
  });

  it('throws error on non-ok response', async () => {
    rejectWith('Not found', 404);
    await expect(api('/missing')).rejects.toThrow('Not found');
  });

  it('attaches status and code to thrown errors', async () => {
    rejectWith('Bad', 400, {}, { errorMessage: 'Bad request', code: 'BAD_INPUT' });
    try {
      await api('/bad');
      throw new Error('should not reach');
    } catch (error) {
      expect(error.status).toBe(400);
      expect(error.code).toBe('BAD_INPUT');
    }
  });

  it('handles 429 rate limit with Retry-After header', async () => {
    rejectWith('', 429, { 'retry-after': '30' }, {});
    await expect(api('/rate-limited')).rejects.toThrow('30');
  });

  it('returns default error message when no message provided', async () => {
    rejectWith('', 500, {}, {});
    await expect(api('/error')).rejects.toThrow('The request could not be completed.');
  });

  it('extracts the backend message from real axios v1 errors', async () => {
    mockRequest.mockRejectedValue({
      isAxiosError: true,
      status: 403,
      message: 'Request failed with status code 403',
      response: {
        status: 403,
        headers: {},
        data: { message: 'This account has been deactivated.' },
      },
    });
    try {
      await api('/auth/login', { method: 'POST', body: { email: 'a@b.c', password: 'x' } });
      throw new Error('should not reach');
    } catch (error) {
      expect(error.message).toBe('This account has been deactivated.');
      expect(error.status).toBe(403);
    }
  });
});

describe('apiForm()', () => {
  it('sends FormData without a JSON content type', async () => {
    resolveWith({ id: 1 });
    const fd = new FormData();
    fd.append('name', 'test');
    await apiForm('/upload', { body: fd });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/upload', data: fd })
    );
  });

  it('throws error on failure', async () => {
    rejectWith('Upload failed', 500);
    await expect(apiForm('/upload', { body: new FormData() })).rejects.toThrow('Upload failed');
  });
});

describe('roomsApi.available()', () => {
  it('requests the public availability endpoint with the selected dates', async () => {
    resolveWith([{ _id: 'r1', roomStatus: 'available', available: true }]);
    const result = await roomsApi.available('2026-01-10', '2026-01-13');
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/room/available?checkInDate=2026-01-10&checkOutDate=2026-01-13',
        method: 'GET',
      })
    );
    expect(result).toEqual([{ _id: 'r1', roomStatus: 'available', available: true }]);
  });

  it('adds the guest count when supplied', async () => {
    resolveWith([]);
    await roomsApi.available('2026-01-10', '2026-01-13', 3);
    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/room/available?checkInDate=2026-01-10&checkOutDate=2026-01-13&numberOfGuests=3',
      })
    );
  });
});