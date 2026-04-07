import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const [badgeData, statsData, subData] = await Promise.all([
        api.get('/stats/badges'),
        api.get('/stats/overview'),
        api.get('/submissions/history?limit=10'),
      ]);
      setBadges(badgeData.badges || []);
      setStats(statsData);
      setSubmissions(subData.submissions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] card-shadow mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-3xl glow">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">{user?.name}</h1>
            <p className="text-[var(--color-text-muted)]">{user?.email}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                Level {stats?.level || 1}
              </span>
              <span className="text-sm px-3 py-1 rounded-full bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
                🔥 {stats?.streak || 0} day streak
              </span>
              <span className="text-sm px-3 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                ⚡ {stats?.xp || 0} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Solved', value: stats?.totalSolved || 0, icon: '✅' },
          { label: 'Accuracy', value: `${stats?.accuracy || 0}%`, icon: '🎯' },
          { label: 'Avg Time', value: `${stats?.avgTime || 0}s`, icon: '⏱️' },
          { label: 'Longest Streak', value: `${stats?.longestStreak || 0}d`, icon: '🏆' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
            <span className="text-xl">{s.icon}</span>
            <div className="text-xl font-bold mt-1 text-[var(--color-text)]">{s.value}</div>
            <div className="text-xs text-[var(--color-text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] card-shadow mb-8">
        <h2 className="text-lg font-semibold mb-4">🏅 Achievements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {badges.map(badge => (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border text-center transition-all ${
                badge.earned
                  ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/30'
                  : 'bg-[var(--color-surface-2)] border-[var(--color-border)] opacity-40'
              }`}
            >
              <span className="text-3xl block mb-2">{badge.icon}</span>
              <span className="text-sm font-medium text-[var(--color-text)] block">{badge.name}</span>
              <span className="text-xs text-[var(--color-text-muted)]">{badge.description}</span>
              {badge.earned && (
                <div className="text-xs text-[var(--color-success)] mt-1">✅ Earned</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] card-shadow">
        <h2 className="text-lg font-semibold mb-4">📋 Recent Activity</h2>
        {submissions.length > 0 ? (
          <div className="space-y-3">
            {submissions.map(sub => (
              <div
                key={sub.id}
                onClick={() => navigate(`/problem/${sub.problem_id}`)}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {sub.status === 'accepted' ? '✅' : sub.status === 'wrong_answer' ? '❌' : '⚠️'}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-[var(--color-text)]">{sub.problem_title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs badge-${sub.difficulty} px-1.5 py-0.5 rounded`}>{sub.difficulty}</span>
                      <span className="text-xs text-[var(--color-text-muted)] capitalize">{sub.topic}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[var(--color-text-muted)] capitalize">{sub.language}</span>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">No activity yet. Start solving problems!</p>
        )}
      </div>
    </div>
  );
}
