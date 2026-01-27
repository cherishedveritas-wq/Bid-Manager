
import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, ArrowRight, ClipboardCheck } from 'lucide-react';
import { Bid, BidCategory, BidResult } from '../types';
import { generateId, formatNumberWithCommas, parseNumberFromCommas } from '../utils';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bid: Bid) => void;
  initialData?: Bid | null;
  defaultYear?: number;
}

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);

const getTodayFormatted = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const emptyBid: Bid = {
  id: '',
  targetYear: 2026,
  category: BidCategory.NEW,
  clientName: '',
  manager: '',
  projectName: '',
  workStartDate: '',
  method: '',
  schedule: '',
  contractPeriod: '',
  competitors: '',
  proposalAmount: 0,
  statusDetail: '',
  result: BidResult.PENDING,
  preferredBidder: '',
  remarks: ''
};

const BidModal: React.FC<BidModalProps> = ({ isOpen, onClose, onSave, initialData, defaultYear }) => {
  const [formData, setFormData] = useState<Bid>(emptyBid);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.contractPeriod.includes(' ~ ')) {
        const [start, end] = initialData.contractPeriod.split(' ~ ');
        setStartDate(start.replace(/\./g, '-'));
        setEndDate(end.replace(/\./g, '-'));
      } else {
        setStartDate('');
        setEndDate('');
      }
    } else {
      setFormData({ 
        ...emptyBid, 
        id: generateId(), 
        targetYear: defaultYear || 2026,
        workStartDate: getTodayFormatted() // 신규 등록 시 오늘 날짜를 기본값으로 설정
      });
      setStartDate('');
      setEndDate('');
    }
  }, [initialData, isOpen, defaultYear]);

  useEffect(() => {
    if (startDate && endDate) {
      const formattedPeriod = `${startDate.replace(/-/g, '.')} ~ ${endDate.replace(/-/g, '.')}`;
      setFormData(prev => ({ ...prev, contractPeriod: formattedPeriod }));
    }
  }, [startDate, endDate]);

  if (!isOpen) return null;

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartDate(newStart);

    if (newStart) {
      const start = new Date(newStart);
      if (!isNaN(start.getTime())) {
        const end = new Date(start);
        end.setFullYear(start.getFullYear() + 1);
        end.setDate(end.getDate() - 1);
        
        const yyyy = end.getFullYear();
        const mm = String(end.getMonth() + 1).padStart(2, '0');
        const dd = String(end.getDate()).padStart(2, '0');
        setEndDate(`${yyyy}-${mm}-${dd}`);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'proposalAmount') {
      setFormData(prev => ({
        ...prev,
        [name]: parseNumberFromCommas(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'targetYear' ? Number(value) : value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const inputClass = "w-full bg-[#3f3f46] text-white border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder-slate-500 font-medium";
  const labelClass = "block text-sm font-bold text-slate-500 mb-2 ml-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col scale-in-center">
        <div className="flex justify-between items-center p-8 border-b border-slate-50 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-slate-800">
            {initialData ? '입찰 정보 수정' : '신규 입찰 등록'}
          </h2>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors p-1">
            <X className="w-8 h-8" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-[17px] font-bold text-blue-600 flex items-center mb-6">
                기본 정보
                <div className="ml-3 flex-1 h-px bg-blue-50"></div>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className={labelClass}>
                    <Calendar className="w-3.5 h-3.5 mr-1.5 inline" /> 대상년도
                  </label>
                  <select
                    name="targetYear"
                    value={formData.targetYear}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {YEAR_OPTIONS.map(year => <option key={year} value={year}>{year}년</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>구분</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {Object.values(BidCategory).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>발주방식</label>
                  <input
                    type="text"
                    name="method"
                    placeholder="입찰/수의/가격"
                    value={formData.method}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                   <label className={labelClass}>PM부서/담당자</label>
                  <input
                    type="text"
                    name="manager"
                    placeholder="영업부/홍길동"
                    value={formData.manager}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>고객사</label>
                <input
                  required
                  type="text"
                  name="clientName"
                  placeholder="에이앤아이"
                  value={formData.clientName}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>입찰명</label>
                <input
                  required
                  type="text"
                  name="projectName"
                  placeholder="oo빌딩 FM종합관리"
                  value={formData.projectName}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  <ClipboardCheck className="w-3.5 h-3.5 mr-1.5 inline" /> 업무개시일
                </label>
                <input
                  type="date"
                  name="workStartDate"
                  value={formData.workStartDate}
                  onChange={handleChange}
                  className={`${inputClass} appearance-none`}
                  style={{ colorScheme: 'dark' }}
                />
              </div>

               <div>
                <label className={labelClass}>계약기간 (달력 선택)</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={handleStartDateChange}
                      className={`${inputClass} appearance-none block`}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                  <div className="flex-1 relative">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`${inputClass} appearance-none block`}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[17px] font-bold text-blue-600 flex items-center mb-6">
                입찰 진행 상세
                <div className="ml-3 flex-1 h-px bg-blue-50"></div>
              </h3>
              
              <div>
                <label className={labelClass}>일정 (현설, 제출일 등)</label>
                <textarea
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  rows={4}
                  placeholder="현설: 10/14&#10;제출: 10/25"
                  className={`${inputClass} resize-none leading-relaxed`}
                />
              </div>

              <div>
                <label className={labelClass}>경쟁사 현황</label>
                <input
                  type="text"
                  name="competitors"
                  placeholder="맥서브, 삼구, 백상 등 10개 업체"
                  value={formData.competitors}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>제안금액 (원)</label>
                  <input
                    type="text"
                    name="proposalAmount"
                    value={formatNumberWithCommas(formData.proposalAmount)}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>결과</label>
                  <select
                    name="result"
                    value={formData.result}
                    onChange={handleChange}
                    className={`${inputClass} ${
                      formData.result === BidResult.WON ? 'text-green-400 font-bold' : 
                      formData.result === BidResult.LOST ? 'text-red-400' : 
                      formData.result === BidResult.DROP ? 'text-slate-400' :
                      'text-blue-400'
                    }`}
                  >
                    {Object.values(BidResult).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

               <div>
                <label className={labelClass}>진행단계 상세</label>
                 <textarea
                  name="statusDetail"
                  value={formData.statusDetail}
                  onChange={handleChange}
                  rows={3}
                  placeholder="* 00/00(수) 서류제출&#10;* 00/00(목) 제안PT&#10;* 00/00(수) 결과 확인"
                  className={`${inputClass} resize-none leading-relaxed`}
                />
              </div>

              <div>
                <label className={labelClass}>비고</label>
                 <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows={3}
                  placeholder="* 특이사항 등"
                  className={`${inputClass} resize-none leading-relaxed`}
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-slate-50 flex justify-end gap-4 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 font-bold transition-all active:scale-95"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 flex items-center font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            <Save className="w-5 h-5 mr-2" />
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default BidModal;
