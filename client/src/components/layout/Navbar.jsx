import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Home, Code2, LayoutDashboard, Target, 
  Sun, Moon, Zap, Flame, LogOut, TerminalSquare
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/practice', label: 'Practice', icon: Code2 },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, auth: true },
    { path: '/interview', label: 'Interview', icon: Target, auth: true },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border)]" style={{ minHeight: 64 }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline group hover:opacity-90">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white shadow-sm border border-[var(--color-primary-dark)]">
            <TerminalSquare size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-semibold text-[var(--color-text)] tracking-tight hidden sm:inline">CodeForge</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1.5">
          {navLinks.filter(l => !l.auth || user).map(link => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 no-underline
                  ${isActive(link.path) 
                    ? 'bg-[var(--color-surface)] border-b-2 border-[var(--color-primary)] text-[var(--color-text)]' 
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
                  }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-lg bg-transparent border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div className="flex items-center gap-3 ml-2">
              {/* XP indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm">
                <Zap size={14} className="text-[var(--color-primary)]" fill="currentColor" />
                <span className="font-semibold text-[var(--color-text)]">{user.xp || 0} XP</span>
              </div>

              {/* Streak */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm">
                <Flame size={14} className="text-orange-500" fill="currentColor" />
                <span className="font-semibold text-[var(--color-text)]">{user.streak || 0}</span>
              </div>

              <div className="w-px h-6 bg-[var(--color-border)] mx-1 hidden sm:block"></div>

              {/* Profile */}
              <Link 
                to="/profile" 
                className="w-9 h-9 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-[var(--color-text)] font-semibold text-sm no-underline hover:ring-2 hover:ring-[var(--color-border)] transition-all"
              >
                {user.name?.charAt(0).toUpperCase()}
              </Link>

              <button
                onClick={logout}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent border-0"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] no-underline px-2 py-2">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm px-4 py-2 rounded-lg no-underline font-medium">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        {navLinks.filter(l => !l.auth || user).map(link => {
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] uppercase tracking-wider font-semibold no-underline transition-colors
                ${isActive(link.path) ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
