import { CollectionPagination } from "@/components/collection-pagination";
import { Container } from "@/components/container";
import { PostCard } from "@/components/post-card";
import { paginateBlogPosts } from "@/lib/blog-pagination";
import { getArticlePosts } from "@/lib/posts";

interface BlogArchiveProps {
  currentPage: number;
}

export function BlogArchive({ currentPage }: BlogArchiveProps) {
  const pagination = paginateBlogPosts(getArticlePosts(), currentPage);

  return (
    <main className="page-shell">
      <Container>
        <header className="page-header">
          <p className="eyebrow">WRITING</p>
          <h1>文章</h1>
        </header>

        <div className="post-list" aria-label={`文章第 ${currentPage} 页`}>
          {pagination.posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        <CollectionPagination
          key={pagination.currentPage}
          ariaLabel="文章分页"
          basePath="/blog"
          currentPage={pagination.currentPage}
          itemLabel="篇"
          totalItems={pagination.totalPosts}
          totalPages={pagination.totalPages}
        />
      </Container>
    </main>
  );
}
