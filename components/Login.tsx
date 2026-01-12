
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { AppUser } from '../types';
import { fetchUsersFromSheet, hasSheetUrl } from '../api';

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

const INITIAL_USERS: AppUser[] = [
  { id: 'admin', name: '최철민', birthDate: '760112', isAdmin: true },
  { id: 'user1', name: '박상일', birthDate: '701017', isAdmin: false },
];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      let userList = INITIAL_USERS;
      
      // 구글 시트 연동 정보가 있으면 원격에서 가져옴
      if (hasSheetUrl()) {
        const cloudUsers = await fetchUsersFromSheet();
        if (cloudUsers.length > 0) {
          userList = cloudUsers;
        }
      }

      const foundUser = userList.find(
        (u: AppUser) => u.name === name && u.birthDate === birthDate
      );

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('사용자 정보가 일치하지 않습니다. (동기화 확인 필요)');
      }
    } catch (err) {
      setError('서버 연결 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9]">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-8">
          <div className="p-5 bg-blue-50 rounded-full border border-blue-100">
            <ShieldCheck className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">입찰 관리 시스템</h2>
        <p className="text-center text-slate-400 mb-10 font-medium">접속을 위해 정보를 입력해주세요.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 ml-1">이름</label>
            <input
              type="text"
              required
              disabled={isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-5 py-4 bg-[#3f3f46] text-white border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder-slate-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 ml-1">생년월일(6자리)</label>
            <input
              type="text"
              required
              disabled={isLoading}
              maxLength={6}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="예: 701017"
              className="w-full px-5 py-4 bg-[#3f3f46] text-white border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder-slate-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm py-3 px-4 rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-blue-200 active:scale-[0.98] text-lg flex justify-center items-center"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : '로그인'}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-50 text-center space-y-1">
          <p className="text-xs text-slate-400">초기 관리자: 최철민 / 760112</p>
          <p className="text-xs text-slate-400 font-bold">테스트 사용자: 박상일 / 701017</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
