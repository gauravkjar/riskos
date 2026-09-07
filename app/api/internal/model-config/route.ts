import { NextResponse } from "next/server";
import { requireRole, HttpError } from "@/lib/auth/require";
import { getLatestModelConfig, getModelConfigHistory, saveModelConfigVersion, appendAuditEvent } from "@/lib/db/store";
import type { EngineConfig } from "@/lib/config/types";

export async function GET() {
  try {
    await requireRole("MODEL_ADMIN", "ADMIN");
    const [latest, history] = await Promise.all([
      getLatestModelConfig(),
      getModelConfigHistory(),
    ]);
    return NextResponse.json({ latest, history });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // eslint-disable-next-line no-console
    console.error("[api/internal/model-config] GET failed", err);
    return NextResponse.json({ error: "Unable to load model configuration." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole("MODEL_ADMIN", "ADMIN");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { weights, bands, allocationTable, portfolioSizeRules } = (body ?? {}) as Partial<
      Omit<EngineConfig, "version" | "savedAt">
    >;

    if (!weights || !bands || !allocationTable || !portfolioSizeRules) {
      return NextResponse.json(
        { error: "weights, bands, allocationTable, and portfolioSizeRules are all required." },
        { status: 400 }
      );
    }

    const before = await getLatestModelConfig();

    const saved = await saveModelConfigVersion({
      savedByUserId: user.id,
      config: { weights, bands, allocationTable, portfolioSizeRules },
    });

    await appendAuditEvent({
      userId: user.id,
      type: "model_config.updated",
      payload: {
        fromVersion: before.version,
        toVersion: saved.version,
        savedByUserId: user.id,
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // eslint-disable-next-line no-console
    console.error("[api/internal/model-config] POST failed", err);
    return NextResponse.json({ error: "Unable to save model configuration." }, { status: 500 });
  }
}
