import test from 'node:test';
import assert from 'node:assert/strict';
import '../js/planner-core.js';

const { findConflicts, safeWrite, sessionsFor, timeOverlap } = globalThis.PlannerCore;
const schedule = {
  days: ['TUE', 'WED'],
  theorySlots: { TUE: { A1: 0 }, WED: { B1: 1 } },
  labSlots: { TUE: { L1: 0 }, WED: { L2: 1 } },
  theoryTimes: ['09:00–09:50', '10:00–10:50'],
  labTimes: ['09:50–10:40', '11:00–11:50'],
};

test('resolves paired slot codes into each scheduled day', () => {
  assert.deepEqual(sessionsFor('A1+B1', 'theory', schedule), [
    { day: 'TUE', slot: 'A1', idx: 0, type: 'theory', time: '09:00–09:50' },
    { day: 'WED', slot: 'B1', idx: 1, type: 'theory', time: '10:00–10:50' },
  ]);
});

test('rejects slot tokens missing from the schedule', () => {
  assert.throws(() => sessionsFor('A1+Z9', 'theory', schedule), /Slot Z9 not scheduled/);
});

test('treats touching intervals as non-overlapping and partial intersections as clashes', () => {
  assert.equal(timeOverlap('09:00–09:50', '09:50–10:40'), false);
  assert.equal(timeOverlap('09:00–09:50', '09:45–10:35'), true);
  assert.equal(timeOverlap('not a time', '09:00–09:50'), false);
});

test('reports every conflicting pair rather than overwriting earlier conflicts', () => {
  const selected = { first: { id: 'first' }, second: { id: 'second' }, third: { id: 'third' } };
  const sessions = {
    first: [{ day: 'TUE', slot: 'A1', time: '09:00–09:50' }],
    second: [{ day: 'TUE', slot: 'L1', time: '09:45–10:35' }],
    third: [{ day: 'TUE', slot: 'B1', time: '09:20–10:10' }],
  };
  const conflicts = findConflicts(selected, selection => sessions[selection.id]);
  assert.deepEqual(conflicts.first.map(pair => pair.with), ['second', 'third']);
  assert.equal(conflicts.second[0].with, 'first');
  assert.equal(conflicts.third[0].with, 'first');
});

test('safeWrite reports browser storage failures instead of throwing', () => {
  const storage = { setItem() { throw new Error('storage disabled'); } };
  assert.equal(safeWrite(storage, 'planner', {}), false);
});

test('safeWrite serializes valid plans', () => {
  let stored;
  const storage = { setItem(key, value) { stored = [key, value]; } };
  assert.equal(safeWrite(storage, 'planner', { course: 'A1' }), true);
  assert.deepEqual(stored, ['planner', '{"course":"A1"}']);
});
