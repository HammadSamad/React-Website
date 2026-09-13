import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, apiForm, API_URL } from './api.js';

describe('API_URL', () => {
  it('defaults to localhost:3000/api', () => {
    expect(API_URL).toBe('http://localhost:3000/api');
  });
});

describe('api()', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends GET request with credentials', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ data: 'ok' }) });
    const result = await api('/test');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/test',
      expect.objectContaining({ method: 'GET', credentials: 'include' })
    );
    expect(result).toEqual({ data: 'ok' });
  });

  it('sends POST request with JSON body', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
    await api('/test', { method: 'POST', body: { name: 'test' } });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('throws error on non-ok response', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ errorMessage: 'Not found' }),
    });
    await expect(api('/missing')).rejects.toThrow('Not found');
  });

  it('handles 429 rate limit with Retry-After header', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: () => '30' },
      json: () => Promise.resolve({}),
    });
    await expect(api('/rate-limited')).rejects.toThrow('30');
  });

  it('returns default error message when no message provided', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      headers: { get: () => null },
      json: () => Promise.resolve({}),
    });
    await expect(api('/error')).rejects.toThrow('The request could not be completed.');
  });
});

describe('apiForm()', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends FormData without Content-Type header', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) });
    const fd = new FormData();
    fd.append('name', 'test');
    await apiForm('/upload', { body: fd });
    const [, options] = fetch.mock.calls[0];
    expect(options.body).toBe(fd);
  });

  it('throws error on failure', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ errorMessage: 'Upload failed' }),
    });
    const fd = new FormData();
    await expect(apiForm('/upload', { body: fd })).rejects.toThrow('Upload failed');
  });
});
