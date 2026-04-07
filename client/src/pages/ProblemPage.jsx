import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LANGUAGES, STATUS_LABELS } from '../utils/constants';
import toast from 'react-hot-toast';
import { 
  Play, Send, Search, Lightbulb, Loader2, RefreshCcw, 
  CheckCircle2, XCircle, AlertTriangle, Terminal, 
  Settings2, Activity, Cpu, Bot
} from 'lucide-react';

export default function ProblemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [output, setOutput] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  
  const [activeTab, setActiveTab] = useState('description');
  const [activeBottomTab, setActiveBottomTab] = useState('testcase');
  const [customInput, setCustomInput] = useState('');
  
  const [review, setReview] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  
  const [doubt, setDoubt] = useState('');
  const [doubtResponse, setDoubtResponse] = useState(null);
  const [askingDoubt, setAskingDoubt] = useState(false);
  
  const [leftWidth, setLeftWidth] = useState(45);
  const [startTime] = useState(Date.now());
  const [generatingSimilar, setGeneratingSimilar] = useState(false);
  const resizerRef = useRef(null);

  useEffect(() => {
    loadProblem();
  }, [id]);

  const loadProblem = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/problems/${id}`);
      setProblem(data.problem);
      const starterCode = data.problem?.starterCode || {};
      setCode(starterCode[language] || '// Start coding here\n');
      setSubmitResult(null);
      setOutput(null);
      setReview(null);
    } catch (err) {
      setError(err.message || 'Failed to load problem data.');
      toast.error('Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (problem?.starterCode) {
      setCode(problem.starterCode[language] || '// Start coding here\n');
    }
  }, [language]);

  // Resizer logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      const container = resizerRef.current?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.max(25, Math.min(75, pct)));
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    const resizer = resizerRef.current;
    const handleMouseDown = () => {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };
    if (resizer) {
      resizer.addEventListener('mousedown', handleMouseDown);
      return () => resizer.removeEventListener('mousedown', handleMouseDown);
    }
  }, []);

  const runCode = async () => {
    setRunning(true);
    setActiveBottomTab('output');
    try {
      const data = await api.post('/submissions/run', {
        problemId: id,
        code,
        language,
        stdin: customInput,
      });
      setOutput(data.result);
    } catch (error) {
      setOutput({ success: false, stderr: error.message, stdout: '' });
    } finally {
      setRunning(false);
    }
  };

  const submitCode = async () => {
    if (!user) return toast.error('Please login to submit');
    setSubmitting(true);
    setActiveBottomTab('result');
    try {
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const data = await api.post('/submissions/submit', {
        problemId: id,
        code,
        language,
        timeTaken,
      });
      setSubmitResult(data);
      
      if (data.submission.status === 'accepted') {
        toast.success('All tests passed!');
        if (data.gamification) {
          toast.success(`+${data.gamification.xpEarned} XP earned!`);
        }
      } else {
        toast.error(`${STATUS_LABELS[data.submission.status]?.label || 'Execution Failed'}`);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const requestReview = async () => {
    if (!user) return toast.error('Please login for AI review');
    setReviewing(true);
    setActiveBottomTab('review');
    try {
      const data = await api.post('/ai/review', { code, language, problemId: id });
      setReview(data.review);
    } catch (error) {
      toast.error('AI review failed');
    } finally {
      setReviewing(false);
    }
  };

  const askDoubt = async () => {
    if (!user) return toast.error('Please login to ask doubts');
    if (!doubt.trim()) return;
    setAskingDoubt(true);
    setActiveBottomTab('doubt');
    try {
      const data = await api.post('/ai/doubt', {
        question: doubt,
        code,
        language,
        problemId: id,
      });
      setDoubtResponse(data.response);
    } catch (error) {
      toast.error('Failed to get response');
    } finally {
      setAskingDoubt(false);
    }
  };

  const [similarCount, setSimilarCount] = useState(0);

  const generateSimilar = async () => {
    setGeneratingSimilar(true);
    try {
      const data = await api.post(`/problems/${id}/similar`, { difficulty: problem.difficulty });
      setSimilarCount(prev => prev + 1);
      const messages = [
        '🎯 Brand-new challenge generated!',
        '✨ Fresh problem ready — completely unique!',
        '🚀 New variation created with different logic!',
        '🔥 Unique challenge unlocked!',
        '💡 A totally new problem awaits!',
      ];
      toast.success(messages[Math.floor(Math.random() * messages.length)]);
      navigate(`/problem/${data.problem.id}`);
    } catch (error) {
      toast.error('Generation failed — retrying will create a different variation!');
    } finally {
      setGeneratingSimilar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-[var(--color-bg)]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin mb-4" />
        <p className="text-[var(--color-text-muted)] text-sm font-medium">Preparing workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-[var(--color-bg)] text-center p-4">
        <AlertTriangle className="w-12 h-12 text-[var(--color-danger)] mb-4" />
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Failed to load challenge</h2>
        <p className="text-[var(--color-text-muted)] text-sm font-medium max-w-md mb-6">{error}</p>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/practice')} className="px-5 py-2.5 rounded-lg btn-ghost text-sm font-semibold cursor-pointer">
            Back to Practice
          </button>
          <button onClick={loadProblem} className="flex items-center gap-2 px-5 py-2.5 rounded-lg btn-primary text-sm font-semibold cursor-pointer">
            <RefreshCcw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!problem) return null;

  const examples = Array.isArray(problem.examples) ? problem.examples : [];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[var(--color-bg)]">
      {/* Left Panel — Problem Description */}
      <div
        className="overflow-y-auto bg-[var(--color-surface)] border-r border-[var(--color-border)]"
        style={{ width: `${leftWidth}%`, minWidth: 300 }}
      >
        {/* Tabs */}
        <div className="sticky top-0 z-10 flex border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          {['description', 'submissions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition-all focus:outline-none 
                ${activeTab === tab ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] border-b-2 border-transparent'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'description' && (
            <div className="animate-fade-in">
              {/* Title + badges */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">{problem.title || 'Practice Challenge'}</h1>
                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold badge-${problem.difficulty || 'easy'} border`}>
                  {(problem.difficulty || 'easy').charAt(0).toUpperCase() + (problem.difficulty || 'easy').slice(1)}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-8">
                <span className="px-2.5 py-1 rounded-md bg-[var(--color-surface-2)] text-xs font-medium text-[var(--color-text-muted)] capitalize border border-[var(--color-border)]">
                  {problem.topic || 'General Topic'}
                </span>
              </div>

              {/* Description */}
              <div className="prose prose-invert prose-sm max-w-none mb-8">
                <div className="text-[var(--color-text)] leading-relaxed whitespace-pre-wrap text-[15px]">
                  {problem.description || 'No description provided.'}
                </div>
              </div>

              {/* Examples */}
              <div className="space-y-5 mb-8">
                {examples.map((ex, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Example {i + 1}:</h3>
                    <div className="p-4 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                      <div className="mb-2">
                        <span className="text-[13px] font-semibold text-[var(--color-text-muted)] select-none">Input: </span>
                        <code className="text-[13px] text-[var(--color-text)] font-mono">{ex.input}</code>
                      </div>
                      <div className="mb-2">
                        <span className="text-[13px] font-semibold text-[var(--color-text-muted)] select-none">Output: </span>
                        <code className="text-[13px] text-[var(--color-text)] font-mono">{ex.output}</code>
                      </div>
                      {ex.explanation && (
                        <div className="pt-2 mt-2 border-t border-[var(--color-border)]">
                          <span className="text-[13px] font-semibold text-[var(--color-text-muted)] mr-1 select-none">Explanation:</span>
                          <span className="text-[13px] text-[var(--color-text)]">{ex.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Constraints */}
              {problem.constraints && (
                <div className="mb-10">
                  <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Constraints:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {String(problem.constraints).split('\n').map((c, i) => c.trim() ? (
                      <li key={i} className="text-[13px] text-[var(--color-text-muted)]">
                        <code className="font-mono bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">{c}</code>
                      </li>
                    ) : null)}
                  </ul>
                </div>
              )}

              {/* Similar problem button */}
              <button
                onClick={generateSimilar}
                disabled={generatingSimilar}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer focus:outline-none"
                style={{
                  background: generatingSimilar
                    ? 'var(--color-surface-2)'
                    : 'linear-gradient(135deg, var(--color-primary), var(--color-accent, var(--color-primary-light)))',
                  color: generatingSimilar ? 'var(--color-text-muted)' : '#fff',
                  border: '1px solid var(--color-border)',
                  opacity: generatingSimilar ? 0.7 : 1,
                }}
              >
                {generatingSimilar ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                {generatingSimilar ? 'Crafting unique challenge...' : '∞ Generate Unique Variation'}
                {similarCount > 0 && !generatingSimilar && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    #{similarCount + 1}
                  </span>
                )}
              </button>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="animate-fade-in text-sm">
              {submitResult ? (
                <div>
                  <h3 className="font-semibold mb-4 text-[var(--color-text)]">Latest Submission Result</h3>
                  <div className={`p-4 rounded-xl border ${submitResult.submission.status === 'accepted' ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/5' : 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5'}`}>
                    <div className="flex items-center gap-2.5 mb-2">
                       {submitResult.submission.status === 'accepted' ? <CheckCircle2 size={18} className="text-[var(--color-success)]" /> : <AlertTriangle size={18} className="text-[var(--color-danger)]" />}
                      <span className="font-semibold" style={{ color: STATUS_LABELS[submitResult.submission.status]?.color }}>
                        {STATUS_LABELS[submitResult.submission.status]?.label}
                      </span>
                    </div>
                    <div className="text-[13px] font-medium text-[var(--color-text-muted)]">
                      Passed: <span className={submitResult.submission.testsPassed === submitResult.submission.totalTests ? "text-[var(--color-success)]" : "text-[var(--color-text)]"}>{submitResult.submission.testsPassed}</span> / {submitResult.submission.totalTests} tests
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
                  <Activity size={32} className="mb-3 opacity-20" />
                  <p>No submissions yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resizer */}
      <div
        ref={resizerRef}
        className="resizer flex-shrink-0"
      />

      {/* Right Panel — Code Editor + Output */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ minWidth: 300 }}>
        {/* Editor header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] gap-3 sm:gap-0">
          <div className="flex items-center bg-[var(--color-surface-2)] rounded-lg p-1 border border-[var(--color-border)]">
            {LANGUAGES.map(lang => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors focus:outline-none
                  ${language === lang.id
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-text)] shadow-sm border border-[var(--color-border)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
              >
                {lang.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={requestReview}
              disabled={reviewing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-3)] transition-all cursor-pointer focus:outline-none"
            >
              {reviewing ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} className="text-[var(--color-accent)]" />}
              AI Review
            </button>
            <button
              onClick={runCode}
              disabled={running}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-3)] transition-all cursor-pointer focus:outline-none"
            >
              {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="text-[var(--color-success)] fill-[var(--color-success)]" />}
              Run
            </button>
            <button
              onClick={submitCode}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg text-[13px] font-medium btn-primary disabled:opacity-70 focus:outline-none"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Submit
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 min-h-0 bg-[var(--color-bg)]">
          <Editor
            height="100%"
            language={LANGUAGES.find(l => l.id === language)?.monacoId || 'python'}
            value={code}
            onChange={(val) => setCode(val || '')}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              fontSize: 14,
              fontFamily: 'var(--font-mono)',
              minimap: { enabled: false },
              padding: { top: 20, bottom: 20 },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              bracketPairColorization: { enabled: true },
              automaticLayout: true,
              tabSize: 4,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
            }}
          />
        </div>

        {/* Bottom Panel */}
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col" style={{ height: '35%', minHeight: 200 }}>
          {/* Bottom tabs */}
          <div className="flex overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 no-scrollbar">
            {[
              { id: 'testcase', label: 'Test Case', icon: Terminal },
              { id: 'output', label: 'Output', icon: Activity },
              { id: 'result', label: 'Result', icon: CheckCircle2 },
              { id: 'review', label: 'AI Review', icon: Search },
              { id: 'doubt', label: 'Ask AI', icon: Lightbulb },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveBottomTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-all focus:outline-none whitespace-nowrap
                    ${activeBottomTab === tab.id 
                      ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-text)]' 
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] border-b-2 border-transparent'}`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 overflow-y-auto flex-1 bg-[var(--color-bg)]">
            {/* Test case input */}
            {activeBottomTab === 'testcase' && (
              <div className="animate-fade-in h-full flex flex-col">
                <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase tracking-wider block">Custom Stdin</label>
                <textarea
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  placeholder="Enter inputs, separated by newlines..."
                  className="flex-1 w-full p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] font-mono text-[var(--color-text)] resize-none focus:outline-none focus:border-[var(--color-primary-light)] transition-colors"
                />
              </div>
            )}

            {/* Output */}
            {activeBottomTab === 'output' && (
              <div className="animate-fade-in">
                {running ? (
                  <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)] p-2">
                    <Loader2 size={16} className="text-[var(--color-primary)] animate-spin" />
                    Executing remotely...
                  </div>
                ) : output ? (
                  <div className="space-y-4">
                    {output.success ? (
                      <div className="p-4 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20">
                         <h4 className="text-xs font-semibold text-[#10B981] mb-2 uppercase tracking-wider">Standard Output</h4>
                         <pre className="text-[13px] font-mono text-[var(--color-text)] whitespace-pre-wrap">{output.stdout}</pre>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20">
                         <h4 className="flex items-center gap-2 text-xs font-semibold text-[var(--color-danger)] mb-2 uppercase tracking-wider">
                           <AlertTriangle size={14} />
                           Execution Failed
                         </h4>
                         <pre className="text-[13px] font-mono text-[var(--color-danger)] whitespace-pre-wrap">{output.stderr || output.compileOutput || 'Unknown Error'}</pre>
                      </div>
                    )}
                    
                    {output.time > 0 && (
                      <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2 px-1">
                        <Cpu size={14} /> Runtime: {output.time}s | Memory: {output.memory}KB
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 text-[var(--color-text-muted)] text-[13px]">
                    Run your code to see the output here.
                  </div>
                )}
              </div>
            )}

            {/* Submit Result */}
            {activeBottomTab === 'result' && (
              <div className="animate-fade-in">
                {submitting ? (
                  <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)] p-2">
                    <Loader2 size={16} className="text-[var(--color-primary)] animate-spin" />
                    Evaluating test cases...
                  </div>
                ) : submitResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {submitResult.submission.status === 'accepted' ? (
                          <div className="bg-[var(--color-success)]/10 text-[var(--color-success)] p-2 rounded-lg">
                             <CheckCircle2 size={24} />
                          </div>
                        ) : (
                          <div className="bg-[var(--color-danger)]/10 text-[var(--color-danger)] p-2 rounded-lg">
                             <XCircle size={24} />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-bold" style={{ color: STATUS_LABELS[submitResult.submission.status]?.color }}>
                            {STATUS_LABELS[submitResult.submission.status]?.label}
                          </h3>
                          <p className="text-[13px] text-[var(--color-text-muted)] font-medium flex items-center flex-wrap gap-2 mt-1">
                            <span>{submitResult.submission.testsPassed} / {submitResult.submission.totalTests} test cases passed</span>
                            {submitResult.submission.executionTime && (
                               <span className="font-mono text-[11px] bg-[var(--color-surface-2)] px-2 py-0.5 rounded border border-[var(--color-border)] ml-2">
                                 ⏱ {submitResult.submission.executionTime}
                               </span>
                            )}
                            {submitResult.submission.memory && (
                               <span className="font-mono text-[11px] bg-[var(--color-surface-2)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                                 💾 {submitResult.submission.memory}
                               </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {submitResult.gamification && (
                        <div className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-xs font-semibold text-[var(--color-primary-light)]">
                           +{submitResult.gamification.xpEarned} XP
                        </div>
                      )}
                    </div>

                    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
                      {submitResult.submission.failedCase && (
                        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-danger)]/5">
                          <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                               <XCircle size={16} className="text-[var(--color-danger)]" />
                               <span className="text-[13px] font-bold text-[var(--color-danger)]">
                                 Failed Test Case
                               </span>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">Input</span>
                              <div className="p-2.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)] text-[12px] font-mono text-[var(--color-text)] whitespace-pre-wrap">
                                {submitResult.submission.failedCase.input || '(empty)'}
                              </div>
                            </div>
                            
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block">Expected</span>
                              <div className="p-2.5 rounded bg-[var(--color-bg)] border border-[var(--color-border)] text-[12px] font-mono text-[var(--color-text)] whitespace-pre-wrap">
                                {submitResult.submission.failedCase.expected_output || '(empty)'}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 space-y-1.5">
                            <span className="text-[11px] font-semibold text-[var(--color-danger)] uppercase tracking-wider block">Actual Result</span>
                            <div className="p-2.5 rounded bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[12px] font-mono text-[var(--color-danger)] whitespace-pre-wrap overflow-x-auto">
                              {submitResult.submission.failedCase.error || submitResult.submission.failedCase.actual_output || '(no output)'}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {submitResult.submission.status === 'Accepted' && (
                        <div className="p-8 text-center text-[var(--color-success)] text-[14px] font-medium bg-[var(--color-success)]/5">
                          All test cases passed successfully!
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 text-[var(--color-text-muted)] text-[13px]">
                    Submit your code to execute validation tests.
                  </div>
                )}
              </div>
            )}

            {/* AI Review */}
            {activeBottomTab === 'review' && (
              <div className="animate-fade-in">
                {reviewing ? (
                  <div className="flex items-center gap-3 text-[13px] text-[var(--color-text-muted)] p-2">
                    <Loader2 size={16} className="text-[var(--color-primary)] animate-spin" />
                    AI is analyzing your code pattern...
                  </div>
                ) : review ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[12px] font-medium text-[var(--color-primary-light)]">
                        <CheckCircle2 size={14} /> Quality: {review.qualityScore}/10
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-[12px] font-medium text-[var(--color-success)]">
                        <Clock size={14} /> Time: {review.timeComplexity}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[12px] font-medium text-[#F59E0B]">
                        <Database size={14} /> Space: {review.spaceComplexity}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                      <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{review.overallFeedback}</p>
                    </div>

                    {review.suggestions?.length > 0 && (
                      <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                        <h4 className="flex items-center gap-2 font-semibold text-[13px] text-[var(--color-text)] mb-3">
                          <Lightbulb size={16} className="text-[#F59E0B]" />
                          Actionable Suggestions
                        </h4>
                        <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-[var(--color-text-muted)]">
                          {review.suggestions.map((s, i) => <li key={i} className="pl-1 leading-relaxed">{s}</li>)}
                        </ul>
                      </div>
                    )}
                    
                    {review.betterApproach && (
                      <div className="p-4 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl">
                        <h4 className="flex items-center gap-2 font-semibold text-[13px] text-[var(--color-primary-light)] mb-2">
                          <Settings2 size={16} /> Optimal Approach
                        </h4>
                        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{review.betterApproach}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--color-text-muted)]">
                    <Search size={32} className="mb-4 opacity-50" />
                    <p className="text-[13px] mb-4">Request an AI review for complexity analysis.</p>
                    <button onClick={requestReview} className="btn-ghost px-5 py-2 rounded-lg text-[13px] font-medium">
                      Analyze Code
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Doubt Solver */}
            {activeBottomTab === 'doubt' && (
              <div className="animate-fade-in flex flex-col h-full">
                <div className="flex gap-2 mb-4 shrink-0">
                  <div className="relative flex-1">
                     <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                     <input
                      type="text"
                      value={doubt}
                      onChange={e => setDoubt(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && askDoubt()}
                      placeholder="e.g. 'Why does my linked list reversal result in a cycle?'"
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors shadow-sm"
                     />
                  </div>
                  <button
                    onClick={askDoubt}
                    disabled={askingDoubt || !doubt.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg btn-primary text-[13px] font-medium disabled:opacity-70"
                  >
                    {askingDoubt ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Ask
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {askingDoubt ? (
                    <div className="flex items-center gap-3 text-[13px] text-[var(--color-text-muted)] p-2">
                      <Loader2 size={16} className="text-[var(--color-primary)] animate-spin" />
                      Constructing response...
                    </div>
                  ) : doubtResponse ? (
                    <div className="space-y-4 pb-4">
                      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
                        <p className="text-[14px] text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">{doubtResponse.answer}</p>
                      </div>
                      {doubtResponse.hints?.length > 0 && (
                        <div className="p-4 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/20">
                          <h4 className="flex items-center gap-2 font-semibold text-[13px] text-[#F59E0B] mb-3">
                            <Lightbulb size={16} /> Helpful Hints
                          </h4>
                          <ul className="list-none space-y-2">
                            {doubtResponse.hints.map((h, i) => (
                              <li key={i} className="flex gap-2 text-[13px] text-[var(--color-text-muted)] leading-relaxed">
                                <ChevronRight size={16} className="text-[#F59E0B] shrink-0 mt-0.5" />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-[var(--color-text-muted)]">
                      <Bot size={32} className="mb-4 opacity-50" />
                      <p className="text-[13px] max-w-sm">Having trouble understanding a concept or debugging an error? The AI tutor has the full context of your current code.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
