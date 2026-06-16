export function formatPercent(value?: number) {
  if (typeof value !== "number") {
    return "n/a";
  }

  return `${Math.round(value)}%`;
}

export function formatSpeedKph(speedMps?: number) {
  if (typeof speedMps !== "number") {
    return "n/a";
  }

  return `${Math.round(speedMps * 3.6)} km/h`;
}

export function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}
