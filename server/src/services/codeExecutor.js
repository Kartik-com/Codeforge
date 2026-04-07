import { config } from '../config/env.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
const JUDGE0_LANG_IDS = {
  python: 71,     // Python 3
  javascript: 63, // Node.js
  java: 62,       // Java
  cpp: 54,        // C++ (GCC)
};

// ─── Output Comparison Logic (STRICT) ──────────────────────────────────────────

function normalize(output) {
  if (output === null || output === undefined) return '';
  return output.toString()
    .trim() // Trim leading/trailing spaces
    .replace(/\r\n/g, '\n') // Normalize Windows line endings
    .replace(/[ \t]+$/gm, '') // Remove trailing spaces on each line
    .replace(/\n+$/g, ''); // Ensure no multiple trailing newlines
}

function compare(expected, actual) {
  return normalize(expected) === normalize(actual);
}

// ─── Formatter Helpers ─────────────────────────────────────────────────────────

function formatExecutionTime(timeSeconds) {
  if (!timeSeconds) return "0.00s";
  return `${parseFloat(timeSeconds).toFixed(2)}s`;
}

function formatMemory(memoryKb) {
  if (!memoryKb) return "0MB";
  return `${(memoryKb / 1024).toFixed(1)}MB`;
}

const mapJudge0Status = (statusId) => {
  if (statusId === 3) return 'Accepted';
  if (statusId === 4) return 'Wrong Answer';
  if (statusId === 5) return 'Time Limit Exceeded';
  if (statusId === 6) return 'Compilation Error';
  if (statusId >= 7 && statusId <= 12) return 'Runtime Error';
  return 'Runtime Error'; // Fallback for Internal Error (13), Exec Format Error (14)
};

// ─── Judge0 Execution Engine ───────────────────────────────────────────────────

