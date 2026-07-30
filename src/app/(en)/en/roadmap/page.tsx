import Link from "next/link";

import { Container } from "@/components/container";
import { createEnglishPageMetadata } from "@/lib/english-metadata";

import styles from "../english.module.css";

export const metadata = createEnglishPageMetadata({
  title: "English Site Roadmap",
  description: "The public roadmap for the Linqingan English Screeps interface, tools, search, evidence, accessibility, and performance work.",
  path: "/en/roadmap",
  chinesePath: "/now",
});

const roadmap = [
  {
    status: "COMPLETED",
    title: "English interface foundation",
    items: ["Task-first home page", "Beginner roadmap and knowledge map", "Search, topics, tools, references, RSS", "English metadata, error states, and bilingual SEO"],
  },
  {
    status: "NEXT",
    title: "Evidence and tool depth",
    items: ["Add only genuine Console and room screenshots", "Expand browser tools without requesting account tokens", "Publish clearer tool version and validation notes", "Review zero-result searches and common navigation exits"],
  },
  {
    status: "CONTINUOUS",
    title: "Quality and accessibility",
    items: ["Production build and route checks", "Keyboard and screen-reader review", "Core Web Vitals monitoring", "Mobile checks at common viewport widths"],
  },
];

export default function EnglishRoadmapPage() {
  return (
    <main className={styles.page} lang="en">
      <Container>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/en">Home</Link><span aria-hidden="true">/</span><span>Roadmap</span></nav>
        <header className={styles.header}><p className="eyebrow">PUBLIC ROADMAP</p><h1>What improves next</h1><p>The roadmap separates completed interface work, evidence-dependent tasks, tool development, and recurring quality checks. Dates are added only when a deliverable has a real schedule.</p></header>
        <div className={styles.roadmapGrid}>
          {roadmap.map((group) => (
            <section key={group.status}>
              <span>{group.status}</span>
              <h2>{group.title}</h2>
              <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          ))}
        </div>
        <div className={styles.notice}><strong>Evidence-dependent work</strong><p>Real Screeps screenshots, Console output, and multi-tick observations cannot be fabricated. They are added only when the original session evidence is available.</p></div>
      </Container>
    </main>
  );
}
