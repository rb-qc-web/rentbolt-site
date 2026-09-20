"use client";

import { useFavourites } from "@/lib/useFavourites";

export default function FavouriteButton({ id, className = "" }) {
  const { isFavourite, toggle, ready } = useFavourites();
  const on = ready && isFavourite(id);

  return (
    <button
      type="button"
      className={`rb-fav${on ? " on" : ""} ${className}`}
      aria-label={on ? "Remove from saved" : "Save this building"}
      aria-pressed={on}
      onClick={(e) => {
        // Cards are links; don't navigate when the heart is clicked.
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
    >
      <svg viewBox="0 0 24 24" fill={on ? "currentColor" : "none"}
           stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.7-7.7 1.1-1.1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  );
}
