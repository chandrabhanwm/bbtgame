import { useState } from 'react';

/**
 * The rotating "Business News" ticker's message log — extracted out of
 * App.tsx per the Phase 0 architecture cleanup. Behavior preserved
 * exactly: keeps the 5 most recent events, newest first.
 */
export function useNewsTicker() {
  const [newsEvents, setNewsEvents] = useState<string[]>([]);
  const pushNewsEvent = (message: string) => {
    setNewsEvents((prev) => [message, ...prev].slice(0, 5));
  };
  return { newsEvents, pushNewsEvent };
}
