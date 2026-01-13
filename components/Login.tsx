
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AppUser, MASTER_USERS } from '../types';
import { fetchUsersFromSheet, hasSheetUrl } from '../api';

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

  // 컴포넌트 마운트 시 로컬 저장소 최신화 (로그인 프로세스 단축)
  useEffect(() => {
    if (hasSheetUrl()) {
      fetchUsersFromSheet().then(cloudUsers => {
        if (cloudUsers.length > 0) {
          try {
            const stored = localStorage.getItem('appUsers');
            const localUsers = stored ? JSON.parse(stored) : [...MASTER_USERS];
            const userMap = new Map();
            localUsers.forEach((u: any) => userMap.set(u.id, u));
            cloudUsers.forEach(u => userMap.set(u.id, u));
            localStorage.setItem('appUsers', JSON.stringify(Array.from(userMap.values())));
          } catch (e) {
            console.error("Background sync error", e);
          }
        }
      }).catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // 1. 입력값 정규화 (모든 공백 제거)
    const normInputName = name.replace(/\s/g, '');
    const normInputBirth = birthDate.replace(/\s/g, '');
    const inputPwd = password.trim();

    try {
      // 2. 현재 사용 가능한 유저 목록 확보
      let userList: AppUser[] = [...MASTER_USERS];
      try {
        const storedUsers = localStorage.getItem('appUsers');
        if (storedUsers) {
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            userList = parsed;
          }
        }
      } catch (e) {
        console.warn("Storage access failed");
      }

      // 3. 인증 검사 (비교 대상도 정규화하여 비교)
      const foundUser = userList.find((u: AppUser) => {
        const normStoredName = u.name.replace(/\s/g, '');
        const normStoredBirth = u.birthDate.replace(/\s/g, '');
        return (
          normStoredName === normInputName && 
          normStoredBirth === normInputBirth && 
          (u.password === inputPwd || (!u.password && inputPwd === ''))
        );
      });

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('로그인 정보를 다시 확인해주세요. (이름, 생일 6자리, 비번)');
      }
    } catch (err) {
      setError('시스템 오류가 발생했습니다. 브라우저를 새로고침 해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-['Noto_Sans_KR']">
      <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-100 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100 shadow-sm shadow-blue-50">
            <ShieldCheck className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-center text-slate-800 mb-1 tracking-tight">지수아이앤씨</h2>
        <p className="text-center text-slate-400 mb-8 font-bold text-sm">입찰 관리 시스템</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">이름</label>
            <input
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 입력"
              className="w-full px-5 py-4 bg-[#f1f5f9] text-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none placeholder-slate-400 font-bold text-base"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 ml-1 uppercase tracking-widest">생년월일 (6자리)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              disabled={isLoading}
              maxLength={6}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="예: 610101"
              className="w-full px-5 py-4 bg-[#f1f5f9] text-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none placeholder-slate-400 font-bold text-base"
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
                className="w-full px-5 py-4 bg-[#f1f5f9] text-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none placeholder-slate-400 font-bold pr-12 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-2"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-[13px] py-3.5 px-4 rounded-2xl text-center font-bold border border-red-100 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 active:scale-[0.98] text-lg flex justify-center items-center mt-4 disabled:bg-slate-300 disabled:shadow-none"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : '로그인 하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
