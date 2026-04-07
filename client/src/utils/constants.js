import { 
  Leaf, Calculator, GitBranch, Database, Box, Brain,
  Settings, Layers, TrendingUp, Trophy,
  Variable, Type, Binary, Keyboard, ArrowRightLeft,
  Plus, Equal, ToggleLeft, Cpu, Clipboard, Users,
  GitFork, Repeat, ArrowDown, StopCircle,
  FileText, List, Lock, Shuffle, BookOpen, Scissors,
  FunctionSquare, Braces, Undo2, Asterisk,
  BarChart2, Hash, Puzzle, Target,
  FileCode, AlertTriangle, Package,
  BoxSelect, GitMerge, Shapes, Shield,
  ArrowUpDown, Filter, Search, Divide, Timer,
  Share2, Link, Inbox, CircleDollarSign
} from 'lucide-react';

// ─── 10-Level Curriculum ─────────────────────────────────────────────────────
export const CURRICULUM_LEVELS = [
  {
    levelId: 'level1', levelNumber: 1, name: 'Basics', color: '#10B981', icon: Leaf,
    description: 'Start your programming journey with the building blocks.',
    topics: [
      { topicId: 'variables', name: 'Variables', icon: Variable },
      { topicId: 'keywords', name: 'Keywords & Identifiers', icon: Type },
      { topicId: 'data_types', name: 'Data Types', icon: Binary },
      { topicId: 'input_output', name: 'Input & Output', icon: Keyboard },
      { topicId: 'type_casting', name: 'Type Casting', icon: ArrowRightLeft },
    ],
  },
  {
    levelId: 'level2', levelNumber: 2, name: 'Operators', color: '#3B82F6', icon: Calculator,
    description: 'Master operators to evaluate and compare data.',
    topics: [
      { topicId: 'arithmetic', name: 'Arithmetic', icon: Plus },
      { topicId: 'relational', name: 'Relational', icon: Equal },
      { topicId: 'logical', name: 'Logical', icon: ToggleLeft },
      { topicId: 'bitwise', name: 'Bitwise', icon: Cpu },
      { topicId: 'assignment', name: 'Assignment', icon: Clipboard },
      { topicId: 'membership_identity', name: 'Membership & Identity', icon: Users },
    ],
  },
  {
    levelId: 'level3', levelNumber: 3, name: 'Control Flow', color: '#8B5CF6', icon: GitBranch,
    description: 'Control the flow of your programs with conditions and loops.',
    topics: [
      { topicId: 'if_else', name: 'If-Else', icon: GitFork },
      { topicId: 'nested_conditions', name: 'Nested Conditions', icon: GitBranch },
      { topicId: 'for_loop', name: 'For Loops', icon: Repeat },
      { topicId: 'while_loop', name: 'While Loops', icon: ArrowDown },
      { topicId: 'break_continue_pass', name: 'Break / Continue', icon: StopCircle },
    ],
  },
  {
    levelId: 'level4', levelNumber: 4, name: 'Data Structures', color: '#F59E0B', icon: Database,
    description: "Store and organize data with Python's built-in structures.",
    topics: [
      { topicId: 'strings', name: 'Strings', icon: FileText },
      { topicId: 'lists', name: 'Lists', icon: List },
      { topicId: 'tuples', name: 'Tuples', icon: Lock },
      { topicId: 'sets', name: 'Sets', icon: Shuffle },
      { topicId: 'dictionaries', name: 'Dictionaries', icon: BookOpen },
      { topicId: 'slicing', name: 'Slicing', icon: Scissors },
    ],
  },
  {
    levelId: 'level5', levelNumber: 5, name: 'Functions', color: '#EC4899', icon: Box,
    description: 'Write reusable blocks of code with functions.',
    topics: [
      { topicId: 'function_basics', name: 'Function Basics', icon: FunctionSquare },
      { topicId: 'arguments', name: 'Arguments', icon: Braces },
      { topicId: 'recursion', name: 'Recursion', icon: Undo2 },
      { topicId: 'args_kwargs', name: '*args & **kwargs', icon: Asterisk },
    ],
  },
  {
    levelId: 'level6', levelNumber: 6, name: 'Problem Solving', color: '#EF4444', icon: Brain,
    description: 'Apply your skills to solve classic programming problems.',
    topics: [
      { topicId: 'pattern_programming', name: 'Patterns', icon: BarChart2 },
      { topicId: 'math_problems', name: 'Math Problems', icon: Hash },
      { topicId: 'conditional_logic', name: 'Conditional Logic', icon: Puzzle },
      { topicId: 'basic_algo_thinking', name: 'Algo Thinking', icon: Target },
    ],
  },
  {
    levelId: 'level7', levelNumber: 7, name: 'Intermediate', color: '#14B8A6', icon: Settings,
    description: 'Handle files, errors, and external modules.',
    topics: [
      { topicId: 'file_handling', name: 'File Handling', icon: FileCode },
      { topicId: 'exception_handling', name: 'Exceptions', icon: AlertTriangle },
      { topicId: 'modules_libraries', name: 'Modules', icon: Package },
    ],
  },
  {
    levelId: 'level8', levelNumber: 8, name: 'OOP', color: '#6366F1', icon: Layers,
    description: 'Design programs using classes and objects.',
    topics: [
      { topicId: 'classes_objects', name: 'Classes & Objects', icon: BoxSelect },
      { topicId: 'inheritance', name: 'Inheritance', icon: GitMerge },
      { topicId: 'polymorphism', name: 'Polymorphism', icon: Shapes },
      { topicId: 'encapsulation', name: 'Encapsulation', icon: Shield },
    ],
  },
  {
    levelId: 'level9', levelNumber: 9, name: 'Algorithms', color: '#F97316', icon: TrendingUp,
    description: 'Learn fundamental algorithms and analyze efficiency.',
    topics: [
      { topicId: 'bubble_sort', name: 'Bubble Sort', icon: ArrowUpDown },
      { topicId: 'selection_sort', name: 'Selection Sort', icon: Filter },
      { topicId: 'linear_search', name: 'Linear Search', icon: Search },
      { topicId: 'binary_search', name: 'Binary Search', icon: Divide },
      { topicId: 'time_complexity', name: 'Complexity', icon: Timer },
    ],
  },
  {
    levelId: 'level10', levelNumber: 10, name: 'DSA', color: '#DC2626', icon: Trophy,
    description: 'Advance to competitive programming and DSA mastery.',
    topics: [
      { topicId: 'arrays_advanced', name: 'Arrays', icon: BarChart2 },
      { topicId: 'linked_lists', name: 'Linked Lists', icon: Link },
      { topicId: 'stacks_queues', name: 'Stacks & Queues', icon: Inbox },
      { topicId: 'trees_basics', name: 'Trees', icon: GitMerge },
      { topicId: 'graphs_basics', name: 'Graphs', icon: Share2 },
      { topicId: 'hashing', name: 'Hashing', icon: Hash },
      { topicId: 'dynamic_programming', name: 'DP', icon: Puzzle },
      { topicId: 'greedy', name: 'Greedy', icon: CircleDollarSign },
    ],
  },
];

// Legacy flat TOPICS for backward compat (used by some components)
export const TOPICS = CURRICULUM_LEVELS.flatMap(level =>
  level.topics.map(t => ({ id: `${level.levelId}_${t.topicId}`, name: t.name, icon: t.icon, levelId: level.levelId, topicId: t.topicId }))
);

export const DIFFICULTIES = [
  { id: 'easy', name: 'Easy', color: '#10B981' },
  { id: 'medium', name: 'Medium', color: '#F59E0B' },
  { id: 'hard', name: 'Hard', color: '#EF4444' },
];

export const LANGUAGES = [
  { id: 'python', name: 'Python', monacoId: 'python' },
];

export const STATUS_LABELS = {
  accepted: { label: 'Accepted', color: '#10B981', type: 'success' },
  wrong_answer: { label: 'Wrong Answer', color: '#EF4444', type: 'error' },
  tle: { label: 'Time Limit Exceeded', color: '#F59E0B', type: 'warning' },
  runtime_error: { label: 'Runtime Error', color: '#EF4444', type: 'error' },
  compilation_error: { label: 'Compilation Error', color: '#EF4444', type: 'error' },
};
