import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export const metadata: Metadata = {
  title: "Screeps 新手入门",
  robots: {
    index: false,
    follow: true,
  },
};

export default function BeginnerPageNumber() {
  permanentRedirect("/beginner");
}
