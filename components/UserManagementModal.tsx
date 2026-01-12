
import React, { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, Trash2, Shield, User as UserIcon, Loader2 } from 'lucide-react';
import { AppUser } from '../types';
import { generateId } from '../utils';
import { fetchUsersFromSheet, syncUserToSheet, hasSheetUrl } from '../api';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_USERS: AppUser[] = [
  { id: 'admin', name: '최철민', birthDate: '760112', isAdmin: true },
  { id: 'user1', name: '박상일', birthDate: '701017', isAdmin: false },
];

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      if (hasSheetUrl()) {
        const cloudUsers = await fetchUsersFromSheet();
        setUsers(cloudUsers.length > 0 ? cloudUsers : INITIAL_USERS);
      } else {
        setUsers(INITIAL_USERS);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, loadUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || newBirthDate.length !== 6) {
      alert('이름과 생년월일 6자리를 정확히 입력해주세요.');
      return;
    }

    setIsLoading(true);
    const newUser: AppUser = {
      id: generateId(),
      name: newName,
      birthDate: newBirthDate,
      isAdmin: newIsAdmin
    };

    if (hasSheetUrl()) {
      await syncUserToSheet('createUser', newUser);
    }
    
    await loadUsers();
    setNewName('');
    setNewBirthDate('');
    setNewIsAdmin(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (id === 'admin') {
      alert('기본 관리자 계정은 삭제할 수 없습니다.');
      return;
    }

    if (window.confirm('해당 사용자를 삭제하시겠습니까?')) {
      setIsLoading(true);
      if (hasSheetUrl()) {
        await syncUserToSheet('deleteUser', undefined, id);
      }
      await loadUsers();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] scale-in-center">
        <div className="flex justify-between items-center p-8 border-b border-slate-50">
          <h2 className="text-[26px] font-bold text-[#1e293b] flex items-center tracking-tight">
            <Shield className="w-8 h-8 mr-3 text-blue-600" />
            사용자 관리 (Cloud Sync)
          </h2>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors p-2">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          )}

          <div className="bg-[#f8fafc] border border-slate-100 p-8 rounded-[2.5rem] mb-10">
            <form onSubmit={handleAddUser} className="flex flex-wrap gap-6 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[13px] font-bold text-slate-400 mb-2.5 ml-1">이름</label>
                <input
                  required
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#3f3f46] text-white border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500 font-bold"
                  placeholder="홍길동"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[13px] font-bold text-slate-400 mb-2.5 ml-1">생년월일(6자리)</label>
                <input
                  required
                  type="text"
                  maxLength={6}
                  value={newBirthDate}
                  onChange={(e) => setNewBirthDate(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-[#3f3f46] text-white border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500 font-bold"
                  placeholder="850101"
                />
              </div>
              <div className="flex items-center gap-3 pb-4 px-1">
                 <input
                  type="checkbox"
                  id="modalIsAdminCheck"
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                  className="w-6 h-6 cursor-pointer accent-blue-600"
                />
                <label htmlFor="modalIsAdminCheck" className="text-[15px] font-bold text-slate-600 cursor-pointer select-none">관리자</label>
              </div>
              <button type="submit" className="bg-[#2563eb] hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[17px] font-bold flex items-center h-[58px] transition-all shadow-lg active:scale-95">
                <UserPlus className="w-5 h-5 mr-2" /> 추가
              </button>
            </form>
          </div>

          <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm bg-white">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-white text-slate-400 text-[13px] font-bold border-b border-slate-50">
                <tr>
                  <th className="px-8 py-6">사용자명</th>
                  <th className="px-8 py-6">생년월일</th>
                  <th className="px-8 py-6 text-center">권한</th>
                  <th className="px-8 py-6 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 font-bold text-[#1e293b] flex items-center">
                      <div className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center mr-4 text-slate-300 border border-slate-100">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[16px]">{user.name}</span>
                    </td>
                    <td className="px-8 py-5 text-slate-400 font-medium text-[16px]">{user.birthDate}</td>
                    <td className="px-8 py-5 text-center">
                      {user.isAdmin ? (
                        <span className="bg-[#eff6ff] text-[#3b82f6] text-[12px] px-4 py-2 rounded-full font-bold">관리자</span>
                      ) : (
                        <span className="bg-[#f1f5f9] text-[#94a3b8] text-[12px] px-4 py-2 rounded-full font-bold">사용자</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-center">
                      {user.id !== 'admin' ? (
                        <button onClick={() => handleDeleteUser(user.id)} className="text-[#ef4444] hover:text-red-600 p-3 hover:bg-red-50 rounded-full transition-all active:scale-90">
                          <Trash2 className="w-6 h-6" />
                        </button>
                      ) : (
                        <span className="text-slate-200 text-lg font-bold">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-slate-50 flex justify-end">
          <button onClick={onClose} className="px-14 py-4 bg-[#f1f5f9] text-[#475569] rounded-2xl text-[17px] font-bold hover:bg-slate-200 transition-colors active:scale-95">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
