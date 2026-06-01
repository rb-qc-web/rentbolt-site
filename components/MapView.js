"use client";

import { useEffect, useRef } from "react";

export default function MapView({ buildings = [], hoveredId, onPinClick, center, zoom }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined" || !window.L || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    const L = window.L;
    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([center?.lat || 45.5, center?.lng || -75.5], zoom || 6);

    L.control.zoom({ position: "bottomright" }).addTo(mapInstanceRef.current);

    // Clean light tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
  }, []);

  // Fly to center when it changes
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    mapInstanceRef.current.flyTo([center.lat, center.lng], zoom || 12, { duration: 1 });
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined" || !window.L) return;
    const L = window.L;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    buildings.forEach((b) => {
      if (!b.lat || !b.lng) return;
      const hov = hoveredId === b.id;
      const icon = L.divIcon({
        className: "rb-marker",
        html: `<div class="rb-pin ${hov ? "rb-pin-active" : ""}">$${b.startingPrice?.toLocaleString()}+</div>`,
        iconSize: [0, 0],
        iconAnchor: [44, 18],
      });
      const marker = L.marker([b.lat, b.lng], { icon }).addTo(mapInstanceRef.current);
      marker.on("click", () => onPinClick?.(b.id));
      markersRef.current.push(marker);
    });
  }, [buildings, hoveredId, onPinClick]);

  return (
    <div ref={mapRef} className="w-full h-full" style={{ background: "#EEF0F4", minHeight: 400 }} />
  );
}
