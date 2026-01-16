import { useState, useEffect } from 'react';
import { AdminLogin } from '../components/AdminLogin';
import { AdminPanel } from '../components/AdminPanel';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [admin, setAdmin] = useState<{ id: string; username: string } | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    const savedAdmin = localStorage.getItem('admin_user');
    
    if (savedToken && savedAdmin) {
      setToken(savedToken);
      setAdmin(JSON.parse(savedAdmin));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = (token: string, admin: { id: string; username: string }) => {
    setToken(token);
    setAdmin(admin);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken('');
    setAdmin(null);
  };

  if (!isLoggedIn) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminPanel token={token} admin={admin!} onLogout={handleLogout} />;
}
