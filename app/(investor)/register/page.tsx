"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
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
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const registerBody = await registerRes.json();
      if (!registerRes.ok) {
        setError(registerBody?.error ?? "Unable to register.");
        return;
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!loginRes.ok) {
        // Registered but auto-login failed; send them to log in manually.
        router.push("/login");
        return;
      }
      router.push("/home");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center pt-8">
      <div className="glass-panel w-full rounded-lg p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create your account</h1>
        <p className="mt-2 text-sm text-muted">
          Takes a minute. You&apos;ll answer a short questionnaire next.
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-border bg-white/[0.02] px-3 py-2 text-sm text-foreground outline-none focus:border-accent/40"
              autoComplete="new-password"
            />
          </label>
          <p className="-mt-2 text-xs text-muted-2">At least 8 characters.</p>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent-strong transition-colors hover:bg-accent/15 disabled:opacity-50"
          >
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-2">
          Already have an account?{" "}
          <Link href="/login" className="text-accent-strong hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
