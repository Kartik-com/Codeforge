import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) { navigate('/dashboard'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('All fields required');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white text-3xl mx-auto mb-4 glow">⚡</div>
          <h1 className="text-3xl font-bold gradient-text">Welcome Back</h1>
          <p className="text-[var(--color-text-muted)] mt-2">Sign in to continue your coding journey</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] card-shadow space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl gradient-bg text-white font-semibold cursor-pointer border-0 hover:opacity-90 transition-all disabled:opacity-50">
            {loading ? '⏳ Signing in...' : '🔓 Sign In'}
          </button>

          <p className="text-center text-sm text-[var(--color-text-muted)]">
            Don't have an account? <Link to="/register" className="text-[var(--color-primary)] no-underline hover:underline font-medium">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
