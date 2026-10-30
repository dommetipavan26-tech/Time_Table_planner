/**
 * Winter 2026–27 Course Planner — application logic
 */
'use strict';

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = 'winter26-planner-v4';
const LEGACY_STORAGE_KEY = 'winter26-planner-v2';
let selected = loadState();   // sectionKey -> normalised selection
let view = 'courses';         // courses | timetable
let filters = { q: '', branch: 'all', cat: 'all', type: 'all' };
const expandedCourses = new Set();
const SECTION_PREVIEW_LIMIT = 4;

// Keep short cards together and place MGT1040 / STS2011 after the
// embedded theory+lab courses instead of leaving large blank grid tracks.
const COURSE_DISPLAY_ORDER = [
  'MEC3002', 'MEC2018', 'MEC2005', 'MAT1010',
  'ECE2003', 'ECE2006', 'ECE2009', 'ECE3006', 'CSE1022',
  'CSE1005', 'CSE1007', 'CSE1021', 'CSE2007', 'CSE2008',
  'CSE3001', 'CSE3002', 'ECE2015', 'SWE3001', 'SWE2006',
  'MGT1040', 'STS2011',
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const PALETTE = [
  '#4f46e5', '#0ea5e9', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#22c55e', '#06b6d4',
  '#a855f7', '#84cc16', '#f43f5e', '#3b82f6',
];
function colorFor(code) {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function initials(name) {
  return name.replace(/^(dr|prof)\.?\s*/i, '')
    .split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
function sectionKey(course, section) {
  return course.code + '::' + section.code + '::' + section.venue;
}
/** The single active selection for a course component ('theory' | 'lab').
 *  Each course may hold at most one theory slot and one lab slot. */
function selectedOfType(courseCode, type) {
  for (const key in selected) {
    if (selected[key].courseCode === courseCode && selected[key].type === type) {
      return { key, sel: selected[key] };
    }
  }
  return null;
}

/** Next component a course still needs — one theory slot, one lab slot. */
function nextMissingSection(course) {
  if (!selectedOfType(course.code, 'theory')) {
    const theory = course.sections.find(s => s.type === 'theory');
    if (theory) return { section: theory, label: 'theory' };
  }
  if (!selectedOfType(course.code, 'lab')) {
    const lab = course.sections.find(s => s.type === 'lab');
    if (lab) return { section: lab, label: 'lab' };
  }
  return null;
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
      || JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY))
      || {};
  } catch (e) { return {}; }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(selected)); }

/** Rebuild saved selections from the current catalogue.
 *  This drops obsolete records (including the removed MGT1040 lab entries)
 *  and prevents stale localStorage data from recreating the old timetable.
 */
function normaliseSavedSelections() {
  const clean = {};
  const filled = new Set();   // "COURSE::type" that already has its one slot
  for (const saved of Object.values(selected)) {
    const course = COURSES.find(c => c.code === saved.courseCode);
    if (!course) continue;
    const section = course.sections.find(sec =>
      sec.code === saved.sectionCode &&
      sec.venue === saved.venue &&
      sec.type === saved.type
    );
    if (!section) continue;
    // One theory slot + one lab slot per course: drop any extra saved slot.
    const slot = course.code + '::' + section.type;
    if (filled.has(slot)) continue;
    filled.add(slot);
    const key = sectionKey(course, section);
    clean[key] = {
      courseCode: course.code,
      courseName: course.name,
      sectionCode: section.code,
      venue: section.venue,
      faculty: section.faculty,
      type: section.type,
      credits: sectionCredits(course, section.type),
      color: colorFor(course.code),
    };
  }
  selected = clean;
}

