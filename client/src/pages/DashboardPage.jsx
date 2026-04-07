import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TOPICS } from '../utils/constants';
import { 
  CheckCircle2, Target, Flame, Zap, Activity, BookOpen, Layers
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [topics, setTopics] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadAll();
  }, [user]);

  const loadAll = async () => {
    try {
      const [statsData, heatmapData, topicsData, progressData] = await Promise.all([
        api.get('/stats/overview'),
        api.get('/stats/heatmap'),
        api.get('/stats/topics'),
        api.get('/stats/progress'),
      ]);
      setStats(statsData);
      setHeatmap(heatmapData.activities || []);
      setTopics(topicsData.topics || []);
      setProgress(progressData.progress || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];
  const diffData = stats ? [
    { name: 'Easy', value: stats.difficultyBreakdown?.easy || 0 },
    { name: 'Medium', value: stats.difficultyBreakdown?.medium || 0 },
    { name: 'Hard', value: stats.difficultyBreakdown?.hard || 0 },
  ].filter(d => d.value > 0) : [];

  // Generate heatmap grid (last 365 days)
  const heatmapMap = {};
  heatmap.forEach(a => { heatmapMap[a.date] = a.problems; });
  const today = new Date();
  const heatmapDays = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    heatmapDays.push({ date: dateStr, count: heatmapMap[dateStr] || 0, day: d.getDay() });
  }
  const weeks = [];
  let currentWeek = [];
  heatmapDays.forEach(d => {
    if (d.day === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(d);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const getHeatmapColor = (count) => {
    if (count === 0) return 'var(--color-surface-2)';
    if (count <= 1) return '#10B98140';
    if (count <= 3) return '#10B98180';
    if (count <= 5) return '#10B981bb';
    return '#10B981';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] mb-2">
          Performance Dashboard
        </h1>
        <p className="text-[15px] text-[var(--color-text-muted)]">
          Comprehensive analytics covering your problem-solving metrics and consistency.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Solved', value: stats?.totalSolved || 0, icon: CheckCircle2, color: 'var(--color-success)' },
          { label: 'Accuracy', value: `${stats?.accuracy || 0}%`, icon: Target, color: 'var(--color-accent)' },
          { label: 'Current Streak', value: `${stats?.streak || 0}`, icon: Flame, color: '#F59E0B' },
          { label: 'Total XP', value: stats?.xp || 0, icon: Zap, color: 'var(--color-primary-light)' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="text-[28px] font-bold tracking-tight text-[var(--color-text)]">{card.value}</div>
                <div className="p-2 rounded-lg bg-[var(--color-surface-2)]" style={{ color: card.color }}>
                   <Icon size={20} strokeWidth={2} />
                </div>
              </div>
              <div className="text-[13px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* XP Progress */}
      {stats?.xpProgress && (
        <div className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text)]">Level Progression: {stats.level}</h2>
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{stats.xpProgress.current} / {stats.xpProgress.needed} XP</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[var(--color-bg)] overflow-hidden border border-[var(--color-border)]">
            <div
              className="h-full bg-[var(--color-primary-light)] transition-all duration-1000 ease-out"
              style={{ width: `${stats.xpProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Progress Chart */}
        <div className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
           <div className="flex items-center gap-2 mb-6">
            <Activity size={18} className="text-[var(--color-primary-light)]" />
            <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text)]">Output Over Time</h2>
          </div>
          
          {progress.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progress}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, fontWeight: 500 }}
                    itemStyle={{ color: 'var(--color-text)' }}
                  />
                  <Line type="monotone" dataKey="cumulative_problems" stroke="var(--color-primary-light)" strokeWidth={3} dot={false} name="Total Solved" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[var(--color-text-muted)] text-[13px] bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] border-dashed">
              Insufficient data. Execute successful submissions to populate.
            </div>
          )}
        </div>

        {/* Difficulty Breakdown */}
        <div className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Layers size={18} className="text-[#F59E0B]" />
            <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text)]">Complexity Breakdown</h2>
          </div>
          
          {diffData.length > 0 ? (
            <div className="flex items-center gap-8 h-[220px]">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={diffData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
                    {diffData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4">
                {diffData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between min-w-[120px]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-[13px] font-semibold text-[var(--color-text)]">{d.name}</span>
                    </div>
                    <span className="text-[14px] font-bold text-[var(--color-text-muted)]">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[var(--color-text-muted)] text-[13px] bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] border-dashed">
              Insufficient data available.
            </div>
          )}
        </div>
      </div>

      {/* Streak Heatmap */}
      <div className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm mb-8 overflow-hidden transform-gpu">
         <div className="flex items-center gap-2 mb-6">
            <Flame size={18} className="text-[#F59E0B]" />
            <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text)]">Execution Heatmap</h2>
          </div>
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map(day => (
                  <div
                    key={day.date}
                    className="w-[14px] h-[14px] rounded-sm transition-opacity hover:opacity-75"
                    style={{ background: getHeatmapColor(day.count) }}
                    title={`${day.date}: ${day.count} executions`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-2 text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          <span>Less</span>
          {[0, 1, 3, 5, 7].map(n => (
            <div key={n} className="w-[14px] h-[14px] rounded-sm" style={{ background: getHeatmapColor(n) }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Topic Mastery */}
      <div className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
        <div className="flex items-center gap-2 mb-6">
            <BookOpen size={18} className="text-[var(--color-primary-light)]" />
            <h2 className="text-[15px] font-bold tracking-tight text-[var(--color-text)]">Domain Analytics</h2>
          </div>
        {topics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {topics.map(t => {
              const topicInfo = TOPICS.find(tp => tp.id === t.topic);
              const Icon = topicInfo?.icon || BookOpen;
              return (
                <div key={t.topic} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-1 text-[13px]">
                     <div className="flex items-center gap-2">
                        <Icon size={16} className="text-[var(--color-text-muted)]" />
                        <span className="font-semibold capitalize text-[var(--color-text)] tracking-tight">{topicInfo?.name || t.topic}</span>
                     </div>
                     <span className="font-medium text-[var(--color-text-muted)]">{t.solved} executed</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 rounded-full bg-[var(--color-bg)] overflow-hidden border border-[var(--color-border)]/50">
                      <div
                        className="h-full transition-all duration-500 ease-out"
                        style={{ width: `${t.accuracy}%`, background: t.accuracy >= 80 ? '#10B981' : t.accuracy >= 50 ? '#F59E0B' : '#EF4444' }}
                      />
                    </div>
                    <span className="text-[12px] font-bold w-10 text-right" style={{ color: t.accuracy >= 80 ? '#10B981' : t.accuracy >= 50 ? '#F59E0B' : '#EF4444' }}>
                      {t.accuracy}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 flex items-center justify-center text-[var(--color-text-muted)] text-[13px] bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] border-dashed">
             Execute validation tests across domains to compile metric accuracy.
          </div>
        )}
      </div>
    </div>
  );
}
