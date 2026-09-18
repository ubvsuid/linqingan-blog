"use client";

import type { SearchV3TelemetryEvent } from "@/lib/search-v3-telemetry-contract";

export function trackSearchV3Event(event: SearchV3TelemetryEvent): void {
  try {
    void fetch("/api/search-v3/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Product telemetry must never interrupt Search.
  }
}
