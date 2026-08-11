import type { ReactNode } from "react";

import { CurrentToolErrorDiagnostics } from "@/components/current-tool-error-diagnostics";

export default function EnglishToolsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CurrentToolErrorDiagnostics locale="en" />
    </>
  );
}
