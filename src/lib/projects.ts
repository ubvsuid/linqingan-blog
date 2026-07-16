export interface ProjectDetail {
  label: string;
  value: string;
}

export interface ProjectRecord {
  id: string;
  status: string;
  title: string;
  summary: string;
  details: ProjectDetail[];
}

export const projects: ProjectRecord[] = [];
