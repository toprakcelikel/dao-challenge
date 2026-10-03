import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center text-white">
        <div className="mb-6 text-7xl">🏆</div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Davidson Academy Online
        </h1>
        <p className="mt-2 text-2xl font-bold text-white/90">Group Challenge Game</p>
        <p className="mt-6 max-w-xl text-lg text-white/90">
          Join a team, race through fun real-world challenges, and earn points for
          your group. Complete a task, snap a photo to prove it, and climb the
          leaderboard!
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register" className="btn bg-white px-6 py-3 text-lg text-indigo-700 hover:bg-indigo-50">
            Get Started
          </Link>
          <Link href="/login" className="btn bg-white/15 px-6 py-3 text-lg text-white ring-1 ring-white/40 hover:bg-white/25">
            Log In
          </Link>
        </div>

        <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
          {[
            { icon: "👋", title: "Sign Up", text: "Register and get placed on a team." },
            { icon: "🎯", title: "Complete Tasks", text: "Be first to finish to win the point." },
            { icon: "📈", title: "Climb the Board", text: "Watch your group rise to the top." },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl bg-white/15 p-5 text-left ring-1 ring-white/20">
              <div className="text-3xl">{s.icon}</div>
              <div className="mt-2 font-bold">{s.title}</div>
              <div className="text-sm text-white/80">{s.text}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
