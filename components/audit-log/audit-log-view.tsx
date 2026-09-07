"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/shell/topbar";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import type { AuditEvent } from "@/lib/db/schema";

type AuditRow = AuditEvent & { userEmail: string | null };

const TYPE_TONE: Record<string, "accent" | "warn" | "neutral" | "danger"> = {
  "assessment.created": "accent",
  "model_config.updated": "warn",
  "user.registered": "neutral",
  "user.login": "neutral",
  "user.bootstrap_admin_created": "danger",
};

export function AuditLogView() {
  const [events, setEvents] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/internal/audit-log")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error ?? "Failed to load audit log.");
        return body as AuditRow[];
      })
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Topbar title="Audit Log" subtitle="Append-only event stream — registrations, logins, assessments, config changes" />
      <div className="flex-1 space-y-4 overflow-y-auto p-6 md:p-8">
        {error && (
          <Panel className="text-center">
            <p className="text-sm text-danger">{error}</p>
          </Panel>
        )}
        {!error && !events && <p className="text-sm text-muted">Loading…</p>}
        {!error && events && events.length === 0 && (
          <Panel className="text-center">
            <p className="text-sm text-muted">No audit events recorded yet.</p>
          </Panel>
        )}
        {!error &&
          events &&
          events.map((event) => {
            const isOpen = expanded === event.id;
            const assessmentId =
              typeof event.payload?.assessmentId === "string"
                ? (event.payload.assessmentId as string)
                : null;

            return (
              <Panel key={event.id}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : event.id)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone={TYPE_TONE[event.type] ?? "neutral"}>{event.type}</Badge>
                      <span className="tabular text-sm text-foreground">
                        {event.userEmail ?? "system"}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-2">
                      {new Date(event.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-muted-2">{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4 text-[13px]">
                    <div>
                      <PanelHeader eyebrow="Raw payload" title="Event data" />
                      <pre className="tabular overflow-x-auto rounded-md bg-black/30 p-3 text-xs text-muted">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </div>
                    {assessmentId && (
                      <a
                        href={`/profiles/${assessmentId}`}
                        className="inline-block rounded-md border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs text-accent-strong hover:bg-accent/15"
                      >
                        Open assessment record
                      </a>
                    )}
                  </div>
                )}
              </Panel>
            );
          })}
      </div>
    </>
  );
}
