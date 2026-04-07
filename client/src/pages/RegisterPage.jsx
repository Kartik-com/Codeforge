import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) { navigate('/dashboard'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('All fields required');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirmPassword) return toast.error('Passwords don\'t match');
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created! Welcome to CodeForge AI! 🎉');
      navigate('/practice');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white text-3xl mx-auto mb-4 glow">⚡</div>
          <h1 className="text-3xl font-bold gradient-text">Join CodeForge AI</h1>
          <p className="text-[var(--color-text-muted)] mt-2">Start your coding journey with AI-powered practice</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] card-shadow space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Full Name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
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
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">Confirm Password</label>
            <input
              type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl gradient-bg text-white font-semibold cursor-pointer border-0 hover:opacity-90 transition-all disabled:opacity-50">
            {loading ? '⏳ Creating account...' : '🚀 Create Account'}
          </button>

          <p className="text-center text-sm text-[var(--color-text-muted)]">
            Already have an account? <Link to="/login" className="text-[var(--color-primary)] no-underline hover:underline font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
