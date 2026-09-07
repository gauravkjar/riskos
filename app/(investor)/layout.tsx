import Link from "next/link";
import { investorNav } from "@/lib/nav";
import { getCurrentUser } from "@/lib/auth/current-user";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function InvestorLayout({ children }: { children: React.ReactNode }) {
  // Unauthenticated access to protected investor routes is redirected to
  // /login by middleware.ts (Node runtime, HMAC session verification).
  // /login and /register themselves render inside this same layout, so
  // `user` may legitimately be null here.
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_2px_var(--accent)]" />
          <span className="font-mono text-sm font-semibold tracking-[0.2em] text-foreground">
            RISKOS
          </span>
        </div>

        <nav className="flex items-center gap-6">
          {investorNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-sm text-muted-2">
          {user ? (
            <>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised text-xs text-foreground">
                {user.email.slice(0, 2).toUpperCase()}
              </span>
              <LogoutButton />
            </>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-8 py-12">{children}</main>
    </div>
  );
}