async function submitToJudge0(code, languageId, stdin) {
  if (!config.judge0ApiKey) throw new Error('Judge0 API key not configured');

  const payload = {
    source_code: Buffer.from(code).toString('base64'),
    language_id: languageId,
    stdin: Buffer.from(stdin || '').toString('base64'),
    base64_encoded: true,
    cpu_time_limit: 2.0, // 2 second timeout
    memory_limit: 128000 // 128 MB equivalent
  };

  const submitRes = await fetch(`${config.judge0ApiUrl}/submissions?base64_encoded=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': config.judge0ApiKey,
      'X-RapidAPI-Host': config.judge0Host,
    },
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    console.error(`Judge0 Submit Error: ${submitRes.status} - ${errText}`);
    throw new Error(`Judge0 API returned ${submitRes.status}`);
  }

  const { token } = await submitRes.json();
  return token;
}

async function pollJudge0Result(token) {
  const maxAttempts = 50; // Max 25 seconds polling
  const delayMs = 500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`${config.judge0ApiUrl}/submissions/${token}?base64_encoded=true`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': config.judge0ApiKey,
        'X-RapidAPI-Host': config.judge0Host,
      },
    });

    if (!res.ok) throw new Error(`Judge0 Poll Error: ${res.status}`);

    const result = await res.json();
    
    // Status 1 = In Queue, Status 2 = Processing
    if (result.status.id >= 3) {
      const decode = (b64) => b64 ? Buffer.from(b64, 'base64').toString('utf8') : '';
      
      return {
        statusId: result.status.id,
        statusText: result.status.description,
        stdout: decode(result.stdout),
        stderr: decode(result.stderr),
        compileOutput: decode(result.compile_output),
        message: decode(result.message),
        time: result.time, // in seconds
        memory: result.memory // in KB
      };
    }

    await new Promise(r => setTimeout(r, Math.min(delayMs * Math.pow(1.2, attempt), 2000))); // Backoff slightly up to 2s
  }

  throw new Error('Polling timeout exceeded');
}

const TEMP_DIR = path.join(process.cwd(), 'temp');

async function executeLocally(code, language, stdin) {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  const id = crypto.randomUUID();
  let ext, cmd;

  if (language === 'python') {
    ext = '.py';
    cmd = process.platform === 'win32' ? 'python' : 'python3';
  } else if (language === 'javascript') {
    ext = '.js';
    cmd = 'node';
  } else {
    return {
      status: 'Runtime Error',
      rawOutput: '',
      errorOutput: `Local execution fallback currently supports python and javascript only. Add Judge0 API key to support ${language}.`,
      execution_time: '0.00s',
      memory: '0MB',
      success: false
    };
  }

  const filePath = path.join(TEMP_DIR, `${id}${ext}`);
  await fs.writeFile(filePath, code);

  return new Promise((resolve) => {
    const start = process.hrtime();
    const child = spawn(cmd, [filePath], { shell: process.platform === 'win32' });
    
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => stdout += data.toString());
    child.stderr.on('data', data => stderr += data.toString());

    if (stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }

    const timeout = setTimeout(() => {
      child.kill();
      resolve({
        status: 'Time Limit Exceeded',
        rawOutput: stdout,
        errorOutput: stderr || 'Execution timed out',
        execution_time: '2.00s',
        memory: '0MB',
        success: false
      });
    }, 2000);

    child.on('close', (codeStatus) => {
      clearTimeout(timeout);
      const end = process.hrtime(start);
      const timeMs = (end[0] * 1000 + end[1] / 1e6) / 1000;
      
      // Cleanup async
      fs.unlink(filePath).catch(() => {});

      resolve({
        status: codeStatus === 0 ? 'Accepted' : 'Runtime Error',
        rawOutput: stdout,
        errorOutput: stderr,
        execution_time: `${timeMs.toFixed(2)}s`,
        memory: '0MB',
        success: codeStatus === 0
      });
    });
    
    child.on('error', (err) => {
      clearTimeout(timeout);
      fs.unlink(filePath).catch(() => {});
      resolve({
        status: 'Runtime Error',
        rawOutput: stdout,
        errorOutput: `Failed to start local process: ${err.message}. Ensure ${cmd} is installed.`,
        execution_time: '0.00s',
        memory: '0MB',
        success: false
      });
    });
  });
}

export async function executeCode(code, language, stdin = '') {
  try {
    const langId = JUDGE0_LANG_IDS[language];
    if (!langId) throw new Error(`Unsupported language for Judge0: ${language}`);

    if (!config.judge0ApiKey) {
      return await executeLocally(code, language, stdin);
    }

    const token = await submitToJudge0(code, langId, stdin);
    const result = await pollJudge0Result(token);

    const mappedStatus = mapJudge0Status(result.statusId);
    let output = result.stdout;
    let error = result.stderr || result.compileOutput || result.message || '';

    return {
      status: mappedStatus,
      rawOutput: output,
      errorOutput: error,
      execution_time: formatExecutionTime(result.time),
      memory: formatMemory(result.memory),
      success: mappedStatus === 'Accepted'
    };
  } catch (err) {
    console.error(`[CodeExecutor] ✗ Judge0 failed: ${err.message}`);
    return {
      status: 'Runtime Error',
      rawOutput: '',
      errorOutput: `Execution Environment Error: ${err.message}`,
      execution_time: '0.00s',
      memory: '0MB',
      success: false
    };
  }
}

export async function runTestCases(code, language, testCases) {
  let passedCount = 0;
  const totalCount = testCases.length;
  let maxTime = 0;
  let maxMemory = 0;

  for (const testCase of testCases) {
    const result = await executeCode(code, language, testCase.input);

    // Update aggregates
    const timeVal = parseFloat(result.execution_time.replace('s', '')) || 0;
    const memVal = parseFloat(result.memory.replace('MB', '')) * 1024 || 0; // convert MB back to roughly KB for max calculation
    if (timeVal > maxTime) maxTime = timeVal;
    if (memVal > maxMemory) maxMemory = memVal;

    // Check system-level failures (Compilation, TLE, RE)
    if (result.status !== 'Accepted') {
      return {
        status: result.status,
        passed: passedCount,
        total: totalCount,
        failed_case: {
          input: testCase.input,
          expected_output: testCase.expectedOutput || testCase.output || '',
          actual_output: result.rawOutput,
          error: result.errorOutput,
        },
        execution_time: formatExecutionTime(maxTime),
        memory: formatMemory(maxMemory)
      };
    }

    // Custom strict comparison for logic verification
    const expectedOutput = testCase.expectedOutput || testCase.output || '';
    const isCorrect = compare(expectedOutput, result.rawOutput);

    if (!isCorrect) {
      return {
        status: 'Wrong Answer',
        passed: passedCount,
        total: totalCount,
        failed_case: {
          input: testCase.input,
          expected_output: expectedOutput,
          actual_output: result.rawOutput,
          error: ''
        },
        execution_time: formatExecutionTime(maxTime),
        memory: formatMemory(maxMemory)
      };
    }

    passedCount++;
  }

  return {
    status: 'Accepted',
    passed: passedCount,
    total: totalCount,
    failed_case: null,
    execution_time: formatExecutionTime(maxTime),
    memory: formatMemory(maxMemory)
  };
}