/* ------------------------------------------------------------------ */
/* Scheduling                                                          */
/* ------------------------------------------------------------------ */
function sessionsFor(code, type) {
  const parts = code.split('+');
  const out = [];
  const found = new Set();
  for (const day of DAYS) {
    const map = type === 'lab' ? LAB_SLOTS[day] : THEORY_SLOTS[day];
    if (!map) continue;
    for (const p of parts) {
      const idx = map[p];
      if (idx === undefined) continue;
      found.add(p);
      out.push({
        day, slot: p, idx, type,
        time: type === 'lab' ? SLOT_LAB_TIMES[idx] : SLOT_THEORY_TIMES[idx],
      });
    }
  }
  for (const p of parts) {
    if (!found.has(p)) throw new Error(`Slot ${p} not scheduled for section ${code}`);
  }
  out.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.time.localeCompare(b.time));
  return out;
}
function rowOf(session) {
  return session.type === 'lab' ? LAB_ROW[session.idx] : THEORY_ROW[session.idx];
}
function durationMin(timeStr) {
  const m = timeStr.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (!m) return 50;
  return (+m[3] * 60 + +m[4]) - (+m[1] * 60 + +m[2]);
}
function sectionCredits(course, type) {
  if (type === 'lab') return course.labCredits ?? 1;
  // MGT1040 is ETP: its project component has no separate lab/slot row.
  if (course.projectCredits) return (course.theoryCredits || 0) + course.projectCredits;
  return course.theoryCredits ?? course.credits;
}
function totals() {
  let credits = 0, sessions = 0, minutes = 0;
  for (const k in selected) {
    const s = selected[k];
    credits += s.credits;
    const secs = sessionsFor(s.sectionCode, s.type);
    sessions += secs.length;
    minutes += secs.reduce((a, b) => a + durationMin(b.time), 0);
  }
  return { credits, sessions, hours: Math.round((minutes / 60) * 10) / 10 };
}
function parseTime(t) {
  const m = t.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return { start: +m[1] * 60 + +m[2], end: +m[3] * 60 + +m[4] };
}
function timeOverlap(t1, t2) {
  const p1 = parseTime(t1), p2 = parseTime(t2);
  if (!p1 || !p2) return false;
  return p1.start < p2.end && p2.start < p1.end;
}
/**
 * Detect clashes between selected sections.
 * Two sections clash if any of their sessions overlap in time on the
 * same day — e.g. A1+TA1 (FRI 10:00–10:50) vs L21+L22 (FRI 09:50–10:40).
 * Returns a map: sectionKey -> { with: otherKey, clashes: [{day, time1, time2}] }
 */
function findConflicts() {
  const keys = Object.keys(selected);
  if (keys.length < 2) return {};
  const sessionMap = {};
  for (const k of keys) {
    sessionMap[k] = sessionsFor(selected[k].sectionCode, selected[k].type);
  }
  const bad = {};
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const k1 = keys[i], k2 = keys[j];
      const s1 = selected[k1], s2 = selected[k2];
      const clashes = [];
      for (const sess1 of sessionMap[k1]) {
        for (const sess2 of sessionMap[k2]) {
          if (sess1.day === sess2.day && timeOverlap(sess1.time, sess2.time)) {
            clashes.push({
              day: sess1.day,
              time1: sess1.time,
              time2: sess2.time,
              slot1: sess1.slot,
              slot2: sess2.slot,
            });
          }
        }
      }
      if (clashes.length > 0) {
        bad[k1] = { with: k2, clashes };
        bad[k2] = { with: k1, clashes };
      }
    }
  }
  return bad;
}

/* ------------------------------------------------------------------ */
/* Toast                                                               */
/* ------------------------------------------------------------------ */
function toast(msg, kind = 'success', action = null) {
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.innerHTML = `<span class="toast-icon">${kind === 'error' ? '⚠' : '✓'}</span><span class="toast-msg">${esc(msg)}</span>`;
  if (action) {
    const b = document.createElement('button');
    b.className = 'toast-action';
    b.textContent = action.label;
    b.addEventListener('click', () => { action.onClick(); dismiss(); });
    el.appendChild(b);
  }
  $('#toasts').appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  let gone = false;
  function dismiss() {
    if (gone) return; gone = true;
    el.classList.remove('show');
    setTimeout(() => el.remove(), 350);
  }
  setTimeout(dismiss, action ? 6000 : 2800);
}

/* ------------------------------------------------------------------ */
/* Confirm dialog (in-page — native confirm() is blocked in sandboxes) */
/* ------------------------------------------------------------------ */
let closeActiveDialog = null;
function confirmDialog({ title, body, ok = 'Yes, clear all' }) {
  if (closeActiveDialog) closeActiveDialog(false);   // only one dialog at a time
  return new Promise(resolve => {
    const modal = $('#modal');
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = body;
    $('#modal-ok').textContent = ok;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('show'));
    $('#modal-ok').focus();
    function close(result) {
      if (closeActiveDialog !== close) return;
      closeActiveDialog = null;
      modal.classList.remove('show');
      setTimeout(() => { if (!closeActiveDialog) modal.hidden = true; }, 200);
      $('#modal-ok').removeEventListener('click', onOk);
      $('#modal-cancel').removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKey);
      resolve(result);
    }
    closeActiveDialog = close;
    const onOk = () => close(true);
    const onCancel = () => close(false);
    const onBackdrop = e => { if (e.target === modal) close(false); };
    const onKey = e => { if (e.key === 'Escape') close(false); };
    $('#modal-ok').addEventListener('click', onOk);
    $('#modal-cancel').addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);
  });
}

