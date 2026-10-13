import { act } from 'react';
import { createRoot } from 'react-dom/client';
import api from './api';
import { useCachedGet, invalidateCached, clearCached, cacheKey, prefetchCached } from './cachedGet';

jest.mock('./api', () => ({ __esModule: true, default: { get: jest.fn() } }));

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function Probe({ url, params }) {
  const { data, loading, error } = useCachedGet(url, params);
  return <p data-testid="out">{loading ? 'loading' : error ? 'error' : JSON.stringify(data)}</p>;
}
// Minimal stand-ins for @testing-library/react, which this project doesn't have.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let roots = [];
function render(ui) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => root.render(ui));
  const handle = { root, el, rerender: (next) => act(() => root.render(next)), unmount: () => { act(() => root.unmount()); el.remove(); } };
  roots.push(handle);
  return handle;
}
const out = () => document.body.querySelector('[data-testid="out"]').textContent;
// Lets settled promises flush their state updates.
const flush = () => act(async () => { await new Promise(r => setTimeout(r, 0)); });
async function waitFor(check) { await flush(); check(); }

afterEach(() => {
  roots.forEach(r => { if (r.el.isConnected) r.unmount(); });
  roots = [];
});

beforeEach(() => {
  clearCached();
  sessionStorage.clear();
  api.get.mockReset();
});

test('cacheKey ignores empty params and param order', () => {
  expect(cacheKey('/x', { b: '2', a: '1', c: '' })).toBe('/x?a=1&b=2');
  expect(cacheKey('/x', { a: '', b: null })).toBe('/x');
});

test('shows a spinner only when nothing is cached', async () => {
  const first = deferred();
  api.get.mockReturnValueOnce(first.promise);
  render(<Probe url="/admin/stats" />);
  expect(out()).toBe('loading');
  await act(async () => first.resolve({ data: { n: 1 } }));
  expect(out()).toBe('{"n":1}');
});

test('returns the cached value first, then the fresh one', async () => {
  api.get.mockResolvedValueOnce({ data: { n: 1 } });
  const { unmount } = render(<Probe url="/admin/stats" />);
  await waitFor(() => expect(out()).toBe('{"n":1}'));
  unmount();

  const second = deferred();
  api.get.mockReturnValueOnce(second.promise);
  render(<Probe url="/admin/stats" />);
  expect(out()).toBe('{"n":1}'); // cached, no spinner on the revisit
  expect(api.get).toHaveBeenCalledTimes(2); // but it still refetches
  await act(async () => second.resolve({ data: { n: 2 } }));
  expect(out()).toBe('{"n":2}');
});

test('survives a reload through sessionStorage', async () => {
  api.get.mockResolvedValueOnce({ data: [1, 2] });
  const { unmount } = render(<Probe url="/admin/live-blog" />);
  await waitFor(() => expect(out()).toBe('[1,2]'));
  unmount();
  // Drop memory only, as a page reload would.
  const stored = { ...sessionStorage };
  clearCached();
  Object.entries(stored).forEach(([k, v]) => sessionStorage.setItem(k, v));

  api.get.mockReturnValueOnce(new Promise(() => {}));
  render(<Probe url="/admin/live-blog" />);
  expect(out()).toBe('[1,2]');
});

test('different params are cached separately', async () => {
  api.get.mockResolvedValueOnce({ data: 'all' });
  const { rerender } = render(<Probe url="/admin/bookings" params={{ status: '' }} />);
  await waitFor(() => expect(out()).toBe('"all"'));
  expect(api.get).toHaveBeenLastCalledWith('/admin/bookings', { params: {} }); // no `status=`
  api.get.mockReturnValueOnce(new Promise(() => {}));
  rerender(<Probe url="/admin/bookings" params={{ status: 'Pending' }} />);
  expect(out()).toBe('loading');
  expect(api.get).toHaveBeenLastCalledWith('/admin/bookings', { params: { status: 'Pending' } });
});

test('invalidation refetches a mounted screen in place, without a spinner', async () => {
  api.get.mockResolvedValueOnce({ data: ['old'] });
  render(<Probe url="/admin/panchangam" />);
  await waitFor(() => expect(out()).toBe('["old"]'));

  const fresh = deferred();
  api.get.mockReturnValueOnce(fresh.promise);
  let done;
  act(() => { done = invalidateCached('/admin/panchangam'); });
  expect(out()).toBe('["old"]');
  await act(async () => { fresh.resolve({ data: ['new'] }); await done; });
  expect(out()).toBe('["new"]');
});

test('invalidation drops entries no screen is showing, including other params', async () => {
  api.get.mockResolvedValueOnce({ data: 'pending' });
  const { unmount } = render(<Probe url="/admin/bookings" params={{ status: 'Pending' }} />);
  await waitFor(() => expect(out()).toBe('"pending"'));
  unmount();

  await invalidateCached('/admin/bookings');
  expect(Object.keys(sessionStorage).some(k => k.includes('/admin/bookings'))).toBe(false);
  api.get.mockReturnValueOnce(new Promise(() => {}));
  render(<Probe url="/admin/bookings" params={{ status: 'Pending' }} />);
  expect(out()).toBe('loading');
});

test('a response that was in flight during an invalidation is not cached', async () => {
  const stale = deferred();
  api.get.mockReturnValueOnce(stale.promise);
  prefetchCached('/admin/stats');
  await invalidateCached('/admin/stats');
  await act(async () => stale.resolve({ data: 'stale' }));

  api.get.mockReturnValueOnce(new Promise(() => {}));
  render(<Probe url="/admin/stats" />);
  expect(out()).toBe('loading');
});

test('prefetch shares the request a page then mounts with, and skips fresh keys', async () => {
  const req = deferred();
  api.get.mockReturnValueOnce(req.promise);
  prefetchCached('/admin/live-blog');
  render(<Probe url="/admin/live-blog" />);
  expect(api.get).toHaveBeenCalledTimes(1);
  await act(async () => req.resolve({ data: ['x'] }));
  expect(out()).toBe('["x"]');
  prefetchCached('/admin/live-blog');
  expect(api.get).toHaveBeenCalledTimes(1);
});

test('an error with nothing cached is reported', async () => {
  api.get.mockRejectedValueOnce(new Error('down'));
  render(<Probe url="/admin/stats" />);
  await waitFor(() => expect(out()).toBe('error'));
});
