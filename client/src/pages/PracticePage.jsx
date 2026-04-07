import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CURRICULUM_LEVELS, DIFFICULTIES } from '../utils/constants';
import toast from 'react-hot-toast';
import { 
  ChevronDown, ChevronRight, Lock, Play, Sparkles, 
  CheckCircle2, Trophy, Zap, ArrowRight, Loader2, AlertTriangle, Settings2
} from 'lucide-react';

export default function PracticePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [recommendations, setRecommendations] = useState(null);

  const [customLevel, setCustomLevel] = useState('level1');
  const [customTopic, setCustomTopic] = useState('variables');

  useEffect(() => {
    loadCurriculum();
    if (user) loadRecommendations();
  }, [user]);

  useEffect(() => {
    const levelParam = searchParams.get('level');
    if (levelParam) setExpandedLevel(levelParam);
  }, [searchParams]);

  const loadCurriculum = async () => {
    try {
      const data = await api.get('/problems/curriculum');
      setCurriculum(data.levels);
      // Auto-expand first incomplete level
      if (!expandedLevel && data.levels) {
        const firstIncomplete = data.levels.find(l => l.unlocked && l.completionPct < 100);
        if (firstIncomplete) setExpandedLevel(firstIncomplete.levelId);
        else setExpandedLevel('level1');
      }
    } catch (e) {
      console.error('Failed to load curriculum:', e);
      // Use static data as fallback
      setCurriculum(CURRICULUM_LEVELS.map((l, i) => ({
        ...l,
        unlocked: i === 0,
        completionPct: 0,
        topics: l.topics.map(t => ({ ...t, progress: { attempted: 0, solved: 0, accuracy: 0, mastery: 0 } })),
      })));
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const data = await api.get('/stats/recommendations');
      setRecommendations(data);
    } catch (e) { /* ignore */ }
  };

  const handleGenerate = async (levelId, topicId) => {
    setGenerating(true);
    try {
      const data = await api.post('/problems/generate', {
        levelId, topicId, difficulty: selectedDifficulty, language: 'python',
      });
      if (data?.id) {
        navigate(`/problem/${data.id}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (e) {
      console.error('Generation failed:', e);
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Failed to generate problem</span>
          <span className="text-xs opacity-80">{e.message || 'Please try again.'}</span>
        </div>,
        { duration: 4000 }
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleQuickStart = async () => {
    if (recommendations?.recommendations?.length > 0) {
      const rec = recommendations.recommendations[0];
      await handleGenerate(rec.levelId, rec.topicId);
    } else {
      await handleGenerate('level1', 'variables');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] mb-2">
          Learning Path
        </h1>
        <p className="text-[15px] text-[var(--color-text-muted)]">
          Master Python from scratch — 10 structured levels, 45+ topics, unlimited practice.
        </p>
      </div>

      {/* Top Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Difficulty pills */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedDifficulty(d.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer border-0
                ${selectedDifficulty === d.id 
                  ? 'text-white' 
                  : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              style={selectedDifficulty === d.id ? { background: d.color } : {}}
            >
              {d.name}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Quick start */}
        <button
          onClick={handleQuickStart}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg btn-primary text-sm font-semibold cursor-pointer disabled:opacity-50"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Quick Start
        </button>
      </div>

      {/* Custom Practice Generator */}
      <div className="mb-8 p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-5 flex items-center gap-2">
          <Settings2 size={20} className="text-[var(--color-primary)]" />
          Custom Challenge Generator
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
           <div>
             <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Level</label>
             <div className="relative">
               <select 
                 className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-light)] appearance-none cursor-pointer"
                 value={customLevel}
                 onChange={(e) => {
                   setCustomLevel(e.target.value);
                   const levelObj = CURRICULUM_LEVELS.find(l => l.levelId === e.target.value);
                   if (levelObj && levelObj.topics.length > 0) {
                     setCustomTopic(levelObj.topics[0].topicId);
                   }
                 }}
               >
                 {CURRICULUM_LEVELS.map(l => (
                   <option key={l.levelId} value={l.levelId}>{l.name}</option>
                 ))}
               </select>
               <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
             </div>
           </div>
           <div>
             <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Topic</label>
             <div className="relative">
               <select 
                 className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-light)] appearance-none cursor-pointer"
                 value={customTopic}
                 onChange={(e) => setCustomTopic(e.target.value)}
               >
                 {CURRICULUM_LEVELS.find(l => l.levelId === customLevel)?.topics.map(t => (
                   <option key={t.topicId} value={t.topicId}>{t.name}</option>
                 ))}
               </select>
               <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
             </div>
           </div>
           <div>
             <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Difficulty</label>
             <div className="relative">
               <select 
                 className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-light)] appearance-none cursor-pointer"
                 value={selectedDifficulty}
                 onChange={(e) => setSelectedDifficulty(e.target.value)}
               >
                 {DIFFICULTIES.map(d => (
                   <option key={d.id} value={d.id}>{d.name}</option>
                 ))}
               </select>
               <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
             </div>
           </div>
        </div>
        <button
          onClick={() => handleGenerate(customLevel, customTopic)}
          disabled={generating}
          className="w-full sm:w-auto px-8 py-2.5 rounded-lg btn-primary text-sm font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
          Generate Challenge
        </button>
      </div>

      {/* Recommendations */}
      {recommendations?.recommendations?.length > 0 && (
        <div className="mb-8 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-[var(--color-primary-light)]" />
            <span className="text-sm font-bold text-[var(--color-text)]">Recommended for You</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendations.recommendations.slice(0, 3).map((rec, i) => {
              const level = CURRICULUM_LEVELS.find(l => l.levelId === rec.levelId);
              const topic = level?.topics.find(t => t.topicId === rec.topicId);
              if (!topic) return null;
              return (
                <button
                  key={i}
                  onClick={() => handleGenerate(rec.levelId, rec.topicId)}
                  disabled={generating}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary-light)] transition-colors text-left cursor-pointer disabled:opacity-50"
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: level?.color }} />
                  <span className="text-xs font-semibold text-[var(--color-text)]">{topic.name}</span>
                  <ArrowRight size={12} className="text-[var(--color-text-muted)]" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Curriculum Levels */}
      <div className="space-y-3">
        {(curriculum || []).map((level) => {
          const isExpanded = expandedLevel === level.levelId;
          const LevelIcon = CURRICULUM_LEVELS.find(l => l.levelId === level.levelId)?.icon || Trophy;
          const isLocked = !level.unlocked;
          const completionPct = Math.round(level.completionPct || 0);

          return (
            <div
              key={level.levelId}
              className={`rounded-xl border transition-colors overflow-hidden ${
                isLocked 
                  ? 'border-[var(--color-border)] opacity-60' 
                  : isExpanded 
                    ? 'border-[var(--color-border)] bg-[var(--color-surface)]' 
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-muted)]/30'
              }`}
            >
              {/* Level Header */}
              <button
                onClick={() => setExpandedLevel(isExpanded ? null : level.levelId)}
                className="w-full flex items-center gap-4 p-5 cursor-pointer bg-transparent border-0 text-left"
                disabled={isLocked}
              >
                {/* Level badge */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform"
                  style={{
                    background: isLocked ? 'var(--color-surface-2)' : `${level.color}15`,
                    color: isLocked ? 'var(--color-text-muted)' : level.color,
                    border: `1px solid ${isLocked ? 'var(--color-border)' : level.color}30`,
                  }}
                >
                  {isLocked ? <Lock size={18} /> : <LevelIcon size={20} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isLocked ? 'var(--color-text-muted)' : level.color }}>
                      Level {level.levelNumber}
                    </span>
                    {completionPct >= 100 && <CheckCircle2 size={14} className="text-[var(--color-success)]" />}
                  </div>
                  <h3 className="text-[15px] font-bold text-[var(--color-text)] tracking-tight">{level.name}</h3>
                  <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5 truncate">{level.description}</p>
                </div>

                {/* Progress bar + chevron */}
                <div className="flex items-center gap-4 shrink-0">
                  {!isLocked && (
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="w-24 h-2 rounded-full bg-[var(--color-bg)] overflow-hidden border border-[var(--color-border)]/50">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${completionPct}%`, background: level.color }}
                        />
                      </div>
                      <span className="text-[12px] font-bold w-8 text-right" style={{ color: level.color }}>
                        {completionPct}%
                      </span>
                    </div>
                  )}
                  {!isLocked && (
                    isExpanded ? <ChevronDown size={18} className="text-[var(--color-text-muted)]" /> : <ChevronRight size={18} className="text-[var(--color-text-muted)]" />
                  )}
                </div>
              </button>

              {/* Expanded topics */}
              {isExpanded && !isLocked && (
                <div className="px-5 pb-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {level.topics.map((topic) => {
                      const TopicIcon = CURRICULUM_LEVELS.find(l => l.levelId === level.levelId)
                        ?.topics.find(t => t.topicId === topic.topicId)?.icon || Play;
                      const solved = topic.progress?.solved || 0;
                      const accuracy = Math.round(topic.progress?.accuracy || 0);

                      return (
                        <div
                          key={topic.topicId}
                          className="group p-4 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-text-muted)]/40 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <TopicIcon size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-light)] transition-colors" />
                              <span className="text-[13px] font-semibold text-[var(--color-text)]">{topic.name}</span>
                            </div>
                            {solved > 0 && (
                              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{
                                color: accuracy >= 80 ? '#10B981' : accuracy >= 50 ? '#F59E0B' : '#EF4444',
                                background: accuracy >= 80 ? '#10B98115' : accuracy >= 50 ? '#F59E0B15' : '#EF444415',
                              }}>
                                {accuracy}%
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              {solved > 0 ? `${solved} solved` : 'Not started'}
                            </span>
                            <button
                              onClick={() => handleGenerate(level.levelId, topic.topicId)}
                              disabled={generating}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary-light)] transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Play size={10} fill="currentColor" />
                              Practice
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
            <p className="text-[15px] font-semibold text-[var(--color-text)]">Generating Problem...</p>
            <p className="text-[12px] text-[var(--color-text-muted)]">Building a fresh challenge for you</p>
          </div>
        </div>
      )}
    </div>
  );
}
