import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAllFromApi, resolveAvatarUrl, type DateRange } from './api';

describe('resolveAvatarUrl', () => {
  it('returns undefined for empty payload', () => {
    expect(resolveAvatarUrl(null)).toBeUndefined();
  });

  it('returns absolute url when supplied', () => {
    expect(resolveAvatarUrl({ avatar: 'https://example.com/a.png' })).toBe('https://example.com/a.png');
  });

  it('converts relative path using API base', () => {
    expect(resolveAvatarUrl({ profilePicture: '/avatar/me.jpg' })).toBe('/m/avatar/me.jpg');
  });
});

describe('fetchAllFromApi', () => {
  const range: DateRange = { from: '2025-09-01', to: '2026-06-30' };
  type FetchCall = [string, RequestInit];

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends required eAsistent app headers with every request', async () => {
    await fetchAllFromApi(range);

    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as FetchCall[];
    expect(calls.length).toBeGreaterThan(0);
    for (const [, init] of calls) {
      const headers = init?.headers as Record<string, string>;
      expect(headers['x-app-name']).toBe('child');
      expect(headers['x-client-version']).toBe('11101');
      expect(headers['x-client-platform']).toBe('android');
      expect(headers['app']).toBe('new_mobile_app');
      expect(headers['Content-Type']).toBe('application/json');
    }
  });

  it('does not include from/to date params on the evaluations endpoint', async () => {
    await fetchAllFromApi(range);

    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as FetchCall[];
    const evaluationsCall = calls.find(([url]) => (url as string).includes('/evaluations'));
    expect(evaluationsCall).toBeDefined();
    const url = evaluationsCall![0] as string;
    expect(url).not.toContain('from=');
    expect(url).not.toContain('to=');
    expect(url).toContain('filter=future');
  });

  it('includes from/to date params on grades, absences and homework endpoints', async () => {
    await fetchAllFromApi(range);

    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as FetchCall[];
    for (const endpoint of ['/grades', '/absences', '/homework']) {
      const call = calls.find(([url]) => (url as string).includes(endpoint));
      expect(call, `expected a fetch call for ${endpoint}`).toBeDefined();
      const url = call![0] as string;
      expect(url).toContain('from=2025-09-01');
      expect(url).toContain('to=2026-06-30');
    }
  });
});
