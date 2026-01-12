
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AppUser } from './types';

const INITIAL_USERS: AppUser[] = [
  { id: 'admin', name: '최철민', birthDate: '760112', isAdmin: true },
  { id: 'user1', name: '박상일', birthDate: '701017', isAdmin: false },
  { id: 'user2', name: '김영희', birthDate: '900505', isAdmin: false },
  { id: 'user3', name: '이철수', birthDate: '821225', isAdmin: false },
  { id: 'user4', name: '박지민', birthDate: '950314', isAdmin: false },
  { id: 'user5', name: '정호석', birthDate: '940218', isAdmin: false },
  { id: 'user6', name: '민윤기', birthDate: '930309', isAdmin: false },
  { id: 'user7', name: '김태형', birthDate: '951230', isAdmin: false },
  { id: 'user8', name: '전정국', birthDate: '970901', isAdmin: false },
  { id: 'user9', name: '강해린', birthDate: '060515', isAdmin: false },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    // 초기 사용자 데이터 설정
    const storedUsers = localStorage.getItem('appUsers');
    if (!storedUsers) {
      localStorage.setItem('appUsers', JSON.stringify(INITIAL_USERS));
    }

    // 세션 유지 확인
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
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

  return (
    <>
      {currentUser ? (
        <Dashboard onLogout={handleLogout} currentUser={currentUser} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
};

export default App;