/* ------------------------------------------------------------------ */
/* Clearing                                                            */
/* ------------------------------------------------------------------ */
function refreshAll() {
  saveState();
  renderHeader();
  renderCourses();
  renderTimetable();
}
/**
 * Remove selections matching `pred` (default: everything) after confirmation.
 * Offers a 6-second Undo.
 */
async function clearSelections(pred = () => true, what = 'whole timetable') {
  const keys = Object.keys(selected).filter(k => pred(selected[k]));
  if (keys.length === 0) {
    toast('Nothing to clear', 'info');
    return;
  }
  const credits = keys.reduce((a, k) => a + selected[k].credits, 0);
  const courses = new Set(keys.map(k => selected[k].courseCode)).size;
  const yes = await confirmDialog({
    title: `Clear ${what}?`,
    body: `This removes <b>${keys.length} section${keys.length > 1 ? 's' : ''}</b> across
           <b>${courses} course${courses > 1 ? 's' : ''}</b> (${credits} credits) from your timetable.
           You can undo right after.`,
    ok: what === 'whole timetable' ? 'Yes, clear all' : `Yes, clear ${what}`,
  });
  if (!yes) return;
  const snapshot = { ...selected };
  for (const k of keys) delete selected[k];
  refreshAll();
  toast(`Cleared ${keys.length} section${keys.length > 1 ? 's' : ''}`, 'info', {
    label: 'Undo',
    onClick: () => { selected = snapshot; refreshAll(); toast('Timetable restored'); },
  });
}
function removeOne(key) {
  const s = selected[key];
  if (!s) return;
  delete selected[key];
  refreshAll();
  toast(`Removed ${s.courseCode} · ${s.sectionCode}`, 'info', {
    label: 'Undo',
    onClick: () => { selected[key] = s; refreshAll(); },
  });
}

/* ------------------------------------------------------------------ */
/* Header / navigation                                                 */
/* ------------------------------------------------------------------ */
function renderHeader() {
  const t = totals();
  const picked = Object.keys(selected).length;
  $('#credit-pill').innerHTML = t.credits > 0
    ? `<span class="pill-dot"></span>${t.credits} credits · ${picked} section${picked === 1 ? '' : 's'}`
    : '';
  $('#credit-pill').classList.toggle('show', t.credits > 0);
  $('#hdr-clear').classList.toggle('show', picked > 0);
  $$('.nav-tab').forEach(tab => {
    const active = tab.dataset.view === view;
    tab.classList.toggle('active', active);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
}

/* ------------------------------------------------------------------ */
/* Courses view                                                        */
/* ------------------------------------------------------------------ */
function renderCourses() {
  const q = filters.q.trim().toLowerCase();
  const list = COURSES.filter(c => {
    if (filters.branch !== 'all' && c.branch !== filters.branch) return false;
    if (filters.cat !== 'all' && c.category !== filters.cat) return false;
    if (filters.type !== 'all' && c.type !== filters.type) return false;
    if (q && !(
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q)
    )) return false;
    return true;
  }).sort((a, b) => COURSE_DISPLAY_ORDER.indexOf(a.code) - COURSE_DISPLAY_ORDER.indexOf(b.code));

  const grid = $('#course-grid');
  grid.innerHTML = list.length
    ? list.map(cardHTML).join('')
    : `<div class="empty-card">No courses match your filters. Try clearing the search.</div>`;

  $$('#course-grid [data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const course = COURSES.find(c => c.code === btn.dataset.code);
      const section = course.sections.find(s => s.code === btn.dataset.slot && s.venue === btn.dataset.venue);
      toggleSection(course, section, btn);
    });
  });
  $$('#course-grid [data-register]').forEach(btn => {
    btn.addEventListener('click', () => {
      const course = COURSES.find(c => c.code === btn.dataset.register);
      const missing = nextMissingSection(course);
      if (missing) toggleSection(course, missing.section);
    });
  });
  $$('#course-grid [data-expand]').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.expand;
      if (expandedCourses.has(code)) expandedCourses.delete(code);
      else expandedCourses.add(code);
      renderCourses();
    });
  });

  // hero stats
  const totalSections = COURSES.reduce((a, c) => a + c.sections.length, 0);
  $('#hero-stats').innerHTML = `
    <div class="hero-stat"><b>${COURSES.length}</b><span>courses</span></div>
    <div class="hero-stat"><b>${totalSections}</b><span>sections</span></div>
    <div class="hero-stat"><b>Tue–Sat</b><span>class days</span></div>
    <div class="hero-stat"><b>${COURSES.filter(c => c.credits === 4).length}</b><span>4-credit courses</span></div>`;
}

