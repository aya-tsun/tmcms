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
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-md">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-bold text-lg tracking-tight text-white no-underline">
              TMCMS
            </Link>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-900 text-white'
                      : 'text-blue-100 hover:bg-blue-600'
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
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-900 text-white'
                        : 'text-blue-100 hover:bg-blue-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-100">
              {user?.name}
              {user?.role === 'admin' && (
                <span className="ml-1 text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded">
                  管理者
                </span>
              )}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-200 hover:text-white transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-200 bg-white">
        研修教材比較管理システム (TMCMS)
      </footer>
    </div>
  );
}
