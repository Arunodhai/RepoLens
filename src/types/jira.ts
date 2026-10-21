export type JiraIssueType = 'story' | 'bug' | 'task' | 'security';
export type JiraPriority = 'highest' | 'high' | 'medium' | 'low';
export type JiraStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';

export interface JiraIssue {
  id: string;
  key: string; // e.g. "CHURCH-101", "VULP-201"
  title: string;
  description: string;
  type: JiraIssueType;
  priority: JiraPriority;
  status: JiraStatus;
  assignee: {
    name: string;
    username: string;
    avatarUrl?: string;
  };
  reporter: {
    name: string;
    username: string;
  };
  storyPoints: number;
  sprint: string;
  epic?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  // GitHub integration links
  linkedBranch?: string;
  linkedCommitSha?: string;
  linkedPrNumber?: number;
  linkedPrTitle?: string;
  filesTouched?: { filename: string; additions: number; deletions: number; status?: string }[];
  additions?: number;
  deletions?: number;
}

export interface JiraSprintInfo {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  totalPoints: number;
  completedPoints: number;
  velocity: number;
}
