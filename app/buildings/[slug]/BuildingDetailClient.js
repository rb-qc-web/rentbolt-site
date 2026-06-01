"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BoltIcon, BoltIconSolid } from "@/components/BoltIcon";
import { amenityIcons, meta } from "@/lib/brand";
import { ArrowLeft, MapPin, Phone, Mail, CheckCircle } from "lucide-react";

export default function BuildingDetailClient({ building }) {
  const [formSent, setFormSent] = useState(false);
  const beds = building.bedrooms || [];
  const bedLabel =
    beds.length === 0
      ? "Units available"
      : beds
          .map((b) => (b === 0 ? "Studio" : `${b} Bed`))
          .join(", ");

  return (
    <>
      <Header />

      {/* Hero image */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={building.photoUrl}
          alt={building.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/#search"
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium mb-3 transition-colors"
            >
              <ArrowLeft size={14} /> Back to search
            </Link>
            {building.tag && (
              <span className="ml-3 inline-block bg-gold text-navy px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                {building.tag}
              </span>
            )}
            <h1 className="font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              {building.name}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-white/70 text-sm">
              <MapPin size={14} />
              {building.address}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Price + bedroom cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Starting at
                </div>
                <div className="font-display text-3xl font-extrabold text-navy">
                  ${building.startingPrice?.toLocaleString()}
                  <span className="text-base font-medium text-gray-400">/mo</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Available
                </div>
                <div className="font-display text-xl font-extrabold text-navy">
                  {bedLabel}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Region
                </div>
                <div className="font-display text-xl font-extrabold text-navy">
                  {building.city}, {building.region}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="font-display text-xl font-bold text-navy mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-3">
                {(building.amenities || []).map((a) => (
                  <span
                    key={a}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-navy flex items-center gap-2"
                  >
                    <span className="text-lg">{amenityIcons[a] || "·"}</span>
                    {a
                      .split("-")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                  </span>
                ))}
              </div>
            </div>

            {/* Details */}
            {(building.petPolicy || building.parkingInfo || building.applicationProcess) && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold text-navy">Details</h2>
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                  {building.petPolicy && (
                    <div className="p-5">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Pet Policy
                      </div>
                      <p className="text-sm text-gray-600">{building.petPolicy}</p>
                    </div>
                  )}
                  {building.parkingInfo && (
                    <div className="p-5">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Parking
                      </div>
                      <p className="text-sm text-gray-600">{building.parkingInfo}</p>
                    </div>
                  )}
                  {building.applicationProcess && (
                    <div className="p-5">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        How to Apply
                      </div>
                      <p className="text-sm text-gray-600">{building.applicationProcess}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verified badge */}
            <div className="bg-gold-subtle border border-gold-light rounded-2xl p-5 flex items-start gap-4">
              <BoltIcon size={28} />
              <div>
                <h3 className="font-display font-bold text-navy text-base mb-1">
                  RentBolt Verified
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Our agents have visited this building, verified the listing details,
                  and can arrange a private tour at a time that works for you.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar — Contact / Book a Visit */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24 shadow-card">
              <h3 className="font-display font-bold text-navy text-lg mb-1">
                Interested in {building.name}?
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                A RentBolt agent will get back to you within 24 hours.
              </p>

              {formSent ? (
                <div className="text-center py-8">
                  <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                  <p className="font-bold text-navy">Request sent!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    We'll reach out within 24 hours.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy transition-colors"
                  />
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none text-gray-500 focus:border-navy transition-colors">
                    <option>Preferred visit type</option>
                    <option>In-person visit</option>
                    <option>Virtual tour</option>
                    <option>Just have questions</option>
                  </select>
                  <textarea
                    placeholder="Anything else we should know? (move-in date, budget, etc.)"
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-navy transition-colors resize-none"
                  />
                  <button
                    onClick={() => setFormSent(true)}
                    className="w-full bg-navy text-white py-3.5 rounded-xl font-bold text-sm hover:bg-navy-light transition-colors shadow-sm"
                  >
                    Book a Visit
                  </button>
                  <a
                    href={`tel:${meta.phone}`}
                    className="w-full flex items-center justify-center gap-2 border border-gray-200 text-navy py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    <Phone size={14} /> Call Us
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
