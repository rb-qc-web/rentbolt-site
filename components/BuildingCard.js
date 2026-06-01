"use client";

import Link from "next/link";
import { amenityIcons } from "@/lib/brand";

export default function BuildingCard({ building, isHovered, onHover, onLeave }) {
  const beds = building.bedrooms || [];
  const bedLabel =
    beds.length === 0
      ? ""
      : beds.length === 1
      ? beds[0] === 0
        ? "Studio"
        : `${beds[0]} Bed`
      : `${beds[0] === 0 ? "Studio" : beds[0] + " Bed"} – ${beds[beds.length - 1]} Bed`;

  return (
    <Link href={`/buildings/${building.slug}`}>
      <div
        onMouseEnter={() => onHover?.(building.id)}
        onMouseLeave={onLeave}
        className={`
          bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
          ${isHovered
            ? "border-gold shadow-card-hover -translate-y-0.5"
            : "border-gray-200 shadow-card"
          }
        `}
        style={{ borderWidth: "1.5px", borderStyle: "solid" }}
      >
        {/* Photo */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={building.photoUrl}
            alt={building.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isHovered ? "scale-105" : "scale-100"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />

          {building.tag && (
            <span
              className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                building.tag === "New"
                  ? "bg-gold text-navy"
                  : building.tag === "Featured"
                  ? "bg-navy text-white"
                  : "bg-navy-light text-white"
              }`}
            >
              {building.tag === "Featured" && "⚡ "}
              {building.tag}
            </span>
          )}

          {/* Price badge */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-baseline gap-1">
            <span className="text-navy text-lg font-extrabold tracking-tight">
              ${building.startingPrice?.toLocaleString()}
            </span>
            <span className="text-gray-400 text-xs font-medium">/mo</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-display text-base font-bold text-navy leading-snug mb-1">
            {building.name}
          </h3>
          <p className="text-sm text-gray-500 truncate mb-3">{building.address}</p>

          <div className="flex justify-between items-center">
            {bedLabel && (
              <span className="bg-gold-subtle text-navy px-2.5 py-1 rounded-md text-xs font-semibold">
                {bedLabel}
              </span>
            )}
            <div className="flex gap-1.5">
              {(building.amenities || []).slice(0, 4).map((a) => (
                <span
                  key={a}
                  title={a}
                  className="w-7 h-7 flex items-center justify-center bg-gray-50 rounded-md border border-gray-200 text-sm"
                >
                  {amenityIcons[a] || "·"}
                </span>
              ))}
            </div>
          </div>

          <div
            className={`mt-3 text-center py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              isHovered
                ? "bg-navy text-white"
                : "bg-transparent text-navy border border-gray-200"
            }`}
          >
            {isHovered ? "Check Availability →" : "View Building"}
          </div>
        </div>
      </div>
    </Link>
  );
}
