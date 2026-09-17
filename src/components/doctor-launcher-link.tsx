"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { trackScreepsDoctorEvent } from "@/lib/screeps-doctor-telemetry-client";
import type { ScreepsDoctorTelemetrySymptom } from "@/lib/screeps-doctor-telemetry-contract";

export function DoctorLauncherLink({
  href,
  symptom,
  className,
  children,
}: {
  href: string;
  symptom: ScreepsDoctorTelemetrySymptom;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackScreepsDoctorEvent({
          eventName: "doctor_launcher_clicked",
          symptom,
          locale: "zh",
          source: "homepage",
        })
      }
    >
      {children}
    </Link>
  );
}
