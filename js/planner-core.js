/* Pure planner logic shared by the browser app and Node's built-in tests. */
(function (root) {
  'use strict';

  function sessionsFor(code, type, schedule) {
    const parts = String(code).split('+');
    const table = type === 'lab' ? schedule.labSlots : schedule.theorySlots;
    const times = type === 'lab' ? schedule.labTimes : schedule.theoryTimes;
    const out = [];
    const found = new Set();
    for (const day of schedule.days) {
      const map = table[day];
      if (!map) continue;
      for (const part of parts) {
        const idx = map[part];
        if (idx === undefined) continue;
        found.add(part);
        out.push({ day, slot: part, idx, type, time: times[idx] });
      }
    }
    for (const part of parts) {
      if (!found.has(part)) throw new Error(`Slot ${part} not scheduled for section ${code}`);
    }
    out.sort((a, b) => schedule.days.indexOf(a.day) - schedule.days.indexOf(b.day) || a.time.localeCompare(b.time));
    return out;
  }

  function parseTime(value) {
    const match = String(value).match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return { start: Number(match[1]) * 60 + Number(match[2]), end: Number(match[3]) * 60 + Number(match[4]) };
  }

  function timeOverlap(first, second) {
    const a = parseTime(first), b = parseTime(second);
    return !!(a && b && a.start < b.end && b.start < a.end);
  }

  // Keep every conflicting pair. A section may overlap several other picks
  // when loading legacy or manually edited saved state.
  function findConflicts(selected, resolveSessions) {
    const keys = Object.keys(selected);
    const sessionMap = Object.fromEntries(keys.map((key) => [key, resolveSessions(selected[key])]));
    const conflicts = {};
    const add = (key, other, clashes) => {
      (conflicts[key] ||= []).push({ with: other, clashes });
    };
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        const firstKey = keys[i], secondKey = keys[j];
        const clashes = [];
        for (const first of sessionMap[firstKey]) {
          for (const second of sessionMap[secondKey]) {
            if (first.day === second.day && timeOverlap(first.time, second.time)) {
              clashes.push({ day: first.day, time1: first.time, time2: second.time, slot1: first.slot, slot2: second.slot });
            }
          }
        }
        if (clashes.length) {
          add(firstKey, secondKey, clashes);
          add(secondKey, firstKey, clashes);
        }
      }
    }
    return conflicts;
  }

  function safeWrite(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  root.PlannerCore = Object.freeze({ sessionsFor, parseTime, timeOverlap, findConflicts, safeWrite });
})(globalThis);
