import { google } from "googleapis";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const CF_ACCOUNT_ID  = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN   = process.env.CLOUDFLARE_API_TOKEN;
const GCP_JSON       = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

function extractFolderId(url) {
  const m = (url || "").match(/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function extractFileId(url) {
  const m = (url || "").match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
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
    {
      method: "POST",
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const itemId  = searchParams.get("item");
  const boardId = searchParams.get("board") || "3743206409";
  const dryRun  = searchParams.get("dry") === "1";

  if (!itemId) {
    return Response.json({ error: "Pass ?item=ITEM_ID&board=BOARD_ID" });
  }

  // Validate env
  for (const [k, v] of Object.entries({ MONDAY_API_KEY, CF_ACCOUNT_ID, CF_API_TOKEN, GCP_JSON })) {
    if (!v) return Response.json({ error: `Missing env var: ${k}` }, { status: 500 });
  }

  const log = [];
  const out = (msg) => { log.push(msg); console.log(msg); };

  try {
    // Init Google Drive
    const creds = JSON.parse(GCP_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });
    out("✅ Google Drive authenticated");

    // Fetch item from Monday
    const data = await mondayCall(`{
      boards(ids: [${boardId}]) {
        items_page(limit: 500) {
          items {
            id name
            column_values { id text }
          }
        }
      }
    }`);

    const items = data?.data?.boards?.[0]?.items_page?.items || [];
    const item = items.find(i => i.id === itemId);
    if (!item) return Response.json({ error: `Item ${itemId} not found on board ${boardId}` }, { status: 404 });

    out(`🏢 Found: ${item.name}`);

    // Find Drive URL — try text_mkxvrp7p first, then any column with drive.google.com
    let driveUrl = item.column_values?.find(cv => cv.id === "text_mkxvrp7p")?.text || "";
    if (!driveUrl.includes("drive.google")) {
      driveUrl = item.column_values?.find(cv => (cv.text || "").includes("drive.google.com"))?.text || "";
    }

    if (!driveUrl) return Response.json({ error: "No Drive URL found on this item", item: item.name }, { status: 404 });
    out(`📁 Drive URL: ${driveUrl}`);

    const folderId = extractFolderId(driveUrl);
    const fileId   = !folderId ? extractFileId(driveUrl) : null;

    let imageBuffer;
    let filename = `${itemId}-hero.jpg`;

    if (folderId) {
      out(`📂 Folder ID: ${folderId}`);

      // Try images directly in this folder first
      let list = await drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
        fields: "files(id,name,mimeType)",
        orderBy: "name",
        pageSize: 1,
      });
      let files = list.data.files || [];

      // None found at root — list subfolders and check inside each, in order
      if (!files.length) {
        out("📂 No images at root — checking subfolders...");
        const subList = await drive.files.list({
          q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed=false`,
          fields: "files(id,name)",
          orderBy: "name",
          pageSize: 20,
        });
        const subfolders = subList.data.files || [];
        out(`📂 Found ${subfolders.length} subfolder(s): ${subfolders.map(f => f.name).join(", ")}`);

        for (const sub of subfolders) {
          const innerList = await drive.files.list({
            q: `'${sub.id}' in parents and mimeType contains 'image/' and trashed=false`,
            fields: "files(id,name,mimeType)",
            orderBy: "name",
            pageSize: 1,
          });
          const innerFiles = innerList.data.files || [];
          if (innerFiles.length) {
            out(`📸 Found image in subfolder "${sub.name}": ${innerFiles[0].name}`);
            files = innerFiles;
            break;
          }
        }
      }

      if (!files.length) return Response.json({ error: "No images found in folder or its subfolders", folderId, log });
      out(`📸 Using: ${files[0].name}`);

      const resp = await drive.files.get(
        { fileId: files[0].id, alt: "media" },
        { responseType: "arraybuffer" }
      );
      imageBuffer = Buffer.from(resp.data);
      filename = files[0].name;

    } else if (fileId) {
      out(`📄 File ID: ${fileId}`);
      const resp = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "arraybuffer" }
      );
      imageBuffer = Buffer.from(resp.data);

    } else {
      return Response.json({ error: "Could not parse Drive URL", driveUrl });
    }

    out(`📦 Downloaded: ${Math.round(imageBuffer.length / 1024)}KB`);

    if (dryRun) {
      return Response.json({ success: true, dryRun: true, log, message: "Dry run — no upload performed" });
    }

    // Upload to Cloudflare
    out("☁️ Uploading to Cloudflare...");
    const cfUrl = await uploadToCloudflare(imageBuffer, filename);
    out(`✅ Cloudflare URL: ${cfUrl}`);

    // Write back to Monday
    await writeMondayColumn(itemId, boardId, "text_mkxvrp7p", cfUrl);
    out("💾 Written back to Monday");

    return Response.json({ success: true, cfUrl, item: item.name, log });

  } catch (err) {
    return Response.json({ error: err.message, log }, { status: 500 });
  }
}
// redeploy trigger Mon Jun 22 20:47:25 UTC 2026
// reconnect test Mon Jun 22 20:54:12 UTC 2026
