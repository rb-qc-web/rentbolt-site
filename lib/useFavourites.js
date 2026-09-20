"use client";

import { useCallback, useEffect, useState } from "react";

// Favourites live in the visitor's browser. No account, no login.
//
// Deliberate trade-off: the list is theirs and disappears if they clear
// storage or switch device. We capture value at the point they ask us to
// email it — see /saved — which is also when the list becomes a lead worth
// acting on.

const KEY = "rentbolt:favourites";
const EVENT = "rentbolt:favourites-changed";

function read() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter(x => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(ids) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
    // Same-tab listeners don't get the native storage event.
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    // Private browsing can refuse writes; favouriting simply won't persist.
  }
}

export function useFavourites() {
  // Starts empty so server and first client render agree, then hydrates.
  const [ids, setIds] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(read());
    setReady(true);
    const sync = () => setIds(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id) => {
    const current = read();
    const next = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id];
    write(next);
    setIds(next);
  }, []);

  const isFavourite = useCallback((id) => ids.includes(id), [ids]);
  const clear = useCallback(() => { write([]); setIds([]); }, []);

  return { ids, count: ids.length, isFavourite, toggle, clear, ready };
}
