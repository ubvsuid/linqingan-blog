export interface NowEntry {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export const nowEntries: NowEntry[] = [];
