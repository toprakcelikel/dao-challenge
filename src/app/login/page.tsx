"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
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
      router.push(data.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-2xl font-extrabold text-indigo-600">
          🏆 DAO Challenge
        </Link>
        <form onSubmit={onSubmit} className="card space-y-4">
          <h1 className="text-xl font-bold">Welcome back</h1>

          {error && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
          </div>

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Logging in…" : "Log In"}
          </button>
          <p className="text-center text-sm text-slate-500">
            New here?{" "}
            <Link href="/register" className="font-semibold text-indigo-600">Create an account</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
