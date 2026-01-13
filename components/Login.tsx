
import React, { useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { AppUser } from '../types';
import { fetchUsersFromSheet, hasSheetUrl } from '../api';

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

// 초기 마스터 계정 (사용자 요청에 따른 업데이트: 최철민 4422, 박상일 3607 유지)
const MASTER_USERS: AppUser[] = [
  { id: 'admin', name: '최철민', birthDate: '760112', password: '4422', isAdmin: true },
  { id: 'user1', name: '박상일', birthDate: '701017', password: '3607', isAdmin: false },
];

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
      let userList = [...MASTER_USERS];
      
      if (hasSheetUrl()) {
        try {
          const cloudUsers = await fetchUsersFromSheet();
          if (cloudUsers && cloudUsers.length > 0) {
            userList = [...cloudUsers, ...MASTER_USERS];
          }
        } catch (apiErr) {
          console.warn("Cloud sync failed, using master accounts only", apiErr);
        }
      }

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
      setError('네트워크 연결 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] relative p-4 font-['Noto_Sans_KR']">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-8">
          <div className="p-5 bg-blue-50 rounded-full border border-blue-100">
            <ShieldCheck className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">입찰 관리 시스템</h2>
        <p className="text-center text-slate-400 mb-10 font-medium">접속을 위해 정보를 입력해주세요.</p>
        
        {!hasSheetUrl() && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-3 text-amber-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs font-bold leading-relaxed">
              현재 시스템에 DB 연동 설정이 되어있지 않습니다. <br/>
              관리자에게 문의하여 설정을 완료해주세요.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">이름</label>
            <input
              type="text"
              required
              disabled={isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 입력"
              className="w-full px-5 py-4 bg-[#3f3f46] text-white border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder-slate-500 font-bold"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">생년월일 (6자리)</label>
            <input
              type="text"
              required
              disabled={isLoading}
              maxLength={6}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="예: 610101"
              className="w-full px-5 py-4 bg-[#3f3f46] text-white border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder-slate-500 font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full px-5 py-4 bg-[#3f3f46] text-white border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder-slate-500 font-bold pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm py-3 px-4 rounded-xl text-center font-bold animate-pulse flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-blue-200 active:scale-[0.98] text-lg flex justify-center items-center mt-4"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
