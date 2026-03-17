import { describe, expect, it } from 'vitest';
import { resolveAvatarUrl } from './api';

describe('resolveAvatarUrl', () => {
  it('returns undefined for empty payload', () => {
    expect(resolveAvatarUrl(null)).toBeUndefined();
  });

  it('returns absolute url when supplied', () => {
    expect(resolveAvatarUrl({ avatar: 'https://example.com/a.png' })).toBe('https://example.com/a.png');
  });

  it('converts relative path to API path', () => {
    expect(resolveAvatarUrl({ profilePicture: '/avatar/me.jpg' })).toBe('http://localhost:8100/m/avatar/me.jpg');
  });
});
