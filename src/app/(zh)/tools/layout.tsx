import type { ReactNode } from "react";

import { ToolKnowledgeRelationsAuto } from "@/components/tool-knowledge-relations-auto";
import { getToolKnowledgeRelationIndex } from "@/lib/tool-knowledge-relations";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  const relations = getToolKnowledgeRelationIndex("zh");

  return (
    <>
      {children}
      <ToolKnowledgeRelationsAuto locale="zh" relations={relations} />
    </>
  );
}
