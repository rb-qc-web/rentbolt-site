"use client";

import { useFavourites } from "@/lib/useFavourites";

// Nav link that only appears once something is saved — an empty "Saved (0)"
// is noise for the majority of visitors who never favourite anything.
export default function SavedNavLink({ onClick }) {
  const { count, ready } = useFavourites();
  if (!ready || count === 0) return null;
  return (
    <a href="/saved" className="rb-nav-saved" onClick={onClick}>
      Saved <span className="count">{count}</span>
    </a>
  );
}
