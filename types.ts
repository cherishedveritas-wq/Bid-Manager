
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
  lastPasswordChangeDate?: string; 
}

export interface DashboardStats {
  totalBids: number;
  totalWon: number;
  winRate: number;
  totalProposalAmount: number;
}

// 시스템 전체 공통 기본 사용자 목록 (고정 데이터)
export const MASTER_USERS: AppUser[] = [
  { id: 'admin', name: '최철민', birthDate: '760112', password: '4422', isAdmin: true, lastPasswordChangeDate: '2024-01-01' },
  { id: 'user_psi', name: '박상일', birthDate: '701017', password: '3607', isAdmin: false, lastPasswordChangeDate: '2024-10-17' },
  { id: 'user_sjw', name: '송제우', birthDate: '750813', password: '1234', isAdmin: false, lastPasswordChangeDate: '2024-08-13' },
  { id: 'user_lsh', name: '이신형', birthDate: '820119', password: '0173', isAdmin: false, lastPasswordChangeDate: '2024-01-19' },
  { id: 'user_kgw', name: '김경우', birthDate: '780219', password: '1212', isAdmin: false, lastPasswordChangeDate: '2024-02-19' },
  { id: 'user_yhj', name: '여혜진', birthDate: '700611', password: '1234', isAdmin: false, lastPasswordChangeDate: '2024-06-11' },
];
