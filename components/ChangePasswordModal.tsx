
import React, { useState } from 'react';
import { X, Lock, Key, ShieldCheck, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';
import { AppUser } from '../types';
import { syncUserToSheet, hasSheetUrl } from '../api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  onPasswordChanged: (updatedUser: AppUser) => void;
  isMandatory?: boolean;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  onPasswordChanged,
  isMandatory = false
}) => {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (currentPwd !== currentUser.password) {
      setError('현재 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPwd.length < 4) {
      setError('새 비밀번호는 최소 4자리 이상이어야 합니다.');
      return;
    }

    if (newPwd === currentPwd) {
      setError('기존 비밀번호와 다른 비밀번호를 설정해주세요.');
      return;
    }

    if (newPwd !== confirmPwd) {
      setError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const updatedUser = { 
        ...currentUser, 
        password: newPwd,
        lastPasswordChangeDate: today 
      };
      
      if (hasSheetUrl()) {
        const success = await syncUserToSheet('updateUser', updatedUser);
        if (!success) {
          throw new Error('DB 동기화에 실패했습니다.');
        }
      }

      const storedUsers = localStorage.getItem('appUsers');
      if (storedUsers) {
        const users = JSON.parse(storedUsers) as AppUser[];
        const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
        localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
      }

      onPasswordChanged(updatedUser);
      alert('비밀번호가 성공적으로 변경되었습니다.');
      onClose();
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-[#3f3f46] text-white border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 transition-all outline-none placeholder-slate-500 font-bold";
  const labelClass = "block text-[13px] font-bold text-slate-400 mb-2 ml-1 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col scale-in-center">
        <div className="flex justify-between items-center p-8 border-b border-slate-50">
          <h2 className="text-2xl font-bold text-[#1e293b] flex items-center tracking-tight">
            <Lock className="w-7 h-7 mr-3 text-blue-600" />
            비밀번호 변경
          </h2>
          {!isMandatory && (
            <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors p-2">
              <X className="w-8 h-8" />
            </button>
          )}
        </div>

        {isMandatory && (
          <div className="bg-red-50 p-6 flex items-start gap-3 border-b border-red-100">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <p className="text-red-700 font-bold text-sm">비밀번호 변경이 필요합니다.</p>
              <p className="text-red-600/70 text-xs mt-1">보안 정책에 따라 6개월마다 비밀번호를 변경해야 합니다. 새로운 비밀번호를 설정해주세요.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1.5">
            <label className={labelClass}>현재 비밀번호</label>
            <div className="relative">
              <input
                type="password"
                required
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className={inputClass}
                placeholder="현재 비밀번호 입력"
              />
              <Key className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>새 비밀번호</label>
            <input
              type="password"
              required
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className={inputClass}
              placeholder="최소 4자리 이상"
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>새 비밀번호 확인</label>
            <input
              type="password"
              required
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className={inputClass}
              placeholder="비밀번호 다시 입력"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm py-4 px-4 rounded-2xl flex items-center gap-3 font-bold animate-pulse border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <div className="pt-4 flex gap-3">
             {!isMandatory && (
               <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
              >
                취소
              </button>
             )}
            <button
              type="submit"
              disabled={isLoading}
              className={`py-4 text-white rounded-2xl font-bold flex justify-center items-center transition-all shadow-lg active:scale-95 ${
                isMandatory ? 'w-full bg-red-600 hover:bg-red-700 shadow-red-100' : 'flex-[2] bg-[#2563eb] hover:bg-blue-700 shadow-blue-100'
              }`}
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  비밀번호 {isMandatory ? '강제 변경' : '변경하기'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
