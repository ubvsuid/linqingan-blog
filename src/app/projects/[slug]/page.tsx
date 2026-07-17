import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/container";
import { createPageMetadata } from "@/lib/metadata";
import { projects } from "@/lib/projects";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.id }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.id === slug);
  if (!project) return {};
  return createPageMetadata({ title: project.title, description: project.summary, path: `/projects/${project.id}` });
}

const dateFormatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" });

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projects.find((item) => item.id === slug);
  if (!project) notFound();

  return (
    <main className="page-shell project-detail-page">
      <Container>
        <nav className="project-breadcrumb" aria-label="面包屑"><Link href="/projects">项目</Link><span aria-hidden="true">/</span><span>{project.title}</span></nav>
        <header className="project-detail-hero">
          <div className="project-status"><span aria-hidden="true" /><strong>{project.status}</strong><time dateTime={project.updatedAt}>更新于 {dateFormatter.format(new Date(`${project.updatedAt}T00:00:00`))}</time></div>
          <h1>{project.title}</h1>
          <p>{project.summary}</p>
        </header>

        <dl className="project-facts">{project.details.map((detail) => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>

        <section className="project-story" aria-label="项目说明">
          <article><p className="eyebrow">PURPOSE</p><h2>为什么做这个项目</h2><p>{project.purpose}</p></article>
          <article><p className="eyebrow">CHALLENGE</p><h2>需要解决的问题</h2><p>{project.challenge}</p></article>
        </section>

        <section className="project-detail-section" aria-labelledby="project-approach-title"><div><p className="eyebrow">APPROACH</p><h2 id="project-approach-title">建设方式</h2></div><ol>{project.approach.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ol></section>
        <section className="project-detail-section" aria-labelledby="project-complete-title"><div><p className="eyebrow">COMPLETED</p><h2 id="project-complete-title">已经完成</h2></div><ul>{project.highlights.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section className="project-detail-section" aria-labelledby="project-next-title"><div><p className="eyebrow">NEXT</p><h2 id="project-next-title">接下来</h2></div><ul>{project.nextSteps.map((item) => <li key={item}>{item}</li>)}</ul></section>

        <div className="project-detail-links">{project.links.filter((link) => !link.href.startsWith(`/projects/${project.id}`)).map((link) => link.external ? <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a> : <Link key={link.href} href={link.href}>{link.label} →</Link>)}</div>
      </Container>
      <style>{`
        .project-breadcrumb { display: flex; gap: 10px; margin-bottom: 34px; color: var(--muted); font-size: 13px; }
        .project-detail-hero { max-width: 920px; padding-bottom: 58px; border-bottom: 1px solid var(--border); }
        .project-status { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; color: var(--muted); font-size: 12px; }
        .project-status > span { width: 8px; height: 8px; border-radius: 50%; background: var(--foreground); }
        .project-status strong { color: var(--foreground); }
        .project-detail-hero h1 { margin: 26px 0 0; font-size: clamp(48px, 8vw, 86px); line-height: .98; letter-spacing: -.06em; }
        .project-detail-hero > p { max-width: 780px; margin: 28px 0 0; color: var(--muted); font-size: clamp(18px, 2.3vw, 23px); line-height: 1.7; }
        .project-facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; border-bottom: 1px solid var(--border); }
        .project-facts div { padding: 28px 22px; }
        .project-facts div + div { border-left: 1px solid var(--border); }
        .project-facts dt { color: var(--muted); font-size: 12px; }
        .project-facts dd { margin: 9px 0 0; line-height: 1.55; }
        .project-story { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; padding-top: 72px; }
        .project-story article { border: 1px solid var(--border); border-radius: 20px; padding: 30px; background: var(--surface); }
        .project-story h2, .project-detail-section h2 { margin: 10px 0 0; font-size: clamp(28px, 4vw, 42px); letter-spacing: -.04em; }
        .project-story article > p:last-child { margin: 18px 0 0; color: var(--muted); line-height: 1.8; }
        .project-detail-section { display: grid; grid-template-columns: minmax(220px, .65fr) minmax(0, 1.35fr); gap: 54px; padding-top: 78px; }
        .project-detail-section ol, .project-detail-section ul { display: grid; margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--border); }
        .project-detail-section li { border-bottom: 1px solid var(--border); padding: 22px 0; line-height: 1.7; }
        .project-detail-section ol li { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 16px; }
        .project-detail-section li span { color: var(--muted); font-family: "SFMono-Regular", Consolas, monospace; font-size: 12px; }
        .project-detail-section li p { margin: 0; }
        .project-detail-section ul li { position: relative; padding-left: 24px; }
        .project-detail-section ul li::before { content: ""; position: absolute; left: 0; top: 31px; width: 6px; height: 6px; border-radius: 50%; background: var(--foreground); }
        .project-detail-links { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 74px; border-top: 1px solid var(--border); padding-top: 30px; }
        .project-detail-links a { display: inline-flex; min-height: 44px; align-items: center; border: 1px solid var(--border); border-radius: 999px; padding: 0 17px; font-weight: 650; }
        @media (max-width: 800px) { .project-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); } .project-facts div:nth-child(3) { border-top: 1px solid var(--border); border-left: 0; } .project-facts div:nth-child(4) { border-top: 1px solid var(--border); } .project-story, .project-detail-section { grid-template-columns: 1fr; gap: 30px; } }
        @media (max-width: 520px) { .project-facts { grid-template-columns: 1fr; } .project-facts div + div, .project-facts div:nth-child(3), .project-facts div:nth-child(4) { border-top: 1px solid var(--border); border-left: 0; } }
      `}</style>
    </main>
  );
}
