// Small helpers shared by the therapist's pages (Overview, Children, a child's page, Activities).
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { getPip } from '../data/pips';

// GET /api/children: the numbers of this week and every child with their statistics.
// A login that is no longer valid logs out. Returns { data, error, reload }.
export function useChildren(onLogout) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => {
    api('/api/children')
      .then((d) => { setData(d); setError(''); })
      .catch((e) => (e.status === 401 ? onLogout() : setError(e.message)));
  }, [onLogout]);
  useEffect(reload, [reload]);
  return { data, error, reload };
}

// Dates from the backend are UTC, like "2026-11-01 17:03:22".
export function parseTs(ts) {
  return ts ? new Date(ts.replace(' ', 'T') + 'Z') : null;
}

const dayMonth = (date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// "1 Nov" (in the therapist's time zone)
export function shortDate(ts) {
  const date = parseTs(ts);
  return date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—';
}

// The week the backend counts as "this week" (Monday to Sunday): "26 Oct – 1 Nov 2026".
export function weekRange(weekStart) {
  if (!weekStart) return '';
  const monday = new Date(`${weekStart}T00:00:00Z`);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const year = (d) => d.getUTCFullYear();
  const first = year(monday) === year(sunday) ? dayMonth(monday) : `${dayMonth(monday)} ${year(monday)}`;
  return `${first} – ${dayMonth(sunday)} ${year(sunday)}`;
}

// 288 -> "4h 48m", 42 -> "42m"
export function formatMinutes(minutes) {
  const m = Math.round(minutes || 0);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

// The age is free text in "Add a child": "8" becomes "8 years", "8 years" stays as it is.
export function ageLabel(age) {
  const text = String(age || '').trim();
  if (!/^\d+$/.test(text)) return text;
  return text === '1' ? '1 year' : `${text} years`;
}

export function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

// "Dan’s"
export const possessive = (name) => `${name}’s`;

// The child's chosen Pip; Pip's face when they haven't chosen one yet (like the child's home).
export const avatarOf = (pip) => getPip(pip)?.img || '/resources/icon.png';
// Class for the avatar when there is no Pip yet: Pip's face is small, so it gets a light circle behind it.
export const avatarClass = (pip) => (getPip(pip) ? '' : ' is-default');

// "ready_to_order" -> "Ready to order"
export const sceneName = (id) => id.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// A child who has never played yet ("New", "Getting started").
export const isNew = (child) => !child.last_active;
export const practisedThisWeek = (child) => child.activities_week > 0 || child.practice_days_week > 0;

export const STATUS_OPTIONS = [
  { id: 'all', label: 'All children' },
  { id: 'week', label: 'Practising this week' },
  { id: 'new', label: 'Getting started' },
];

export const SORT_OPTIONS = [
  { id: 'last', label: 'Last active' },
  { id: 'name', label: 'Name' },
];

// Search (name or login code), filter and sort the list of children.
export function filterChildren(children, { search = '', status = 'all', sort = 'last' }) {
  const text = search.trim().toLowerCase();
  const list = children.filter((c) => {
    if (text && !c.name.toLowerCase().includes(text) && !c.code.toLowerCase().includes(text)) return false;
    if (status === 'week') return practisedThisWeek(c);
    if (status === 'new') return isNew(c);
    return true;
  });
  const byName = (a, b) => a.name.localeCompare(b.name);
  if (sort === 'name') return list.sort(byName);
  // Most recent first; children who never played go last.
  return list.sort((a, b) => (b.last_active || '').localeCompare(a.last_active || '') || byName(a, b));
}
