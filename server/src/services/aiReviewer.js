import OpenAI from 'openai';
import { config } from '../config/env.js';
import { buildCodeReviewPrompt, buildDoubtSolverPrompt } from '../prompts/codeReview.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export async function reviewCode(code, language, problemDescription) {
  if (!config.openaiApiKey || config.openaiApiKey === 'your-openai-api-key-here') {
    return getFallbackReview(code, language);
  }

  try {
    const prompt = buildCodeReviewPrompt(code, language, problemDescription);
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = completion.choices[0].message.content.trim();
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('AI review error:', error.message);
    return getFallbackReview(code, language);
  }
}

export async function solveDoubt(question, code, language, problemDescription) {
  if (!config.openaiApiKey || config.openaiApiKey === 'your-openai-api-key-here') {
    return {
      answer: "I'm currently in offline mode. To get AI-powered doubt solving, please configure your OpenAI API key in the server .env file.\n\nIn the meantime, here are some general debugging tips:\n1. Check your edge cases\n2. Print intermediate values to trace the logic\n3. Review the problem constraints carefully",
      hints: ["Try tracing through the algorithm with a small example", "Check boundary conditions"],
      relatedConcepts: ["Debugging", "Algorithm tracing"],
    };
  }

  try {
    const prompt = buildDoubtSolverPrompt(question, code, language, problemDescription);
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const content = completion.choices[0].message.content.trim();
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Doubt solver error:', error.message);
    return {
      answer: "Sorry, I encountered an error analyzing your code. Please try again.",
      hints: ["Review your approach step by step"],
      relatedConcepts: [],
    };
  }
}

function getFallbackReview(code, language) {
  const lines = code.split('\n').length;
  return {
    correctness: "Unable to perform AI review. Please configure your OpenAI API key for detailed analysis.",
    timeComplexity: "Analysis requires AI",
    spaceComplexity: "Analysis requires AI",
    qualityScore: 5,
    suggestions: [
      "Consider adding comments to explain your logic",
      "Use meaningful variable names for better readability",
      lines > 50 ? "Consider breaking your solution into smaller functions" : "Good code length"
    ],
    betterApproach: null,
    badPractices: [],
    overallFeedback: "Configure your OpenAI API key in server/.env for comprehensive AI code reviews including complexity analysis, optimization suggestions, and better approach recommendations."
  };
}
