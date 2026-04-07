// ─── CodeForge AI — Full Curriculum Definition ─────────────────────────────────
// 10 Levels: Fundamentals (1-9) + DSA (10)
// Python-first approach. Each topic has an ID, display name, description,
// and arrays of problem types it should cover.

export const CURRICULUM = [
  {
    levelId: 'level1',
    levelNumber: 1,
    name: 'Basics',
    description: 'Start your programming journey with the building blocks.',
    color: '#10B981',
    icon: 'Leaf',
    topics: [
      {
        topicId: 'variables',
        name: 'Variables',
        description: 'Learn how to store and manipulate data using variables.',
        problemTypes: ['concept', 'output', 'io'],
      },
      {
        topicId: 'keywords',
        name: 'Keywords & Identifiers',
        description: 'Understand reserved words and naming rules in Python.',
        problemTypes: ['concept', 'output'],
      },
      {
        topicId: 'data_types',
        name: 'Data Types',
        description: 'Work with integers, floats, strings, and booleans.',
        problemTypes: ['concept', 'output', 'io'],
      },
      {
        topicId: 'input_output',
        name: 'Input & Output',
        description: 'Read user input and display formatted output.',
        problemTypes: ['io', 'real_world'],
      },
      {
        topicId: 'type_casting',
        name: 'Type Casting',
        description: 'Convert between different data types safely.',
        problemTypes: ['concept', 'io', 'output'],
      },
    ],
  },
  {
    levelId: 'level2',
    levelNumber: 2,
    name: 'Operators',
    description: 'Master operators to evaluate and compare data.',
    color: '#3B82F6',
    icon: 'Calculator',
    topics: [
      {
        topicId: 'arithmetic',
        name: 'Arithmetic Operators',
        description: 'Addition, subtraction, multiplication, division, modulo, and power.',
        problemTypes: ['io', 'real_world', 'concept'],
      },
      {
        topicId: 'relational',
        name: 'Relational Operators',
        description: 'Compare values with ==, !=, <, >, <=, >=.',
        problemTypes: ['output', 'concept', 'io'],
      },
      {
        topicId: 'logical',
        name: 'Logical Operators',
        description: 'Combine conditions using and, or, not.',
        problemTypes: ['output', 'concept', 'puzzle'],
      },
      {
        topicId: 'bitwise',
        name: 'Bitwise Operators',
        description: 'Operate on numbers at the bit level.',
        problemTypes: ['concept', 'io', 'puzzle'],
      },
      {
        topicId: 'assignment',
        name: 'Assignment Operators',
        description: 'Assign and update variable values with +=, -=, *=, etc.',
        problemTypes: ['output', 'concept'],
      },
      {
        topicId: 'membership_identity',
        name: 'Membership & Identity',
        description: 'Use in, not in, is, and is not operators.',
        problemTypes: ['output', 'concept'],
      },
    ],
  },
  {
    levelId: 'level3',
    levelNumber: 3,
    name: 'Control Statements',
    description: 'Control the flow of your programs with conditions and loops.',
    color: '#8B5CF6',
    icon: 'GitBranch',
    topics: [
      {
        topicId: 'if_else',
        name: 'If-Else',
        description: 'Make decisions in your code with conditional statements.',
        problemTypes: ['io', 'real_world', 'puzzle'],
      },
      {
        topicId: 'nested_conditions',
        name: 'Nested Conditions',
        description: 'Handle complex decision trees with nested if-elif-else.',
        problemTypes: ['io', 'puzzle', 'real_world'],
      },
      {
        topicId: 'for_loop',
        name: 'For Loops',
        description: 'Iterate over sequences with for loops and range().',
        problemTypes: ['io', 'pattern', 'concept'],
      },
      {
        topicId: 'while_loop',
        name: 'While Loops',
        description: 'Repeat actions while a condition stays true.',
        problemTypes: ['io', 'puzzle', 'concept'],
      },
      {
        topicId: 'break_continue_pass',
        name: 'Break, Continue, Pass',
        description: 'Control loop execution with break, continue, and pass.',
        problemTypes: ['output', 'concept', 'io'],
      },
    ],
  },
  {
    levelId: 'level4',
    levelNumber: 4,
    name: 'Data Structures',
    description: 'Store and organize data with Python\'s built-in structures.',
    color: '#F59E0B',
    icon: 'Database',
    topics: [
      {
        topicId: 'strings',
        name: 'Strings',
        description: 'Manipulate text with string methods and operations.',
        problemTypes: ['io', 'puzzle', 'real_world'],
      },
      {
        topicId: 'lists',
        name: 'Lists',
        description: 'Work with ordered, mutable collections of items.',
        problemTypes: ['io', 'puzzle', 'concept'],
      },
      {
        topicId: 'tuples',
        name: 'Tuples',
        description: 'Use immutable sequences for fixed collections.',
        problemTypes: ['concept', 'output', 'io'],
      },
      {
        topicId: 'sets',
        name: 'Sets',
        description: 'Work with unordered collections of unique elements.',
        problemTypes: ['io', 'puzzle', 'concept'],
      },
      {
        topicId: 'dictionaries',
        name: 'Dictionaries',
        description: 'Map keys to values for fast lookups.',
        problemTypes: ['io', 'real_world', 'puzzle'],
      },
      {
        topicId: 'slicing',
        name: 'Slicing',
        description: 'Extract portions of strings, lists, and tuples.',
        problemTypes: ['output', 'concept', 'io'],
      },
    ],
  },
  {
    levelId: 'level5',
    levelNumber: 5,
    name: 'Functions',
    description: 'Write reusable blocks of code with functions.',
    color: '#EC4899',
    icon: 'Box',
    topics: [
      {
        topicId: 'function_basics',
        name: 'Function Basics',
        description: 'Define and call functions with parameters and return values.',
        problemTypes: ['io', 'concept', 'real_world'],
      },
      {
        topicId: 'arguments',
        name: 'Arguments & Parameters',
        description: 'Use default, keyword, and positional arguments.',
        problemTypes: ['concept', 'io', 'output'],
      },
      {
        topicId: 'recursion',
        name: 'Recursion',
        description: 'Solve problems by having functions call themselves.',
        problemTypes: ['io', 'puzzle', 'concept'],
      },
      {
        topicId: 'args_kwargs',
        name: '*args and **kwargs',
        description: 'Handle variable-length arguments in functions.',
        problemTypes: ['concept', 'output', 'io'],
      },
    ],
  },
  {
    levelId: 'level6',
    levelNumber: 6,
    name: 'Problem Solving',
    description: 'Apply your skills to solve classic programming problems.',
    color: '#EF4444',
    icon: 'Brain',
    topics: [
      {
        topicId: 'pattern_programming',
        name: 'Pattern Programming',
        description: 'Print star, number, and character patterns.',
        problemTypes: ['pattern', 'io'],
      },
      {
        topicId: 'math_problems',
        name: 'Mathematical Problems',
        description: 'Solve prime, factorial, GCD, Fibonacci, and more.',
        problemTypes: ['io', 'puzzle', 'concept'],
      },
      {
        topicId: 'conditional_logic',
        name: 'Conditional Logic',
        description: 'Multi-step problems requiring careful condition design.',
        problemTypes: ['io', 'puzzle', 'real_world'],
      },
      {
        topicId: 'basic_algo_thinking',
        name: 'Algorithmic Thinking',
        description: 'Develop systematic approaches before writing code.',
        problemTypes: ['io', 'puzzle'],
      },
    ],
  },
  {
    levelId: 'level7',
    levelNumber: 7,
    name: 'Intermediate',
    description: 'Handle files, errors, and external modules.',
    color: '#14B8A6',
    icon: 'Settings',
    topics: [
      {
        topicId: 'file_handling',
        name: 'File Handling',
        description: 'Read, write, and process files in Python.',
        problemTypes: ['concept', 'io', 'real_world'],
      },
      {
        topicId: 'exception_handling',
        name: 'Exception Handling',
        description: 'Handle errors gracefully with try-except blocks.',
        problemTypes: ['concept', 'output', 'real_world'],
      },
      {
        topicId: 'modules_libraries',
        name: 'Modules & Libraries',
        description: 'Import and use Python\'s built-in modules.',
        problemTypes: ['concept', 'io'],
      },
    ],
  },
  {
    levelId: 'level8',
    levelNumber: 8,
    name: 'Object-Oriented Programming',
    description: 'Design programs using classes and objects.',
    color: '#6366F1',
    icon: 'Layers',
    topics: [
      {
        topicId: 'classes_objects',
        name: 'Classes & Objects',
        description: 'Create blueprints for objects with classes.',
        problemTypes: ['concept', 'io', 'real_world'],
      },
      {
        topicId: 'inheritance',
        name: 'Inheritance',
        description: 'Build new classes from existing ones.',
        problemTypes: ['concept', 'io', 'output'],
      },
      {
        topicId: 'polymorphism',
        name: 'Polymorphism',
        description: 'Use one interface for different data types.',
        problemTypes: ['concept', 'output'],
      },
      {
        topicId: 'encapsulation',
        name: 'Encapsulation',
        description: 'Control access to class attributes and methods.',
        problemTypes: ['concept', 'output', 'io'],
      },
    ],
  },
  {
    levelId: 'level9',
    levelNumber: 9,
    name: 'Basic Algorithms',
    description: 'Learn fundamental algorithms and analyze their efficiency.',
    color: '#F97316',
    icon: 'TrendingUp',
    topics: [
      {
        topicId: 'bubble_sort',
        name: 'Bubble Sort',
        description: 'Sort elements by repeatedly swapping adjacent pairs.',
        problemTypes: ['io', 'concept'],
      },
      {
        topicId: 'selection_sort',
        name: 'Selection Sort',
        description: 'Sort by finding the minimum element repeatedly.',
        problemTypes: ['io', 'concept'],
      },
      {
        topicId: 'linear_search',
        name: 'Linear Search',
        description: 'Find an element by checking each item sequentially.',
        problemTypes: ['io', 'concept'],
      },
      {
        topicId: 'binary_search',
        name: 'Binary Search',
        description: 'Efficiently search sorted arrays by halving the search space.',
        problemTypes: ['io', 'concept', 'puzzle'],
      },
      {
        topicId: 'time_complexity',
        name: 'Time Complexity Basics',
        description: 'Understand Big O notation and basic complexity analysis.',
        problemTypes: ['concept', 'output', 'puzzle'],
      },
    ],
  },
  {
    levelId: 'level10',
    levelNumber: 10,
    name: 'Data Structures & Algorithms',
    description: 'Advance to competitive programming and DSA mastery.',
    color: '#DC2626',
    icon: 'Trophy',
    topics: [
      {
        topicId: 'arrays_advanced',
        name: 'Arrays (Advanced)',
        description: 'Two-pointer, sliding window, and prefix sums.',
        problemTypes: ['io', 'puzzle'],
      },
      {
        topicId: 'linked_lists',
        name: 'Linked Lists',
        description: 'Singly and doubly linked list operations.',
        problemTypes: ['io', 'concept'],
      },
      {
        topicId: 'stacks_queues',
        name: 'Stacks & Queues',
        description: 'LIFO and FIFO data structures.',
        problemTypes: ['io', 'concept', 'puzzle'],
      },
      {
        topicId: 'trees_basics',
        name: 'Trees',
        description: 'Binary trees, BSTs, and tree traversals.',
        problemTypes: ['io', 'concept'],
      },
      {
        topicId: 'graphs_basics',
        name: 'Graphs',
        description: 'Graph representations, BFS, and DFS.',
        problemTypes: ['io', 'concept'],
      },
      {
        topicId: 'hashing',
        name: 'Hashing',
        description: 'Hash maps and solving problems with hash-based lookups.',
        problemTypes: ['io', 'puzzle'],
      },
      {
        topicId: 'dynamic_programming',
        name: 'Dynamic Programming',
        description: 'Break complex problems into overlapping subproblems.',
        problemTypes: ['io', 'puzzle'],
      },
      {
        topicId: 'greedy',
        name: 'Greedy Algorithms',
        description: 'Make locally optimal choices for global solutions.',
        problemTypes: ['io', 'puzzle'],
      },
    ],
  },
];

