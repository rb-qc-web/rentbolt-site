import { google } from "googleapis";

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const CF_ACCOUNT_ID  = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN   = process.env.CLOUDFLARE_API_TOKEN;
const GCP_JSON       = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

const BOARD_CONFIGS = {
  montreal: { id: "3743206409",  photoCol: "text_mkxvrp7p" },
  ottawa:   { id: "4955235841",  photoCol: "text_mkxvrp7p" },
  toronto:  { id: "18402583974", photoCol: "text_mkxvrp7p" },
  london:   { id: "18401824343", photoCol: "text_mkxvrp7p" },
  kwcg:     { id: "5892819868",  photoCol: "text_mkxvrp7p" },
};

const ACTIVE_STATUSES = ["Lease-Up", "Stabilization"];

function extractFolderId(url) {
  const m = (url || "").match(/folders\/([a-zA-Z0-9_-]+)/);
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
  const blob = new Blob([imageBuffer], { type: "image/jpeg" });
  form.append("file", blob, filename);
  form.append("requireSignedURLs", "false");
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
    { method: "POST", headers: { Authorization: `Bearer ${CF_API_TOKEN}` }, body: form }
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

async function getImagesFromDrive(drive, folderId) {
  let list = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
    fields: "files(id,name,mimeType)", orderBy: "name", pageSize: 20,
    includeItemsFromAllDrives: true, supportsAllDrives: true,
  });
  let files = list.data.files || [];

  if (!files.length) {
    const subList = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id,name)", orderBy: "name", pageSize: 20,
      includeItemsFromAllDrives: true, supportsAllDrives: true,
    });
    for (const sub of (subList.data.files || [])) {
      if (files.length >= 20) break;
      const inner = await drive.files.list({
        q: `'${sub.id}' in parents and mimeType contains 'image/' and trashed=false`,
        fields: "files(id,name,mimeType)", orderBy: "name", pageSize: 20 - files.length,
        includeItemsFromAllDrives: true, supportsAllDrives: true,
      });
      files = files.concat(inner.data.files || []);
    }
  }

  const results = [];
  for (const file of files) {
    const resp = await drive.files.get(
      { fileId: file.id, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" }
    );
    results.push({ buffer: Buffer.from(resp.data), name: file.name });
    await new Promise(r => setTimeout(r, 200));
  }
  return results;
}

export async function runBatchMigration() {
  if (!MONDAY_API_KEY || !CF_ACCOUNT_ID || !CF_API_TOKEN || !GCP_JSON) return { skipped: "missing env vars" };

  const creds = JSON.parse(GCP_JSON);
  const auth  = new google.auth.GoogleAuth({ credentials: creds, scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
  const drive = google.drive({ version: "v3", auth });

  const summary = {};

  for (const [city, board] of Object.entries(BOARD_CONFIGS)) {
    try {
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
      const active = items.filter(i => {
        const s = i.column_values?.find(cv => cv.id === "status2");
        return ACTIVE_STATUSES.some(st => (s?.text || "").includes(st));
      });

      let migrated = 0, skipped = 0, errors = 0;

      for (const item of active) {
        const photoCol = item.column_values?.find(cv => cv.id === board.photoCol);
        if (isAlreadyMigrated(photoCol?.text || "")) { skipped++; continue; }

        const rbSub = item.subitems?.find(s => s.name?.toLowerCase().trim() === "rb website");
        if (!rbSub) { skipped++; continue; }

        const linkCol = rbSub.column_values?.find(cv => (cv.text || "").includes("drive.google"));
        if (!linkCol?.text) { skipped++; continue; }

        const folderId = extractFolderId(linkCol.text);
        if (!folderId) { skipped++; continue; }

        try {
          const images = await getImagesFromDrive(drive, folderId);
          if (!images.length) { skipped++; continue; }

          const cfUrls = [];
          for (const img of images) {
            const url = await uploadToCloudflare(img.buffer, img.name);
            cfUrls.push(url);
            await new Promise(r => setTimeout(r, 300));
          }

          await writeMondayColumn(item.id, board.id, board.photoCol, JSON.stringify(cfUrls));
          migrated++;
        } catch (err) {
          console.error(`[Migration] ${city}/${item.name}: ${err.message}`);
          errors++;
        }

        await new Promise(r => setTimeout(r, 500));
      }

      summary[city] = { migrated, skipped, errors };
    } catch (err) {
      summary[city] = { error: err.message };
    }
  }

  return summary;
}
