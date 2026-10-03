import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminNav from "@/components/AdminNav";
import ContentManager from "@/components/ContentManager";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      challenges: { orderBy: { sortOrder: "asc" } },
    },
  });

  return (
    <>
      <AdminNav active="content" />
      <main className="mx-auto max-w-4xl px-4 pb-10">
        <div className="mb-4">
          <h1 className="text-lg font-bold">Categories &amp; Tasks</h1>
          <p className="text-sm text-slate-500">
            Build challenge ladders. The first task in a category is open; later tasks unlock
            as each is won. Add, edit, or remove anything below.
          </p>
        </div>
        <ContentManager categories={categories} />
      </main>
    </>
  );
}
