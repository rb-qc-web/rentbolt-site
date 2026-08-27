"use client";

import { useEffect, useMemo, useState } from "react";

const NAVY = "#0A1F5C";
const GOLD = "#C9A84C";

export default function AdminPhotosClient() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(true);

  const [photos, setPhotos] = useState([]);   // {url, name, status}
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [toast, setToast] = useState(null);

  const selected = buildings.find(b => b.id === selectedId) || null;

  const api = (path, opts = {}) =>
    fetch(path, { ...opts, headers: { ...(opts.headers || {}), "x-admin-password": pw } });

  async function loadBuildings(pwOverride) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/buildings", {
        headers: { "x-admin-password": pwOverride ?? pw },
      });
      if (res.status === 401) { setAuthError("Wrong password"); setAuthed(false); return false; }
      const data = await res.json();
      setBuildings(data.buildings || []);
      setAuthed(true);
      setAuthError("");
      return true;
    } catch {
      setAuthError("Could not reach the server");
      return false;
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("rb_admin_pw");
    if (saved) { setPw(saved); loadBuildings(saved); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    const ok = await loadBuildings(pw);
    if (ok) sessionStorage.setItem("rb_admin_pw", pw);
  }

  // Load existing gallery when a building is picked
  useEffect(() => {
    if (!selected) { setPhotos([]); return; }
    setPhotos((selected.gallery || []).map((url, i) => ({ url, name: `Existing ${i + 1}`, status: "saved" })));
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const q = filter.toLowerCase();
    return buildings.filter(b => {
      if (onlyMissing && b.photoCount > 0) return false;
      if (!q) return true;
      return `${b.label} ${b.city} ${b.publicName}`.toLowerCase().includes(q);
    });
  }, [buildings, filter, onlyMissing]);

  async function uploadFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith("image/"));
    if (!files.length || !selected) return;
    setBusy(true);

    const added = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(`Uploading ${i + 1} of ${files.length} — ${file.name}`);
      try {
        const r = await api("/api/admin/upload-url", { method: "POST" });
        if (!r.ok) throw new Error("Could not get an upload URL");
        const { uploadURL, deliveryURL } = await r.json();

        // Straight to Cloudflare — never through Vercel, so file size is a non-issue.
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch(uploadURL, { method: "POST", body: fd });
        if (!up.ok) throw new Error("Cloudflare rejected the file");

        added.push({ url: deliveryURL, name: file.name, status: "new" });
      } catch (err) {
        added.push({ url: null, name: file.name, status: "error", error: err.message });
      }
    }

    setPhotos(p => [...p, ...added]);
    setBusy(false);
    setProgress("");
    const failed = added.filter(a => a.status === "error").length;
    if (failed) setToast({ kind: "error", msg: `${failed} file(s) failed to upload` });
  }

  function move(i, dir) {
    setPhotos(p => {
      const n = [...p];
      const j = i + dir;
      if (j < 0 || j >= n.length) return p;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  }
  const remove = i => setPhotos(p => p.filter((_, idx) => idx !== i));

  async function save() {
    if (!selected) return;
    const urls = photos.filter(p => p.url).map(p => p.url);
    setBusy(true);
    try {
      const res = await api("/api/admin/save-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selected.id, boardId: selected.boardId,
          subitemId: selected.subitemId, urls,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setBuildings(bs => bs.map(b =>
        b.id === selected.id
          ? { ...b, photoCount: urls.length, gallery: urls, subitemId: data.subitemId }
          : b
      ));
      setPhotos(p => p.map(x => ({ ...x, status: x.url ? "saved" : x.status })));
      setToast({ kind: "ok", msg: `Saved ${urls.length} photo(s) to ${selected.label}` });
    } catch (err) {
      setToast({ kind: "error", msg: err.message });
    } finally { setBusy(false); }
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ---------- Login ----------
  if (!authed) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#F7F8FA", fontFamily: "system-ui, sans-serif" }}>
        <form onSubmit={handleLogin} style={{ background: "#fff", padding: 32, borderRadius: 16, width: 340, boxShadow: "0 4px 24px rgba(10,31,92,0.08)" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 20, color: NAVY }}>RentBolt Admin</h1>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#8B92A5" }}>Photo upload</p>
          <input
            type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="Password" autoFocus
            style={{ width: "100%", padding: "12px 14px", border: "1px solid #E8EBF0", borderRadius: 10, fontSize: 14, marginBottom: 12 }}
          />
          {authError && <p style={{ color: "#C0392B", fontSize: 13, margin: "0 0 12px" }}>{authError}</p>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: 12, background: NAVY, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {loading ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  // ---------- App ----------
  const done = buildings.filter(b => b.photoCount > 0).length;

  return (
    <div style={{ minHeight: "100dvh", background: "#F7F8FA", fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 22, color: NAVY }}>Photo upload</h1>
          <span style={{ fontSize: 13, color: "#8B92A5" }}>
            {done} of {buildings.length} active buildings have photos
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>

          {/* Building picker */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 16, maxHeight: "78dvh", overflow: "auto" }}>
            <input
              value={filter} onChange={e => setFilter(e.target.value)}
              placeholder="Search buildings…"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8EBF0", borderRadius: 10, fontSize: 13, marginBottom: 10 }}
            />
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#5A6278", marginBottom: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={onlyMissing} onChange={e => setOnlyMissing(e.target.checked)} />
              Only show buildings without photos
            </label>

            {visible.length === 0 && <p style={{ fontSize: 13, color: "#8B92A5" }}>Nothing matches.</p>}

            {visible.map(b => (
              <button key={b.id} onClick={() => setSelectedId(b.id)}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "10px 12px",
                  marginBottom: 6, borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                  border: selectedId === b.id ? `2px solid ${NAVY}` : "1px solid #E8EBF0",
                  background: selectedId === b.id ? "#F2F5FF" : "#fff",
                }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{b.label}</div>
                <div style={{ fontSize: 11, color: "#8B92A5", marginTop: 2 }}>
                  {b.city}
                  {b.photoCount > 0
                    ? <span style={{ color: "#1E8449" }}> · {b.photoCount} photos</span>
                    : <span style={{ color: GOLD }}> · no photos</span>}
                </div>
              </button>
            ))}
          </div>

          {/* Workspace */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, minHeight: 400 }}>
            {!selected ? (
              <p style={{ color: "#8B92A5", fontSize: 14 }}>Pick a building on the left to add photos.</p>
            ) : (
              <>
                <div style={{ marginBottom: 4, fontSize: 17, fontWeight: 800, color: NAVY }}>{selected.label}</div>
                <div style={{ fontSize: 12, color: "#8B92A5", marginBottom: 16 }}>
                  {selected.city} · shows publicly as “{selected.publicName}”
                  {!selected.subitemId && " · RB Website subitem will be created on save"}
                </div>

                <label
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); uploadFiles(e.dataTransfer.files); }}
                  style={{
                    display: "block", border: "2px dashed #C9D2E3", borderRadius: 12,
                    padding: 28, textAlign: "center", cursor: busy ? "wait" : "pointer",
                    background: "#FAFBFD", marginBottom: 16,
                  }}>
                  <input type="file" multiple accept="image/*" disabled={busy}
                    onChange={e => { uploadFiles(e.target.files); e.target.value = ""; }}
                    style={{ display: "none" }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>
                    {busy ? progress || "Working…" : "Drop photos here, or click to choose"}
                  </div>
                  <div style={{ fontSize: 12, color: "#8B92A5", marginTop: 4 }}>
                    First photo becomes the cover. 15–20 is a good set.
                  </div>
                </label>

                {photos.length > 0 && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10, marginBottom: 16 }}>
                      {photos.map((p, i) => (
                        <div key={i} style={{ border: "1px solid #E8EBF0", borderRadius: 10, overflow: "hidden", position: "relative", background: "#F7F8FA" }}>
                          {p.url
                            ? <img src={p.url} alt="" style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                            : <div style={{ height: 90, display: "grid", placeItems: "center", fontSize: 11, color: "#C0392B", padding: 6, textAlign: "center" }}>Failed</div>}
                          {i === 0 && p.url && (
                            <span style={{ position: "absolute", top: 6, left: 6, background: NAVY, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>COVER</span>
                          )}
                          <div style={{ display: "flex", gap: 4, padding: 6 }}>
                            <button onClick={() => move(i, -1)} disabled={i === 0} style={miniBtn}>←</button>
                            <button onClick={() => move(i, 1)} disabled={i === photos.length - 1} style={miniBtn}>→</button>
                            <button onClick={() => remove(i)} style={{ ...miniBtn, marginLeft: "auto", color: "#C0392B" }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button onClick={save} disabled={busy}
                      style={{ padding: "12px 24px", background: NAVY, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: busy ? "wait" : "pointer" }}>
                      {busy ? "Saving…" : `Save ${photos.filter(p => p.url).length} photo(s) to Monday`}
                    </button>
                    <span style={{ fontSize: 12, color: "#8B92A5", marginLeft: 12 }}>
                      Live on the site within ~10 minutes.
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
          background: toast.kind === "ok" ? NAVY : "#C0392B", color: "#fff",
          padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>{toast.msg}</div>
      )}
    </div>
  );
}

const miniBtn = {
  flex: "0 0 auto", padding: "3px 7px", fontSize: 12, lineHeight: 1,
  border: "1px solid #E8EBF0", background: "#fff", borderRadius: 6,
  cursor: "pointer", fontFamily: "inherit",
};
