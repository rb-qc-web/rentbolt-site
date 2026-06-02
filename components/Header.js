"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";
import { BoltIcon } from "./BoltIcon";
import { meta } from "@/lib/brand";
import FindAPlaceModal from "./FindAPlaceModal";

const NAV_LINKS = [
  { href: "/", label: "Find a Home" },
  { href: "/landlords", label: "Landlords" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <BoltIcon size={26} />
              <span className="font-display font-extrabold text-xl tracking-tight text-navy">
                RENT<span className="text-navy">BOLT</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-navy rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA + phone */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href={`tel:${meta.phone}`}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-navy transition-colors"
              >
                <Phone size={14} />
                {meta.phone}
              </a>
              <button
                onClick={() => setModalOpen(true)}
                className="bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-navy-light transition-colors shadow-sm"
              >
                Find a Place
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="md:hidden pb-4 animate-slide-up">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 px-4">
                <button
                  onClick={() => { setMobileOpen(false); setModalOpen(true); }}
                  className="block w-full text-center bg-navy text-white px-5 py-3 rounded-xl text-sm font-bold"
                >
                  Find a Place
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <FindAPlaceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
