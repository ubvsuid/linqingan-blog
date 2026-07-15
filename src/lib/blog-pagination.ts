import {
  DEFAULT_ITEMS_PER_PAGE,
  getCollectionPageHref,
  getTotalPages,
  paginateItems,
} from "@/lib/pagination";
import type { PostSummary } from "@/lib/posts";

export const BLOG_POSTS_PER_PAGE = DEFAULT_ITEMS_PER_PAGE;

export interface PaginatedBlogPosts {
  posts: PostSummary[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
}

export function getBlogTotalPages(totalPosts: number): number {
  return getTotalPages(totalPosts, BLOG_POSTS_PER_PAGE);
}

export function getBlogPageHref(page: number): string {
  return getCollectionPageHref("/blog", page);
}

export function paginateBlogPosts(
  posts: PostSummary[],
  requestedPage: number,
): PaginatedBlogPosts {
  const pagination = paginateItems(
    posts,
    requestedPage,
    BLOG_POSTS_PER_PAGE,
  );

  return {
    posts: pagination.items,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalPosts: pagination.totalItems,
  };
}