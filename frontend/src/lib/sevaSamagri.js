/* Materials (samagri) lists for select sevas, as supplied by the temple.
   The lists live on the backend (app/data/seva_samagri.json) and are read from
   GET /api/sevas/{id}/samagri, the same endpoint the Darshan gateway uses, so
   the site and SoHum show one list. Each item is { en, te, qty?, optional?,
   note? } or a group { en, te, children: [...] }.
   undefined while loading; null when the seva has no list. */
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export function useSevaSamagri(sevaId) {
  const [items, setItems] = useState(undefined);
  useEffect(() => {
    let live = true;
    setItems(undefined);
    api.get(`/sevas/${sevaId}/samagri`)
      .then(r => { if (live) setItems(r.data.items); })
      .catch(() => { if (live) setItems(null); });
    return () => { live = false; };
  }, [sevaId]);
  return items;
}

// Display order given by the temple for the Pratyaksha Seva list, A through O.
// Sevas not on this list keep their existing relative order, after these.
export const SEVA_PRIORITY_ORDER = [
  '93a765c0-33bd-40c3-85fa-29449f297659', // A) Nija Rudra Abhishekam
  '0d3dbbc7-a0b2-4ecd-a19a-1d3321850e46', // B) Rudrabhishekam
  '3f827b4b-2c41-402e-844b-d87b8635c93c', // C) Archana
  '84922da6-488b-4093-8a4a-62815890b3dc', // D) Hanuman Abhishekam
  '390ea5a1-23b2-4723-bb6c-bf3cbdcc85f5', // D) Yellamma Bonam
  'b8bd0ca3-3bc4-4c97-9d31-4e9bd380f14a', // E) Sri Satyanarayana Swamy Vratam
  'fabe8faa-f7a1-47c5-a3ca-4d7d500d662f', // F) Laksha Pushparchana
  '1f6dec8c-4b23-4c22-908c-209aa95fa507', // G) Masa Kalyanam
  '9a747367-c76b-4e7c-8bd4-fc42982b2a0d', // H) Kumkumarchana
  '75505f16-8d3a-4324-af13-8c6d5b2ca7aa', // I) Kode Trippi Kattuta
  '2d634010-82b3-4de4-ac03-670621ec9fa9', // J) Pallaki Seva
  '3a224812-4900-4382-b2dc-46d63f4e3bdc', // K) Dwichakra Vahanamu Pooja
  'b0f1d7d2-4947-4913-a0a6-e61f5ff3e387', // L) Tri Chakra Vahanamu Pooja
  'ef56f8d5-c485-4283-8211-7bba1782f0da', // M) Chathushchakra Vahana Pooja
  '72aee361-4053-4a3d-b225-d35406532db5', // N) Bhari Vahana Pooja
  '5aa77829-8fb5-4763-a903-2ff014e1b4ff', // O) Vivaham
];

export function sortByPriority(sevas) {
  const rank = new Map(SEVA_PRIORITY_ORDER.map((id, i) => [id, i]));
  return [...sevas].sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id) : Infinity;
    const rb = rank.has(b.id) ? rank.get(b.id) : Infinity;
    return ra - rb;
  });
}
