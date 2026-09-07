import { Topbar } from "@/components/shell/topbar";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";

export function PhaseStub({
  title,
  subtitle,
  phase,
  description,
}: {
  title: string;
  subtitle: string;
  phase: string;
  description: string;
}) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <div className="flex flex-1 items-center justify-center p-6 md:p-8">
        <Panel className="max-w-md text-center">
          <Badge tone="warn" className="mx-auto mb-4">
            {phase}
          </Badge>
          <p className="text-sm text-muted">{description}</p>
        </Panel>
      </div>
    </>
  );
}
