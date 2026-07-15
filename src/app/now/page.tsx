import type { Metadata } from "next";

import { NowArchive } from "@/components/now-archive";

export const metadata: Metadata = {
  title: "近况",
  description: "临清安最近正在开发、学习和关注的事情。",
  alternates: {
    canonical: "/now",
  },
};

export default function NowPage() {
  return <NowArchive currentPage={1} />;
}