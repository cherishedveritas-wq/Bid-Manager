
import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, LogOut, Database, RefreshCw, Loader2, Calendar, Users, AlertTriangle } from 'lucide-react';
import { Bid, BidCategory, BidResult, AppUser } from '../types';
import StatsOverview from './StatsOverview';
import BidTable from './BidTable';
import BidModal from './BidModal';
import SheetConfigModal from './SheetConfigModal';
import UserManagementModal from './UserManagementModal';
import { fetchBids, syncBidToSheet, hasSheetUrl } from '../api';

interface DashboardProps {
  onLogout: () => void;
  currentUser: AppUser;
}

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);

const INITIAL_DATA: Bid[] = [
  {
    id: '1',
    targetYear: 2025,
    category: BidCategory.NEW,
    clientName: '로보트보쉬코리아',
    manager: '영업부 최철민',
    projectName: '보쉬 용인 오피스/세종 공장 보안/미화관리',
    method: '입찰',
    schedule: '현설 9/25(목)\n공고 9/26(금)\n제출 10/17(금)',
    contractPeriod: '2026.1.1 ~ 12.31',
    competitors: '캡스텍(기존), 당사, IBS, 동우유니온',
    proposalAmount: 0,
    statusDetail: '2025.10.17(금) 서류제출\n2025.10.22(수) 우협사 선정',
    result: BidResult.LOST,
    preferredBidder: '캡스텍',
    remarks: '당사 불참'
  },
  {
    id: '5',
    targetYear: 2026,
    category: BidCategory.EXISTING,
    clientName: '현대엔지니어링',
    manager: '영업부 박상일',
    projectName: 'HEC 시화MTV 복합물류센터 FM 위탁관리',
    method: '입찰',
    schedule: '현설 10/16(목)\n제출 10/22(수)',
    contractPeriod: '2027.1.1 ~ 12.31',
    competitors: '당사, CHM, 백상, 앨림, 발렉스',
    proposalAmount: 4200000000,
    statusDetail: '2025.10.29(수) 결과 확인',
    result: BidResult.WON,
    preferredBidder: '당사',
    remarks: '임대진행중'
  }
];

const Dashboard: React.FC<DashboardProps> = ({ onLogout, currentUser }) => {
  const [allBids, setAllBids] = useState<Bid[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetConnected, setIsSheetConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const filteredBids = useMemo(() => {
    return allBids.filter(bid => bid.targetYear === selectedYear);
  }, [allBids, selectedYear]);

  const loadData = async () => {
    setConnectionError(false);
    if (hasSheetUrl()) {
      setIsLoading(true);
      setIsSheetConnected(true);
      try {
        const data = await fetchBids();
        if (data && data.length > 0) {
          setAllBids(data);
        } else {
          setAllBids([]);
        }
      } catch (error) {
        console.error("Error loading data from Google Sheets", error);
        setConnectionError(true);
        // 연동 실패 시 로컬 더미 데이터라도 보여줌
        if (allBids.length === 0) setAllBids(INITIAL_DATA);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsSheetConnected(false);
      setAllBids(INITIAL_DATA);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveBid = async (bid: Bid) => {
    const isEdit = !!editingBid;
    let newAllBids = isEdit ? allBids.map(item => item.id === bid.id ? bid : item) : [bid, ...allBids];
    setAllBids(newAllBids);

    if (isSheetConnected) {
      const action = isEdit ? 'update' : 'create';
      await syncBidToSheet(action, bid);
    }
  };

  const handleDeleteBid = async (id: string) => {
    if (window.confirm('정말로 이 항목을 삭제하시겠습니까?')) {
      const prevBids = [...allBids];
      setAllBids(prev => prev.filter(item => item.id !== id));
      if (isSheetConnected) {
        const success = await syncBidToSheet('delete', undefined, id);
        if (!success) setAllBids(prevBids);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
              <span className="text-blue-600 mr-2">지수아이앤씨</span> 영업입찰 현황
            </h1>
            
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
              <Calendar className="w-4 h-4 text-slate-500 ml-2" />
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none pr-2 py-1 cursor-pointer"
              >
                {YEAR_OPTIONS.map(year => <option key={year} value={year}>{year}년 </option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {connectionError && (
              <div className="flex items-center text-red-500 text-xs font-bold bg-red-50 px-3 py-1.5 rounded-full border border-red-100 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> DB 연동 오류
              </div>
            )}
            
            <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
              <span className="text-sm font-bold text-slate-600">{currentUser.name} {currentUser.isAdmin ? '(관리자)' : '(사용자)'}</span>
            </div>

            <div className="flex items-center space-x-2">
              {currentUser.isAdmin && (
                <button onClick={() => setIsUserModalOpen(true)} className="flex items-center space-x-1 text-sm px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                  <Users className="w-4 h-4 mr-1" />
                  사용자 관리
                </button>
              )}
              <button onClick={() => setIsConfigOpen(true)} className="flex items-center space-x-1 text-sm px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                <Database className="w-4 h-4 mr-1" />
                DB 설정
              </button>
              <div className="h-4 w-px bg-slate-200 mx-1"></div>
              <button onClick={onLogout} className="flex items-center space-x-1 text-sm text-slate-500 hover:text-red-600 px-2 py-1.5 transition-colors">
                <LogOut className="w-4 h-4 mr-1" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden flex flex-col">
        <StatsOverview bids={filteredBids} year={selectedYear} />

        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-700 flex items-center">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2"></span>
            {selectedYear}년 입찰 진행 리스트
          </h2>
          <div className="flex space-x-3">
             {isSheetConnected && (
              <button onClick={loadData} disabled={isLoading} className="text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors">
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button onClick={() => { setEditingBid(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-lg transition-all active:scale-95">
              <PlusCircle className="w-5 h-5 mr-2" />
              신규입찰 등록
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden min-h-[500px] relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          ) : (
             <BidTable bids={filteredBids} onEdit={(bid) => { setEditingBid(bid); setIsModalOpen(true); }} onDelete={handleDeleteBid} />
          )}
        </div>
      </main>

      <BidModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveBid} initialData={editingBid} defaultYear={selectedYear} />
      <SheetConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} onSaved={loadData} />
      <UserManagementModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
