import { useSyncExternalStore } from 'react';

// True below Tailwind's `md` breakpoint (768px) - the same point where the
// admin swaps its sidebar for the phone header. For screens that render a
// different layout on phones (cards instead of a wide table) rather than
// both layouts with one hidden, so each control exists once in the page.
const QUERY = '(max-width: 767px)';

const subscribe = (onChange) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};

export default function useIsPhone() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
