import { google } from "googleapis";
import {
  findPhotoSubitem, findDriveUrl, parseGallery, parseDriveTarget,
  GALLERY_COLUMN_ID, MAX_PHOTOS_PER_BUILDING,
} from "./photoConfig";

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN  = process.env.CLOUDFLARE_API_TOKEN;
const GCP_JSON      = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

export const PHOTO_BOARDS = {
  montreal: { id: "3743206409",  city: "Montreal",           locationColId: "location" },
  ottawa:   { id: "4955235841",  city: "Ottawa",             locationColId: "location" },
  toronto:  { id: "18402583974", city: "Toronto",            locationColId: "location_mm3yrv60" },
  london:   { id: "18401824343", city: "London",             locationColId: "location_mm5eg13x" },
  kwcg:     { id: "5892819868",  city: "Kitchener-Waterloo", locationColId: "location_mm3yr7wf" },
};

const ACTIVE_STATUSES = ["Lease-Up", "Stabilization"];

async function mondayCall(query, variables = {}) {
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: process.env.MONDAY_API_KEY },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.errors) throw new Error(`Monday: ${JSON.stringify(json.errors)}`);
  return json.data;
}

// Native FormData/Blob — the form-data npm package produces a malformed
// multipart body on Vercel's runtime ("incomplete multipart stream").
async function uploadToCloudflare(buffer, filename) {
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "image/jpeg" }), filename);
  form.append("requireSignedURLs", "false");
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
    { method: "POST", headers: { Authorization: `Bearer ${CF_API_TOKEN}` }, body: form }
  );
  const data = await res.json();
  if (!data.success) throw new Error(`Cloudflare: ${JSON.stringify(data.errors)}`);
  return data.result.variants.find(v => v.includes("/public")) || data.result.variants[0];
}

// supportsAllDrives / includeItemsFromAllDrives are REQUIRED: the photo folders
// live on a Shared Drive, which the default API calls silently cannot see.
const DRIVE_SHARED = { includeItemsFromAllDrives: true, supportsAllDrives: true };

async function listFolderImages(drive, folderId) {
  let res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
    fields: "files(id,name)", orderBy: "name",
    pageSize: MAX_PHOTOS_PER_BUILDING, ...DRIVE_SHARED,
  });
  let files = res.data.files || [];
  if (files.length) return files;

  // Fall back to one level of subfolders (units/amenities layouts).
  const subs = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id,name)", orderBy: "name", pageSize: 20, ...DRIVE_SHARED,
  });
  for (const sub of subs.data.files || []) {
    if (files.length >= MAX_PHOTOS_PER_BUILDING) break;
    const inner = await drive.files.list({
      q: `'${sub.id}' in parents and mimeType contains 'image/' and trashed=false`,
      fields: "files(id,name)", orderBy: "name",
      pageSize: MAX_PHOTOS_PER_BUILDING - files.length, ...DRIVE_SHARED,
    });
    files = files.concat(inner.data.files || []);
  }
  return files;
}

async function downloadImages(drive, target) {
  let files = [];
  if (target.type === "folder") files = await listFolderImages(drive, target.id);
  else if (target.type === "files") files = target.ids.slice(0, MAX_PHOTOS_PER_BUILDING).map(id => ({ id, name: `${id}.jpg` }));

  const out = [];
  for (const f of files) {
    try {
      const resp = await drive.files.get(
        { fileId: f.id, alt: "media", supportsAllDrives: true },
        { responseType: "arraybuffer" }
      );
      out.push({ buffer: Buffer.from(resp.data), name: f.name });
    } catch {
      // Skip unreadable files rather than failing the whole building.
    }
  }
  return out;
}

async function fetchBoard(board) {
  const data = await mondayCall(`{
    boards(ids: [${board.id}]) {
      items_page(limit: 200) {
        items {
          id name
          column_values(ids: ["status2"]) { id text }
          subitems { id name column_values { id text } }
        }
      }
    }
  }`);
  return data?.boards?.[0]?.items_page?.items || [];
}

/** Classify a building without doing any work — powers the status endpoint. */
export function classify(item) {
  const status = item.column_values?.find(cv => cv.id === "status2")?.text || "";
  if (!ACTIVE_STATUSES.some(s => status.includes(s))) return { state: "inactive", status };

  const sub = findPhotoSubitem(item);
  if (!sub) return { state: "no_subitem", status };

  const gallery = parseGallery(sub.column_values?.find(cv => cv.id === GALLERY_COLUMN_ID)?.text);
  if (gallery.length) return { state: "done", status, photos: gallery.length };

  const url = findDriveUrl(sub);
  if (!url) return { state: "no_link", status };
  if (parseDriveTarget(url).type === "none") return { state: "bad_link", status };

  return { state: "pending", status };
}

