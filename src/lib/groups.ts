import { prisma } from "./db";

/**
 * Picks the group with the fewest members for balanced, even assignment.
 * Ties are broken by sortOrder then id for deterministic behavior.
 */
export async function pickGroupForNewMember(): Promise<string | null> {
  const groups = await prisma.group.findMany({
    include: { _count: { select: { members: true } } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  if (groups.length === 0) return null;

  let chosen = groups[0];
  for (const g of groups) {
    if (g._count.members < chosen._count.members) {
      chosen = g;
    }
  }
  return chosen.id;
}
