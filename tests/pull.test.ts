import { PullEngine } from '../src/pull';

describe('PullEngine.detectConflict', () => {
  test('returns false when local was not modified after last sync', () => {
    const result = PullEngine.detectConflict(
      '2026-01-01T10:00:00Z',
      '2026-01-01T09:00:00Z',
      '2026-01-01T09:00:00Z'
    );
    expect(result).toBe(false);
  });

  test('returns true when both lark and local changed after last sync', () => {
    const result = PullEngine.detectConflict(
      '2026-01-01T11:00:00Z',
      '2026-01-01T09:00:00Z',
      '2026-01-01T10:00:00Z'
    );
    expect(result).toBe(true);
  });

  test('returns false when only lark changed (local unchanged)', () => {
    const result = PullEngine.detectConflict(
      '2026-01-01T11:00:00Z',
      '2026-01-01T09:00:00Z',
      '2026-01-01T09:00:00Z'
    );
    expect(result).toBe(false);
  });
});
