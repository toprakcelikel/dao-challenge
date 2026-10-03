import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminNav from "@/components/AdminNav";
import GroupEditor from "@/components/GroupEditor";
import MemberMover from "@/components/MemberMover";
import DeleteUserButton from "@/components/DeleteUserButton";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const groups = await prisma.group.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      members: { where: { role: "STUDENT" }, orderBy: { createdAt: "asc" } },
    },
  });

  const totalStudents = groups.reduce((n, g) => n + g.members.length, 0);
  const teamOptions = groups.map((g) => ({ id: g.id, name: g.name }));

  return (
    <>
      <AdminNav active="groups" />
      <main className="mx-auto max-w-5xl px-4 pb-10">
        <div className="mb-4">
          <h1 className="text-lg font-bold">Groups &amp; Roster</h1>
          <p className="text-sm text-slate-500">
            {totalStudents} student{totalStudents === 1 ? "" : "s"} registered. New students
            are auto-assigned to the smallest group for balance.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full" style={{ backgroundColor: g.color }} />
                  <span className="text-lg font-bold">{g.name}</span>
                  <span className="badge bg-slate-100 text-slate-600">{g.points} pts</span>
                </div>
                <GroupEditor group={{ id: g.id, name: g.name, color: g.color, points: g.points }} />
              </div>
              <p className="mt-1 text-xs text-slate-400">{g.members.length} members</p>
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {g.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 py-1.5">
                    <span className="truncate">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <MemberMover userId={m.id} currentGroupId={g.id} groups={teamOptions} />
                      <DeleteUserButton userId={m.id} userName={m.name} />
                    </div>
                  </li>
                ))}
                {g.members.length === 0 && (
                  <li className="py-1.5 text-slate-400">No members yet.</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
