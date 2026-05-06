export enum VideoStatus {
  COMPLETED = 'Completed',
  PENDING = 'Pending',
  URGENT = 'Urgent',
}

export interface VideoEntry {
  timestamp: string;
  email: string;
  channel: string;
  subject: string;
  category: string;
  type: string;
  editors: string;
  status: VideoStatus | string;
}

export interface DashboardStats {
  totalVideos: number;
  completedCount: number;
  pendingCount: number;
  urgentCount: number;
  editorsCount: number;
  channelsCount: number;
}
