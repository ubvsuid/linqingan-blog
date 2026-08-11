"use client";

import { usePathname } from "next/navigation";

import { Container } from "@/components/container";
import { RelatedErrorDiagnostics } from "@/components/related-error-diagnostics";
import { getScreepsErrorDiagnosticsForHref } from "@/lib/screeps-error-diagnostics";
import type { ScreepsErrorDiagnosticLocale } from "@/lib/screeps-error-diagnostics";

import styles from "./current-tool-error-diagnostics.module.css";

export function CurrentToolErrorDiagnostics({
  locale,
}: {
  locale: ScreepsErrorDiagnosticLocale;
}) {
  const pathname = usePathname();
  if (getScreepsErrorDiagnosticsForHref(pathname, locale).length === 0) return null;

  return (
    <div className={styles.footer}>
      <Container>
        <RelatedErrorDiagnostics href={pathname} locale={locale} />
      </Container>
    </div>
  );
}
