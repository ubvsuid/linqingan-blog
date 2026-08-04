import "@/lib/english-beginner-content";

declare module "@/lib/english-beginner-content" {
  interface EnglishBeginnerArticle {
    /** Optional editorial modification date for focused article overrides. */
    updatedAt?: string;
  }
}
