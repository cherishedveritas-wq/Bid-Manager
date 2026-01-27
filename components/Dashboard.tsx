
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PlusCircle, LogOut, Database, RefreshCw, Loader2, Calendar, Users, AlertTriangle, RotateCw, Lock, Menu, X, Info } from 'lucide-react';
import { Bid, BidCategory, BidResult, AppUser } from '../types';
import StatsOverview from './StatsOverview';
import BidTable from './BidTable';
import BidModal from './BidModal';
import SheetConfigModal from './SheetConfigModal';
import UserManagementModal from './UserManagementModal';
import ChangePasswordModal from './ChangePasswordModal';
import { fetchBids, syncBidToSheet, hasSheetUrl } from '../api';

interface DashboardProps {
  onLogout: () => void;
  currentUser: AppUser;
  onUpdateUser: (user: AppUser) => void;
}

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);

const INITIAL_DATA: Bid[] = [
  {
    id: 'initial_bid_1',
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
  }
];

const Dashboard: React.FC<DashboardProps> = ({ onLogout, currentUser, onUpdateUser }) => {
  const [allBids, setAllBids] = useState<Bid[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSheetConnected, setIsSheetConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // 시트에 ID가 없는 데이터가 있는지 체크 (api.ts에서 prefix를 붙여서 가져오기 때문)
  const hasIncompleteData = useMemo(() => {
    return allBids.some(bid => bid.id.startsWith('temp_') || bid.id.includes('bid_gen_'));
  }, [allBids]);

  const filteredBids = useMemo(() => {
    return allBids.filter(bid => bid.targetYear === selectedYear);
  }, [allBids, selectedYear]);

  const loadData = useCallback(async () => {
    setConnectionError(false);
    if (hasSheetUrl()) {
      setIsLoading(true);
      setIsSheetConnected(true);
      try {
        const data = await fetchBids();
        setAllBids(data.length > 0 ? data : []);
      } catch (error) {
        console.error("Error loading data from Google Sheets", error);
        setConnectionError(true);
        if (allBids.length === 0) setAllBids(INITIAL_DATA);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsSheetConnected(false);
      setAllBids(INITIAL_DATA);
    }
  }, [allBids.length]);

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveBid = async (bid: Bid) => {
    const isEdit = !!editingBid;
    setIsSaving(true);

    try {
      if (isSheetConnected) {
        const action = isEdit ? 'update' : 'create';
        const success = await syncBidToSheet(action, bid);
        
        if (!success) {
          throw new Error('서버 동기화에 실패했습니다. 구글 시트의 ID 컬럼을 확인하세요.');
        }
      }

      setAllBids(prev => {
        if (isEdit) {
          return prev.map(item => item.id === bid.id ? { ...bid } : item);
        } else {
          return [{ ...bid }, ...prev];
        }
      });

      setIsModalOpen(false);
      setEditingBid(null);
    } catch (error: any) {
      alert(error.message || '데이터 저장 중 오류가 발생했습니다.');
      loadData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBid = async (id: string) => {
    if (window.confirm('정말로 이 항목을 삭제하시겠습니까?')) {
      const prevBids = [...allBids];
      setAllBids(prev => prev.filter(item => item.id !== id));
      if (isSheetConnected) {
        const success = await syncBidToSheet('delete', undefined, id);
        if (!success) {
          alert('삭제 동기화에 실패했습니다.');
          setAllBids(prevBids);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {isSaving && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex items-center space-x-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="font-bold text-slate-700">데이터를 저장하는 중입니다...</span>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-6 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              <span className="text-blue-600">지수아이앤씨</span> 입찰 현황
            </h1>
            
            <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 p-1 rounded-lg shrink-0">
              <Calendar className="w-3 h-3 sm:w-4 h-4 text-slate-500 ml-1" />
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-700 outline-none pr-1 py-0.5 cursor-pointer"
              >
                {YEAR_OPTIONS.map(year => <option key={year} value={year}>{year}년 </option>)}
              </select>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            {connectionError ? (
              <button onClick={loadData} className="flex items-center text-red-500 text-xs font-bold bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> DB 오류 
              </button>
            ) : isSheetConnected && (
              <div className="flex items-center text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></div> 실시간 DB
              </div>
            )}
            
            <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <span className="text-sm font-bold text-slate-600">{currentUser.name} {currentUser.isAdmin ? '(관리자)' : ''}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button onClick={() => setIsPasswordModalOpen(true)} className="text-sm px-3 py-1.5 text-slate-600 hover:text-blue-600 flex items-center">
                <Lock className="w-4 h-4 mr-1" /> 비번변경
              </button>
              {currentUser.isAdmin && (
                <>
                  <button onClick={() => setIsUserModalOpen(true)} className="text-sm px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center">
                    <Users className="w-4 h-4 mr-1" /> 사용자
                  </button>
                  <button onClick={() => setIsConfigOpen(true)} className="text-sm px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center">
                    <Database className="w-4 h-4 mr-1" /> DB
                  </button>
                </>
              )}
              <button onClick={onLogout} className="text-sm text-slate-500 hover:text-red-600 px-2 py-1.5 flex items-center">
                <LogOut className="w-4 h-4 mr-1" /> 로그아웃
              </button>
            </div>
          </div>

          <div className="lg:hidden flex items-center">
             <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 py-4 px-4 space-y-3 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50">
              <span className="text-sm font-bold text-slate-700">{currentUser.name} {currentUser.isAdmin ? '(관리자)' : ''}</span>
              {isSheetConnected && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">DB 연결됨</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setIsPasswordModalOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center justify-center space-x-2 py-2.5 bg-slate-50 rounded-xl text-sm text-slate-600 font-bold">
                <Lock className="w-4 h-4" /> <span>비번변경</span>
              </button>
              <button onClick={onLogout} className="flex items-center justify-center space-x-2 py-2.5 bg-red-50 rounded-xl text-sm text-red-600 font-bold">
                <LogOut className="w-4 h-4" /> <span>로그아웃</span>
              </button>
              {currentUser.isAdmin && (
                <>
                  <button onClick={() => { setIsUserModalOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center justify-center space-x-2 py-2.5 bg-slate-50 rounded-xl text-sm text-slate-600 font-bold">
                    <Users className="w-4 h-4" /> <span>사용자 관리</span>
                  </button>
                  <button onClick={() => { setIsConfigOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center justify-center space-x-2 py-2.5 bg-slate-50 rounded-xl text-sm text-slate-600 font-bold">
                    <Database className="w-4 h-4" /> <span>DB 설정</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 py-6 overflow-x-hidden flex flex-col">
        {hasIncompleteData && isSheetConnected && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
            <Info className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-amber-900 font-bold text-sm">구글 시트에 ID값이 비어있는 데이터가 발견되었습니다.</p>
              <p className="text-amber-700 text-xs">수정 내용을 반영하려면 구글 시트의 'id' 열에 값을 직접 입력하거나 [DB 설정] 도움말을 확인하세요.</p>
            </div>
            <button 
              onClick={() => setIsConfigOpen(true)}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors"
            >
              해결방법 보기
            </button>
          </div>
        )}

        <StatsOverview bids={filteredBids} year={selectedYear} />

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-700 flex items-center whitespace-nowrap">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2"></span>
            {selectedYear}년 입찰 리스트
          </h2>
          <div className="flex w-full sm:w-auto space-x-2">
            {isSheetConnected && (
              <button onClick={loadData} disabled={isLoading} className="flex-1 sm:flex-none text-slate-500 hover:text-blue-600 p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button 
              onClick={() => { setEditingBid(null); setIsModalOpen(true); }} 
              className="flex-[3] sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center shadow-lg transition-all active:scale-95 text-sm sm:text-base"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              신규 등록
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center py-20">
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
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
        currentUser={currentUser}
        onPasswordChanged={onUpdateUser}
        isMandatory={false}
      />
    </div>
  );
};

export default Dashboard;
