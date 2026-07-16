import Link from "next/link";

import { CollectionPagination } from "@/components/collection-pagination";
import { Container } from "@/components/container";
import { formatDate } from "@/lib/date";
import { paginateItems } from "@/lib/pagination";
import { projects } from "@/lib/projects";

interface ProjectsArchiveProps {
  currentPage: number;
}

export function ProjectsArchive({ currentPage }: ProjectsArchiveProps) {
  const pagination = paginateItems(projects, currentPage);

  return (
    <main className="page-shell">
      <Container>
        <header className="page-header">
          <p className="eyebrow">PROJECTS</p>
          <h1>项目</h1>
          <p>记录正在建设的内容系统、网站与 Screeps 实践，而不只是展示最终结果。</p>
        </header>

        <div
          className="project-list"
          aria-label={`项目第 ${pagination.currentPage} 页`}
        >
          {pagination.items.map((project) => (
            <article className="project-feature" key={project.id}>
              <div className="project-topline">
                <span className="status-dot" aria-hidden="true" />
                <span>{project.status}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={project.updatedAt}>
                  更新于 {formatDate(project.updatedAt)}
                </time>
              </div>
              <h2>{project.title}</h2>
              <p className="project-summary">{project.summary}</p>

              <dl className="project-data">
                {project.details.map((detail) => (
                  <div key={detail.label}>
                    <dt>{detail.label}</dt>
                    <dd>{detail.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="project-outcomes">
                <h3>已经完成</h3>
                <ul>
                  {project.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>

              <div className="project-links">
                {project.links.map((link) =>
                  link.external ? (
                    <a
                      href={link.href}
                      key={link.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {link.label} ↗
                    </a>
                  ) : (
                    <Link href={link.href} key={link.href}>
                      {link.label} →
                    </Link>
                  ),
                )}
              </div>
            </article>
          ))}
        </div>

        <CollectionPagination
          key={pagination.currentPage}
          ariaLabel="项目分页"
          basePath="/projects"
          currentPage={pagination.currentPage}
          itemLabel="个项目"
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
        />
      </Container>

      <style>{`
        .project-list {
          display: grid;
          gap: 28px;
        }

        .project-outcomes {
          margin-top: 34px;
          border-top: 1px solid var(--border);
          padding-top: 28px;
        }

        .project-outcomes h3 {
          margin: 0 0 14px;
          font-size: 18px;
        }

        .project-outcomes ul {
          display: grid;
          gap: 9px;
          margin: 0;
          padding-left: 22px;
          color: var(--muted);
        }

        .project-links {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }

        .project-links a {
          display: inline-flex;
          min-height: 42px;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0 16px;
          background: var(--background);
          font-size: 14px;
          font-weight: 650;
        }

        .project-links a:hover {
          border-color: var(--muted);
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}
