
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AppUser } from './types';

// 초기 사용자 데이터
const INITIAL_USERS: AppUser[] = [
  { 
    id: 'admin', 
    name: '최철민', 
    birthDate: '760112', 
    password: '4422', 
    isAdmin: true,
    lastPasswordChangeDate: '2024-01-01'
  },
  { 
    id: 'user1', 
    name: '박상일', 
    birthDate: '701017', 
    password: '3607', 
    isAdmin: false,
    lastPasswordChangeDate: new Date().toISOString().split('T')[0]
  },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    // 앱 초기 실행 시 사용자 목록 초기화 (로컬스토리지에 없을 경우)
    const storedUsers = localStorage.getItem('appUsers');
    if (!storedUsers) {
      localStorage.setItem('appUsers', JSON.stringify(INITIAL_USERS));
    }
  }, []);

  /**
   * 로그인 핸들러
   */
  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('userSession', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('userSession');
  };

  /**
   * 사용자 정보(비밀번호 등) 업데이트 핸들러
   */
  const handleUpdateUser = (updatedUser: AppUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('userSession', JSON.stringify(updatedUser));
    
    // 로컬스토리지의 전체 사용자 목록도 업데이트
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
