"use client";

import SavedNavLink from "@/app/components/SavedNavLink";

function Bolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

/** Site header. `scrolled` styling is applied permanently on interior pages,
 *  which have a light background rather than the homepage's navy hero. */
export function SiteHeader() {
  return (
    <header className="rb-header scrolled">
      <a href="/" className="rb-logo"><Bolt /> RentBolt</a>
      <nav className="rb-nav">
        <a href="/search">Search</a>
        <a href="/landlords">Property Owners</a>
        <SavedNavLink />
        <a href="/find-a-place" className="rb-nav-cta">Start Search</a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="rb-footer">
      <div className="rb-fgrid">
        <div className="rb-fbrand">
          <a href="/" className="rb-logo"><Bolt /> RentBolt</a>
          <p className="rb-fdesc">
            Apartments, rooms and homes for rent across Canada. Your trusted partner for apartment hunting.
          </p>
        </div>
        <div className="rb-fcol">
          <h4>Renters</h4>
          <ul>
            <li><a href="/search">Browse apartments</a></li>
            <li><a href="/#how">How it works</a></li>
            <li><a href="/#cities">Cities</a></li>
            <li><a href="/find-a-place">Start Search</a></li>
          </ul>
        </div>
        <div className="rb-fcol">
          <h4>Property Owners</h4>
          <ul>
            <li><a href="/landlords">Our services</a></li>
            <li><a href="https://calendly.com/rentwithbolt/discoverycall">Discovery call</a></li>
            <li><a href="/landlords">Why RentBolt</a></li>
          </ul>
        </div>
        <div className="rb-fcol">
          <h4>Get in touch</h4>
          <ul>
            <li><a href="tel:+14387937514">(438) 793-7514</a></li>
            <li><a href="mailto:hello@rentbolt.ca">hello@rentbolt.ca</a></li>
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
