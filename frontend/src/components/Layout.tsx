import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const navItems = [
  { label: '教材一覧', path: '/' },
  { label: 'タグ管理', path: '/tags' },
];

const adminItems = [
  { label: 'ユーザー管理', path: '/users' },
  { label: '設定', path: '/settings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f3f0ff' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #a855f7 100%)' }} className="text-white shadow-lg">
        <div className="max-w-screen-xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-bold text-xl tracking-tight text-white no-underline drop-shadow-sm">
              🍡 TMCMS
            </Link>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === item.path
                      ? 'bg-white/25 text-white shadow-inner'
                      : 'text-purple-100 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user?.role === 'admin' &&
                adminItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      location.pathname === item.path
                        ? 'bg-white/25 text-white shadow-inner'
                        : 'text-purple-100 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-purple-100">
              {user?.name}
              {user?.role === 'admin' && (
                <span className="ml-2 text-xs bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded-full font-medium">
                  管理者
                </span>
              )}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-purple-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-7">
        {children}
      </main>

      <footer className="text-center text-xs text-purple-300 py-4 border-t border-purple-100 bg-white/40">
        研修教材比較管理システム (TMCMS)
      </footer>
    </div>
  );
}
