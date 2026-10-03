import { prisma } from "./db";

export async function getLeaderboard() {
  return prisma.group.findMany({
    orderBy: [{ points: "desc" }, { sortOrder: "asc" }],
    include: { _count: { select: { members: true } } },
  });
}

export async function getEventEnded(): Promise<boolean> {
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  return settings?.eventEnded ?? false;
}

/**
 * Returns active categories, each with its current ACTIVE challenge (if any).
 * Also reports, for the given group, whether they have a pending submission
 * on that challenge and whether they already won it.
 */
export async function getCategoriesWithActiveChallenge(groupId: string | null) {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      challenges: {
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        take: 1,
        include: {
          submissions: groupId
            ? { where: { groupId }, orderBy: { createdAt: "desc" } }
            : false,
          _count: { select: { submissions: true } },
        },
      },
      _count: { select: { challenges: true } },
    },
  });

  const completedCounts = await prisma.challenge.groupBy({
    by: ["categoryId"],
    where: { status: "COMPLETED" },
    _count: { _all: true },
  });
  const completedMap = new Map(completedCounts.map((c) => [c.categoryId, c._count._all]));

  return categories.map((cat) => {
    const active = cat.challenges[0] ?? null;
    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      totalChallenges: cat._count.challenges,
      completedChallenges: completedMap.get(cat.id) ?? 0,
      activeChallenge: active
        ? {
            id: active.id,
            title: active.title,
            description: active.description,
            difficulty: active.difficulty,
            level: active.level,
            myGroupSubmission: Array.isArray(active.submissions)
              ? active.submissions[0] ?? null
              : null,
          }
        : null,
    };
  });
}
