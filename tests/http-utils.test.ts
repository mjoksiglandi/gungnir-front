import { REST_API_VERSION } from "@/shared/contracts/rest";
import { okJson, readBoolean, readEnum, toErrorResponse } from "@/app/api/v1/_lib/http";

describe("api http utils", () => {
  it("builds JSON responses with no-store and API version headers", async () => {
    const response = okJson({ ok: true });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("x-gugnir-api-version")).toBe(REST_API_VERSION);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("parses boolean query values", () => {
    expect(readBoolean("true", "enabled")).toBe(true);
    expect(readBoolean("false", "enabled")).toBe(false);
    expect(readBoolean(null, "enabled")).toBeUndefined();
  });

  it("returns an invalid_query payload for unsupported boolean values", async () => {
    let thrown: unknown;

    try {
      readBoolean("maybe", "enabled");
    } catch (error) {
      thrown = error;
    }

    const response = toErrorResponse(thrown);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_query",
        details: {
          field: "enabled",
          value: "maybe",
        },
        message: "Unsupported 'enabled' boolean value.",
      },
    });
  });

  it("validates enum query values", async () => {
    expect(readEnum("zone", ["zone", "corridor"] as const, "layerType")).toBe("zone");
    expect(readEnum(null, ["zone", "corridor"] as const, "layerType")).toBeUndefined();

    let thrown: unknown;

    try {
      readEnum("route", ["zone", "corridor"] as const, "layerType");
    } catch (error) {
      thrown = error;
    }

    const response = toErrorResponse(thrown);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_query",
        details: {
          allowed: "zone,corridor",
          field: "layerType",
          value: "route",
        },
        message: "Unsupported 'layerType' value.",
      },
    });
  });
});
