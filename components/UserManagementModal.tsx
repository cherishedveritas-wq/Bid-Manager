
import React, { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, Trash2, Shield, User as UserIcon, Loader2, Key, Lock } from 'lucide-react';
import { AppUser, MASTER_USERS } from '../types';
import { generateId } from '../utils';
import { fetchUsersFromSheet, syncUserToSheet, hasSheetUrl } from '../api';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateLocalStorage = (updatedUsers: AppUser[]) => {
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
  };

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedUsers = localStorage.getItem('appUsers');
      let localUsers = storedUsers ? JSON.parse(storedUsers) : [...MASTER_USERS];

      if (hasSheetUrl()) {
        const cloudUsers = await fetchUsersFromSheet();
        if (cloudUsers.length > 0) {
          const userMap = new Map();
          localUsers.forEach(u => userMap.set(u.id, u));
          cloudUsers.forEach(u => userMap.set(u.id, u));
          localUsers = Array.from(userMap.values());
          updateLocalStorage(localUsers);
        }
      }
      setUsers(localUsers);
    } catch (e) {
      console.error("Failed to load users", e);
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
    if (!newName || newBirthDate.length !== 6 || !newPassword) {
      alert('이름, 생년월일 6자리, 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    const newUser: AppUser = {
      id: `user_${generateId()}`,
      name: newName.trim(),
      birthDate: newBirthDate.trim(),
      password: newPassword.trim(),
      isAdmin: newIsAdmin,
      lastPasswordChangeDate: new Date().toISOString().split('T')[0]
    };

    try {
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      updateLocalStorage(updatedUsers);

      if (hasSheetUrl()) {
        await syncUserToSheet('createUser', newUser);
      }
      
      setNewName('');
      setNewBirthDate('');
      setNewPassword('');
      setNewIsAdmin(false);
      alert(`${newName} 사용자가 추가되었습니다.`);
    } catch (err) {
      alert('사용자 추가 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === 'admin') {
      alert('시스템 관리자 계정은 삭제할 수 없습니다.');
      return;
    }

    if (window.confirm('해당 사용자를 삭제하시겠습니까?')) {
      setIsLoading(true);
      try {
        const updatedUsers = users.filter(user => user.id !== id);
        setUsers(updatedUsers);
        updateLocalStorage(updatedUsers);

        if (hasSheetUrl()) {
          await syncUserToSheet('deleteUser', undefined, id);
        }
      } catch (err) {
        alert('사용자 삭제 중 오류가 발생했습니다.');
        loadUsers();
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-['Noto_Sans_KR']">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] scale-in-center">
        <div className="flex justify-between items-center p-8 border-b border-slate-50">
          <h2 className="text-[26px] font-bold text-[#1e293b] flex items-center tracking-tight">
            <Shield className="w-8 h-8 mr-3 text-blue-600" />
            사용자 계정 관리
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

          <div className="bg-[#f8fafc] border border-slate-100 p-8 rounded-[2.5rem] mb-10 shadow-inner">
            <h3 className="text-sm font-bold text-slate-500 mb-6 flex items-center">
              <UserPlus className="w-4 h-4 mr-2" /> 신규 사용자 등록
            </h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                <label className="block text-[13px] font-bold text-slate-400 mb-2.5 ml-1">이름</label>
                <input
                  required
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#3f3f46] text-white border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-400 mb-2.5 ml-1">생년월일(6자리)</label>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={newBirthDate}
                  onChange={(e) => setNewBirthDate(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-[#3f3f46] text-white border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  placeholder="610101"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-400 mb-2.5 ml-1">비밀번호</label>
                <input
                  required
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#3f3f46] text-white border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  placeholder="비번 설정"
                />
              </div>
              <div className="flex items-center gap-4 justify-between">
                <div className="flex items-center gap-2">
                   <input
                    type="checkbox"
                    id="modalIsAdminCheck"
                    checked={newIsAdmin}
                    onChange={(e) => setNewIsAdmin(e.target.checked)}
                    className="w-6 h-6 cursor-pointer accent-blue-600"
                  />
                  <label htmlFor="modalIsAdminCheck" className="text-[15px] font-bold text-slate-600 cursor-pointer select-none">관리자</label>
                </div>
                <button type="submit" className="bg-[#2563eb] hover:bg-blue-700 text-white px-6 py-4 rounded-2xl text-[17px] font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap">
                  추가하기
                </button>
              </div>
            </form>
          </div>

          <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm bg-white overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[600px]">
              <thead className="bg-slate-50 text-slate-400 text-[13px] font-bold border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6">사용자명</th>
                  <th className="px-8 py-6">생년월일</th>
                  <th className="px-8 py-6">비밀번호</th>
                  <th className="px-8 py-6 text-center">권한</th>
                  <th className="px-8 py-6 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 font-bold text-[#1e293b] flex items-center">
                      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center mr-4 text-slate-400 border border-slate-200 shrink-0">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[16px] whitespace-nowrap">{user.name}</span>
                    </td>
                    <td className="px-8 py-5 text-slate-400 font-medium text-[16px] whitespace-nowrap">{user.birthDate}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                        <Key className="w-3.5 h-3.5 mr-2 text-blue-400" />
                        <span className="font-mono font-bold">{user.password || '-'}</span>
                      </div>
                    </td>
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
