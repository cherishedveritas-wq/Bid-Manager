
export enum BidResult {
  PENDING = '진행중',
  WON = '수주',
  LOST = '탈락',
  DROP = '드랍'
}

export enum BidCategory {
  NEW = '신규',
  EXISTING = '기존',
  TEST = 'Test'
}

export interface Bid {
  id: string;
  targetYear: number;
  category: BidCategory;
  clientName: string;
  manager: string;
  projectName: string;
  method: string;
  schedule: string;
  contractPeriod: string;
  competitors: string;
  proposalAmount: number;
  statusDetail: string;
  result: BidResult;
  preferredBidder: string;
  remarks: string;
}

export interface AppUser {
  id: string;
  name: string;
  birthDate: string; // 6자리 (ex: 610101)
  password?: string;
  isAdmin: boolean;
  lastPasswordChangeDate?: string; // ISO 8601 string (ex: 2023-10-27)
}

export interface DashboardStats {
  totalBids: number;
  totalWon: number;
  winRate: number;
  totalProposalAmount: number;
}
