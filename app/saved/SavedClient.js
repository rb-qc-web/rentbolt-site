"use client";

import { useMemo, useState } from "react";
import { useFavourites } from "@/lib/useFavourites";
import FavouriteButton from "@/app/components/FavouriteButton";
import { getBuildingPhoto } from "@/lib/cityPhotos";
import { SiteHeader, SiteFooter } from "@/app/components/SiteChrome";

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
      const res = await fetch("/api/save-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
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
                    {b.startingPrice > 0 && (
                      <div className="sv-price">From ${Number(b.startingPrice).toLocaleString()}<small>/mo</small></div>
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

      <style jsx global>{`
        .sv-wrap { min-height: 70vh; background: var(--bg-soft); padding: 110px 24px 80px; }
        .sv-inner { max-width: 1120px; margin: 0 auto; }
        .sv-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; flex-wrap: wrap; }
        .sv-head h1 { font-size: clamp(30px, 3.2vw, 42px); font-weight: 700; letter-spacing: -0.02em; color: var(--navy); margin: 0 0 6px; }
        .sv-head p { color: var(--text-mute); font-size: 15px; margin: 0; }
        .sv-clear { background: none; border: 1px solid var(--border); border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 600; color: var(--text-mute); font-family: inherit; }
        .sv-clear:hover { color: var(--navy); border-color: var(--navy); }

        .sv-empty { background: #fff; border-radius: 12px; padding: 56px 24px; text-align: center; }
        .sv-empty p { color: var(--text-mute); margin: 0 0 18px; }
        .sv-btn { display: inline-block; background: var(--navy); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; }

        .sv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; margin-bottom: 40px; }
        .sv-card { background: #fff; border-radius: 12px; overflow: hidden; text-decoration: none; display: block; box-shadow: 0 4px 16px rgba(10,31,92,0.07); transition: transform 0.15s; }
        .sv-card:hover { transform: translateY(-2px); }
        .sv-photo { position: relative; height: 150px; background: var(--border); }
        .sv-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .sv-body { padding: 14px 16px 16px; }
        .sv-loc { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--gold-dark, #A8892F); margin-bottom: 5px; }
        .sv-body h3 { font-size: 16px; font-weight: 700; color: var(--navy); margin: 0 0 8px; letter-spacing: -0.01em; }
        .sv-price { font-size: 14px; font-weight: 700; color: var(--navy); }
        .sv-price small { font-weight: 500; color: var(--text-mute); }

        .sv-capture { background: var(--navy); color: #fff; border-radius: 12px; padding: 32px; }
        .sv-capture h2 { font-size: 22px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.015em; }
        .sv-capture p { color: rgba(255,255,255,0.72); font-size: 15px; line-height: 1.6; margin: 0 0 20px; max-width: 560px; }
        .sv-form { display: flex; flex-direction: column; gap: 14px; }
        .sv-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
        .sv-field { flex: 1 1 200px; display: flex; flex-direction: column; gap: 6px; }
        .sv-field > span { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.72); }
        .sv-field > span em { font-style: normal; color: rgba(255,255,255,0.45); font-weight: 500; }
        .sv-field input, .sv-field textarea {
          width: 100%; padding: 12px 14px; border: none; border-radius: 8px;
          font-size: 14px; font-family: inherit; resize: vertical;
        }
        .sv-field input:disabled { opacity: 0.45; }
        .sv-field-date { flex: 0 1 260px; }
        .sv-flex {
          display: inline-flex; align-items: center; gap: 9px;
          background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.18);
          border-radius: 8px; padding: 12px 18px; font-size: 13px; font-weight: 600;
          font-family: inherit; white-space: nowrap; height: 44px;
        }
        .sv-flex-dot { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.45); transition: all 0.15s; }
        .sv-flex.on { background: var(--gold); color: var(--navy-deep); border-color: var(--gold); }
        .sv-flex.on .sv-flex-dot { background: var(--navy-deep); border-color: var(--navy-deep); }
        .sv-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .sv-form button[type="submit"] { background: var(--gold); color: var(--navy-deep); border: none; border-radius: 8px; padding: 13px 30px; font-weight: 700; font-size: 14px; font-family: inherit; white-space: nowrap; }
        .sv-form button[type="submit"]:disabled { opacity: 0.6; }
        .sv-err { color: #F5B7B1; font-size: 13px; }
        .sv-done { background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px 20px; font-size: 15px; font-weight: 600; }

        @media (max-width: 640px) {
          .sv-wrap { padding: 90px 16px 60px; }
          .sv-capture { padding: 24px 20px; }
        }
      `}</style>
    </main>
    <SiteFooter />
    </>
  );
}
