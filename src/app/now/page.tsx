import type { Metadata } from "next";

import { NowArchive } from "@/components/now-archive";

export const metadata: Metadata = {
  title: "近况",
  description: "近况内容将在后续更新。",
  alternates: {
    canonical: "/now",
  },
};

export default function NowPage() {
  return <NowArchive currentPage={1} />;
}
