import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BoltIconSolid } from "@/components/BoltIcon";
import { meta } from "@/lib/brand";
import { ChevronRight, Users, Globe, DollarSign, Megaphone, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Landlords & Property Managers — Fill Vacancies Faster",
  description:
    "Partner with RentBolt to access 4,000+ weekly rental inquiries. We refer qualified tenants to your properties. Pay only on results.",
};

export default function LandlordsPage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-navy py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <BoltIconSolid size={14} color="#E2C87E" />
              <span className="text-gold font-bold text-sm uppercase tracking-wider">
                For Property Owners & Managers
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5">
              We'll refer quality
              <br />
              <span className="text-gold">tenants to you.</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-xl">
              RentBolt partners with property developers, owners, and managers
              across Quebec and Ontario. You only pay once a successful rental is completed.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={meta.calendly}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gold text-navy px-7 py-3.5 rounded-xl font-bold text-base hover:bg-gold-light transition-colors"
              >
                Book a Discovery Call
                <ChevronRight size={18} />
              </a>
              <a
                href={`mailto:${meta.email}`}
                className="inline-flex items-center gap-2 bg-white/10 text-white px-7 py-3.5 rounded-xl font-bold text-base hover:bg-white/20 transition-colors"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-14 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "4,000+", label: "Weekly rental inquiries" },
              { value: "6", label: "Languages spoken" },
              { value: "7", label: "Markets across QC & ON" },
              { value: "$0", label: "Upfront cost" },
            ].map((s, i) => (
              <div key={i}>
                <div className="font-display text-3xl md:text-4xl font-extrabold text-navy mb-1">
                  {s.value}
                </div>
                <div className="text-sm text-gray-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why RentBolt */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-extrabold text-navy mb-3">
              Why Property Managers Choose RentBolt
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              We've built the leasing infrastructure so you don't have to.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: "International Reach", desc: "Active in Canada and abroad. We connect you with international students, professionals, and newcomers your other channels don't reach." },
              { icon: DollarSign, title: "Pay on Results Only", desc: "No subscription fees, no upfront costs. You pay a commission only when we successfully place a tenant in your property." },
              { icon: Users, title: "Qualified Tenants", desc: "Every applicant goes through credit checks, employment verification, and reference calls before we present them to you." },
              { icon: Megaphone, title: "Cross-Marketing", desc: "Your properties get exposure to our 4,000+ weekly inquiries across all markets — not just the city they're in." },
              { icon: ShieldCheck, title: "Professional Agents", desc: "Our trained leasing agents handle showings, follow-ups, and applications. Your team stays focused on operations." },
              { icon: Clock, title: "Faster Turnaround", desc: "Average time from listing to signed lease is dramatically reduced through our pipeline and pre-qualified tenant pool." },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gold-subtle rounded-xl flex items-center justify-center mb-4">
                  <item.icon size={22} className="text-navy" />
                </div>
                <h3 className="font-display font-bold text-navy text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-navy mb-4">
            Ready to fill your vacancies?
          </h2>
          <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
            Book a 15-minute call with our team and we'll show you how RentBolt
            can work for your portfolio.
          </p>
          <a
            href={meta.calendly}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-navy text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-navy-light transition-colors shadow-sm"
          >
            Book a Discovery Call
            <ChevronRight size={18} />
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
