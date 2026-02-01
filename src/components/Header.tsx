import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { LogOut, Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.signout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">VK</span>
            </div>
            <span className="text-white font-bold text-lg hidden sm:inline">Voice of Kalki</span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>

          <nav
            className={`${
              mobileMenuOpen ? 'flex' : 'hidden'
            } md:flex absolute md:relative top-16 md:top-0 left-0 md:left-auto right-0 flex-col md:flex-row bg-slate-800 md:bg-transparent border-b md:border-none border-slate-700 md:gap-1 w-full md:w-auto`}
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 md:py-2 transition-colors ${
                isActive('/')
                  ? 'text-blue-400 bg-slate-700/50 md:bg-transparent'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              News Feed
            </Link>
            <Link
              to="/social-media"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 md:py-2 transition-colors ${
                isActive('/social-media')
                  ? 'text-blue-400 bg-slate-700/50 md:bg-transparent'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Social Media
            </Link>
            <Link
              to="/saved"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 md:py-2 transition-colors ${
                isActive('/saved')
                  ? 'text-blue-400 bg-slate-700/50 md:bg-transparent'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Saved Articles
            </Link>
          </nav>

          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
