
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Trophy, FileText, Coins, TrendingUp } from 'lucide-react';
import { Bid, BidResult, BidCategory } from '../types';
import { formatCompactNumber, formatCurrency } from '../utils';

interface StatsOverviewProps {
  bids: Bid[];
  year: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ bids, year }) => {
  const validBids = bids.filter(b => b.category !== BidCategory.TEST);

  const totalBids = validBids.length;
  const wonBids = validBids.filter(b => b.result === BidResult.WON).length;
  const lostBids = validBids.filter(b => b.result === BidResult.LOST).length;
  
  const completedBids = wonBids + lostBids;
  const winRate = completedBids > 0 ? Math.round((wonBids / completedBids) * 100) : 0;

  const totalContractAmount = validBids
    .filter(b => b.result === BidResult.WON)
    .reduce((sum, bid) => sum + bid.proposalAmount, 0);

  const totalProposalVolume = validBids
    .reduce((sum, bid) => sum + bid.proposalAmount, 0);

  const categories = [BidCategory.NEW, BidCategory.EXISTING];
  const chartData = categories.map(cat => {
    const catBids = validBids.filter(b => b.category === cat);
    return {
      name: cat,
      '수주': catBids.filter(b => b.result === BidResult.WON).length,
      '진행중': catBids.filter(b => b.result === BidResult.PENDING).length,
      '탈락': catBids.filter(b => b.result === BidResult.LOST).length,
      '드랍': catBids.filter(b => b.result === BidResult.DROP).length,
    };
  });

  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (!value || value === 0) return null;
    return (
      <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="bold">
        {value}
      </text>
    );
  };

  const Card = ({ icon: Icon, color, title, value, sub, subDetail }: any) => (
    <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3 sm:space-x-4">
      <div className={`p-2.5 sm:p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 sm:w-6 h-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider truncate">{title}</p>
        <h3 className="text-lg sm:text-xl font-black text-slate-800 truncate">{value}</h3>
        {sub && <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">{sub} {subDetail && <span className="opacity-60">{subDetail}</span>}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card icon={FileText} color="bg-blue-50 text-blue-600" title={`${year}년 입찰 건수`} value={`${totalBids}건`} sub={`${totalBids}건 진행 중`} />
        <Card icon={Trophy} color="bg-emerald-50 text-emerald-600" title="수주 성공률" value={`${winRate}%`} sub={`수주 ${wonBids} / 결과 ${completedBids}`} />
        <Card icon={TrendingUp} color="bg-amber-50 text-amber-600" title="전체 제안규모" value={formatCompactNumber(totalProposalVolume)} sub={`${totalBids}건 합계`} />
        <Card icon={Coins} color="bg-indigo-50 text-indigo-600" title="수주 총액" value={formatCompactNumber(totalContractAmount)} sub={formatCurrency(totalContractAmount)} />
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
          <h4 className="text-sm font-bold text-slate-700 flex items-center">
            <span className="w-1 h-3 bg-blue-500 rounded-full mr-2"></span>
            입찰 결과 통계
          </h4>
          <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 bg-slate-50 rounded-full">단위: 건</span>
        </div>
        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 12, fontWeight: 'bold', fill: '#64748b'}} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
              <Legend iconType="circle" wrapperStyle={{paddingTop: '10px', fontSize: '11px', fontWeight: 'bold'}} />
              <Bar dataKey="수주" stackId="a" fill="#10b981" barSize={32} radius={[0, 0, 0, 0]}>
                <LabelList dataKey="수주" content={renderCustomBarLabel} />
              </Bar>
              <Bar dataKey="진행중" stackId="a" fill="#3b82f6" barSize={32}>
                <LabelList dataKey="진행중" content={renderCustomBarLabel} />
              </Bar>
              <Bar dataKey="탈락" stackId="a" fill="#ef4444" barSize={32}>
                <LabelList dataKey="탈락" content={renderCustomBarLabel} />
              </Bar>
              <Bar dataKey="드랍" stackId="a" fill="#94a3b8" barSize={32} radius={[0, 4, 4, 0]}>
                <LabelList dataKey="드랍" content={renderCustomBarLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
