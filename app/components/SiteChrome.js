"use client";

import { useEffect, useState } from "react";
import SavedNavLink from "@/app/components/SavedNavLink";
import { meta } from "@/lib/brand";

// THE header and footer. Every page uses these.
//
// There were nine hand-written headers and five footers before this, and they
// had drifted into seven different navs across eight pages: one said
// "Properties" where another said "Search", the wordmark was RENTBOLT on some
// pages and RentBolt on others, and the CTA was "Find a Place" or "Start
// Search" depending where you landed. Clicking between pages felt like moving
// between different websites.
//
// The homepage variant is transparent so the navy hero shows through; that is
// the only intended difference.

function Bolt() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" fill="url(#chrome-bolt)" stroke="url(#chrome-bolt)" strokeLinejoin="round" strokeWidth="0.5"/>
      <defs>
        <linearGradient id="chrome-bolt" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#E2C87E"/>
          <stop offset="100%" stopColor="#C9A84C"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/** One nav, in one order, everywhere. */
const NAV = [
  { href: "/search",     label: "Properties" },
  { href: "/#how",       label: "How it works" },
  { href: "/landlords",  label: "Property Owners" },
  { href: "/contact",    label: "Contact" },
];

/**
 * @param {"solid"|"hero"|"static"} variant  "hero" starts transparent over the
 *   homepage's navy hero and turns solid on scroll; everything else sits on a
 *   light page and is solid from the start.
 */
export function SiteHeader({ variant = "solid" }) {
  const [scrolled, setScrolled] = useState(variant !== "hero");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (variant !== "hero") return;           // only the hero variant changes
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  const close = () => setMenuOpen(false);

  return (
    <>
      {/* "static" sits in normal flow rather than fixed, for the search page's
          full-height flex layout where a fixed bar would overlay the filters
          and break the map's height. */}
      <header className={`rb-header${scrolled ? " scrolled" : ""}${variant === "static" ? " rb-header-static" : ""}`}>
        <a href="/" className="rb-logo"><Bolt /> RentBolt</a>
        <nav className="rb-nav">
          {NAV.map(n => <a key={n.href} href={n.href}>{n.label}</a>)}
          <SavedNavLink />
          <a href="/find-a-place" className="rb-nav-cta">Find a Place</a>
        </nav>
        {/* Lived only on the homepage and the landlords page before, so every
            other page was unusable on a phone once the nav collapsed. */}
        <button className="rb-hamburger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu" aria-expanded={menuOpen}>
          <span className={`rb-ham-icon${menuOpen ? " open" : ""}`}>
            <span /><span /><span />
          </span>
        </button>
      </header>

      {menuOpen && (
        <div className="rb-mobile-drawer">
          {NAV.map(n => <a key={n.href} href={n.href} onClick={close}>{n.label}</a>)}
          <a href="/saved" onClick={close}>Saved</a>
          <a href="/find-a-place" className="rb-mobile-cta" onClick={close}>Find a Place →</a>
        </div>
      )}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="rb-footer">
      <div className="rb-fgrid">
        <div className="rb-fbrand">
          <a href="/" className="rb-logo"><Bolt /> RentBolt</a>
          <p className="rb-fdesc">
            Apartments, rooms and homes for rent across Quebec and Ontario.
            Licensed brokerage, and free for renters.
          </p>
        </div>
        <div className="rb-fcol">
          <h4>Renters</h4>
          <ul>
            <li><a href="/search">Browse apartments</a></li>
            <li><a href="/#how">How it works</a></li>
            <li><a href="/#cities">Cities</a></li>
            <li><a href="/find-a-place">Find a Place</a></li>
          </ul>
        </div>
        <div className="rb-fcol">
          <h4>Property Owners</h4>
          <ul>
            <li><a href="/landlords">Our services</a></li>
            <li><a href="https://calendly.com/rentwithbolt/discoverycall">Discovery call</a></li>
            <li><a href="/landlords#faq">Why RentBolt</a></li>
          </ul>
        </div>
        <div className="rb-fcol">
          <h4>Get in touch</h4>
          <ul>
            {/* hello@ is the public address. rent@ is kept for lead handling
                and is not advertised here. */}
            <li><a href={`tel:${meta.phone.replace(/[^\d+]/g, "")}`}>{meta.phone}</a></li>
            <li><a href={`mailto:${meta.emailPublic}`}>{meta.emailPublic}</a></li>
            <li><a href="/contact">227 Galt #320</a></li>
            <li><a href="/contact">Montréal, QC H4G 2P3</a></li>
          </ul>
        </div>
      </div>
      <div className="rb-fbottom">
        <div>© {new Date().getFullYear()} RentBolt · All rights reserved</div>
        <div className="rb-flinks">
          <a href="/contact">Contact</a>
          <a href="/landlords">Property Owners</a>
        </div>
      </div>
    </footer>
  );
}
