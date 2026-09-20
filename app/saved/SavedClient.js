"use client";

import { useMemo, useState } from "react";
import { useFavourites } from "@/lib/useFavourites";
import FavouriteButton from "@/app/components/FavouriteButton";
import { getBuildingPhoto } from "@/lib/cityPhotos";

export default function SavedClient({ buildings }) {
  const { ids, ready, clear } = useFavourites();
  const [email, setEmail] = useState("");
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
          email,
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
  if (!ready) return <main className="sv-wrap" />;

  return (
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
                  <input
                    type="email" required placeholder="you@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    aria-label="Your email"
                  />
                  <input
                    type="text" placeholder="Anything we should know? (optional)"
                    value={note} onChange={e => setNote(e.target.value)}
                    aria-label="Optional note"
                  />
                  <button type="submit" disabled={state.status === "sending"}>
                    {state.status === "sending" ? "Sending…" : "Send my list"}
                  </button>
                  {state.status === "error" && <div className="sv-err">{state.msg}</div>}
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
        .sv-form { display: flex; gap: 10px; flex-wrap: wrap; }
        .sv-form input { flex: 1 1 220px; padding: 12px 16px; border: none; border-radius: 8px; font-size: 14px; font-family: inherit; }
        .sv-form button { background: var(--gold); color: var(--navy-deep); border: none; border-radius: 8px; padding: 12px 28px; font-weight: 700; font-size: 14px; font-family: inherit; white-space: nowrap; }
        .sv-form button:disabled { opacity: 0.6; }
        .sv-err { flex: 1 1 100%; color: #F5B7B1; font-size: 13px; }
        .sv-done { background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px 20px; font-size: 15px; font-weight: 600; }

        @media (max-width: 640px) {
          .sv-wrap { padding: 90px 16px 60px; }
          .sv-capture { padding: 24px 20px; }
        }
      `}</style>
    </main>
  );
}