function cardHTML(course) {
  const color = colorFor(course.code);
  const expanded = expandedCourses.has(course.code);
  const visibleSections = expanded
    ? course.sections
    : course.sections.slice(0, SECTION_PREVIEW_LIMIT);
  const hiddenCount = course.sections.length - visibleSections.length;
  const theoryPick = selectedOfType(course.code, 'theory');
  const labPick = selectedOfType(course.code, 'lab');
  const sections = visibleSections.map(sec => {
    const key = sectionKey(course, sec);
    const isOn = !!selected[key];
    // Only one theory + one lab per course, so a second pick swaps the first.
    const current = sec.type === 'lab' ? labPick : theoryPick;
    const willSwap = !isOn && !!current;
    const sess = sessionsFor(sec.code, sec.type);
    const days = [...new Set(sess.map(s => s.day))].join(' · ');
    return `
      <div class="section-row ${isOn ? 'selected' : ''}" style="--c:${color}">
        <span class="slot-code">${esc(sec.code)}</span>
        <span class="slot-type ${sec.type}">${sec.type === 'lab' ? 'LAB' : 'T'}</span>
        <span class="venue">${esc(sec.venue)}</span>
        ${sec.faculty ? `<span class="prof">${esc(sec.faculty)}</span>` : ''}
        <span class="slot-days">${esc(days)}</span>
        <button class="btn-select ${isOn ? 'on' : ''}${willSwap ? ' swap' : ''}" data-toggle
          data-code="${esc(course.code)}" data-slot="${esc(sec.code)}" data-venue="${esc(sec.venue)}"
          aria-pressed="${isOn}"
          aria-label="${esc(isOn
            ? `Remove ${course.code} ${sec.type} slot ${sec.code} at ${sec.venue}`
            : willSwap
              ? `Swap ${course.code} ${sec.type} slot to ${sec.code} at ${sec.venue}, replacing ${current.sel.sectionCode}`
              : `Select ${course.code} ${sec.type} slot ${sec.code} at ${sec.venue}`)}"
          ${willSwap ? `title="Replaces your current ${sec.type} slot ${esc(current.sel.sectionCode)}"` : ''}>
          ${isOn ? '✓ Selected' : willSwap ? 'Swap' : 'Select'}
        </button>
      </div>`;
  }).join('');
  const missing = nextMissingSection(course);

  return `
    <article class="course-card" style="--c:${color}">
      <header class="card-head">
        <div>
          <div class="code-row">
            <span class="code-chip">${esc(course.code)}</span>
            <span class="cat-badge cat-${esc(course.category)}">${esc(course.category)}</span>
          </div>
          <h3>${esc(course.name)}</h3>
        </div>
        <div class="credit-block">
          <span class="ltp">${course.labCredits
            ? `Theory ${course.theoryCredits} cr + Lab ${course.labCredits} cr`
            : course.projectCredits
              ? `Theory ${course.theoryCredits} cr + Project ${course.projectCredits} cr`
              : `Theory ${course.theoryCredits} cr`}</span>
          <b>${course.credits} CR</b>
        </div>
      </header>
      <div class="meta-row">
        <span class="branch-badge branch-${esc(course.branch)}">${esc(course.branch)}</span>
        <span class="type-badge">${esc(course.type)}</span>
        <span class="pick-rule">${course.labCredits ? '1 theory + 1 lab' : '1 theory slot'}</span>
      </div>
      <div class="sections ${expanded ? 'expanded' : ''}">${sections}</div>
      ${course.sections.length > SECTION_PREVIEW_LIMIT ? `
        <button class="btn-more" data-expand="${esc(course.code)}" aria-expanded="${expanded}">
          ${expanded ? 'Show fewer sections' : `Show ${hiddenCount} more section${hiddenCount === 1 ? '' : 's'}`}
        </button>` : ''}
      ${missing ? `<button class="btn-register" data-register="${esc(course.code)}">+ Add ${missing.label} section</button>` : ''}
    </article>`;
}

