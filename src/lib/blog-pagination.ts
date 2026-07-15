import type { PostSummary } from "@/lib/posts";

export const BLOG_POSTS_PER_PAGE = 6;

export interface PaginatedBlogPosts {
  posts: PostSummary[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
}

export function getBlogTotalPages(totalPosts: number): number {
  return Math.max(1, Math.ceil(totalPosts / BLOG_POSTS_PER_PAGE));
}

export function getBlogPageHref(page: number): string {
  return page <= 1 ? "/blog" : `/blog/page/${page}`;
}

export function paginateBlogPosts(
  posts: PostSummary[],
  requestedPage: number,
): PaginatedBlogPosts {
  const totalPages = getBlogTotalPages(posts.length);
  const currentPage = Math.min(
    Math.max(1, Math.trunc(requestedPage)),
    totalPages,
  );
  const start = (currentPage - 1) * BLOG_POSTS_PER_PAGE;

  return {
    posts: posts.slice(start, start + BLOG_POSTS_PER_PAGE),
    currentPage,
    totalPages,
    totalPosts: posts.length,
  };
}
