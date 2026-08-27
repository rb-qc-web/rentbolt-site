import { getPhotoStatus } from "@/lib/migrate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const status = await getPhotoStatus();

  const totals = Object.values(status).reduce((acc, s) => {
    if (s.error) return acc;
    acc.active += s.activeBuildings;
    acc.withPhotos += s.withPhotos;
    acc.pending += s.needsAttention.pendingMigration.length;
    acc.missingSubitem += s.needsAttention.missingSubitem.length;
    return acc;
  }, { active: 0, withPhotos: 0, pending: 0, missingSubitem: 0 });

  return Response.json({
    totals: {
      ...totals,
      coverage: totals.active ? `${Math.round((totals.withPhotos / totals.active) * 100)}%` : "n/a",
    },
    legend: {
      pendingMigration: "Has a Drive link — will be picked up by the next hourly run",
      missingSubitem: "No 'RB Website' subitem yet — needs a VA to add one",
      subitemButNoLink: "Subitem exists but the Drive link cell is empty",
      unreadableLink: "Link present but not a recognisable Drive folder or file",
    },
    byCity: status,
  });
}
