import { useEffect, useState } from 'react';

const toISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// One shared timer for the whole app so every "now" is consistent and
// rolls over exactly with the user's system clock (checked every 30s).
let nowValue = new Date();
const listeners = new Set();

if (typeof window !== 'undefined') {
  setInterval(() => {
    nowValue = new Date();
    listeners.forEach((fn) => fn(nowValue));
  }, 30000);
}

// Live Date — re-renders subscribers whenever the clock ticks.
export function useNow() {
  const [now, setNow] = useState(nowValue);
  useEffect(() => {
    listeners.add(setNow);
    setNow(nowValue);
    return () => listeners.delete(setNow);
  }, []);
  return now;
}

// Live ISO "today" (YYYY-MM-DD) from the current system time.
export function useToday() {
  const now = useNow();
  return toISO(now);
}

export const toISODate = toISO;