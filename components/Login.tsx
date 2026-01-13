
import React, { useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AppUser } from '../types';
import { fetchUsersFromSheet, hasSheetUrl } from '../api';
import { MASTER_USERS } from '../App';

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const inputName = name.trim();
    const inputBirth = birthDate.trim();
    const inputPwd = password.trim();

    try {
      // 1. 로컬 저장소 로드 (없으면 마스터 목록 사용)
      const storedUsers = localStorage.getItem('appUsers');
      let userList: AppUser[] = storedUsers ? JSON.parse(storedUsers) : [...MASTER_USERS];
      
      // 2. 클라우드 DB 연동 확인
      if (hasSheetUrl()) {
        try {
          const cloudUsers = await fetchUsersFromSheet();
          if (cloudUsers && cloudUsers.length > 0) {
            // 중복 제거하며 병합 (ID 기준)
            const userMap = new Map();
            // 로컬(관리자 추가분 포함) 데이터 먼저 세팅
            userList.forEach(u => userMap.set(u.id, u));
            // 클라우드 데이터로 덮어쓰기/추가
            cloudUsers.forEach(u => userMap.set(u.id, u));
            userList = Array.from(userMap.values());
            
            // 병합된 목록 최신화
            localStorage.setItem('appUsers', JSON.stringify(userList));
          }
        } catch (apiErr) {
          console.warn("Cloud sync failed, using local accounts", apiErr);
        }
      }

      // 3. 인증 확인 (이름 + 생년월일 + 비밀번호)
      const foundUser = userList.find(
        (u: AppUser) => 
          u.name === inputName && 
          u.birthDate === inputBirth && 
          (u.password === inputPwd || (!u.password && inputPwd === ''))
      );

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('사용자 정보 또는 비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      setError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 sm:p-6 font-['Noto_Sans_KR']">
      <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl max-w-md w-full border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="p-4 sm:p-5 bg-blue-50 rounded-3xl border border-blue-100 shadow-sm shadow-blue-50">
            <ShieldCheck className="w-10 h-10 sm:w-12 h-12 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-center text-slate-800 mb-2 tracking-tight">지수아이앤씨</h2>
        <p className="text-center text-slate-400 mb-8 sm:mb-10 font-bold text-sm sm:text-base">입찰 관리 시스템 로그인</p>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">이름</label>
            <input
              type="text"
              required
              disabled={isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 입력"
              className="w-full px-5 py-3.5 sm:py-4 bg-[#f1f5f9] text-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none placeholder-slate-400 font-bold text-base"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">생년월일 (6자리)</label>
            <input
              type="text"
              required
              disabled={isLoading}
              maxLength={6}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="예: 610101"
              className="w-full px-5 py-3.5 sm:py-4 bg-[#f1f5f9] text-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none placeholder-slate-400 font-bold text-base"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full px-5 py-3.5 sm:py-4 bg-[#f1f5f9] text-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none placeholder-slate-400 font-bold text-base pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-[13px] py-3.5 px-4 rounded-2xl text-center font-bold animate-pulse border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 hover:shadow-blue-200 active:scale-[0.98] text-lg flex justify-center items-center mt-6"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : '로그인 하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
