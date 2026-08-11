import type { ReactNode } from "react";

import { CurrentToolErrorDiagnostics } from "@/components/current-tool-error-diagnostics";

export default function ChineseToolsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CurrentToolErrorDiagnostics locale="zh" />
    </>
  );
}
