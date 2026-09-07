export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4 md:px-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="hidden items-center gap-4 text-xs text-muted-2 sm:flex">
        <span>Model v1.0</span>
      </div>
    </header>
  );
}