/**
 * Migrate pending buildings. Time-boxed and resumable: it processes what it
 * can within the budget and picks up where it left off on the next run, so it
 * never hits the function timeout no matter how many buildings are queued.
 */
export async function runPhotoMigration({ budgetMs = 240000, cityKey = null } = {}) {
  const started = Date.now();
  const timeLeft = () => budgetMs - (Date.now() - started);

  if (!process.env.MONDAY_API_KEY || !CF_ACCOUNT_ID || !CF_API_TOKEN || !GCP_JSON) {
    return { ok: false, error: "Missing env vars (Monday / Cloudflare / Google)" };
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(GCP_JSON),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const drive = google.drive({ version: "v3", auth });

  const boards = cityKey ? { [cityKey]: PHOTO_BOARDS[cityKey] } : PHOTO_BOARDS;
  const summary = {};
  let migrated = 0, failed = 0, remaining = 0;
  const errors = [];

  for (const [key, board] of Object.entries(boards)) {
    if (!board) continue;
    const perCity = { migrated: 0, pending: 0, done: 0, no_subitem: 0, no_link: 0, bad_link: 0, failed: 0 };

    let items;
    try {
      items = await fetchBoard(board);
    } catch (err) {
      summary[key] = { error: err.message };
      errors.push({ city: board.city, error: err.message });
      continue;
    }

    for (const item of items) {
      const c = classify(item);
      if (c.state === "inactive") continue;
      if (c.state !== "pending") { perCity[c.state] = (perCity[c.state] || 0) + 1; continue; }

      // Out of budget — leave it queued for the next run.
      if (timeLeft() < 25000) { perCity.pending++; remaining++; continue; }

      const sub = findPhotoSubitem(item);
      try {
        const target = parseDriveTarget(findDriveUrl(sub));
        const images = await downloadImages(drive, target);
        if (!images.length) {
          perCity.failed++; failed++;
          errors.push({ city: board.city, building: item.name, error: "Drive folder contained no readable images" });
          continue;
        }

        const urls = [];
        for (const img of images) urls.push(await uploadToCloudflare(img.buffer, img.name));

        // Written to the subitem, not a parent column: the parent photo column
        // does not exist on every board, so writes were silently discarded.
        await mondayCall(`
          mutation ($itemId: ID!, $value: JSON!) {
            change_column_value(board_id: ${board.id}, item_id: $itemId,
              column_id: "${GALLERY_COLUMN_ID}", value: $value) { id }
          }`,
          { itemId: String(sub.id), value: JSON.stringify(JSON.stringify(urls)) }
        );

        perCity.migrated++; migrated++;
      } catch (err) {
        perCity.failed++; failed++;
        errors.push({ city: board.city, building: item.name, error: err.message });
      }
    }

    summary[key] = perCity;
  }

  return {
    ok: true,
    ms: Date.now() - started,
    migrated, failed, remaining,
    summary,
    errors: errors.slice(0, 25),
    note: remaining > 0 ? `${remaining} building(s) left — the next scheduled run continues automatically.` : undefined,
  };
}

/** Read-only snapshot of photo coverage across every board. */
export async function getPhotoStatus() {
  const out = {};
  for (const [key, board] of Object.entries(PHOTO_BOARDS)) {
    try {
      const items = await fetchBoard(board);
      const buckets = { done: [], pending: [], no_subitem: [], no_link: [], bad_link: [] };
      let active = 0;
      for (const item of items) {
        const c = classify(item);
        if (c.state === "inactive") continue;
        active++;
        buckets[c.state]?.push(item.name);
      }
      out[key] = {
        city: board.city,
        activeBuildings: active,
        withPhotos: buckets.done.length,
        coverage: active ? `${Math.round((buckets.done.length / active) * 100)}%` : "n/a",
        needsAttention: {
          pendingMigration: buckets.pending,
          missingSubitem: buckets.no_subitem,
          subitemButNoLink: buckets.no_link,
          unreadableLink: buckets.bad_link,
        },
      };
    } catch (err) {
      out[key] = { city: board.city, error: err.message };
    }
  }
  return out;
}
