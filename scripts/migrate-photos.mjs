/**
 * RentBolt Photo Migration Script
 * Drive folder → download hero image → upload to Cloudflare → write URL back to Monday
 *
 * Run:        node scripts/migrate-photos.mjs
 * Test one:   node scripts/migrate-photos.mjs --item 18107278663
 *
 * Required env vars:
 *   MONDAY_API_KEY
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_API_TOKEN
 *   GOOGLE_SERVICE_ACCOUNT_JSON
 */

import { google } from "googleapis";
import fetch from "node-fetch";
import FormData from "form-data";

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const CF_ACCOUNT_ID  = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN   = process.env.CLOUDFLARE_API_TOKEN;
const GCP_JSON       = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

// Board configs — driveCol = column that holds the Drive URL
// After migration, hero Cloudflare URL is written to heroWriteCol
const BOARDS = [
  { id: "3743206409",  city: "Montreal",          driveCol: "text_mkxvrp7p", heroWriteCol: "text_mkxvrp7p" },
  { id: "1399669367",  city: "Ottawa",             driveCol: "text_mkxvrp7p", heroWriteCol: "text_mkxvrp7p" },
  { id: "1399673049",  city: "London",             driveCol: "text_mkxvrp7p", heroWriteCol: "text_mkxvrp7p" },
  { id: "1399674937",  city: "Kitchener-Waterloo", driveCol: "text_mkxvrp7p", heroWriteCol: "text_mkxvrp7p" },
  // Toronto uses subitems for photos — handled separately
];

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
  form.append("file", imageBuffer, {
    filename,
    contentType: "image/jpeg",
  });
  form.append("requireSignedURLs", "false");

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        ...form.getHeaders(),
      },
      body: form,
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error(`CF error: ${JSON.stringify(data.errors)}`);
  // Return the public URL variant
  return data.result.variants.find(v => v.includes("/public")) || data.result.variants[0];
}

async function writeMondayColumn(itemId, boardId, columnId, value) {
  await mondayCall(`
    mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
        id
      }
    }
  `, {
    boardId: String(boardId),
    itemId: String(itemId),
    columnId,
    value: JSON.stringify(value),
  });
}

async function main() {
  // Validate
  for (const [k, v] of Object.entries({ MONDAY_API_KEY, CF_ACCOUNT_ID, CF_API_TOKEN, GCP_JSON })) {
    if (!v) { console.error(`❌ Missing env var: ${k}`); process.exit(1); }
  }

  // Init Google Drive
  const creds = JSON.parse(GCP_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  const drive = google.drive({ version: "v3", auth });
  console.log("✅ Google Drive authenticated");

  // Single item mode?
  const itemIdx = process.argv.indexOf("--item");
  const singleId = itemIdx > -1 ? process.argv[itemIdx + 1] : null;
  if (singleId) console.log(`🎯 Single item mode: ${singleId}`);

  let processed = 0, uploaded = 0, skipped = 0, errors = 0;

  for (const board of BOARDS) {
    console.log(`\n📋 ${board.city} (${board.id})`);

    const data = await mondayCall(`{
      boards(ids: [${board.id}]) {
        items_page(limit: 500) {
          items {
            id name
            column_values(ids: ["${board.driveCol}"]) { id text }
          }
        }
      }
    }`);

    let items = data?.data?.boards?.[0]?.items_page?.items || [];

    // Filter to items with Drive links
    if (singleId) {
      items = items.filter(i => i.id === singleId);
    } else {
      items = items.filter(i => (i.column_values?.[0]?.text || "").includes("drive.google.com"));
    }

    console.log(`   ${items.length} items with Drive links`);

    for (const item of items) {
      const driveUrl = item.column_values?.[0]?.text || "";
      processed++;
      process.stdout.write(`\n   🏢 ${item.name}\n`);

      try {
        let imageBuffer;
        let filename = `${item.id}-hero.jpg`;

        const folderId = extractFolderId(driveUrl);
        const fileId   = !folderId ? extractFileId(driveUrl) : null;

        if (folderId) {
          // Folder — grab first image alphabetically
          const list = await drive.files.list({
            q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
            fields: "files(id,name,mimeType)",
            orderBy: "name",
            pageSize: 1,
          });
          const files = list.data.files || [];
          if (!files.length) { console.log(`      ⚠️  No images in folder`); skipped++; continue; }

          console.log(`      📸 ${files[0].name}`);
          const resp = await drive.files.get(
            { fileId: files[0].id, alt: "media" },
            { responseType: "arraybuffer" }
          );
          imageBuffer = Buffer.from(resp.data);
          filename = files[0].name;

        } else if (fileId) {
          const resp = await drive.files.get(
            { fileId, alt: "media" },
            { responseType: "arraybuffer" }
          );
          imageBuffer = Buffer.from(resp.data);

        } else {
          console.log(`      ⚠️  Unrecognized URL: ${driveUrl}`);
          skipped++; continue;
        }

        // Upload to Cloudflare
        console.log(`      ☁️  Uploading ${Math.round(imageBuffer.length / 1024)}KB to Cloudflare...`);
        const cfUrl = await uploadToCloudflare(imageBuffer, filename);
        console.log(`      ✅ ${cfUrl}`);

        // Write back to Monday
        await writeMondayColumn(item.id, board.id, board.heroWriteCol, cfUrl);
        console.log(`      💾 Saved to Monday`);
        uploaded++;

        // Gentle rate limiting
        await new Promise(r => setTimeout(r, 1500));

      } catch (err) {
        console.error(`      ❌ ${err.message}`);
        errors++;
      }
    }
  }

  console.log(`\n${"─".repeat(40)}`);
  console.log(`✨ Migration complete`);
  console.log(`   Processed : ${processed}`);
  console.log(`   Uploaded  : ${uploaded}`);
  console.log(`   Skipped   : ${skipped}`);
  console.log(`   Errors    : ${errors}`);
}

main().catch(console.error);
