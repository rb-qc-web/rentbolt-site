"use client";

import "./saved.css";

import { useMemo, useState } from "react";
import { useFavourites } from "@/lib/useFavourites";
import FavouriteButton from "@/app/components/FavouriteButton";
import { getBuildingPhoto } from "@/lib/cityPhotos";
import { SiteHeader, SiteFooter } from "@/app/components/SiteChrome";
import { submitLead } from "@/lib/submitLead";

export default function SavedClient({ buildings }) {
  const { ids, ready, clear } = useFavourites();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [moveIn, setMoveIn] = useState("");
  const [flexible, setFlexible] = useState(false);
  const [note, setNote] = useState("");
  const [state, setState] = useState({ status: "idle", msg: "" });

  const saved = useMemo(
    () => ids.map(id => buildings.find(b => b.id === id)).filter(Boolean),
    [ids, buildings]
  );

  async function submit(e) {
    e.preventDefault();
    setState({ status: "sending", msg: "" });
    try {
      await submitLead({
        name,
        email,
        phone,
        moveIn: flexible ? "" : moveIn,
        flexible,
        note,
        buildings: saved.map(b => ({
          id: b.id, name: b.publicName, city: b.city,
          neighbourhood: b.neighbourhood, price: b.startingPrice,
        })),
      }, "/api/save-list");
      setState({ status: "done", msg: "Sent. An advisor will be in touch shortly." });
    } catch (err) {
      setState({ status: "error", msg: err.message });
    }
  }

  // Render nothing until localStorage has been read, or the server HTML and
  // the first client render disagree.
  if (!ready) return (<><SiteHeader /><main className="sv-wrap" /><SiteFooter /></>);

  return (
    <>
    <SiteHeader />
    <main className="sv-wrap">
      <div className="sv-inner">
        <header className="sv-head">
          <div>
            <h1>Saved homes</h1>
            <p>{saved.length === 0 ? "Nothing saved yet." : `${saved.length} ${saved.length === 1 ? "home" : "homes"} on your list.`}</p>
          </div>
          {saved.length > 0 && (
            <button className="sv-clear" onClick={clear}>Clear list</button>
          )}
        </header>

        {saved.length === 0 ? (
          <div className="sv-empty">
            <p>Tap the heart on any listing to add it here.</p>
            <a href="/search" className="sv-btn">Browse homes</a>
          </div>
        ) : (
          <>
            <div className="sv-grid">
              {saved.map(b => (
                <a key={b.id} href={`/buildings/${b.slug}`} className="sv-card">
                  <div className="sv-photo">
                    <img src={b.photo || getBuildingPhoto(b)} alt="" />
                    <FavouriteButton id={b.id} className="sv-card-fav" />
                  </div>
                  <div className="sv-body">
                    <div className="sv-loc">{b.city}{b.neighbourhood ? ` · ${b.neighbourhood}` : ""}</div>
                    <h3>{b.publicName}</h3>
                    {b.startingPrice > 0 ? (
                      <div className="sv-price">From ${Number(b.startingPrice).toLocaleString()}<small>/mo</small></div>
                    ) : (
                      <div className="sv-price sv-price-none">Contact us for pricing</div>
                    )}
                  </div>
                </a>
              ))}
            </div>

            <section className="sv-capture">
              <h2>Want help with these?</h2>
              <p>Send us your list and a local advisor will check availability, answer questions and arrange visits — at no cost to you.</p>

              {state.status === "done" ? (
                <div className="sv-done">{state.msg}</div>
              ) : (
                <form onSubmit={submit} className="sv-form">
                  <div className="sv-row">
                    <label className="sv-field">
                      <span>Full name</span>
                      <input
                        type="text" required placeholder="First and last name"
                        value={name} onChange={e => setName(e.target.value)}
                      />
                    </label>
                    <label className="sv-field">
                      <span>Email</span>
                      <input
                        type="email" required placeholder="you@email.com"
                        value={email} onChange={e => setEmail(e.target.value)}
                      />
                    </label>
                    <label className="sv-field">
                      <span>Phone <em>(optional)</em></span>
                      <input
                        type="tel" placeholder="(514) 555-0123"
                        value={phone} onChange={e => setPhone(e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="sv-row">
                    <label className="sv-field sv-field-date">
                      <span>Desired move-in date</span>
                      <input
                        type="date" value={moveIn} disabled={flexible}
                        onChange={e => setMoveIn(e.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      className={`sv-flex${flexible ? " on" : ""}`}
                      onClick={() => setFlexible(f => !f)}
                      aria-pressed={flexible}
                    >
                      <span className="sv-flex-dot" aria-hidden="true" />
                      I&apos;m flexible
                    </button>
                  </div>

                  <label className="sv-field">
                    <span>Anything we should know? <em>(optional)</em></span>
                    <textarea
                      rows={2} placeholder="e.g. I need parking and a quiet building"
                      value={note} onChange={e => setNote(e.target.value)}
                    />
                  </label>

                  <div className="sv-actions">
                    <button type="submit" disabled={state.status === "sending"}>
                      {state.status === "sending" ? "Sending…" : "Send my list"}
                    </button>
                    {state.status === "error" && <div className="sv-err">{state.msg}</div>}
                  </div>
                </form>
              )}
            </section>
          </>
        )}
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
