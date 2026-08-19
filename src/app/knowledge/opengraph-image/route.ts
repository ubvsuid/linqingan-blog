import renderKnowledgeOpenGraphImage from "@/app/(zh)/knowledge/opengraph-image";

export const dynamic = "force-static";

export function GET() {
  return renderKnowledgeOpenGraphImage();
}
