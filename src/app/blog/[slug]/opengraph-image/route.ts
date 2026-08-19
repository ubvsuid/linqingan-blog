import renderArticleOpenGraphImage, {
  generateStaticParams,
} from "@/app/(zh)/blog/[slug]/opengraph-image";

export { generateStaticParams };
export const dynamicParams = false;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  return renderArticleOpenGraphImage({ params });
}
