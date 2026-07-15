export const DEFAULT_ITEMS_PER_PAGE = 6;

export interface PaginatedItems<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export function getTotalPages(
  totalItems: number,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
): number {
  const safeItemsPerPage = Math.max(1, Math.trunc(itemsPerPage));
  return Math.max(1, Math.ceil(Math.max(0, totalItems) / safeItemsPerPage));
}

export function getCollectionPageHref(basePath: string, page: number): string {
  const normalizedBasePath =
    basePath.length > 1 && basePath.endsWith("/")
      ? basePath.slice(0, -1)
      : basePath;

  return page <= 1
    ? normalizedBasePath
    : `${normalizedBasePath}/page/${page}`;
}

export function paginateItems<T>(
  items: T[],
  requestedPage: number,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
): PaginatedItems<T> {
  const safeItemsPerPage = Math.max(1, Math.trunc(itemsPerPage));
  const totalPages = getTotalPages(items.length, safeItemsPerPage);
  const requested = Number.isFinite(requestedPage)
    ? Math.trunc(requestedPage)
    : 1;
  const currentPage = Math.min(Math.max(1, requested), totalPages);
  const start = (currentPage - 1) * safeItemsPerPage;

  return {
    items: items.slice(start, start + safeItemsPerPage),
    currentPage,
    totalPages,
    totalItems: items.length,
  };
}

export function parsePositivePageNumber(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const page = Number.parseInt(value, 10);
  return Number.isSafeInteger(page) && page > 0 ? page : null;
}

export function getArchiveStaticParams(
  totalItems: number,
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE,
): Array<{ page: string }> {
  const totalPages = getTotalPages(totalItems, itemsPerPage);

  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
    page: String(index + 2),
  }));
}