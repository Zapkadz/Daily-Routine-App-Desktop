import { expect, it } from 'vitest';
import { tomorrowDateKey } from './date';

it.each([
  ['2026-09-30', '2026-10-01'],
  ['2026-12-31', '2027-01-01'],
  ['2028-02-28', '2028-02-29'],
  ['2028-02-29', '2028-03-01'],
  ['2027-02-28', '2027-03-01'],
])('advances the local day from %s to %s', (today, expected) => {
  expect(tomorrowDateKey(today)).toBe(expected);
});
