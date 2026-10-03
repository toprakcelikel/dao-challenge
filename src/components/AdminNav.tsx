import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function AdminNav({ active }: { active: string }) {
  const tabs = [
    { href: "/admin", label: "Review", key: "review" },
    { href: "/admin/content", label: "Categories & Tasks", key: "content" },
    { href: "/admin/groups", label: "Groups", key: "groups" },
  ];
  return (
    <header className="mb-6 border-b border-white/60 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/admin" className="text-xl font-extrabold text-indigo-600">
          🛠️ DAO Admin
        </Link>
        <nav className="flex items-center gap-1">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                active === t.key ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </div>
    </header>
  );
}
