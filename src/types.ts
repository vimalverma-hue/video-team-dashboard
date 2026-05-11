export enum VideoStatus {
  WORKING_ON_IT = 'Working on it',
  COMPLETED = 'Completed',
  VIDEO_REJECTED = 'Video rejected',
  HOLD_BY_OWNER = 'Hold by owner',
}

export interface CreativeEntry {
  timestamp: string;
  modeOfSession: string;
  creativeType: string;
  mailSubjectLine: string;
  creativesCount: string;
  designer: string;
  status: string;
  channel: string;
  vertical?: string;
}

export interface VideoEntry {
  timestamp: string;
  email: string;
  channel: string;
  subject: string;
  category: string;
  type: string;
  editors: string;
  status: string;
}

export interface DashboardStats {
  totalVideos: number;
  completedCount: number;
  workingCount: number;
  rejectedCount: number;
  onHoldCount: number;
  editorsCount: number;
  channelsCount: number;
}
