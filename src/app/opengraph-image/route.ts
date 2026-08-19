import renderOpenGraphImage from "@/app/(zh)/opengraph-image";

export const dynamic = "force-static";

export function GET() {
  return renderOpenGraphImage();
}
