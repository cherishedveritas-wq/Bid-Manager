
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Edit, Trash2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Bid, BidResult, BidCategory } from '../types';
import { formatCurrency } from '../utils';

interface BidTableProps {
  bids: Bid[];
  onEdit: (bid: Bid) => void;
  onDelete: (id: string) => void;
}

type SortKey = keyof Bid;
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey | null;
  direction: SortDirection;
}

const BidTable: React.FC<BidTableProps> = ({ bids, onEdit, onDelete }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  // Initial column configuration
  const initialCols = [
    { name: 'NO', key: 'id' as SortKey, width: 50, align: 'center' as const, sortable: false, sticky: true },
    { name: '구분', key: 'category' as SortKey, width: 60, align: 'center' as const, sortable: true, sticky: true },
    { name: '고객사', key: 'clientName' as SortKey, width: 140, align: 'left' as const, sortable: true, sticky: true },
    { name: 'PM 담당자', key: 'manager' as SortKey, width: 100, align: 'left' as const, sortable: true, sticky: true },
    { name: '프로젝트/입찰명', key: 'projectName' as SortKey, width: 240, align: 'left' as const, sortable: true, sticky: true },
    { name: '방식', key: 'method' as SortKey, width: 80, align: 'center' as const, sortable: true, sticky: false },
    { name: '일정', key: 'schedule' as SortKey, width: 180, align: 'left' as const, sortable: true, sticky: false },
    { name: '계약기간', key: 'contractPeriod' as SortKey, width: 140, align: 'left' as const, sortable: true, sticky: false },
    { name: '경쟁사', key: 'competitors' as SortKey, width: 160, align: 'left' as const, sortable: true, sticky: false },
    { name: '제안금액', key: 'proposalAmount' as SortKey, width: 130, align: 'right' as const, sortable: true, sticky: false },
    { name: '진행단계', key: 'statusDetail' as SortKey, width: 200, align: 'left' as const, sortable: true, sticky: false },
    { name: '결과', key: 'result' as SortKey, width: 80, align: 'center' as const, sortable: true, sticky: false },
    { name: '우협사', key: 'preferredBidder' as SortKey, width: 120, align: 'center' as const, sortable: true, sticky: false },
    { name: '비고', key: 'remarks' as SortKey, width: 200, align: 'left' as const, sortable: false, sticky: false },
    { name: '관리', key: 'id' as SortKey, width: 80, align: 'center' as const, sortable: false, sticky: false },
  ];

  const [cols, setCols] = useState(initialCols);
  
  // 가로 틀 고정을 위한 각 컬럼의 left 오프셋 계산
  const getLeftOffset = (index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      if (cols[i].sticky) {
        offset += cols[i].width;
      }
    }
    return offset;
  };

  // Refs for resizing logic
  const activeIndex = useRef<number | null>(null);
  const activeStartWidth = useRef<number>(0);
  const activeStartX = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activeIndex.current === null) return;
      const delta = e.clientX - activeStartX.current;
      setCols(prev => {
        const next = [...prev];
        const newWidth = Math.max(30, activeStartWidth.current + delta);
        next[activeIndex.current!] = { ...next[activeIndex.current!], width: newWidth };
        return next;
      });
    };
    const handleMouseUp = () => {
      if (activeIndex.current !== null) {
        activeIndex.current = null;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    activeIndex.current = index;
    activeStartX.current = e.clientX;
    activeStartWidth.current = cols[index].width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedBids = useMemo(() => {
    const sortableItems = [...bids];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [bids, sortConfig]);

  const renderSortIcon = (col: typeof initialCols[0]) => {
    if (!col.sortable) return null;
    if (sortConfig.key !== col.key) return <ArrowUpDown className="w-3 h-3 ml-1 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-blue-500" /> : <ChevronDown className="w-3 h-3 ml-1 text-blue-500" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-700">입찰 진행 세부내역</h3>
        <span className="text-xs text-slate-500">
          총 {bids.length}건 <span className="text-slate-400 ml-2">(헤더 클릭 시 정렬 / 경계선 드래그 시 너비 조절)</span>
        </span>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar" style={{ maxHeight: '600px' }}>
        <table 
          className="text-[12px] text-left border-collapse table-fixed w-full"
          style={{ width: cols.reduce((acc, col) => acc + col.width, 0) }}
        >
          <thead className="text-slate-600 uppercase sticky top-0 z-50">
            <tr>
              {cols.map((col, index) => {
                const isLastSticky = col.sticky && !cols[index + 1]?.sticky;
                const left = col.sticky ? getLeftOffset(index) : undefined;
                
                return (
                  <th 
                    key={index} 
                    scope="col" 
                    className={`px-3 py-4 border border-slate-200 relative group select-none font-bold transition-colors 
                      ${col.sortable ? 'cursor-pointer hover:bg-slate-200' : ''} 
                      ${col.sticky ? 'sticky z-50 bg-slate-100' : 'bg-slate-100'}
                      ${isLastSticky ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] border-r-slate-300' : ''}
                    `}
                    style={{ 
                      width: col.width, 
                      textAlign: 'center',
                      left: left !== undefined ? `${left}px` : undefined
                    }}
                    onClick={() => col.sortable && requestSort(col.key)}
                  >
                    <div className="flex items-center justify-center">
                      {col.name}
                      {renderSortIcon(col)}
                    </div>
                    {/* Resizer Handle */}
                    <div 
                      className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-blue-400 z-50 transition-colors"
                      onMouseDown={(e) => handleMouseDown(e, index)}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedBids.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="text-center py-20 text-slate-400 text-sm bg-white">
                  해당 연도에 등록된 입찰 정보가 없습니다.
                </td>
              </tr>
            ) : (
              sortedBids.map((bid, index) => (
                <tr key={bid.id} className="bg-white hover:bg-slate-50 transition-colors align-top group/row">
                  {cols.map((col, colIndex) => {
                    const isLastSticky = col.sticky && !cols[colIndex + 1]?.sticky;
                    const left = col.sticky ? getLeftOffset(colIndex) : undefined;
                    
                    // Render cell content based on key
                    let content: React.ReactNode = '-';
                    if (col.name === 'NO') content = index + 1;
                    else if (col.key === 'category') {
                      content = (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bid.category === BidCategory.NEW ? 'bg-blue-100 text-blue-700' : 
                          bid.category === BidCategory.EXISTING ? 'bg-slate-100 text-slate-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{bid.category}</span>
                      );
                    }
                    else if (col.key === 'proposalAmount') content = bid.proposalAmount > 0 ? formatCurrency(bid.proposalAmount) : '-';
                    else if (col.key === 'result') {
                      content = (
                        <span className={`font-bold px-2 py-1 rounded text-[11px] inline-block w-full break-words ${
                          bid.result === BidResult.WON ? 'bg-green-100 text-green-700' :
                          bid.result === BidResult.LOST ? 'bg-red-100 text-red-700' :
                          bid.result === BidResult.DROP ? 'bg-gray-200 text-gray-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>{bid.result}</span>
                      );
                    }
                    else if (col.name === '관리') {
                      content = (
                        <div className="flex items-center justify-center space-x-1">
                          <button onClick={() => onEdit(bid)} className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-100 rounded-lg transition-colors" title="수정"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(bid.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-100 rounded-lg transition-colors" title="삭제"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      );
                    }
                    else {
                      content = (bid as any)[col.key] || '-';
                    }

                    return (
                      <td 
                        key={colIndex}
                        className={`px-3 py-3 border border-slate-200 break-words whitespace-normal leading-normal
                          ${col.sticky ? 'sticky z-20 bg-white group-hover/row:bg-slate-50' : ''}
                          ${isLastSticky ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] border-r-slate-300' : ''}
                          ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                          ${col.key === 'projectName' || col.key === 'clientName' ? 'font-bold text-slate-800' : 'text-slate-600'}
                          ${col.key === 'proposalAmount' ? 'bg-amber-50/10 font-bold' : ''}
                        `}
                        style={{ 
                          left: left !== undefined ? `${left}px` : undefined 
                        }}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BidTable;
