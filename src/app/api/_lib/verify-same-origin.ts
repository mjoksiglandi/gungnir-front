function getRequestOrigin(request: Request) {
  return new URL(request.url).origin;
}

function readSourceOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    return origin;
  }

  const referer = request.headers.get("referer");
  if (!referer) {
    return null;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function verifySameOriginRequest(request: Request) {
  const sourceOrigin = readSourceOrigin(request);
  if (!sourceOrigin) {
    return null;
  }

  if (sourceOrigin === getRequestOrigin(request)) {
    return null;
  }

  return Response.json({
    error: {
      code: "forbidden_origin",
      message: "Cross-site mutations are not allowed for this endpoint.",
    },
  }, { status: 403 });
}