function toggleSection(course, section, btn) {
  const key = sectionKey(course, section);
  if (selected[key]) {
    delete selected[key];
    toast(`Removed ${course.code} · ${section.code}`, 'info');
  } else {
    // A course can hold exactly one theory slot and one lab slot, so picking
    // another slot of the same kind swaps it out (an L31+L32 lab is one slot).
    const prev = selectedOfType(course.code, section.type);
    const restore = prev ? { key: prev.key, value: { ...prev.sel } } : null;
    if (restore) delete selected[restore.key];

    selected[key] = {
      courseCode: course.code,
      courseName: course.name,
      sectionCode: section.code,
      venue: section.venue,
      faculty: section.faculty,
      type: section.type,
      credits: sectionCredits(course, section.type),
      color: colorFor(course.code),
    };
    // Prevent clashes instead of leaving error-coloured cells in the plan.
    const clashes = findConflicts();
    const myClash = clashes[key];
    if (myClash) {
      const other = selected[myClash.with];
      const detail = myClash.clashes
        .map(c => `${c.day} ${c.slot1}/${c.slot2} · ${c.time1} ↔ ${c.time2}`).join(' · ');
      delete selected[key];
      if (restore) selected[restore.key] = restore.value;   // keep the old slot
      toast(`Cannot add ${course.code} · ${section.code}: it overlaps with ${other.courseCode} · ${other.sectionCode} — ${detail}`, 'error');
    } else if (restore) {
      toast(`Swapped ${course.code} ${section.type} · ${restore.value.sectionCode} → ${section.code}`, 'info');
    } else {
      toast(`Added ${course.code} · ${section.code} to timetable`);
    }
  }
  saveState();
  renderHeader();
  renderSelections();
  renderCourses();
  if (view === 'timetable') renderTimetable();
}

/* ------------------------------------------------------------------ */
/* Timetable view                                                      */
/* ------------------------------------------------------------------ */
const MATRIX_HEADER = {
  theoryStart: ['08:00','09:00','09:01','10:00','10:01','11:00','11:01','12:00','12:01','—','Lunch','14:00','14:01','15:00','15:01','16:00','16:01','17:00','17:01','18:00','—'],
  theoryEnd:   ['08:50','09:50','09:51','10:50','10:51','11:50','11:51','12:50','12:51','—','Lunch','14:50','14:51','15:50','15:51','16:50','16:51','17:50','17:51','18:50','—'],
  labStart:    ['08:00','08:50','08:51','09:50','09:51','10:40','10:41','11:40','11:41','12:30','Lunch','14:00','14:01','14:50','14:51','15:50','15:51','16:40','16:41','17:40','18:30'],
  labEnd:      ['08:50','09:40','09:41','10:40','10:41','11:30','11:31','12:30','12:31','13:10','Lunch','14:50','14:51','15:40','15:41','16:40','16:41','17:30','17:31','18:30','19:10'],
};

// Column-for-column transcription of the official Winter 2026–27 slot matrix.
const MATRIX_THEORY = {
  TUE: ['TFF1','A1','—','B1','—','TC1','G1','D1','—','—','Lunch','F2','—','A2','—','B2','—','TC2','G2','TDD2','—'],
  WED: ['TGG1','D1','—','F1','—','E1','SC2','B1','—','—','Lunch','D2','—','TF2','G2','E2','SC1','B2','—','TCC2','—'],
  THU: ['TEE1','C1','—','TD1','TG1','TAA1','ECS','TBB1','CLUB','—','Lunch','TE2','SE1','C2','—','TD2','TG2','A2','—','TFF2','—'],
  FRI: ['TCC1','TB1','—','TA1','—','F1','—','TE1','SD2','—','Lunch','C2','—','TB2','—','TA2','—','F2','—','TEE2','—'],
  SAT: ['TDD1','E1','SE2','C1','—','TF1','G1','A1','—','—','Lunch','D2','—','E2','SD1','TAA2','ECS','TBB2','CLUB','TGG2','—'],
};
const MATRIX_LAB = {
  TUE: ['L1','L2','—','L3','—','L4','—','L5','—','L6','Lunch','L31','—','L32','—','L33','—','L34','—','L35','L36'],
  WED: ['L7','L8','—','L9','—','L10','—','L11','—','L12','Lunch','L37','—','L38','—','L39','—','L40','—','L41','L42'],
  THU: ['L13','L14','—','L15','—','L16','—','L17','—','L18','Lunch','L43','—','L44','—','L45','—','L46','—','L47','L48'],
  FRI: ['L19','L20','—','L21','—','L22','—','L23','—','L24','Lunch','L49','—','L50','—','L51','—','L52','—','L53','L54'],
  SAT: ['L25','L26','—','L27','—','L28','—','L29','—','L30','Lunch','L55','—','L56','—','L57','—','L58','—','L59','L60'],
};

