export function buildCodeReviewPrompt(code, language, problemDescription) {
  return `You are an expert code reviewer and programming mentor. Analyze the following code submission:

**Problem:** ${problemDescription}
**Language:** ${language}
**Code:**
\`\`\`${language}
${code}
\`\`\`

Provide a comprehensive code review including:

1. **Correctness**: Is the solution correct? Any bugs or logical errors?
2. **Time Complexity**: Big O analysis of the solution
3. **Space Complexity**: Memory usage analysis
4. **Code Quality**: Variable naming, readability, structure
5. **Optimizations**: Suggest specific improvements
6. **Better Approaches**: If there's a more efficient algorithm, explain it
7. **Bad Practices**: Highlight any anti-patterns or bad habits

Respond ONLY in valid JSON format:
{
  "correctness": "Assessment of correctness",
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "qualityScore": 8,
  "suggestions": [
    "Specific improvement suggestion 1",
    "Specific improvement suggestion 2"
  ],
  "betterApproach": "Description of a better approach if one exists, or null",
  "badPractices": ["List of bad practices found"],
  "overallFeedback": "2-3 sentence summary of the review"
}`;
}

export function buildDoubtSolverPrompt(question, code, language, problemDescription) {
  return `You are a patient and encouraging programming tutor. A student has a question about their code:

**Problem:** ${problemDescription}
**Language:** ${language}
**Their Code:**
\`\`\`${language}
${code}
\`\`\`
**Their Question:** ${question}

Provide a helpful, step-by-step response that:
1. Directly addresses their question
2. Explains concepts clearly without giving the full solution away
3. Uses examples and analogies when helpful
4. Points out specific lines or sections of their code when relevant
5. Encourages them and suggests what to try next

Respond ONLY in valid JSON format:
{
  "answer": "Your detailed, encouraging response with step-by-step explanation. Use \\n for line breaks.",
  "hints": ["Actionable hint 1", "Actionable hint 2"],
  "relatedConcepts": ["Concept 1 to review", "Concept 2 to review"]
}`;
}
