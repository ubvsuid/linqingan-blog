import renderRoomDiagnosticsOpenGraphImage from "@/app/(zh)/tools/room-diagnostics/opengraph-image";

export const dynamic = "force-static";

export function GET() {
  return renderRoomDiagnosticsOpenGraphImage();
}
