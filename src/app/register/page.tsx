"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState<{ name: string; color: string } | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      setGroup(data.group);
      // Brief celebratory reveal of the assigned group, then go to dashboard.
      setTimeout(() => router.push("/dashboard"), 1600);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (group) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-center text-white">
        <div>
          <div className="text-6xl">🎉</div>
          <p className="mt-4 text-xl">You&apos;ve joined</p>
          <p className="mt-1 text-4xl font-extrabold" style={{ color: group.color }}>
            <span className="rounded-xl bg-white px-4 py-1">{group.name}</span>
          </p>
          <p className="mt-6 text-white/80">Taking you to your dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-2xl font-extrabold text-indigo-600">
          🏆 DAO Challenge
        </Link>
        <form onSubmit={onSubmit} className="card space-y-4">
          <h1 className="text-xl font-bold">Create your account</h1>

          {error && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="At least 8 characters" required />
          </div>

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating…" : "Sign Up"}
          </button>
          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-indigo-600">Log in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
