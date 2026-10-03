import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ChallengeStatus } from "../src/lib/constants";

const prisma = new PrismaClient();

// 4 numbered teams. Admin can recolor later; names are normalized on each run.
const GROUPS = [
  { name: "Team #1", color: "#f97316", sortOrder: 1 }, // orange
  { name: "Team #2", color: "#3b82f6", sortOrder: 2 }, // blue
  { name: "Team #3", color: "#22c55e", sortOrder: 3 }, // green
  { name: "Team #4", color: "#a855f7", sortOrder: 4 }, // purple
];

// Challenge categories + ladders (easy -> harder). All editable by admin.
const CATEGORIES: {
  name: string;
  icon: string;
  challenges: { title: string; description: string; difficulty: string }[];
}[] = [
  {
    name: "Photography in the Wild",
    icon: "📷",
    challenges: [
      { title: "Bird", description: "Photograph a wild bird in its natural habitat.", difficulty: "Easy" },
      { title: "Squirrel", description: "Capture a clear photo of a squirrel outdoors.", difficulty: "Easy" },
      { title: "Pig", description: "Snap a photo of a pig (farm or wild).", difficulty: "Medium" },
      { title: "Mountain lake", description: "Photograph a mountain lake landscape.", difficulty: "Hard" },
    ],
  },
  {
    name: "Cooking",
    icon: "🍳",
    challenges: [
      { title: "Scrambled eggs", description: "Cook scrambled eggs and photograph the finished plate.", difficulty: "Easy" },
      { title: "Pancakes", description: "Make a stack of pancakes and show the result.", difficulty: "Easy" },
      { title: "Batch of cookies from scratch", description: "Bake a batch of cookies from scratch and show the tray.", difficulty: "Medium" },
      { title: "Chocolate cake", description: "Bake a chocolate cake and photograph it.", difficulty: "Hard" },
    ],
  },
  {
    name: "Artwork",
    icon: "🎨",
    challenges: [
      { title: "Pencil sketch of a mug", description: "Draw a pencil sketch of a mug. Winner is chosen out of the first two submissions.", difficulty: "Easy" },
      { title: "Portrait of a landscape", description: "Paint or draw a landscape. Winner is chosen out of the first two submissions.", difficulty: "Easy" },
      { title: "Portrait of a real person", description: "Create a portrait of a real person. Winner is chosen out of the first two submissions.", difficulty: "Medium" },
      { title: "Fully composed canvas painting (acrylic/oil)", description: "Complete a fully composed canvas painting in acrylic or oil. Winner is chosen out of the first two submissions.", difficulty: "Hard" },
    ],
  },
];

async function main() {
  // App settings (single row).
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, eventEnded: false },
  });

  // Teams: ensure exactly 4, normalized to "Team #1".."Team #4" by position.
  // Existing groups are renamed in place so members, points, and colors are kept.
  const existingGroups = await prisma.group.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  for (let i = 0; i < GROUPS.length; i++) {
    const target = GROUPS[i];
    const current = existingGroups[i];
    if (current) {
      if (current.name !== target.name || current.sortOrder !== target.sortOrder) {
        await prisma.group.update({
          where: { id: current.id },
          data: { name: target.name, sortOrder: target.sortOrder },
        });
      }
    } else {
      await prisma.group.create({ data: target });
    }
  }

  // Admin login comes only from the environment; when set, it also replaces an existing admin's password.
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const existingAdmin = adminEmail
    ? await prisma.user.findUnique({ where: { email: adminEmail } })
    : null;
  if (!adminEmail || !adminPassword) {
    console.log("SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD is not set; skipping admin account setup.");
  } else if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { passwordHash: await bcrypt.hash(adminPassword, 10) },
    });
    console.log(`Admin password for ${adminEmail} set from SEED_ADMIN_PASSWORD.`);
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        name: "DAO Admin",
        role: "ADMIN",
      },
    });
    console.log(`Seeded admin login for ${adminEmail}.`);
  }

  // Categories + challenges (only if none exist yet).
  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    let catOrder = 1;
    for (const cat of CATEGORIES) {
      const category = await prisma.category.create({
        data: { name: cat.name, icon: cat.icon, sortOrder: catOrder++ },
      });
      let level = 1;
      for (const ch of cat.challenges) {
        await prisma.challenge.create({
          data: {
            categoryId: category.id,
            level,
            sortOrder: level,
            title: ch.title,
            description: ch.description,
            difficulty: ch.difficulty,
            // First challenge in each ladder is ACTIVE; the rest are LOCKED.
            status: level === 1 ? ChallengeStatus.ACTIVE : ChallengeStatus.LOCKED,
          },
        });
        level++;
      }
    }
    console.log(`Seeded ${CATEGORIES.length} categories with challenge ladders.`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
