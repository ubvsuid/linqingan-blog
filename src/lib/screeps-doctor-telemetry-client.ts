"use client";

import type { ScreepsDoctorTelemetryEvent } from "@/lib/screeps-doctor-telemetry-contract";

export function trackScreepsDoctorEvent(event: ScreepsDoctorTelemetryEvent): void {
  try {
    void fetch("/api/doctor/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Product telemetry must never interrupt the Doctor experience.
  }
}
