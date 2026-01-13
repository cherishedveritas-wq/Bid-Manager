
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AppUser, MASTER_USERS } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    // 1. 사용자 목록 초기화
    const storedUsers = localStorage.getItem('appUsers');
    if (!storedUsers) {
      localStorage.setItem('appUsers', JSON.stringify(MASTER_USERS));
    } else {
      try {
        const localUsers = JSON.parse(storedUsers) as AppUser[];
        const userMap = new Map();
        localUsers.forEach(u => userMap.set(u.id, u));
        MASTER_USERS.forEach(u => {
          if (!userMap.has(u.id)) userMap.set(u.id, u);
        });
        localStorage.setItem('appUsers', JSON.stringify(Array.from(userMap.values())));
      } catch (e) {
        localStorage.setItem('appUsers', JSON.stringify(MASTER_USERS));
      }
    }
    
    // 2. 세션 복구
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
      try {
        const users = JSON.parse(storedUsers) as AppUser[];
        const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
      } catch (e) {
        console.error("Update user in storage failed", e);
      }
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
