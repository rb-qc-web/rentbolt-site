import { google } from "googleapis";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folder");
  if (!folderId) return Response.json({ error: "Pass ?folder=FOLDER_ID" });

  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  const drive = google.drive({ version: "v3", auth });

  const results = {};

  // Standard listing with supportsAllDrives
  try {
    const r1 = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id,name,mimeType)",
      pageSize: 50,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });
    results.withAllDrives = r1.data.files;
  } catch (e) { results.withAllDrivesError = e.message; }

  // Standard listing without supportsAllDrives
  try {
    const r2 = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id,name,mimeType)",
      pageSize: 50,
    });
    results.standard = r2.data.files;
  } catch (e) { results.standardError = e.message; }

  return Response.json(results);
}
