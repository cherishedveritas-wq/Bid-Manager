
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AppUser } from './types';

// 시스템 전체 공통 기본 사용자 목록 (Source of Truth)
export const MASTER_USERS: AppUser[] = [
  { id: 'admin', name: '최철민', birthDate: '760112', password: '4422', isAdmin: true, lastPasswordChangeDate: '2024-01-01' },
  { id: 'user_psi', name: '박상일', birthDate: '701017', password: '3607', isAdmin: false, lastPasswordChangeDate: '2024-10-17' },
  { id: 'user_sjw', name: '송제우', birthDate: '750813', password: '1234', isAdmin: false, lastPasswordChangeDate: '2024-08-13' },
  { id: 'user_lsh', name: '이신형', birthDate: '820119', password: '0173', isAdmin: false, lastPasswordChangeDate: '2024-01-19' },
  { id: 'user_kgw', name: '김경우', birthDate: '780219', password: '1212', isAdmin: false, lastPasswordChangeDate: '2024-02-19' },
  { id: 'user_yhj', name: '여혜진', birthDate: '700611', password: '1234', isAdmin: false, lastPasswordChangeDate: '2024-06-11' },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    // 앱 초기 실행 시 로컬스토리지 확인 및 초기화
    const storedUsers = localStorage.getItem('appUsers');
    if (!storedUsers) {
      localStorage.setItem('appUsers', JSON.stringify(MASTER_USERS));
    } else {
      // 기존 저장된 데이터가 있다면 병합 (신규 마스터 유저 추가 대응)
      try {
        const localUsers = JSON.parse(storedUsers) as AppUser[];
        const userMap = new Map();
        // 1. 현재 로컬 유저들 먼저 담기
        localUsers.forEach(u => userMap.set(u.id, u));
        // 2. 마스터 유저들 중 없는 ID만 추가로 담기
        MASTER_USERS.forEach(u => {
          if (!userMap.has(u.id)) userMap.set(u.id, u);
        });
        localStorage.setItem('appUsers', JSON.stringify(Array.from(userMap.values())));
      } catch (e) {
        localStorage.setItem('appUsers', JSON.stringify(MASTER_USERS));
      }
    }
    
    // 세션 유지 확인
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        setCurrentUser(JSON.parse(session));
      } catch (e) {
        localStorage.removeItem('userSession');
      }
    }
  }, []);

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('userSession', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('userSession');
  };

  const handleUpdateUser = (updatedUser: AppUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('userSession', JSON.stringify(updatedUser));
    
    const storedUsers = localStorage.getItem('appUsers');
    if (storedUsers) {
      const users = JSON.parse(storedUsers) as AppUser[];
      const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    }
  };

  return (
    <>
      {currentUser ? (
        <Dashboard 
          onLogout={handleLogout} 
          currentUser={currentUser} 
          onUpdateUser={handleUpdateUser}
        />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
};

export default App;
