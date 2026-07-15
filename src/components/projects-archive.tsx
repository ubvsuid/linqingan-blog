import { CollectionPagination } from "@/components/collection-pagination";
import { Container } from "@/components/container";
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
          <p>把长期开发过程整理成可阅读、可追踪的项目档案。</p>
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
      `}</style>
    </main>
  );
}