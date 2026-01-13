
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AppUser } from './types';

// 초기 사용자 데이터 (lastPasswordChangeDate 추가)
const INITIAL_USERS: AppUser[] = [
  { 
    id: 'admin', 
    name: '최철민', 
    birthDate: '760112', 
    password: '4422', 
    isAdmin: true,
    lastPasswordChangeDate: '2024-01-01' // 정책 테스트용 (6개월 지남)
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
  const [isPasswordExpired, setIsPasswordExpired] = useState(false);

  const checkPasswordExpiration = (user: AppUser) => {
    if (!user.lastPasswordChangeDate) return true; // 날짜가 없으면 무조건 변경 대상
    
    const lastDate = new Date(user.lastPasswordChangeDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 182; // 182일(약 6개월) 이상 경과 시 만료
  };

  useEffect(() => {
    // 초기 사용자 데이터 설정
    const storedUsers = localStorage.getItem('appUsers');
    if (!storedUsers) {
      localStorage.setItem('appUsers', JSON.stringify(INITIAL_USERS));
    }

    // 세션 유지 확인
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      const user = JSON.parse(savedSession) as AppUser;
      setCurrentUser(user);
      setIsPasswordExpired(checkPasswordExpiration(user));
    }
  }, []);

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('userSession', JSON.stringify(user));
    setIsPasswordExpired(checkPasswordExpiration(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsPasswordExpired(false);
    localStorage.removeItem('userSession');
  };

  const handleUpdateUser = (updatedUser: AppUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('userSession', JSON.stringify(updatedUser));
    setIsPasswordExpired(false); // 변경 완료 시 만료 상태 해제
  };

  return (
    <>
      {currentUser ? (
        <Dashboard 
          onLogout={handleLogout} 
          currentUser={currentUser} 
          onUpdateUser={handleUpdateUser}
          forceChangePassword={isPasswordExpired}
        />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
};

export default App;
