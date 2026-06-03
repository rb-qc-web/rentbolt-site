import { meta, brand } from "@/lib/brand";

export const metadata = {
  title: "Contact | RentBolt",
  description: "Get in touch with RentBolt — we're here to help you find your next home.",
};

const navy = brand.navy;
const navyDark = brand.navyDark;
const gold = brand.gold;
const bg = brand.bg;
const border = brand.border;
const textMid = brand.textSecondary;
const textMute = brand.textMuted;

function Bolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z"
        fill="url(#cp-bolt)" stroke="url(#cp-bolt)" strokeLinejoin="round" strokeWidth="0.5"/>
      <defs>
        <linearGradient id="cp-bolt" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#E2C87E"/>
          <stop offset="100%" stopColor="#C9A84C"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

const CHANNELS = [
  {
    icon: "📞",
    label: "Phone",
    value: meta.phone,
    href: `tel:${meta.phone}`,
    sub: "Mon–Fri, 9am–6pm ET",
  },
  {
    icon: "✉️",
    label: "Email",
    value: meta.email,
    href: `mailto:${meta.email}`,
    sub: "We respond within one business day",
  },
  {
    icon: "📅",
    label: "Book a call",
    value: "Schedule a discovery call",
    href: meta.calendly,
    sub: "15-min intro call with our team",
    external: true,
  },
];

const OFFICES = [
  {
    province: "Quebec",
    flag: "🔵",
    address: meta.addressQC,
    markets: ["Montréal", "Gatineau"],
  },
  {
    province: "Ontario",
    flag: "🔴",
    address: meta.addressON,
    markets: ["Ottawa", "Toronto", "Kitchener-Waterloo", "London", "Hamilton"],
  },
];

export default function ContactPage() {
  return (
    <>
      {/* HEADER */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100, background: "#fff",
        borderBottom: `1px solid ${border}`, padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Bolt />
          <span style={{ fontWeight: 800, fontSize: 20, color: navy, letterSpacing: "-0.5px" }}>RENTBOLT</span>
        </a>
        <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[
            { href: "/", label: "Properties" },
            { href: "/landlords", label: "Partnership" },
            { href: "/contact", label: "Contact" },
          ].map(l => (
            <a key={l.href} href={l.href} style={{
              padding: "8px 16px", fontSize: 14, fontWeight: 600,
              color: l.href === "/contact" ? navy : textMid,
              textDecoration: "none", borderRadius: 8,
              fontWeight: l.href === "/contact" ? 800 : 600,
            }}>{l.label}</a>
          ))}
          <a href="/find-a-place" style={{
            marginLeft: 8, padding: "10px 20px", background: gold, color: navy,
            fontWeight: 800, fontSize: 14, borderRadius: 10, textDecoration: "none",
          }}>Find a Place</a>
        </nav>
      </header>

      <main style={{ background: bg, minHeight: "100vh", paddingBottom: 80 }}>

        {/* HERO */}
        <div style={{
          background: `linear-gradient(135deg, ${navyDark} 0%, ${navy} 100%)`,
          padding: "64px 32px 56px", textAlign: "center", color: "#fff",
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: gold, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>
            Get in touch
          </p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, margin: "0 0 14px", lineHeight: 1.15, letterSpacing: "-1px" }}>
            We're here to help
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", maxWidth: 420, margin: "0 auto" }}>
            Whether you're looking for a home or a leasing partner — reach out and we'll get back to you fast.
          </p>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px" }}>

          {/* CONTACT CHANNELS */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
            marginTop: -28, position: "relative", zIndex: 2,
          }} className="cp-channels">
            {CHANNELS.map(ch => (
              <a key={ch.label} href={ch.href} target={ch.external ? "_blank" : undefined}
                rel={ch.external ? "noopener noreferrer" : undefined}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                  background: "#fff", borderRadius: 20, padding: "32px 24px",
                  boxShadow: "0 4px 24px rgba(10,31,92,0.08)", border: `1.5px solid ${border}`,
                  textDecoration: "none", transition: "all 0.18s",
                }}>
                <span style={{ fontSize: 32, marginBottom: 14 }}>{ch.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                  {ch.label}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: navy, marginBottom: 6 }}>{ch.value}</span>
                <span style={{ fontSize: 12, color: textMute }}>{ch.sub}</span>
              </a>
            ))}
          </div>

          {/* OFFICES */}
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>
              Our offices
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="cp-offices">
              {OFFICES.map(o => (
                <div key={o.province} style={{
                  background: "#fff", borderRadius: 16, padding: "28px 28px",
                  border: `1.5px solid ${border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 24 }}>{o.flag}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: navy }}>{o.province}</span>
                  </div>
                  <p style={{ fontSize: 14, color: textMid, marginBottom: 16, lineHeight: 1.5 }}>{o.address}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {o.markets.map(m => (
                      <span key={m} style={{
                        fontSize: 12, fontWeight: 600, color: navy,
                        background: bg, border: `1px solid ${border}`,
                        padding: "4px 10px", borderRadius: 100,
                      }}>{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SOCIAL */}
          <div style={{ marginTop: 48, textAlign: "center" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>
              Follow us
            </h2>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              {Object.entries(meta.social).map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer" style={{
                  padding: "10px 22px", borderRadius: 100, fontSize: 13, fontWeight: 700,
                  background: "#fff", border: `1.5px solid ${border}`, color: navy,
                  textDecoration: "none", textTransform: "capitalize", transition: "all 0.15s",
                }}>
                  {name === "instagram" ? "📸" : name === "linkedin" ? "💼" : name === "tiktok" ? "🎵" : "📘"} {name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ background: navyDark, color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "28px 32px", fontSize: 13 }}>
        © 2026 RentBolt · <a href={`mailto:${meta.email}`} style={{ color: gold, textDecoration: "none" }}>{meta.email}</a>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .cp-channels { grid-template-columns: 1fr !important; margin-top: -20px !important; }
          .cp-offices { grid-template-columns: 1fr !important; }
          nav { display: none; }
        }
      `}</style>
    </>
  );
}
