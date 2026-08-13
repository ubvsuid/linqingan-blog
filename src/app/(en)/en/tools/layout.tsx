import type { ReactNode } from "react";

import { ToolKnowledgeRelationsAuto } from "@/components/tool-knowledge-relations-auto";
import { getToolKnowledgeRelationIndex } from "@/lib/tool-knowledge-relations";

export default function EnglishToolsLayout({ children }: { children: ReactNode }) {
  const relations = getToolKnowledgeRelationIndex("en");

  return (
    <>
      {children}
      <ToolKnowledgeRelationsAuto locale="en" relations={relations} />
    </>
  );
}
