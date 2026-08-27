import { runPhotoMigration } from "@/lib/migrate";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // Vercel Pro

export async function GET(request) {
  const isCron = request.headers.get("x-vercel-cron") === "1";
  const authed = request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  const manual = new URL(request.url).searchParams.get("secret") === process.env.CRON_SECRET;
  if (!isCron && !authed && !manual) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Leave headroom under maxDuration so the function always returns cleanly.
  const result = await runPhotoMigration({ budgetMs: 240000 });

  if (result.migrated) console.log(`[Photos] migrated ${result.migrated} building(s)`);
  if (result.failed)   console.error(`[Photos] ${result.failed} failed:`, JSON.stringify(result.errors));

  return Response.json(result);
}
