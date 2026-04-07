import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Editor from '@monaco-editor/react';
import { api } from '../services/api';
import { LANGUAGES, STATUS_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';
import { 
  Terminal, Target, Clock, ArrowRight, Play, CheckCircle2, XCircle, SkipForward, RefreshCcw, LayoutDashboard, Loader2
} from 'lucide-react';

export default function InterviewPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [phase, setPhase] = useState('setup'); // setup, coding, review
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(2);
  const [problems, setProblems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [language, setLanguage] = useState('python');
  
  const [codes, setCodes] = useState({});
  const [results, setResults] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime] = useState(45 * 60); // 45 minutes
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) navigate('/login');
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [user]);

  const startInterview = async () => {
    setLoading(true);
    try {
      const diffs = difficulty === 'easy' ? ['easy', 'easy', 'medium'] :
                    difficulty === 'medium' ? ['easy', 'medium', 'hard'] :
                    ['medium', 'hard', 'hard'];
      
      const topics = ['arrays', 'strings', 'recursion', 'sorting', 'loops', 'dp', 'hashing'];
      const selected = [];
      
      for (let i = 0; i < questionCount; i++) {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        const data = await api.post('/problems/generate', {
          topic,
          difficulty: diffs[i] || difficulty,
          language,
        });
        selected.push(data.problem);
      }

      setProblems(selected);
      const initialCodes = {};
      selected.forEach((p, i) => {
        initialCodes[i] = p.starterCode?.[language] || '// Your code here\n';
      });
      setCodes(initialCodes);
      setTimeLeft(totalTime);
      setPhase('coding');

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            toast.error("Time's up! Interview concluded.");
            setPhase('review');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      toast.error('Failed to provision interview environment');
    } finally {
      setLoading(false);
    }
  };

  const submitCurrent = async () => {
    setSubmitting(true);
    try {
      const problem = problems[currentIndex];
      const data = await api.post('/submissions/submit', {
        problemId: problem.id,
        code: codes[currentIndex],
        language,
        timeTaken: totalTime - timeLeft,
      });
      setResults(prev => ({ ...prev, [currentIndex]: data }));
      
      if (data.submission.status === 'accepted') {
        toast.success(`Question ${currentIndex + 1} passed perfectly.`);
      } else {
        toast.error(`Question ${currentIndex + 1} execution failed.`);
      }

      // Move to next or review
      if (currentIndex < problems.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const finishInterview = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('review');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const score = Object.values(results).filter(r => r?.submission?.status === 'accepted').length;

  // Setup phase
  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3 tracking-tight text-[var(--color-text)]">
            Mock Interview Sandbox
          </h1>
          <p className="text-[15px] text-[var(--color-text-muted)] max-w-lg mx-auto">
            A timed environment strictly evaluating real-time execution against multi-phase prompts. No external AI assistance is injected.
          </p>
        </div>

        <div className="p-8 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm space-y-8">
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider mb-3 text-[var(--color-text-muted)]">Target Complexity Curve</label>
            <div className="flex gap-3">
              {['easy', 'medium', 'hard'].map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`px-6 py-3.5 rounded-lg text-sm font-medium capitalize transition-all cursor-pointer border flex-1 focus:outline-none
                    ${difficulty === d ? 'bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-text)] shadow-sm' : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider mb-3 text-[var(--color-text-muted)]">Module Limit</label>
            <div className="flex gap-3">
              {[2, 3].map(n => (
                <button key={n} onClick={() => setQuestionCount(n)}
                  className={`px-6 py-3.5 rounded-lg text-sm font-medium transition-all cursor-pointer border flex-1 focus:outline-none
                    ${questionCount === n ? 'bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-text)] shadow-sm' : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'}`}>
                  {n} Logical Prompts
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wider mb-3 text-[var(--color-text-muted)]">Native Kernel Runtime</label>
            <div className="flex gap-3 flex-wrap">
              {LANGUAGES.map(l => (
                <button key={l.id} onClick={() => setLanguage(l.id)}
                  className={`px-6 py-3.5 rounded-lg text-sm font-medium transition-all cursor-pointer border focus:outline-none
                    ${language === l.id ? 'bg-[var(--color-surface-3)] border-[var(--color-border)] text-[var(--color-text)] shadow-sm' : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'}`}>
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          <button onClick={startInterview} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-lg btn-primary text-[14px] font-bold cursor-pointer disabled:opacity-70 transition-all shadow-sm">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Provisioning Environment...
              </span>
            ) : (
              <>
                <Target size={18} strokeWidth={2} /> Initialize Session Timeout
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Coding phase
  if (phase === 'coding') {
    const currentProblem = problems[currentIndex];
    const examples = Array.isArray(currentProblem?.examples) ? currentProblem.examples : [];

    return (
      <div className="h-[calc(100vh-64px)] flex flex-col bg-[var(--color-bg)]">
        {/* Timer bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <div className="flex items-center gap-6">
            <span className="font-bold text-[14px] text-[var(--color-text)] flex items-center gap-2">
              <Terminal size={16} className="text-[var(--color-text-muted)]" /> Active Instance
            </span>
            <div className="flex bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md overflow-hidden">
              {problems.map((_, i) => (
                <button key={i} onClick={() => setCurrentIndex(i)}
                  className={`px-4 py-1.5 text-[13px] font-semibold cursor-pointer transition-colors focus:outline-none border-r border-[var(--color-border)] last:border-r-0
                    ${currentIndex === i ? 'bg-[var(--color-surface-3)] text-[var(--color-text)]' :
                      results[i]?.submission?.status === 'accepted' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' :
                      results[i] ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' :
                      'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'}`}>
                  Prompt 0{i + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className={`font-mono font-bold text-[16px] flex items-center gap-2 ${timeLeft < 300 ? 'text-[var(--color-danger)] animate-pulse' : 'text-[var(--color-text)]'}`}>
              <Clock size={16} /> {formatTime(timeLeft)}
            </span>
            <button onClick={finishInterview}
              className="px-4 py-1.5 rounded-lg btn-ghost border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-[12px] font-semibold cursor-pointer hover:bg-[var(--color-danger)]/10 transition-colors focus:outline-none">
              Force Quit
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Problem panel */}
          <div className="w-2/5 overflow-y-auto p-6 border-r border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-2 mb-4">
               <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider badge-${currentProblem.difficulty}`}>{currentProblem.difficulty}</span>
               <span className="text-[12px] font-medium text-[var(--color-text-muted)] capitalize px-2 py-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]">{currentProblem.topic}</span>
            </div>
            <h2 className="text-[20px] font-bold mb-6 text-[var(--color-text)] tracking-tight">{currentProblem.title}</h2>
            
            <div className="prose prose-invert prose-sm max-w-none mb-8">
               <div className="text-[14px] text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">{currentProblem.description}</div>
            </div>

            {currentProblem.constraints && (
              <div className="mb-8">
                <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-2">Algorithm Limits:</h3>
                <div className="p-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  <pre className="text-[12px] text-[var(--color-text-muted)] whitespace-pre-wrap font-mono m-0">{currentProblem.constraints}</pre>
                </div>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-[13px] font-semibold text-[var(--color-text)] mb-3">Unit Test Examples:</h3>
              {examples.map((ex, i) => (
                <div key={i} className="p-4 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] mb-3">
                  <div className="mb-2"><span className="font-semibold text-[12px] text-[var(--color-text-muted)] w-16 inline-block uppercase tracking-wider">Input:</span><code className="text-[13px] text-[var(--color-text)] font-mono">{ex.input}</code></div>
                  <div><span className="font-semibold text-[12px] text-[var(--color-text-muted)] w-16 inline-block uppercase tracking-wider">Output:</span><code className="text-[13px] text-[var(--color-text)] font-mono">{ex.output}</code></div>
                </div>
              ))}
            </div>
          </div>

          {/* Editor panel */}
          <div className="flex-1 flex flex-col bg-[var(--color-bg)]">
            <div className="flex-1">
              <Editor
                height="100%"
                language={LANGUAGES.find(l => l.id === language)?.monacoId}
                value={codes[currentIndex] || ''}
                onChange={val => setCodes(prev => ({ ...prev, [currentIndex]: val || '' }))}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                options={{ fontSize: 14, fontFamily: 'var(--font-mono)', minimap: { enabled: false }, padding: { top: 20 }, automaticLayout: true }}
              />
            </div>
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex justify-end items-center gap-4">
              {results[currentIndex] && (
                <div className="flex-1 flex items-center">
                  <span className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-semibold ${results[currentIndex].submission.status === 'accepted' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'}`}>
                    {results[currentIndex].submission.status === 'accepted' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {STATUS_LABELS[results[currentIndex].submission.status]?.label} 
                    <span className="text-[var(--color-text-muted)] font-normal ml-2">[{results[currentIndex].submission.testsPassed} / {results[currentIndex].submission.totalTests} passes]</span>
                  </span>
                </div>
              )}
              
              <button onClick={submitCurrent} disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg btn-primary text-[1sm] font-bold cursor-pointer disabled:opacity-70 focus:outline-none">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />} 
                Execute Q{currentIndex + 1}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Review phase
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2 tracking-tight text-[var(--color-text)]">
          Execution Evaluated
        </h1>
        <div className="text-[80px] font-bold my-6 leading-none" style={{ color: score === problems.length ? '#10B981' : score > 0 ? '#F59E0B' : '#EF4444' }}>
          {score}<span className="text-[var(--color-border)] text-4xl">/{problems.length}</span>
        </div>
        <p className="text-[15px] font-medium text-[var(--color-text-muted)]">
          {score === problems.length ? 'Exceptional output precision. Module Cleared.' :
           score > 0 ? 'Partial alignment detected. Review metrics below.' :
           'Execution criteria failed. Restart runtime and attempt again.'}
        </p>
      </div>

      <div className="space-y-4 mb-10 border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
        {problems.map((p, i) => (
          <div key={i} className={`p-5 flex items-center justify-between border-b border-[var(--color-border)] last:border-0 ${results[i]?.submission?.status === 'accepted' ? 'bg-[var(--color-success)]/5' : results[i] ? 'bg-[var(--color-danger)]/5' : 'bg-transparent'}`}>
            <div className="flex items-center gap-4">
               <span className="text-[w-8] font-mono text-[var(--color-text-muted)]">0{i+1}</span>
               <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-[var(--color-text)]">{p.title}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider badge-${p.difficulty} px-1.5 py-0.5 rounded-sm`}>{p.difficulty}</span>
                  </div>
               </div>
            </div>
            
            <div className={`p-2 rounded-lg ${results[i]?.submission?.status === 'accepted' ? 'text-[var(--color-success)] bg-[var(--color-success)]/10' : results[i] ? 'text-[var(--color-danger)] bg-[var(--color-danger)]/10' : 'text-[var(--color-text-muted)] bg-[var(--color-surface-2)]'}`}>
               {results[i]?.submission?.status === 'accepted' ? <CheckCircle2 size={24} /> : results[i] ? <XCircle size={24} /> : <SkipForward size={24} />}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={() => { setPhase('setup'); setProblems([]); setResults({}); setCodes({}); setCurrentIndex(0); }}
          className="flex items-center justify-center gap-2 px-8 py-3 rounded-lg btn-primary font-bold text-[14px] cursor-pointer transition-all focus:outline-none">
          <RefreshCcw size={16} /> Boot New Sandbox
        </button>
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center gap-2 px-8 py-3 rounded-lg btn-ghost text-[var(--color-text)] font-bold text-[14px] cursor-pointer transition-all focus:outline-none">
          <LayoutDashboard size={16} /> Return to Operations
        </button>
      </div>
    </div>
  );
}
