import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CURRICULUM_LEVELS } from '../utils/constants';
import { 
  Terminal, Code2, Cpu, BarChart3, Lock, Rocket, 
  BrainCircuit, Layers, Target, Trophy, Play,
  GraduationCap, BookOpen, Sparkles
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 px-4 border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)] mb-8 animate-fade-in shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-light)] animate-pulse"></span>
            Structured Learning Platform
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-[var(--color-text)] leading-[1.1] animate-slide-up">
            Master Python Programming <br />
            <span className="text-[var(--color-primary-light)]">From Zero to Hero</span>
          </h1>

          <p className="text-[15px] md:text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            A structured 10-level curriculum with 100+ curated problems and AI-powered generation.
            Learn fundamentals, master data structures, and conquer algorithms — step by step.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link
              to={user ? '/practice' : '/register'}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg btn-primary text-[14px] font-semibold tracking-wide no-underline transition-all"
            >
              <GraduationCap size={16} /> 
              Start Learning
            </Link>
            <Link
              to="/practice"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg btn-ghost text-[14px] font-semibold tracking-wide no-underline transition-all"
            >
              <BookOpen size={16} />
              View Curriculum
            </Link>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 mt-20 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm animate-slide-up w-full max-w-3xl" style={{ animationDelay: '0.3s' }}>
            {[
              { label: 'Learning Levels', value: '10', icon: Layers },
              { label: 'Topics', value: '45+', icon: BookOpen },
              { label: 'Curated Problems', value: '100+', icon: Code2 },
              { label: 'AI Generation', value: '∞', icon: BrainCircuit },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                     <Icon size={20} strokeWidth={1.5} />
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-bold text-[var(--color-text)] tracking-tight">{stat.value}</div>
                    <div className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 tracking-tight text-[var(--color-text)]">
              Why CodeForge Stands Out
            </h2>
            <p className="text-[15px] text-[var(--color-text-muted)] max-w-xl mx-auto leading-relaxed">
              Unlike random problem sets, we guide you through a structured learning path — from variables to dynamic programming.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: GraduationCap, title: 'Structured Curriculum', desc: '10 levels from absolute beginner to advanced DSA. Each topic builds on the last.' },
              { icon: Code2, title: 'Professional IDE', desc: 'Integrated Monaco Editor with Python syntax highlighting and autocomplete.' },
              { icon: Sparkles, title: 'AI + Curated Problems', desc: '100+ hand-crafted problems plus unlimited AI-generated variations for every topic.' },
              { icon: Target, title: 'Adaptive Learning', desc: "Smart recommendations based on your performance. We know what you need to practice." },
              { icon: Cpu, title: 'Real Code Execution', desc: 'Your code runs in a secure sandbox with real test cases and instant feedback.' },
              { icon: Trophy, title: 'Progress Tracking', desc: 'XP, streaks, mastery bars, and level unlocks keep you motivated.' },
            ].map(feature => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="p-6 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] transition-colors hover:border-[var(--color-primary-light)]/50 group">
                  <div className="mb-5 p-2.5 rounded-lg bg-[var(--color-surface-2)] inline-block border border-[var(--color-border)] text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-light)] transition-colors">
                     <Icon size={22} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[16px] font-semibold mb-2 text-[var(--color-text)] tracking-tight">{feature.title}</h3>
                  <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curriculum Preview */}
      <section className="py-24 px-4 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 tracking-tight text-[var(--color-text)]">
              10-Level Learning Path
            </h2>
            <p className="text-[15px] text-[var(--color-text-muted)]">
              Start with the basics, master each level, and unlock the next challenge.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {CURRICULUM_LEVELS.map(level => {
              const Icon = level.icon;
              return (
                <Link
                  key={level.levelId}
                  to={`/practice?level=${level.levelId}`}
                  className="flex flex-col items-center p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-all no-underline text-center group"
                  style={{ '--level-color': level.color }}
                >
                  <div 
                    className="mb-3 p-2.5 rounded-lg transition-colors"
                    style={{ 
                      background: `${level.color}10`, 
                      color: level.color,
                      border: `1px solid ${level.color}25`
                    }}
                  >
                    <Icon size={22} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: level.color }}>
                    Level {level.levelNumber}
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--color-text)] tracking-tight">{level.name}</span>
                  <span className="text-[10px] text-[var(--color-text-muted)] mt-1">{level.topics.length} topics</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-[var(--color-surface)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 tracking-tight text-[var(--color-text)]">
              How It Works
            </h2>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-[var(--color-border)]">
            {[
              { step: '01', title: 'Pick Your Level', desc: 'Choose a topic from the structured curriculum that matches your skill.', icon: BookOpen },
              { step: '02', title: 'Solve the Problem', desc: 'Write your Python solution in our professional code editor.', icon: Code2 },
              { step: '03', title: 'Get Instant Feedback', desc: 'Your code runs against test cases with real execution results.', icon: Rocket },
              { step: '04', title: 'Level Up', desc: 'Track mastery, earn XP, unlock new levels, and keep progressing.', icon: BarChart3 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--color-bg)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <Icon size={16} strokeWidth={2} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="font-semibold text-[15px] text-[var(--color-text)]">{item.title}</h3>
                       <span className="text-[10px] font-bold text-[var(--color-primary-light)] tracking-widest">STEP {item.step}</span>
                    </div>
                    <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-[var(--color-bg)] border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Start Your Python Journey</h2>
          <p className="text-[15px] text-[var(--color-text-muted)] mb-8 max-w-xl mx-auto">Begin with Level 1 and work your way up. No prior experience needed.</p>
          <Link
            to={user ? '/practice' : '/register'}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg btn-primary font-semibold text-[14px] no-underline transition-all shadow-sm"
          >
            <Play size={16} fill="currentColor" /> Begin Level 1
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 px-4 bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--color-text)]">CodeForge AI</span>
            <span className="text-[var(--color-border)]">|</span>
            <span className="text-[var(--color-text-muted)] text-[13px]">Structured Python Learning Platform</span>
          </div>
          <div className="text-[13px] text-[var(--color-text-muted)]">
            10 Levels • 45+ Topics • 100+ Problems • AI-Powered
          </div>
        </div>
      </footer>
    </div>
  );
}
