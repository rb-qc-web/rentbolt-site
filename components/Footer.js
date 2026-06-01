import Link from "next/link";
import { BoltIcon } from "./BoltIcon";
import { meta, markets } from "@/lib/brand";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <BoltIcon size={22} />
              <span className="font-display font-extrabold text-lg">RENTBOLT</span>
            </div>
            <p className="text-navy-100 text-sm leading-relaxed mb-6 opacity-70">
              Connecting renters from around the world with verified apartments
              across Canada. Live inventory, real agents, faster move-ins.
            </p>
            <div className="flex gap-4">
              {Object.entries(meta.social).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-gold transition-colors text-sm capitalize"
                >
                  {platform}
                </a>
              ))}
            </div>
          </div>

          {/* Markets */}
          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-gold mb-4">
              Our Markets
            </h4>
            <ul className="space-y-2">
              {markets.map((m) => (
                <li key={m.name}>
                  <Link
                    href={`/?city=${encodeURIComponent(m.name)}`}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {m.name}, {m.region}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-gold mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/landlords", label: "Landlords & Partners" },
                { href: "/about", label: "About RentBolt" },
                { href: "/contact", label: "Contact Us" },
                { href: "/terms", label: "Terms & Conditions" },
                { href: "/privacy", label: "Privacy Policy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-gold mb-4">
              Get In Touch
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="text-gold mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/60">{meta.address}</span>
              </li>
              <li>
                <a
                  href={`tel:${meta.phone}`}
                  className="flex items-center gap-2.5 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <Phone size={15} className="text-gold flex-shrink-0" />
                  {meta.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${meta.email}`}
                  className="flex items-center gap-2.5 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <Mail size={15} className="text-gold flex-shrink-0" />
                  {meta.email}
                </a>
              </li>
            </ul>

            <a
              href={meta.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 bg-gold text-navy px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gold-light transition-colors"
            >
              Book a Call
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} RentBolt. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            EN | FR
          </p>
        </div>
      </div>
    </footer>
  );
}
