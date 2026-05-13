import type { OperationalScenario } from "@/shared/contracts/operational";
import { operationalDataGateway } from "@/shared/data";

type InternalErrorCode =
  | "invalid_body"
  | "not_available_in_environment";

function errorResponse(
  status: number,
  code: InternalErrorCode,
  message: string,
) {
  return Response.json(
    {
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: {
        "cache-control": "no-store",
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateScenario(value: unknown): value is OperationalScenario {
  if (!isObject(value)) return false;

  return Array.isArray(value.assets)
    && Array.isArray(value.alerts)
    && Array.isArray(value.incidents)
    && Array.isArray(value.layers)
    && Array.isArray(value.timeline);
}

export async function PUT(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return errorResponse(
      403,
      "not_available_in_environment",
      "Internal test-data mutations are disabled in production.",
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "invalid_body", "Request body must be valid JSON.");
  }

  if (!validateScenario(body)) {
    return errorResponse(
      400,
      "invalid_body",
      "Request body must satisfy the canonical OperationalScenario shape.",
    );
  }

  const snapshot = await operationalDataGateway.replaceSnapshot(body);

  return Response.json(snapshot, {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}
