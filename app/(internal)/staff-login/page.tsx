"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InternalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Unable to log in.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="glass-panel w-full max-w-sm rounded-lg p-8">
        <div className="mb-6 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_2px_var(--accent)]" />
          <span className="font-mono text-sm font-semibold tracking-[0.2em] text-foreground">
            RISKOS
          </span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Internal sign-in</h1>
        <p className="mt-2 text-sm text-muted">
          For advisors, risk admins, and model admins. Investors should use the main app login.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-muted">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-border bg-white/[0.02] px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
              autoComplete="email"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-muted">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-border bg-white/[0.02] px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
              autoComplete="current-password"
            />
          </label>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-accent/15 disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
