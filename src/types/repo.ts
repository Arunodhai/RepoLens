export type DateRange = '7D' | '30D' | '90D' | '1Y' | 'ALL';

export interface RepoMetadata {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  defaultBranch: string;
  language: string;
  license: string;
  isCustom?: boolean;
  lastSyncedAt: string;
  htmlUrl: string;
}

export interface KPIMetricItem {
  title: string;
  value: string;
  numericValue: number;
  sublabel: string;
  deltaText: string;
  isPositive: boolean;
  tooltip: string;
}

export interface MonthlyActivityData {
  month: string;
  commits: number;
  prs: number;
  reviews: number;
}

export interface ContributorShare {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  commits: number;
  prs: number;
  reviews: number;
  sharePct: number;
  color: string;
  additions: number;
  deletions: number;
  activeDays: number;
  longestStreak: number;
  currentStreak: number;
  role: string;
  bio: string;
  badges: string[];
  topFiles: { path: string; changes: number }[];
  activityScore: number;
}

export interface TimeOfDayHour {
  hour: number;
  label: string;
  weekdayCount: number;
  weekendCount: number;
  totalCount: number;
  isPeak: boolean;
}

export interface RepositoryHotspot {
  path: string;
  type: 'dir' | 'file';
  changesCount: number;
  percentage: number;
}

export interface CalendarDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface VelocityPoint {
  dateLabel: string;
  commits: number;
  prsMerged: number;
  prsOpened: number;
}

export interface MilestoneItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  category: 'first' | 'record' | 'release' | 'community' | 'spend';
  badgeLabel: string;
  icon: 'rocket' | 'flame' | 'trophy' | 'tag' | 'box' | 'dollar';
}

export interface RadarHealthMetric {
  dimension: string;
  score: number;
  fullMark: number;
  status: string;
}

export interface CollaborationReviewLink {
  author: string;
  reviewer: string;
  count: number;
  avgTurnaroundHours: number;
}

export interface AchievementBadgeInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
}

export interface DeveloperFeatureItem {
  id: string;
  title: string;
  category: 'Frontend & UI' | 'CMS Backend & Core' | 'Security & Compliance' | 'DevOps & CI/CD' | 'SEO & Content';
  developer: {
    username: string;
    name: string;
    avatarUrl: string;
    role: string;
    color: string;
  };
  description: string;
  impact: 'Core' | 'High' | 'Medium';
  status: 'Merged & Shipped' | 'Production Ready';
  completedDate: string;
  prNumber?: number;
  prTitle?: string;
  commitsCount: number;
  commitShas: string[];
  keyHighlights: string[];
  technologies: string[];
  filesTouched: string[];
}

export interface CommitFileChange {
  filename: string;
  additions: number;
  deletions: number;
  status: 'added' | 'modified' | 'deleted';
}

export interface CommitItem {
  sha: string;
  shortSha: string;
  message: string;
  body?: string;
  author: {
    name: string;
    username: string;
    avatarUrl: string;
    color?: string;
  };
  date: string;
  displayDate: string;
  prNumber?: number;
  prTitle?: string;
  type: 'feat' | 'fix' | 'refactor' | 'ci' | 'docs' | 'style' | 'chore';
  stats: {
    additions: number;
    deletions: number;
    filesCount: number;
  };
  filesTouched: CommitFileChange[];
}

export interface RepoDataset {
  kpis: Record<DateRange, KPIMetricItem[]>;
  monthlyActivity: MonthlyActivityData[];
  contributors: ContributorShare[];
  timeOfDayHours: TimeOfDayHour[];
  hotspots: RepositoryHotspot[];
  calendarHeatmap: CalendarDay[];
  velocityTrend: VelocityPoint[];
  milestones: MilestoneItem[];
  healthRadar: RadarHealthMetric[];
  reviewLinks: CollaborationReviewLink[];
  features?: DeveloperFeatureItem[];
  commits: CommitItem[];
}

