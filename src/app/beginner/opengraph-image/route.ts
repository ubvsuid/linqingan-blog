import renderBeginnerOpenGraphImage from "@/app/(zh)/beginner/opengraph-image";

export const dynamic = "force-static";

export function GET() {
  return renderBeginnerOpenGraphImage();
}
