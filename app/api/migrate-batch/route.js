import { google } from "googleapis";
import FormData from "form-data";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const CF_ACCOUNT_ID  = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN   = process.env.CLOUDFLARE_API_TOKEN;
const GCP_JSON       = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

const BOARD_CONFIGS = {
  london:   { id: "18401824343", photoCol: "text_mkxvrp7p" },
  montreal: { id: "3743206409",  photoCol: "text_mkxvrp7p" },
  ottawa:   { id: "4955235841",  photoCol: "text_mkxvrp7p" },
  toronto:  { id: "18402583974", photoCol: "text_mkxvrp7p" },
  kwcg:     { id: "5892819868",  photoCol: "text_mkxvrp7p" },
};

const ACTIVE_STATUSES = ["Lease-Up", "Stabilization"];

function extractFolderId(url) {
  const m = (url || "").match(/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function extractFileId(url) {
  const m = (url || "").match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function isAlreadyMigrated(url) {
  return (url || "").includes("imagedelivery.net") ||
    ((url || "").startsWith("[") && (url || "").includes("imagedelivery.net"));
}

async function mondayCall(query, variables = {}) {
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: MONDAY_API_KEY },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function uploadToCloudflare(imageBuffer, filename) {
  const form = new FormData();
  form.append("file", imageBuffer, { filename, contentType: "image/jpeg" });
  form.append("requireSignedURLs", "false");
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${CF_API_TOKEN}`, ...form.getHeaders() },
      body: form,
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error(`CF error: ${JSON.stringify(data.errors)}`);
  return data.result.variants.find(v => v.includes("/public")) || data.result.variants[0];
}

async function writeMondayColumn(itemId, boardId, columnId, value) {
  await mondayCall(`
    mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) { id }
    }
  `, { boardId: String(boardId), itemId: String(itemId), columnId, value: JSON.stringify(value) });
}

async function getImagesFromDrive(drive, driveUrl) {
  // Handle multiple space-separated file/folder links (pasted from Drive "Copy link")
  const urls = driveUrl.split(/\s+/).filter(u => u.includes("drive.google") || u.includes("drive.google.com"));

  // If multiple individual file links — download each directly
  const fileIds = [];
  for (const url of urls) {
    const fId = extractFileId(url) || (url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || [])[1];
    if (fId) fileIds.push(fId);
  }

  if (fileIds.length > 0) {
    const results = [];
    for (const fileId of fileIds.slice(0, 20)) {
      try {
        const resp = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
        results.push({ buffer: Buffer.from(resp.data), name: `${fileId}.jpg` });
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.log(`  Skipping file ${fileId}: ${err.message}`);
      }
    }
    return results;
  }

  // Single folder link
  const folderId = extractFolderId(urls[0] || driveUrl);
  if (!folderId) return [];

  let list = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
    fields: "files(id,name,mimeType)", orderBy: "name", pageSize: 20,
  });
  let files = list.data.files || [];

  if (!files.length) {
    const subList = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id,name)", orderBy: "name", pageSize: 20,
    });
    for (const sub of (subList.data.files || [])) {
      if (files.length >= 20) break;
      const inner = await drive.files.list({
        q: `'${sub.id}' in parents and mimeType contains 'image/' and trashed=false`,
        fields: "files(id,name,mimeType)", orderBy: "name", pageSize: 20 - files.length,
      });
      files = files.concat(inner.data.files || []);
    }
  }

  if (!files.length) return [];

  const results = [];
  for (const file of files) {
    const resp = await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "arraybuffer" });
    results.push({ buffer: Buffer.from(resp.data), name: file.name });
    await new Promise(r => setTimeout(r, 200));
  }
  return results;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cityParam  = searchParams.get("city")?.toLowerCase();
  const dryRun     = searchParams.get("dry") === "1";
  const limitParam = parseInt(searchParams.get("limit") || "5", 10);

  if (!cityParam || !BOARD_CONFIGS[cityParam]) {
    return Response.json({ error: "Pass ?city=london|montreal|ottawa|toronto|kwcg", available: Object.keys(BOARD_CONFIGS) });
  }

  for (const [k, v] of Object.entries({ MONDAY_API_KEY, CF_ACCOUNT_ID, CF_API_TOKEN, GCP_JSON })) {
    if (!v) return Response.json({ error: `Missing env var: ${k}` }, { status: 500 });
  }

  const board = BOARD_CONFIGS[cityParam];
  const log   = [];
  const out   = (msg) => { log.push(msg); console.log(msg); };

  try {
    const creds = JSON.parse(GCP_JSON);
    const auth  = new google.auth.GoogleAuth({ credentials: creds, scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
    const drive = google.drive({ version: "v3", auth });
    out(`✅ Google Drive authenticated`);

    out(`📋 Fetching ${cityParam} board...`);
    const data = await mondayCall(`{
      boards(ids: [${board.id}]) {
        items_page(limit: 200) {
          items {
            id name
            column_values(ids: ["status2", "${board.photoCol}"]) { id text value }
            subitems { id name column_values { id text value type } }
          }
        }
      }
    }`);

    const items = data?.data?.boards?.[0]?.items_page?.items || [];
    out(`📦 Total items: ${items.length}`);

    const active = items.filter(item => {
      const statusCol  = item.column_values?.find(cv => cv.id === "status2");
      const statusText = statusCol?.text || "";
      return ACTIVE_STATUSES.some(s => statusText.includes(s));
    });
    out(`✅ Active (Lease-Up / Stabilization): ${active.length}`);

    const needsMigration = active.filter(item => {
      const photoCol  = item.column_values?.find(cv => cv.id === board.photoCol);
      return !isAlreadyMigrated(photoCol?.text || "");
    });
    out(`📸 Need migration: ${needsMigration.length}`);

    const batch = needsMigration.slice(0, limitParam);
    out(`🎯 Processing this batch: ${batch.length}`);

    if (dryRun) {
      return Response.json({
        success: true, dryRun: true, log,
        stats: { total: items.length, active: active.length, needsMigration: needsMigration.length, thisBatch: batch.length },
        items: batch.map(i => ({ id: i.id, name: i.name })),
      });
    }

    const results = [];
    for (const item of batch) {
      const iOut = (msg) => out(`  [${item.name}] ${msg}`);
      try {
        let driveUrl = "";

        // New standard: always look for "RB Website Photos" subitem
        // If not present → building has no curated photos → skip
        // Debug: log all subitem names
        const subitemNames = (item.subitems || []).map(s => s.name);
        iOut(`📋 Subitems: ${JSON.stringify(subitemNames)}`);

        const rbPhotosSub = item.subitems?.find(s =>
          s.name?.toLowerCase().trim() === "rb website"
        );

        if (rbPhotosSub) {
          // Check all link-type columns for a Drive URL
          const allLinks = rbPhotosSub.column_values?.filter(cv => cv.text);
          iOut(`🔗 RB Website columns with text: ${JSON.stringify(allLinks?.map(cv => ({id: cv.id, text: cv.text?.slice(0,50)})))}`);
          const linkCol = rbPhotosSub.column_values?.find(cv =>
            (cv.text || "").includes("drive.google")
          );
          driveUrl = linkCol?.text || "";
        }

        if (!driveUrl || !driveUrl.includes("drive.google")) {
          iOut(`⏭️ No "RB Website" subitem with Drive link — skipping`);
          results.push({ id: item.id, name: item.name, status: "skipped", reason: "no_rb_website_photos" });
          continue;
        }

        const images = await getImagesFromDrive(drive, driveUrl);
        if (!images.length) {
          iOut(`⚠️ No images in Drive — skipping`);
          results.push({ id: item.id, name: item.name, status: "skipped", reason: "no_images" });
          continue;
        }
        iOut(`📸 ${images.length} image(s) downloaded`);

        const cfUrls = [];
        for (const img of images) {
          const url = await uploadToCloudflare(img.buffer, img.name);
          cfUrls.push(url);
          await new Promise(r => setTimeout(r, 300));
        }
        iOut(`☁️ ${cfUrls.length} uploaded to Cloudflare`);

        await writeMondayColumn(item.id, board.id, board.photoCol, JSON.stringify(cfUrls));
        iOut(`💾 Written back to Monday`);
        results.push({ id: item.id, name: item.name, status: "migrated", photos: cfUrls.length });

      } catch (err) {
        out(`  [${item.name}] ❌ ${err.message}`);
        results.push({ id: item.id, name: item.name, status: "error", error: err.message });
      }
      await new Promise(r => setTimeout(r, 500));
    }

    const migrated  = results.filter(r => r.status === "migrated").length;
    const skipped   = results.filter(r => r.status === "skipped").length;
    const errors    = results.filter(r => r.status === "error").length;
    const remaining = needsMigration.length - batch.length;

    return Response.json({
      success: true, log, results,
      stats: { total: items.length, active: active.length, needsMigration: needsMigration.length, migrated, skipped, errors, remaining },
      message: remaining > 0 ? `${remaining} buildings still need migration — run again` : "All done!",
    });

  } catch (err) {
    return Response.json({ error: err.message, log }, { status: 500 });
  }
}