// ─── Mastery / Unlock Rules ────────────────────────────────────────────────────
// Soft unlock: levels are shown even when locked (grayed out), but problems
// can only be generated for unlocked levels.
// A level unlocks when the previous level reaches 70% completion AND 60% accuracy.

export const MASTERY_RULES = {
  completionThreshold: 0.70,  // 70% of problems in a level must be attempted
  accuracyThreshold: 0.60,    // 60% accuracy on attempted problems
  minProblemsPerTopic: 3,     // Minimum problems to attempt per topic before mastery counts
  softUnlock: true,           // Users can see locked levels (grayed out)
};

// ─── Legacy Topic Mapping ──────────────────────────────────────────────────────
// Maps old flat topic IDs to new curriculum IDs for migration

export const LEGACY_TOPIC_MAP = {
  arrays: { levelId: 'level10', topicId: 'arrays_advanced' },
  strings: { levelId: 'level4', topicId: 'strings' },
  loops: { levelId: 'level3', topicId: 'for_loop' },
  recursion: { levelId: 'level5', topicId: 'recursion' },
  sorting: { levelId: 'level9', topicId: 'bubble_sort' },
  linkedlists: { levelId: 'level10', topicId: 'linked_lists' },
  trees: { levelId: 'level10', topicId: 'trees_basics' },
  graphs: { levelId: 'level10', topicId: 'graphs_basics' },
  dp: { levelId: 'level10', topicId: 'dynamic_programming' },
  hashing: { levelId: 'level10', topicId: 'hashing' },
  stacks: { levelId: 'level10', topicId: 'stacks_queues' },
  queues: { levelId: 'level10', topicId: 'stacks_queues' },
  greedy: { levelId: 'level10', topicId: 'greedy' },
  backtracking: { levelId: 'level10', topicId: 'dynamic_programming' },
  math: { levelId: 'level6', topicId: 'math_problems' },
  oop: { levelId: 'level8', topicId: 'classes_objects' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function getLevelById(levelId) {
  return CURRICULUM.find(l => l.levelId === levelId) || null;
}

export function getTopicById(levelId, topicId) {
  const level = getLevelById(levelId);
  if (!level) return null;
  return level.topics.find(t => t.topicId === topicId) || null;
}

export function getAllTopicIds() {
  const ids = [];
  for (const level of CURRICULUM) {
    for (const topic of level.topics) {
      ids.push({ levelId: level.levelId, topicId: topic.topicId });
    }
  }
  return ids;
}

export function getTotalTopicCount() {
  return CURRICULUM.reduce((sum, level) => sum + level.topics.length, 0);
}
