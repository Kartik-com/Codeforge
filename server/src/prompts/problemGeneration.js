// ─── Curriculum-aware AI Prompt Builder ─────────────────────────────────────
// Generates precise prompts with 6-dimension variation injection for truly
// unique problem generation. Python-only starter code.

export function buildProblemPrompt(opts) {
  const {
    levelId, topicId, difficulty, language = 'python',
    levelName, topicName, topicDescription, previousProblems = [],
    previousSignatures = [], variation = {},
  } = opts;

  const {
    contextTheme = 'General Programming',
    constraintRange = { label: 'small', nMin: 1, nMax: 100, valMin: -1000, valMax: 1000 },
    edgeCaseFocus = 'boundary_max_values',
    ioFormat = 'integers_one_per_line',
    logicModifier = 'standard',
    realWorldFraming = 'everyday_task',
    uniqueSeed = Math.floor(Math.random() * 100000),
  } = variation;

  // Avoid list — up to 20 most recent titles + signatures
  const avoidTitles = previousProblems.length > 0
    ? `\n\nYou MUST NOT generate problems similar to ANY of these previous titles:\n${previousProblems.slice(0, 20).map((t, i) => `  ${i + 1}. "${t}"`).join('\n')}`
    : '';

  const avoidSignatures = previousSignatures.length > 0
    ? `\nYou MUST NOT reuse any of these logic patterns:\n${previousSignatures.slice(0, 20).join(', ')}`
    : '';

  const levelNum = parseInt(levelId.replace('level', ''));
  const isBeginnerLevel = levelNum <= 3;
  const isIntermediateLevel = levelNum >= 4 && levelNum <= 6;

  let difficultyGuide = '';
  if (isBeginnerLevel) {
    difficultyGuide = `Difficulty guide for BEGINNER level:
   - Easy: Single concept, direct application, very clear instructions
   - Medium: Combine 2 concepts, requires small logical reasoning
   - Hard: Edge cases awareness, requires careful condition handling`;
  } else if (isIntermediateLevel) {
    difficultyGuide = `Difficulty guide for INTERMEDIATE level:
   - Easy: Direct application of the concept with simple logic
   - Medium: Requires combining concepts or handling multiple cases
   - Hard: Requires optimization or multi-step problem solving`;
  } else {
    difficultyGuide = `Difficulty guide for ADVANCED level:
   - Easy: Standard implementation of the algorithm/data structure
   - Medium: Requires algorithmic thinking, data structure usage
   - Hard: Complex algorithms, optimization needed, tricky edge cases`;
  }

  // IO format instruction
  const ioFormatInstruction = {
    integers_one_per_line: 'Input/Output: One value per line.',
    space_separated_single_line: 'Input/Output: All values on a single line, space-separated.',
    first_line_count_then_values: 'Input: First line is the count N, then N values follow (one per line).',
    comma_separated: 'Input: Values are comma-separated on a single line.',
  }[ioFormat] || 'Input/Output: One value per line.';

  // Logic modifier instruction
  const logicModifierInstruction = {
    standard: 'Use a straightforward approach to solve the problem.',
    reverse_problem: 'TWIST: Frame the problem in reverse — given the output, determine what input produced it.',
    add_extra_condition: 'TWIST: Add an additional constraint or special condition that the student must handle.',
    count_instead_of_find: 'TWIST: Instead of finding a specific value, ask the student to COUNT how many valid answers exist.',
    optimize_for_minimum: 'TWIST: Among all valid solutions, the student must find the MINIMUM or OPTIMAL one.',
    check_existence_only: 'TWIST: Instead of computing the full answer, ask the student to determine if a solution EXISTS (Yes/No).',
  }[logicModifier] || '';

  // Edge case emphasis
  const edgeCaseInstruction = {
    empty_or_minimal_input: 'Hidden test cases MUST include: empty input, single element, and minimal valid input.',
    all_same_values: 'Hidden test cases MUST include: all identical values, and check correct handling.',
    negative_numbers: 'Hidden test cases MUST include: negative numbers, mixed positive/negative, and zero.',
    boundary_max_values: 'Hidden test cases MUST include: maximum constraint values and near-boundary inputs.',
    single_element: 'Hidden test cases MUST include: single element input and two-element input.',
    sorted_input: 'Hidden test cases MUST include: already-sorted input and nearly-sorted input.',
    reverse_sorted: 'Hidden test cases MUST include: reverse-sorted input and worst-case ordering.',
    alternating_pattern: 'Hidden test cases MUST include: alternating positive/negative values.',
  }[edgeCaseFocus] || '';

  return `You are an expert computer science educator. Create a UNIQUE coding problem for a structured learning platform.

UNIQUENESS SEED: ${uniqueSeed} — use this to inspire unique numbers, names, and scenarios.

**Level:** ${levelName} (Level ${levelNum}/10)
**Topic:** ${topicName} — ${topicDescription}
**Difficulty:** ${difficulty}
**Language:** Python only

═══ MANDATORY VARIATION PARAMETERS (you MUST follow ALL of these) ═══

1. **THEME**: The problem scenario MUST be set in: "${contextTheme}"
   - All characters, objects, and setting must match this theme
   - The real-world framing style is: "${realWorldFraming}"

2. **CONSTRAINT SCALE**: ${constraintRange.label} scale
   - Input size N: ${constraintRange.nMin} to ${constraintRange.nMax}
   - Value range: ${constraintRange.valMin} to ${constraintRange.valMax}

3. **IO FORMAT**: ${ioFormatInstruction}

4. **LOGIC**: ${logicModifierInstruction}

5. **EDGE CASES**: ${edgeCaseInstruction}

═══ QUALITY RULES ═══

1. Create a clear, unambiguous problem that tests "${topicName}" specifically
2. ${isBeginnerLevel ? 'Keep it VERY simple. A complete beginner should understand the problem in 30 seconds.' : 'Assume the student knows basic Python syntax.'}
3. Use sys.stdin/stdout for I/O
4. DO NOT use AI-sounding language like "delve", "leverage", "utilize"
5. DO NOT reference "competitive programming" — this is for learning
6. Write natural, friendly problem descriptions like a teacher would
7. Provide 2-3 examples with clear explanations
8. Generate 3-5 hidden test cases covering: normal, edge, and boundary cases
9. Starter code MUST use this exact Python template:
    def solve():
        import sys
        input_data = sys.stdin.read().splitlines()
        # Student code here
    if __name__ == "__main__":
        solve()

${difficultyGuide}
${avoidTitles}
${avoidSignatures}

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "title": "Short unique title referencing the theme (MUST be different from all avoided titles)",
  "logic_signature": "snake_case string: topic_theme_modifier e.g. nested_loops_space_exploration_reverse",
  "description": "Clear problem statement. Use \\n for newlines. Include input/output format.",
  "constraints": "Input constraints matching the scale above",
  "examples": [
    {"input": "actual input", "output": "expected output", "explanation": "step by step"}
  ],
  "hiddenTestCases": [
    {"input": "test input", "expectedOutput": "expected output"}
  ],
  "starterCode": {
    "python": "def solve():\\n    import sys\\n    input_data = sys.stdin.read().splitlines()\\n    # Your code here\\n\\nif __name__ == \\"__main__\\":\\n    solve()"
  },
  "solution": "Brief approach description"
}`;
}

