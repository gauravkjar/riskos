import { Sidebar } from "@/components/shell/sidebar";
import { getCurrentUser } from "@/lib/auth/current-user";
import { StaffLogoutButton } from "@/components/auth/staff-logout-button";

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  // Unauthenticated access and INVESTOR-role access to internal routes is
  // redirected by middleware.ts (Node runtime, HMAC session verification)
  // before this layout ever renders. `user` is expected to be a staff
  // (non-INVESTOR) user here, except on /staff-login which is not gated.
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar
        staffIdentity={
          user
            ? { label: `${user.email} · ${user.role}`, initials: user.email.slice(0, 2).toUpperCase() }
            : null
        }
      />
      <div className="flex min-h-screen flex-1 flex-col">{children}</div>
    </div>
  );
}
