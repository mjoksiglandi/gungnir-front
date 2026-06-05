import type { Asset } from "@/shared/contracts/operational";
import { verifySameOriginRequest } from "@/app/api/_lib/verify-same-origin";
import { isInternalTestDataMutationEnabled } from "@/app/api/internal/test-data/v1/_lib/access";
import { operationalDataGateway } from "@/shared/data";

type InternalErrorCode =
  | "invalid_body"
  | "id_mismatch"
  | "not_available_in_environment";

function errorResponse(
  status: number,
  code: InternalErrorCode,
  message: string,
  details?: Record<string, string | number | boolean>,
) {
  return Response.json(
    {
      error: {
        code,
        details,
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

function isIsoDateTime(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function validateAsset(value: unknown): value is Asset {
  if (!isObject(value)) return false;
  if (value.kind !== "asset") return false;
  if (typeof value.id !== "string" || value.id.trim() === "") return false;
  if (typeof value.version !== "number" || !Number.isInteger(value.version) || value.version <= 0) return false;
  if (!isIsoDateTime(value.updatedAt)) return false;
  if (typeof value.source !== "string" || typeof value.name !== "string") return false;
  if (typeof value.callsign !== "string" || typeof value.mission !== "string") return false;
  if (!["air", "ground", "autonomous", "personnel", "sensor"].includes(String(value.assetType))) return false;
  if (!["nominal", "degraded", "lost"].includes(String(value.status))) return false;
  if (!["friendly", "neutral", "unknown"].includes(String(value.affiliation))) return false;
  if (!isObject(value.position)) return false;
  if (typeof value.position.lat !== "number" || typeof value.position.lon !== "number") return false;

  return true;
}

export async function POST(request: Request) {
  const sameOriginError = verifySameOriginRequest(request);
  if (sameOriginError) {
    return sameOriginError;
  }

  if (!isInternalTestDataMutationEnabled()) {
    return errorResponse(
      403,
      "not_available_in_environment",
      "Internal test-data mutations are disabled. Set INTERNAL_TEST_DATA_WRITE_ENABLED=true only in isolated development environments.",
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "invalid_body", "Request body must be valid JSON.");
  }

  if (!validateAsset(body)) {
    return errorResponse(
      400,
      "invalid_body",
      "Request body must satisfy the canonical Asset shape.",
    );
  }

  const saved = await operationalDataGateway.upsertAsset(body);

  return Response.json(saved, {
    status: 201,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}
