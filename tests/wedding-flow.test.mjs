import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFlowEntry, compareFlowEntries } from '../lib/wedding-flow.ts';
function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ event_id: '1', title: ' Dinner ', side: 'BOTH', category: 'Menu', time: '19:30', ...overrides })) data.set(key, value);
  return data;
}
test('validates and normalizes event entries', () => {
  assert.deepEqual(parseFlowEntry(form()).data, { event_id: 1, title: 'Dinner', side: 'BOTH', category: 'Menu', time: '19:30', owner: null, notes: null });
  assert.equal(parseFlowEntry(form({ time: '' })).data.time, null);
});
test('rejects invalid event IDs, categories, sides, times and oversized fields', () => {
  for (const invalid of [{ event_id: '' }, { event_id: '1.2' }, { side: 'UNKNOWN' }, { category: 'Invalid' }, { title: '  ' }, { title: 'a'.repeat(201) }, { time: '24:00' }, { time: '12:60' }, { owner: 'a'.repeat(121) }, { notes: 'a'.repeat(4001) }]) assert.ok(parseFlowEntry(form(invalid)).error);
});
test('sorts chronologically with untimed entries last and stable ties', () => {
  const entries = [{ id: 4, time: null }, { id: 3, time: '18:00:00' }, { id: 2, time: '09:00:00' }, { id: 1, time: '09:00:00' }];
  assert.deepEqual(entries.sort(compareFlowEntries).map(e => e.id), [1, 2, 3, 4]);
});
