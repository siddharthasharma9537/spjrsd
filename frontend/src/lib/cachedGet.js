import { useEffect, useReducer, useRef, useState } from 'react';
import api from './api';

// Stale-while-revalidate for admin GETs: a revisited screen renders its last
// response at once and quietly refetches, instead of "Loading..." on every
// visit. Kept in memory plus sessionStorage (so a reload in the same tab is
// fast too); cleared on login/logout so one account never sees another's
// cached figures.

const STORAGE_PREFIX = 'admin-get:';
// A hover-prefetch skips the request if this key was fetched this recently.
const PREFETCH_FRESH_MS = 30000;

const memory = new Map();    // key -> { data, at }
const inflight = new Map();  // key -> promise
const requests = new Map();  // key -> { url, params }
const listeners = new Map(); // key -> Set<fn>

// Unset filters ('' / null) are left off the request entirely, as the
// screens did before, so `{ status: '' }` and `{}` are the same request.
function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params || {})
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

export function cacheKey(url, params) {
  const qs = new URLSearchParams(cleanParams(params)).toString();
  return qs ? `${url}?${qs}` : url;
}

function read(key) {
  if (memory.has(key)) return memory.get(key);
  try {
    const stored = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (stored) {
      const entry = JSON.parse(stored);
      memory.set(key, entry);
      return entry;
    }
  } catch { /* unreadable or blocked: just a cache miss */ }
  return undefined;
}

function write(key, data) {
  const entry = { data, at: Date.now() };
  memory.set(key, entry);
  // A list too big for the quota still works from memory for this visit.
  try { sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry)); } catch { /* memory only */ }
  listeners.get(key)?.forEach(fn => fn());
}

export function fetchCached(url, params) {
  const key = cacheKey(url, params);
  requests.set(key, { url, params });
  if (inflight.has(key)) return inflight.get(key);
  const p = api.get(url, { params: cleanParams(params) }).then(r => {
    // Dropped by an invalidation while in flight: this response may predate
    // the write, so it must not land in the cache.
    if (inflight.get(key) === p) write(key, r.data);
    return r.data;
  }).finally(() => {
    if (inflight.get(key) === p) inflight.delete(key);
  });
  inflight.set(key, p);
  return p;
}

export function prefetchCached(url, params) {
  const entry = read(cacheKey(url, params));
  if (entry && Date.now() - entry.at < PREFETCH_FRESH_MS) return;
  fetchCached(url, params).catch(() => { /* the page's own fetch will show the error */ });
}

// Call after a write. Every cached variant of `url` (any params) is dropped;
// the ones a mounted screen is showing are refetched in place, so the list
// updates without flashing back to "Loading...".
export function invalidateCached(url) {
  const matches = (key) => key === url || key.startsWith(`${url}?`);
  const keys = new Set([...memory.keys(), ...inflight.keys(), ...requests.keys()].filter(matches));
  try {
    Object.keys(sessionStorage)
      .filter(k => k.startsWith(STORAGE_PREFIX) && matches(k.slice(STORAGE_PREFIX.length)))
      .forEach(k => keys.add(k.slice(STORAGE_PREFIX.length)));
  } catch { /* nothing stored */ }
  const refetches = [];
  keys.forEach(key => {
    inflight.delete(key);
    if (listeners.get(key)?.size && requests.has(key)) {
      const { url: u, params } = requests.get(key);
      refetches.push(fetchCached(u, params).catch(() => {}));
    } else {
      memory.delete(key);
      try { sessionStorage.removeItem(STORAGE_PREFIX + key); } catch { /* already gone */ }
    }
  });
  return Promise.all(refetches);
}

export function clearCached() {
  memory.clear();
  inflight.clear();
  try {
    Object.keys(sessionStorage).filter(k => k.startsWith(STORAGE_PREFIX)).forEach(k => sessionStorage.removeItem(k));
  } catch { /* nothing stored */ }
}

// { data, loading, error, refresh }. `loading` is true only when there is
// nothing cached to show yet; a background refetch never sets it.
export function useCachedGet(url, params) {
  const key = cacheKey(url, params);
  const [, rerender] = useReducer(n => n + 1, 0);
  const [error, setError] = useState(null);
  const latest = useRef({ url, params });
  latest.current = { url, params };

  useEffect(() => {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(rerender);
    let active = true;
    setError(null);
    fetchCached(latest.current.url, latest.current.params).catch(err => { if (active) setError(err); });
    return () => {
      active = false;
      listeners.get(key).delete(rerender);
    };
  }, [key]);

  const data = read(key)?.data;
  return {
    data,
    loading: data === undefined && !error,
    error,
    refresh: () => fetchCached(latest.current.url, latest.current.params),
  };
}