export function buildSimilarProblemPrompt(originalProblem, difficulty, variation = {}, previousSignatures = [], previousTitles = []) {
  const {
    contextTheme = 'General Programming',
    constraintRange = { label: 'small', nMin: 1, nMax: 100, valMin: -1000, valMax: 1000 },
    edgeCaseFocus = 'boundary_max_values',
    ioFormat = 'integers_one_per_line',
    logicModifier = 'standard',
    realWorldFraming = 'everyday_task',
    uniqueSeed = Math.floor(Math.random() * 100000),
  } = variation;

  const avoidSignatures = previousSignatures.length > 0
    ? `\nDo NOT reuse any of these patterns:\n${previousSignatures.slice(0, 20).join(', ')}`
    : '';

  const avoidTitles = previousTitles.length > 0
    ? `\nDo NOT use any title similar to:\n${previousTitles.slice(0, 20).map((t, i) => `  ${i + 1}. "${t}"`).join('\n')}`
    : '';

  const logicModifierInstruction = {
    standard: 'Keep the same algorithmic approach but completely change the scenario.',
    reverse_problem: 'REVERSE the problem: given the output, determine the input.',
    add_extra_condition: 'Add an EXTRA condition or constraint not in the original.',
    count_instead_of_find: 'Change from finding a value to COUNTING occurrences.',
    optimize_for_minimum: 'Change to finding the MINIMUM or OPTIMAL solution.',
    check_existence_only: 'Change to a YES/NO existence check.',
  }[logicModifier] || '';

  return `You are an expert CS educator. Create a COMPLETELY NEW problem that tests the same core concept as the original but feels 100% brand-new.

UNIQUENESS SEED: ${uniqueSeed}

**Original Problem (for concept reference only — do NOT copy):**
Title: ${originalProblem.title}
Core concept: ${originalProblem.description?.substring(0, 200)}...

**New Difficulty:** ${difficulty || originalProblem.difficulty}
**Language:** Python only

═══ MANDATORY VARIATION PARAMETERS ═══

1. **NEW THEME**: "${contextTheme}" — all characters, objects, setting must match
2. **REAL-WORLD STYLE**: "${realWorldFraming}"
3. **CONSTRAINT SCALE**: ${constraintRange.label} (N: ${constraintRange.nMin}-${constraintRange.nMax}, values: ${constraintRange.valMin} to ${constraintRange.valMax})
4. **IO FORMAT**: ${ioFormat.replace(/_/g, ' ')}
5. **LOGIC TWIST**: ${logicModifierInstruction}
6. **EDGE FOCUS**: Test cases must emphasize: ${edgeCaseFocus.replace(/_/g, ' ')}

═══ UNIQUENESS RULES ═══

- The problem MUST be structurally different from the original (not just reworded)
- Change the math, numbers, data types, and story completely
- At least 2 of the 6 variation parameters above must create visible differences
- The solution approach uses the same core concept but the problem feels brand-new
- Use the standard Python starter code template with sys.stdin
- DO NOT use AI-sounding language
${avoidSignatures}
${avoidTitles}

Respond ONLY with valid JSON:
{
  "title": "Unique title themed to ${contextTheme}",
  "logic_signature": "snake_case: concept_theme_modifier_${uniqueSeed}",
  "description": "...",
  "constraints": "...",
  "examples": [{"input": "...", "output": "...", "explanation": "..."}],
  "hiddenTestCases": [{"input": "...", "expectedOutput": "..."}],
  "starterCode": {"python": "def solve():\\n    import sys\\n    input_data = sys.stdin.read().splitlines()\\n    # Your code here\\n\\nif __name__ == \\"__main__\\":\\n    solve()"},
  "solution": "..."
}`;
}
