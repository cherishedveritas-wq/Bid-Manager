
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
  // Filter out Test bids for statistics
  const validBids = bids.filter(b => b.category !== BidCategory.TEST);

  // Calculate Stats
  const totalBids = validBids.length;
  const wonBids = validBids.filter(b => b.result === BidResult.WON).length;
  const lostBids = validBids.filter(b => b.result === BidResult.LOST).length;
  const pendingBids = validBids.filter(b => b.result === BidResult.PENDING).length;
  
  // Calculate Win Rate (excluding pending and drop)
  const completedBids = wonBids + lostBids;
  const winRate = completedBids > 0 ? Math.round((wonBids / completedBids) * 100) : 0;

  // Calculate Revenue (Sum of won proposals)
  const totalContractAmount = validBids
    .filter(b => b.result === BidResult.WON)
    .reduce((sum, bid) => sum + bid.proposalAmount, 0);

  // Calculate Total Proposal Volume for selected year
  const totalProposalVolume = validBids
    .reduce((sum, bid) => sum + bid.proposalAmount, 0);

  // Prepare Data for Stacked Bar Chart (Horizontal)
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
      <text 
        x={x + width / 2} 
        y={y + height / 2} 
        fill="#fff" 
        textAnchor="middle" 
        dominantBaseline="middle"
        fontSize={12}
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{year}년 입찰 건수</p>
          <h3 className="text-2xl font-bold text-slate-800">{totalBids}건</h3>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
        <div className="p-3 bg-emerald-100 rounded-lg">
          <Trophy className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">수주 성공률</p>
          <h3 className="text-2xl font-bold text-slate-800">{winRate}%</h3>
          <p className="text-xs text-slate-400">수주 {wonBids} / 결과 {completedBids}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
        <div className="p-3 bg-amber-100 rounded-lg">
          <TrendingUp className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{year}년 전체 제안규모</p>
          <h3 className="text-2xl font-bold text-slate-800">{formatCompactNumber(totalProposalVolume)}원</h3>
          <p className="text-xs text-slate-400">{totalBids}건 합계</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <Coins className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{year}년 수주총액</p>
          <h3 className="text-2xl font-bold text-slate-800">{formatCompactNumber(totalContractAmount)}원</h3>
          <p className="text-xs text-slate-400">{formatCurrency(totalContractAmount)}</p>
        </div>
      </div>

      <div className="col-span-1 lg:col-span-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-600 mb-2 border-b pb-2">{year}년 입찰 결과 현황 (신규/기존)</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
              <XAxis type="number" allowDecimals={false} tick={false} domain={[0, 'dataMax + 1']} />
              <YAxis dataKey="name" type="category" width={50} tick={{fontSize: 14, fontWeight: 'bold'}} />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="수주" stackId="a" fill="#10b981" barSize={40}>
                <LabelList dataKey="수주" content={renderCustomBarLabel} />
              </Bar>
              <Bar dataKey="진행중" stackId="a" fill="#3b82f6" barSize={40}>
                <LabelList dataKey="진행중" content={renderCustomBarLabel} />
              </Bar>
              <Bar dataKey="탈락" stackId="a" fill="#ef4444" barSize={40}>
                <LabelList dataKey="탈락" content={renderCustomBarLabel} />
              </Bar>
              <Bar dataKey="드랍" stackId="a" fill="#94a3b8" barSize={40}>
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