function renderTimetable() {
  const t = totals();
  const conflicts = findConflicts();
  const nCourses = new Set(Object.values(selected).map(s => s.courseCode)).size;

  $('#tt-stats').innerHTML = `
    <div class="tt-stat"><b>${nCourses}</b><span>courses</span></div>
    <div class="tt-stat"><b>${Object.keys(selected).length}</b><span>sections</span></div>
    <div class="tt-stat"><b>${t.credits}</b><span>credits</span></div>
    <div class="tt-stat"><b>${t.sessions}</b><span>sessions/wk</span></div>
    <div class="tt-stat"><b>${t.hours}</b><span>hrs/week</span></div>`;

  // Index each selected class by the exact day/type/slot shown in the matrix.
  const assignments = {};
  for (const [selectionKey, s] of Object.entries(selected)) {
    for (const sess of sessionsFor(s.sectionCode, s.type)) {
      const key = `${sess.day}|${s.type}|${sess.slot}`;
      (assignments[key] ||= []).push({ ...s, selectionKey });
    }
  }

  function headerCells(values) {
    return values.map(value => `<th class="matrix-time ${value === 'Lunch' ? 'is-lunch' : ''}">${esc(value)}</th>`).join('');
  }

  function scheduleCell(day, type, slot) {
    if (slot === 'Lunch') return '<td class="matrix-cell is-lunch"><span>Lunch</span></td>';
    if (slot === '—') return '<td class="matrix-cell is-gap"><span>—</span></td>';
    const items = assignments[`${day}|${type}|${slot}`] || [];
    if (!items.length) return `<td class="matrix-cell"><span class="matrix-slot">${esc(slot)}</span></td>`;
    const hasConflict = items.some(item => conflicts[item.selectionKey]);
    const color = items[0].color;
    const title = items.map(item => `${item.courseCode} · ${item.sectionCode} · ${item.venue}`).join(' | ');
    return `<td class="matrix-cell is-selected ${hasConflict ? 'has-overlap' : ''}" style="--c:${color}" title="${esc(title)}">
      <span class="matrix-slot">${esc(slot)}</span>
      ${items.map(item => `<span class="matrix-course"><b>${esc(item.courseCode)}</b><small>${esc(item.venue)}</small></span>`).join('')}
    </td>`;
  }

  const bodyRows = DAYS.map(day => `
    <tr>
      <th class="matrix-day" rowspan="2">${esc(day)}</th>
      <th class="matrix-kind theory-kind">THEORY</th>
      ${MATRIX_THEORY[day].map(slot => scheduleCell(day, 'theory', slot)).join('')}
    </tr>
    <tr>
      <th class="matrix-kind lab-kind">LAB</th>
      ${MATRIX_LAB[day].map(slot => scheduleCell(day, 'lab', slot)).join('')}
    </tr>`).join('');

  $('#tt-grid').innerHTML = `
    ${Object.keys(selected).length === 0 ? `<div class="matrix-empty-note">
      <span class="matrix-empty-icon">＋</span>
      <span><b>No sections selected yet.</b> The complete official slot matrix remains visible below; choose sections from Courses to highlight your classes.</span>
    </div>` : ''}
    <div class="matrix-scroll-note" aria-hidden="true">Scroll horizontally to view the full day →</div>
    <div class="schedule-wrap" id="schedule-capture">
      <table class="schedule-table" aria-label="Winter 2026–27 weekly timetable">
        <thead>
          <tr><th class="matrix-band theory-band" rowspan="2">THEORY</th><th class="matrix-label">Start</th>${headerCells(MATRIX_HEADER.theoryStart)}</tr>
          <tr><th class="matrix-label">End</th>${headerCells(MATRIX_HEADER.theoryEnd)}</tr>
          <tr><th class="matrix-band lab-band" rowspan="2">LAB</th><th class="matrix-label">Start</th>${headerCells(MATRIX_HEADER.labStart)}</tr>
          <tr><th class="matrix-label">End</th>${headerCells(MATRIX_HEADER.labEnd)}</tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;

  const legend = Object.values(selected);
  $('#tt-legend').innerHTML = legend.length
    ? `<span class="legend-title">Selected:</span>` + legend.map(s => `
        <div class="legend-item" style="--c:${s.color}">
          <span class="legend-swatch"></span>
          <span>${esc(s.courseCode)}</span>
          <span class="legend-sec">${esc(s.sectionCode)}</span>
        </div>`).join('')
    : '';

  $('#tt-toolbar').innerHTML = `
    <button class="btn-ghost" id="tt-save-print" title="Print or save as PDF">Print / PDF</button>
    <button class="btn-ghost" id="tt-save-text" title="Download as text file">Save text</button>
    <button class="btn-ghost" id="tt-save-img" title="Download as PNG image">Save image</button>`;
  $('#tt-save-print').addEventListener('click', () => window.print());
  $('#tt-save-text').addEventListener('click', saveTimetableText);
  $('#tt-save-img').addEventListener('click', saveTimetableImage);
  renderSelections(conflicts);
}

/* ------------------------------------------------------------------ */
/* Save timetable                                                       */
/* ------------------------------------------------------------------ */
function saveTimetableText() {
  if (Object.keys(selected).length === 0) { toast('Nothing to save — add sections first', 'error'); return; }
  const lines = ['Winter 2026–27 · Personal Timetable', '='.repeat(70)];
  // Header
  lines.push('');
  lines.push('Period         ' + DAYS.map(d => d.padEnd(20)).join(''));
  lines.push('-'.repeat(110));
  // Build cell map
  const cellMap = {};
  for (const k in selected) {
    const s = selected[k];
    for (const sess of sessionsFor(s.sectionCode, s.type)) {
      const r = rowOf(sess);
      const key = sess.day + '|' + r;
      cellMap[key] = {
        slot: sess.slot,
        courseCode: s.courseCode,
        venue: s.venue,
        time: sess.time,
        type: s.type,
      };
    }
  }
  // Timeline rows
  for (const r of TIMELINE) {
    if (!r.label) continue;
    const cells = DAYS.map(day => {
      const i = TIMELINE.indexOf(r);
      const key = day + '|' + i;
      const c = cellMap[key];
      if (c) {
        const slotLine = `[${c.slot}]`.padEnd(5);
        const info = `${c.courseCode} · ${c.venue}`;
        return (slotLine + info).padEnd(20);
      }
      return ' '.repeat(20);
    }).join('');
    lines.push(r.label.padEnd(13) + cells);
  }
  // Summary
  lines.push('');
  lines.push('-'.repeat(70));
  const t = totals();
  lines.push(`Courses: ${new Set(Object.values(selected).map(s => s.courseCode)).size}`);
  lines.push(`Sections: ${Object.keys(selected).length} (${t.credits} credits)`);
  lines.push(`Sessions/week: ${t.sessions}`);
  lines.push(`Hours/week: ${t.hours}`);
  lines.push('');
  lines.push('Generated: ' + new Date().toLocaleString('en-IN'));
  const text = lines.join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Winter2026-27_timetable.txt';
  a.click();
  URL.revokeObjectURL(url);
  toast('Timetable saved as text file', 'success');
}

function saveTimetableImage() {
  if (Object.keys(selected).length === 0) { toast('Nothing to save — add sections first', 'error'); return; }
  if (typeof html2canvas === 'undefined') {
    toast('Image library not loaded — use Print to save as PDF', 'error');
    return;
  }
  html2canvas($('#tt-grid'), { scale: 2, backgroundColor: '#ffffff' })
    .then(canvas => {
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Winter2026-27_timetable.png';
        a.click();
        URL.revokeObjectURL(url);
        toast('Timetable saved as PNG image', 'success');
      });
    })
    .catch(() => toast('Could not capture image — try Print instead', 'error'));
}

/* ------------------------------------------------------------------ */
/* My selections panel                                                 */
/* ------------------------------------------------------------------ */
function renderSelections(conflicts = findConflicts()) {
  const entries = Object.entries(selected)
    .sort((a, b) => a[1].courseCode.localeCompare(b[1].courseCode) || a[1].type.localeCompare(b[1].type) * -1);
  const n = entries.length;
  const t = totals();
  const nTheory = entries.filter(([, s]) => s.type === 'theory').length;
  const nLab = n - nTheory;

  // clash summary banner
  const clashPairs = new Set();
  for (const k in conflicts) {
    const other = conflicts[k].with;
    clashPairs.add([k, other].sort().join('||'));
  }
  const clashBanner = clashPairs.size > 0
    ? `<div class="clash-banner" id="clash-banner">
         <div class="clash-banner-icon">⚠</div>
         <div class="clash-banner-text">
           <b>${clashPairs.size} timetable clash${clashPairs.size > 1 ? 'es' : ''} detected</b>
           ${Array.from(clashPairs).map(pair => {
             const [k1, k2] = pair.split('||');
             const c1 = selected[k1], c2 = selected[k2];
             const details = conflicts[k1].clashes
               .map(c => `${c.day} ${c.time1} ↔ ${c.time2}`).join(' · ');
             return `<div class="clash-detail">${esc(c1.courseCode)} · ${esc(c1.sectionCode)} clashes with ${esc(c2.courseCode)} · ${esc(c2.sectionCode)} — ${esc(details)}</div>`;
           }).join('')}
         </div>
       </div>`
    : '';

  $('#sel-panel').classList.toggle('empty', n === 0);
  $('#sel-sub').textContent = n
    ? `${n} section${n > 1 ? 's' : ''} · ${nTheory} theory · ${nLab} lab · ${t.credits} credits`
    : 'No sections selected yet — pick some from the Courses tab.';
  $('#sel-clear-all').disabled = n === 0;
  $('#sel-clear-theory').disabled = nTheory === 0;
  $('#sel-clear-labs').disabled = nLab === 0;

  $('#sel-list').innerHTML = clashBanner + (n ? entries.map(([k, s]) => `
    <div class="sel-item ${conflicts[k] ? 'conflict' : ''}" style="--c:${s.color}">
      <span class="sel-swatch"></span>
      <div class="sel-text">
        <div class="sel-line1">
          <b>${esc(s.courseCode)}</b>
          <span class="slot-type ${s.type}">${s.type === 'lab' ? 'LAB' : 'T'}</span>
          <span class="sel-slot">${esc(s.sectionCode)}</span>
          ${conflicts[k] ? `<span class="sel-warn" title="${esc(conflicts[k].clashes.map(c => c.day + ' ' + c.time1 + ' / ' + c.time2).join('; '))}">⚠ clashes with ${esc(selected[conflicts[k].with].courseCode)} · ${esc(selected[conflicts[k].with].sectionCode)}</span>` : ''}
        </div>
        <div class="sel-line2">${esc(s.venue)} ${s.faculty ? '· ' + esc(s.faculty) : ''} · ${s.credits} cr</div>
      </div>
      <button class="sel-remove" data-remove="${esc(k)}" title="Remove this section" aria-label="Remove ${esc(s.courseCode)} ${esc(s.sectionCode)}">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>`).join('') : '');

  $$('#sel-list [data-remove]').forEach(btn =>
    btn.addEventListener('click', () => removeOne(btn.dataset.remove)));
}

/* ------------------------------------------------------------------ */
/* Faculty view                                                        */
/* ------------------------------------------------------------------ */
function renderFaculty() {
  const map = {};
  for (const c of COURSES) {
    for (const f of c.faculty) (map[f] = map[f] || []).push(c);
  }
  const list = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  $('#faculty-grid').innerHTML = list.map(([name, courses]) => {
    const color = colorFor(courses[0].code);
    return `
      <div class="fac-card" style="--c:${color}">
        <div class="avatar lg" style="background:${color}22;color:${color}">${esc(initials(name))}</div>
        <div class="fac-info">
          <h4>${esc(name)}</h4>
          <div class="fac-courses">
            ${courses.map(c => `<span class="fac-course">${esc(c.code)} · ${esc(c.name)}</span>`).join('')}
          </div>
        </div>
        <span class="fac-count">${courses.length} course${courses.length > 1 ? 's' : ''}</span>
      </div>`;
  }).join('');
}

/* ------------------------------------------------------------------ */
/* View switching                                                       */
/* ------------------------------------------------------------------ */
function switchView(v) {
  view = v;
  $$('.view').forEach(sec => sec.classList.toggle('active', sec.id === 'view-' + v));
  renderHeader();
  if (v === 'courses') renderCourses();
  if (v === 'timetable') renderTimetable();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */
function bindFilters() {
  $('#search-input').addEventListener('input', e => { filters.q = e.target.value; renderCourses(); });

  // "/" focuses the search field from anywhere; Escape clears it.
  document.addEventListener('keydown', e => {
    const el = e.target;
    const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    if (e.key === '/' && !typing) {
      e.preventDefault();
      $('#search-input').focus();
      $('#search-input').select();
    }
  });
  $('#search-input').addEventListener('keydown', e => {
    if (e.key === 'Escape' && e.target.value) {
      e.stopPropagation();           // don't let Escape close a dialog too
      e.target.value = '';
      filters.q = '';
      renderCourses();
    }
  });
  $$('.branch-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      filters.branch = chip.dataset.branch;
      $$('.branch-chip').forEach(c => c.classList.toggle('active', c === chip));
      renderCourses();
    });
  });
  $$('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      filters.cat = chip.dataset.cat;
      $$('.cat-chip').forEach(c => c.classList.toggle('active', c === chip));
      renderCourses();
    });
  });
  $$('.type-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      filters.type = chip.dataset.type;
      $$('.type-chip').forEach(c => c.classList.toggle('active', c === chip));
      renderCourses();
    });
  });
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */
function boot() {
  bindFilters();
  normaliseSavedSelections();
  saveState();
  renderHeader();
  renderCourses();
  renderTimetable();
  $$('.nav-tab').forEach(tab => tab.addEventListener('click', () => switchView(tab.dataset.view)));
  $('#sel-clear-all').addEventListener('click', () => clearSelections());
  $('#hdr-clear').addEventListener('click', () => clearSelections());
  $('#sel-clear-theory').addEventListener('click', () => clearSelections(s => s.type === 'theory', 'all theory sections'));
  $('#sel-clear-labs').addEventListener('click', () => clearSelections(s => s.type === 'lab', 'all lab sections'));

  const yearEl = $('#footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Glass header: deepen the frosted panel as soon as the page scrolls.
  const header = document.querySelector('.site-header');
  if (header) {
    const syncHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });
  }
}
document.addEventListener('DOMContentLoaded', boot);
