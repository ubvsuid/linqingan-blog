import { permanentRedirect } from "next/navigation";

export default function MemoryWriteSafetyRedirectPage() {
  permanentRedirect("/en/blog/screeps-memory-basics");
}
