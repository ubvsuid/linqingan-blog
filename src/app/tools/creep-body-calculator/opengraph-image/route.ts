import renderBodyCalculatorOpenGraphImage from "@/app/(zh)/tools/creep-body-calculator/opengraph-image";

export const dynamic = "force-static";

export function GET() {
  return renderBodyCalculatorOpenGraphImage();
}
