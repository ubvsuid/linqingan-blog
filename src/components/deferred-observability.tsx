"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";

interface ObservabilityComponents {
  Analytics: ComponentType;
  SpeedInsights: ComponentType;
}

const FALLBACK_DELAY_MS = 2_500;
const IDLE_TIMEOUT_MS = 4_000;

export function DeferredObservability() {
  const [components, setComponents] = useState<ObservabilityComponents | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    let idleId: number | undefined;

    async function loadObservability() {
      const [analyticsModule, speedInsightsModule] = await Promise.all([
        import("@vercel/analytics/next"),
        import("@vercel/speed-insights/next"),
      ]);

      if (!cancelled) {
        setComponents({
          Analytics: analyticsModule.Analytics,
          SpeedInsights: speedInsightsModule.SpeedInsights,
        });
      }
    }

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(
        () => void loadObservability(),
        { timeout: IDLE_TIMEOUT_MS },
      );
    } else {
      timeoutId = window.setTimeout(
        () => void loadObservability(),
        FALLBACK_DELAY_MS,
      );
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!components) return null;

  const { Analytics, SpeedInsights } = components;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
