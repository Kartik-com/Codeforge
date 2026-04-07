import OpenAI from 'openai';
import { config } from '../config/env.js';
import db from '../config/database.js';
import { buildProblemPrompt, buildSimilarProblemPrompt } from '../prompts/problemGeneration.js';
import { FALLBACK_PROBLEMS } from '../data/fallbackProblems.js';
import { CURRICULUM, getLevelById, getTopicById, LEGACY_TOPIC_MAP } from '../data/curriculum.js';
import crypto from 'crypto';

function generateId() {
  return crypto.randomUUID();
}

const openai = new OpenAI({ apiKey: config.openaiApiKey });

// ═══════════════════════════════════════════════════════════════════════════════
// 6-DIMENSION VARIATION SYSTEM — 96,000+ unique combinations per topic
// ═══════════════════════════════════════════════════════════════════════════════

const CONTEXT_THEMES = [
  'Space Exploration', 'Cyberpunk Hacker', 'E-Commerce Store',
  'Medieval RPG Gaming', 'Healthcare Systems', 'Automotive Racing',
  'Stock Market Trading', 'Social Media Analytics', 'Smart Home IoT',
  'Cryptocurrency Exchange', 'Airline Booking', 'Food Delivery App',
  'Weather Forecasting', 'Robot Navigation', 'Fitness Tracking',
  'Music Streaming', 'Theme Park Tycoon', 'Zombie Survival',
  'Quantum Computing Lab', 'Pirate Treasure Hunt', 'Ocean Research Station',
  'Wildlife Conservation', 'Ancient Library Archive', 'Ninja Training Academy',
  'Mars Colony Builder', 'Deep Sea Mining', 'Dragon Breeding Farm',
  'Time Travel Agency', 'Spy Network', 'Superhero Academy',
  'Virtual Reality Arcade', 'Pizza Empire', 'Train Dispatcher',
  'Jungle Expedition', 'Arctic Research Base', 'Volcano Observatory',
  'Cybersecurity Firm', 'Fantasy Potion Brewery', 'Space Station Repair',
  'Dinosaur Park', 'Underground Bunker', 'Cloud City Transport',
  'Haunted Mansion Mystery', 'Olympic Training Camp', 'Submarine Fleet',
  'Desert Oasis Builder', 'Steampunk Workshop', 'Crystal Mining Cave',
  'Galactic Senate', 'Robot Factory'
];

const CONSTRAINT_RANGES = [
  { label: 'tiny', nMin: 1, nMax: 10, valMin: -10, valMax: 10 },
  { label: 'small', nMin: 1, nMax: 100, valMin: -1000, valMax: 1000 },
  { label: 'medium', nMin: 1, nMax: 10000, valMin: -100000, valMax: 100000 },
  { label: 'large', nMin: 1, nMax: 100000, valMin: -1000000, valMax: 1000000 },
];

const EDGE_CASE_FOCUSES = [
  'empty_or_minimal_input',
  'all_same_values',
  'negative_numbers',
  'boundary_max_values',
  'single_element',
  'sorted_input',
  'reverse_sorted',
  'alternating_pattern',
];

const IO_FORMAT_TWISTS = [
  'integers_one_per_line',
  'space_separated_single_line',
  'first_line_count_then_values',
  'comma_separated',
];

const LOGIC_MODIFIERS = [
  'standard',
  'reverse_problem',
  'add_extra_condition',
  'count_instead_of_find',
  'optimize_for_minimum',
  'check_existence_only',
];

const REAL_WORLD_FRAMINGS = [
  'everyday_task',
  'game_mechanic',
  'business_logic',
  'scientific_measurement',
  'sports_statistics',
  'cooking_recipe',
  'school_scenario',
  'travel_planning',
];

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL UNIQUENESS REGISTRY — SHA-256 content hashing
// ═══════════════════════════════════════════════════════════════════════════════

// In-memory cache of known hashes for fast lookups (populated on first use)
let hashCacheLoaded = false;
const knownHashes = new Set();

function loadHashCache() {
  if (hashCacheLoaded) return;
  try {
    const rows = db.prepare('SELECT content_hash FROM problems WHERE content_hash IS NOT NULL AND content_hash != ""').all();
    for (const row of rows) {
      knownHashes.add(row.content_hash);
    }
  } catch (e) {
    // Column might not exist yet on first run
  }
  hashCacheLoaded = true;
}

function computeContentHash(title, description, constraints) {
  const raw = `${(title || '').trim().toLowerCase()}||${(description || '').trim().toLowerCase()}||${(constraints || '').trim().toLowerCase()}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
}

function isDuplicate(hash) {
  loadHashCache();
  if (knownHashes.has(hash)) return true;
  // Also check DB in case cache is stale
  const row = db.prepare('SELECT 1 FROM problems WHERE content_hash = ? LIMIT 1').get(hash);
  return !!row;
}

function registerHash(hash) {
  knownHashes.add(hash);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VARIATION VECTOR — random sampling from all 6 dimensions
// ═══════════════════════════════════════════════════════════════════════════════

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const shuffled = (arr) => [...arr].sort(() => Math.random() - 0.5);

function buildVariationVector() {
  return {
    contextTheme: pick(CONTEXT_THEMES),
    constraintRange: pick(CONSTRAINT_RANGES),
    edgeCaseFocus: pick(EDGE_CASE_FOCUSES),
    ioFormat: pick(IO_FORMAT_TWISTS),
    logicModifier: pick(LOGIC_MODIFIERS),
    realWorldFraming: pick(REAL_WORLD_FRAMINGS),
    uniqueSeed: randInt(1000, 999999),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FALLBACK / RANDOM SELECTION
// ═══════════════════════════════════════════════════════════════════════════════

function getRandomFallback(levelId, topicId, difficulty, excludeTitles = []) {
  const levelProblems = FALLBACK_PROBLEMS[levelId];
  if (!levelProblems) return null;

  const topicProblems = levelProblems[topicId];
  if (!topicProblems || topicProblems.length === 0) return null;

  let candidates = topicProblems.filter(p => p.difficulty === difficulty);
  if (candidates.length === 0) candidates = [...topicProblems];

  const unseen = candidates.filter(p => !excludeTitles.includes(p.title));
  if (unseen.length > 0) candidates = unseen;

  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY TOPIC SUPPORT
// ═══════════════════════════════════════════════════════════════════════════════

function resolveLegacyTopic(topic) {
  const mapping = LEGACY_TOPIC_MAP[topic];
  if (mapping) return mapping;
  for (const level of CURRICULUM) {
    const found = level.topics.find(t => t.topicId === topic);
    if (found) return { levelId: level.levelId, topicId: found.topicId };
  }
  return { levelId: 'level1', topicId: 'variables' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET PREVIOUS PROBLEMS (for anti-repetition)
// ═══════════════════════════════════════════════════════════════════════════════

function getPreviousProblems(levelId, topicId, limit = 30) {
  try {
    return db.prepare(
      'SELECT title, logic_signature, content_hash FROM problems WHERE level_id = ? AND topic_id = ? ORDER BY created_at DESC LIMIT ?'
    ).all(levelId, topicId, limit);
  } catch (e) {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROBLEM GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

export async function generateProblem(topicOrOpts, difficulty, language, userId) {
  let levelId, topicId;

  if (typeof topicOrOpts === 'object' && topicOrOpts.levelId) {
    levelId = topicOrOpts.levelId;
    topicId = topicOrOpts.topicId;
    difficulty = topicOrOpts.difficulty || difficulty || 'easy';
    language = topicOrOpts.language || language || 'python';
    userId = topicOrOpts.userId || userId;
  } else {
    const resolved = resolveLegacyTopic(topicOrOpts);
    levelId = resolved.levelId;
    topicId = resolved.topicId;
  }

  const topicField = `${levelId}_${topicId}`;

  // Gather previous problems for anti-repetition (ALL problems, not just submitted)
  const previousGenerated = getPreviousProblems(levelId, topicId, 30);
  const previousTitles = previousGenerated.map(p => p.title);
  const previousSignatures = previousGenerated.map(p => p.logic_signature).filter(Boolean);

  // Build a variation vector for this generation
  const variation = buildVariationVector();

  // ─── Try OpenAI first (with retry for uniqueness) ────────────────────────
  if (config.openaiApiKey && config.openaiApiKey !== 'your-openai-api-key-here') {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // Each retry gets a fresh variation vector
        const v = attempt === 0 ? variation : buildVariationVector();
        const levelInfo = getLevelById(levelId);
        const topicInfo = getTopicById(levelId, topicId);
        const prompt = buildProblemPrompt({
          levelId, topicId, difficulty, language: language || 'python',
          levelName: levelInfo?.name || '',
          topicName: topicInfo?.name || '',
          topicDescription: topicInfo?.description || '',
          previousProblems: previousTitles,
          previousSignatures,
          variation: v,
        });

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.85 + (attempt * 0.05),
          max_tokens: 2000,
        });

        const content = completion.choices[0].message.content.trim();
        let jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        const problemData = JSON.parse(jsonStr);

        // Check for duplicates via content hash
        const hash = computeContentHash(problemData.title, problemData.description, problemData.constraints);
        if (isDuplicate(hash)) {
          console.log(`[ProblemGen] Duplicate hash detected on attempt ${attempt + 1}, retrying...`);
          continue;
        }

        const id = generateId();
        const logicSig = problemData.logic_signature || `${v.contextTheme.replace(/\s/g, '_').toLowerCase()}_${v.logicModifier}_${v.uniqueSeed}`;
        
        db.prepare(`
          INSERT INTO problems (id, title, logic_signature, content_hash, description, topic, difficulty, level_id, topic_id, constraints, examples, hidden_test_cases, starter_code, solution, generated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ai')
        `).run(
          id, problemData.title, logicSig, hash,
          problemData.description, topicField,
          difficulty, levelId, topicId, problemData.constraints,
          JSON.stringify(problemData.examples), JSON.stringify(problemData.hiddenTestCases),
          JSON.stringify(problemData.starterCode), problemData.solution || ''
        );

        registerHash(hash);
        return { id, topic: topicField, levelId, topicId, difficulty, ...problemData };
      } catch (error) {
        console.error(`[ProblemGen] OpenAI attempt ${attempt + 1} failed:`, error.message);
      }
    }
  }

  // ─── Fallback: programmatic mutation engine ──────────────────────────────
  return generateMutatedFallback(levelId, topicId, difficulty, previousTitles, variation);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MUTATED FALLBACK GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

function generateMutatedFallback(levelId, topicId, difficulty, excludeTitles, variation) {
  const fallback = getRandomFallback(levelId, topicId, difficulty, excludeTitles);

  if (!fallback) {
    // Try any topic in the level
    const levelProblems = FALLBACK_PROBLEMS[levelId];
    if (levelProblems) {
      const allTopicKeys = Object.keys(levelProblems);
      for (const tk of shuffled(allTopicKeys)) {
        const p = getRandomFallback(levelId, tk, difficulty, excludeTitles);
        if (p) {
          return saveMutatedProblem(p, levelId, tk, difficulty, variation);
        }
      }
    }
    // Last resort
    const lastResort = FALLBACK_PROBLEMS.level1.variables[0];
    return saveMutatedProblem(lastResort, 'level1', 'variables', 'easy', variation);
  }

  return saveMutatedProblem(fallback, levelId, topicId, difficulty, variation);
}

function saveMutatedProblem(original, levelId, topicId, difficulty, variation) {
  // Try up to 5 mutations to get a unique hash
  for (let attempt = 0; attempt < 5; attempt++) {
    const v = attempt === 0 ? variation : buildVariationVector();
    const mutated = deepMutateProblem(original, v);

    const hash = computeContentHash(mutated.title, mutated.description, mutated.constraints);
    if (!isDuplicate(hash)) {
      const id = generateId();
      const topicField = `${levelId}_${topicId}`;
      const logicSig = `${v.contextTheme.replace(/\s/g, '_').toLowerCase()}_${v.logicModifier}_${v.edgeCaseFocus}_${v.uniqueSeed}`;

      db.prepare(`
        INSERT INTO problems (id, title, logic_signature, content_hash, description, topic, difficulty, level_id, topic_id, constraints, examples, hidden_test_cases, starter_code, solution, generated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'template')
      `).run(
        id, mutated.title, logicSig, hash, mutated.description, topicField,
        mutated.difficulty || difficulty, levelId, topicId,
        mutated.constraints || '',
        JSON.stringify(mutated.examples),
        JSON.stringify(mutated.hiddenTestCases),
        JSON.stringify(mutated.starterCode),
        mutated.solution || ''
      );

      registerHash(hash);
      return { id, topic: topicField, levelId, topicId, difficulty: mutated.difficulty || difficulty, ...mutated };
    }
  }

  // Absolute last resort — force unique with timestamp
  const v = buildVariationVector();
  const mutated = deepMutateProblem(original, v);
  mutated.title = `${mutated.title} — Edition ${Date.now() % 100000}`;
  const hash = computeContentHash(mutated.title, mutated.description, mutated.constraints);
  const id = generateId();
  const topicField = `${levelId}_${topicId}`;

  db.prepare(`
    INSERT INTO problems (id, title, logic_signature, content_hash, description, topic, difficulty, level_id, topic_id, constraints, examples, hidden_test_cases, starter_code, solution, generated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'template')
  `).run(
    id, mutated.title, `forced_unique_${Date.now()}`, hash, mutated.description, topicField,
    mutated.difficulty || difficulty, levelId, topicId,
    mutated.constraints || '',
    JSON.stringify(mutated.examples),
    JSON.stringify(mutated.hiddenTestCases),
    JSON.stringify(mutated.starterCode),
    mutated.solution || ''
  );

  registerHash(hash);
  return { id, topic: topicField, levelId, topicId, difficulty: mutated.difficulty || difficulty, ...mutated };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEEP PROGRAMMATIC MUTATOR — the heart of infinite generation
// ═══════════════════════════════════════════════════════════════════════════════

function deepMutateProblem(p, variation) {
  const { contextTheme, constraintRange, edgeCaseFocus, ioFormat, logicModifier, realWorldFraming, uniqueSeed } = variation;

  // ── Theme metadata ───────────────────────────────────────────────────────
  const THEME_DATA = {
    'Space Exploration':      { adj: 'Galactic',    noun: 'Station',    entity: 'astronaut',     unit: 'fuel cells',    verb: 'launched', place: 'aboard the ISS' },
    'Cyberpunk Hacker':       { adj: 'Neon',        noun: 'Network',    entity: 'hacker',        unit: 'credits',       verb: 'hacked', place: 'in Neo-Tokyo' },
    'E-Commerce Store':       { adj: 'Digital',     noun: 'Marketplace',entity: 'customer',      unit: 'coins',         verb: 'purchased', place: 'on the platform' },
    'Medieval RPG Gaming':    { adj: 'Ancient',     noun: 'Kingdom',    entity: 'knight',        unit: 'gold coins',    verb: 'conquered', place: 'in the realm' },
    'Healthcare Systems':     { adj: 'Medical',     noun: 'Hospital',   entity: 'doctor',        unit: 'doses',         verb: 'administered', place: 'in the clinic' },
    'Automotive Racing':      { adj: 'Turbo',       noun: 'Circuit',    entity: 'driver',        unit: 'laps',          verb: 'raced', place: 'on the track' },
    'Stock Market Trading':   { adj: 'Wall Street', noun: 'Exchange',   entity: 'trader',        unit: 'shares',        verb: 'traded', place: 'on the floor' },
    'Social Media Analytics': { adj: 'Viral',       noun: 'Platform',   entity: 'influencer',    unit: 'followers',     verb: 'posted', place: 'online' },
    'Smart Home IoT':         { adj: 'Connected',   noun: 'Hub',        entity: 'sensor',        unit: 'data points',   verb: 'triggered', place: 'in the smart home' },
    'Cryptocurrency Exchange':{ adj: 'Blockchain',  noun: 'Ledger',     entity: 'miner',         unit: 'tokens',        verb: 'mined', place: 'on the chain' },
    'Airline Booking':        { adj: 'SkyHigh',     noun: 'Terminal',   entity: 'passenger',     unit: 'miles',         verb: 'booked', place: 'at the airport' },
    'Food Delivery App':      { adj: 'Express',     noun: 'Kitchen',    entity: 'chef',          unit: 'orders',        verb: 'delivered', place: 'in the city' },
    'Weather Forecasting':    { adj: 'Storm',       noun: 'Observatory',entity: 'meteorologist', unit: 'readings',      verb: 'measured', place: 'at the station' },
    'Robot Navigation':       { adj: 'Autonomous',  noun: 'Grid',       entity: 'robot',         unit: 'steps',         verb: 'navigated', place: 'in the maze' },
    'Fitness Tracking':       { adj: 'Peak',        noun: 'Gym',        entity: 'athlete',       unit: 'reps',          verb: 'trained', place: 'at the gym' },
    'Music Streaming':        { adj: 'Rhythm',      noun: 'Studio',     entity: 'DJ',            unit: 'beats',         verb: 'mixed', place: 'in the studio' },
    'Theme Park Tycoon':      { adj: 'Fantasy',     noun: 'Park',       entity: 'manager',       unit: 'tickets',       verb: 'managed', place: 'in the park' },
    'Zombie Survival':        { adj: 'Apocalyptic', noun: 'Shelter',    entity: 'survivor',      unit: 'supplies',      verb: 'survived', place: 'in the wasteland' },
    'Quantum Computing Lab':  { adj: 'Quantum',     noun: 'Lab',        entity: 'physicist',     unit: 'qubits',        verb: 'computed', place: 'in the lab' },
    'Pirate Treasure Hunt':   { adj: 'Buccaneer',   noun: 'Ship',       entity: 'pirate',        unit: 'doubloons',     verb: 'plundered', place: 'on the seas' },
    'Ocean Research Station': { adj: 'Oceanic',     noun: 'Station',    entity: 'marine biologist', unit: 'samples',    verb: 'collected', place: 'under the sea' },
    'Wildlife Conservation':  { adj: 'Wild',        noun: 'Reserve',    entity: 'ranger',        unit: 'tracks',        verb: 'tracked', place: 'in the savanna' },
    'Ancient Library Archive':{ adj: 'Ancient',     noun: 'Archive',    entity: 'librarian',     unit: 'scrolls',       verb: 'cataloged', place: 'in the library' },
    'Ninja Training Academy': { adj: 'Shadow',      noun: 'Dojo',       entity: 'ninja',         unit: 'shuriken',      verb: 'trained', place: 'in the dojo' },
    'Mars Colony Builder':    { adj: 'Martian',     noun: 'Colony',     entity: 'colonist',      unit: 'resources',     verb: 'built', place: 'on Mars' },
    'Deep Sea Mining':        { adj: 'Abyssal',     noun: 'Mine',       entity: 'diver',         unit: 'crystals',      verb: 'extracted', place: 'in the deep' },
    'Dragon Breeding Farm':   { adj: 'Draconic',    noun: 'Lair',       entity: 'breeder',       unit: 'dragon eggs',   verb: 'hatched', place: 'in the mountains' },
    'Time Travel Agency':     { adj: 'Temporal',    noun: 'Portal',     entity: 'traveler',      unit: 'time units',    verb: 'warped', place: 'across eras' },
    'Spy Network':            { adj: 'Covert',      noun: 'Agency',     entity: 'agent',         unit: 'intel points',  verb: 'intercepted', place: 'in the field' },
    'Superhero Academy':      { adj: 'Heroic',      noun: 'Academy',    entity: 'hero',          unit: 'power points',  verb: 'defended', place: 'in the city' },
    'Virtual Reality Arcade': { adj: 'Digital',     noun: 'Arcade',     entity: 'player',        unit: 'tokens',        verb: 'scored', place: 'in VR' },
    'Pizza Empire':           { adj: 'Supreme',     noun: 'Pizzeria',   entity: 'chef',          unit: 'slices',        verb: 'baked', place: 'in the kitchen' },
    'Train Dispatcher':       { adj: 'Express',     noun: 'Terminal',   entity: 'dispatcher',    unit: 'passengers',    verb: 'dispatched', place: 'at the station' },
    'Jungle Expedition':      { adj: 'Tropical',    noun: 'Jungle',     entity: 'explorer',      unit: 'discoveries',   verb: 'explored', place: 'in the jungle' },
    'Arctic Research Base':   { adj: 'Polar',       noun: 'Base',       entity: 'researcher',    unit: 'ice cores',     verb: 'drilled', place: 'in the Arctic' },
    'Volcano Observatory':    { adj: 'Volcanic',    noun: 'Peak',       entity: 'volcanologist', unit: 'lava samples',  verb: 'analyzed', place: 'near the crater' },
    'Cybersecurity Firm':     { adj: 'Firewall',    noun: 'HQ',         entity: 'analyst',       unit: 'threat scores', verb: 'blocked', place: 'in the SOC' },
    'Fantasy Potion Brewery': { adj: 'Mystical',    noun: 'Brewery',    entity: 'alchemist',     unit: 'potions',       verb: 'brewed', place: 'in the tower' },
    'Space Station Repair':   { adj: 'Orbital',     noun: 'Dock',       entity: 'engineer',      unit: 'parts',         verb: 'repaired', place: 'in orbit' },
    'Dinosaur Park':          { adj: 'Jurassic',    noun: 'Enclosure',  entity: 'keeper',        unit: 'specimens',     verb: 'contained', place: 'in the park' },
    'Underground Bunker':     { adj: 'Subterranean',noun: 'Bunker',     entity: 'guard',         unit: 'rations',       verb: 'stored', place: 'underground' },
    'Cloud City Transport':   { adj: 'Skybound',    noun: 'Terminal',   entity: 'pilot',         unit: 'cargo units',   verb: 'transported', place: 'above the clouds' },
    'Haunted Mansion Mystery':{ adj: 'Spectral',    noun: 'Mansion',    entity: 'detective',     unit: 'clues',         verb: 'investigated', place: 'in the manor' },
    'Olympic Training Camp':  { adj: 'Champion',    noun: 'Arena',      entity: 'athlete',       unit: 'medals',        verb: 'competed', place: 'at the games' },
    'Submarine Fleet':        { adj: 'Nautical',    noun: 'Fleet',      entity: 'captain',       unit: 'torpedoes',     verb: 'launched', place: 'at sea' },
    'Desert Oasis Builder':   { adj: 'Saharan',     noun: 'Oasis',      entity: 'architect',     unit: 'water units',   verb: 'constructed', place: 'in the desert' },
    'Steampunk Workshop':     { adj: 'Clockwork',   noun: 'Workshop',   entity: 'inventor',      unit: 'gears',         verb: 'assembled', place: 'in the workshop' },
    'Crystal Mining Cave':    { adj: 'Crystalline', noun: 'Cavern',     entity: 'miner',         unit: 'crystals',      verb: 'mined', place: 'in the caves' },
    'Galactic Senate':        { adj: 'Senatorial',  noun: 'Chamber',    entity: 'senator',       unit: 'votes',         verb: 'debated', place: 'in the senate' },
    'Robot Factory':          { adj: 'Automated',   noun: 'Factory',    entity: 'technician',    unit: 'components',    verb: 'manufactured', place: 'on the line' },
  };

  const theme = THEME_DATA[contextTheme] || {
    adj: 'Cosmic', noun: 'Center', entity: 'operator', unit: 'units', verb: 'processed', place: 'at the base'
  };

  // ── Deep clone ─────────────────────────────────────────────────────────────
  let json = JSON.stringify(p);
  const mutated = JSON.parse(json);

  // ── 1. Re-theme the entire description ─────────────────────────────────────
  const framingIntros = {
    everyday_task: `You are working ${theme.place} and need to solve a practical problem.`,
    game_mechanic: `In the ${theme.adj} ${theme.noun}, a ${theme.entity} must complete a challenge.`,
    business_logic: `The ${theme.adj} ${theme.noun} corporation needs a ${theme.entity} to build a critical tool.`,
    scientific_measurement: `A ${theme.entity} at the ${theme.adj} ${theme.noun} is running experiments.`,
    sports_statistics: `The ${theme.adj} ${theme.noun} league needs a ${theme.entity} to analyze performance data.`,
    cooking_recipe: `At the ${theme.adj} ${theme.noun}, a ${theme.entity} is preparing a complex recipe.`,
    school_scenario: `At the ${theme.adj} ${theme.noun} academy, a ${theme.entity} is studying for a test.`,
    travel_planning: `A ${theme.entity} is planning a trip through the ${theme.adj} ${theme.noun}.`,
  };

  const intro = framingIntros[realWorldFraming] || framingIntros.game_mechanic;

  // ── 2. Name / noun replacement pools ────────────────────────────────────────
  const nameReplacements = {
    'Alice': [`${theme.entity} Alpha`, `Agent-${uniqueSeed % 100}`],
    'Bob': [`${theme.entity} Beta`, `Unit-${(uniqueSeed + 1) % 100}`],
    'Charlie': [`${theme.entity} Gamma`, `Operator-${(uniqueSeed + 2) % 100}`],
    'Dave': [`${theme.entity} Delta`, `Node-${(uniqueSeed + 3) % 100}`],
    'Eve': [`${theme.entity} Echo`, `Relay-${(uniqueSeed + 4) % 100}`],
  };

  const nounReplacements = {
    'apples': [theme.unit, 'energy cells', 'data fragments'],
    'oranges': ['shield charges', 'memory chips', 'star fragments'],
    'students': ['recruits', 'cadets', 'trainees'],
    'items': ['artifacts', 'modules', 'components'],
    'coins': [theme.unit, 'gems', 'crystals'],
    'points': ['score units', 'XP shards', 'merit badges'],
    'books': ['scrolls', 'logs', 'blueprints'],
    'numbers': [theme.unit, 'readings', 'measurements'],
    'elements': ['specimens', 'fragments', 'samples'],
    'values': ['metrics', 'signals', 'indicators'],
  };

  // Apply name replacements
  let desc = mutated.description || '';
  for (const [name, replacements] of Object.entries(nameReplacements)) {
    const re = new RegExp(name, 'g');
    desc = desc.replace(re, pick(replacements));
  }
  for (const [noun, replacements] of Object.entries(nounReplacements)) {
    const re = new RegExp(`\\b${noun}\\b`, 'gi');
    desc = desc.replace(re, pick(replacements));
  }

  // ── 3. Prepend themed intro and rewrite description ────────────────────────
  // Extract the core instruction from the original description
  const coreDesc = desc.trim();
  const logicModifierSuffix = {
    standard: '',
    reverse_problem: `\n\nTwist: Instead of finding the result, determine the input that would produce a given output.`,
    add_extra_condition: `\n\nAdditional condition: If any value is negative, handle it specially by taking its absolute value first.`,
    count_instead_of_find: `\n\nInstead of finding the value, count how many valid results exist.`,
    optimize_for_minimum: `\n\nAmong all valid answers, return the minimum possible result.`,
    check_existence_only: `\n\nInstead of computing the full answer, just determine if a valid answer exists. Print "Possible" or "Impossible".`,
  };

  const suffix = logicModifierSuffix[logicModifier] || '';
  mutated.description = `${intro}\n\n${coreDesc}${suffix}`;

  // ── 4. Mutate constraint bounds ────────────────────────────────────────────
  const cr = constraintRange;
  if (mutated.constraints) {
    // Replace numeric bounds in constraint text
    mutated.constraints = mutated.constraints
      .replace(/\b\d{2,}\b/g, (match) => {
        const n = parseInt(match);
        const factor = randInt(1, 3);
        if (n > 100) return String(Math.min(cr.valMax, n * factor));
        return String(randInt(cr.nMin, Math.min(cr.nMax, n * 5)));
      });
    mutated.constraints += ` (${cr.label} scale)`;
  }

  // ── 5. Generate fresh examples with varied numbers ─────────────────────────
  if (Array.isArray(mutated.examples)) {
    mutated.examples = mutated.examples.map((ex, idx) => {
      const inputLines = String(ex.input || '').split('\n');
      const outputLines = String(ex.output || ex.expectedOutput || '').split('\n');

      const allInputInts = inputLines.every(l => /^-?\d+$/.test(l.trim()));
      const allOutputInts = outputLines.every(l => /^-?\d+$/.test(l.trim()));

      if (allInputInts && allOutputInts && inputLines.length <= 5) {
        const offset = randInt(1, 50) + (idx * 17) + (uniqueSeed % 30);
        const scale = pick([1, 2, 3]);
        return {
          ...ex,
          input: inputLines.map(l => {
            const v = parseInt(l);
            return String(v * scale + offset);
          }).join('\n'),
          output: outputLines.map(l => {
            const v = parseInt(l);
            return String(v * scale + offset);
          }).join('\n'),
          explanation: ex.explanation
            ? `${theme.adj} variant: ${ex.explanation} (adjusted by factor ${scale}, offset ${offset})`
            : `${theme.adj} calculation ${theme.place}`,
        };
      }

      // For non-numeric examples, at least re-theme the explanation
      return {
        ...ex,
        explanation: ex.explanation
          ? `${intro.substring(0, 40)}... — ${ex.explanation}`
          : `Scenario ${theme.place}`,
      };
    });
  }

  // ── 6. Generate completely fresh hidden test cases ──────────────────────────
  if (Array.isArray(mutated.hiddenTestCases)) {
    mutated.hiddenTestCases = mutated.hiddenTestCases.map((tc, idx) => {
      const inputLines = String(tc.input || '').split('\n');
      const outputLines = String(tc.expectedOutput || tc.output || '').split('\n');

      const allInputInts = inputLines.every(l => /^-?\d+$/.test(l.trim()));
      const allOutputInts = outputLines.every(l => /^-?\d+$/.test(l.trim()));

      if (allInputInts && allOutputInts && inputLines.length <= 5) {
        const offset = randInt(1, 100) + (idx * 31) + (uniqueSeed % 50);
        return {
          ...tc,
          input: inputLines.map(l => String(parseInt(l) + offset)).join('\n'),
          expectedOutput: outputLines.map(l => String(parseInt(l) + offset)).join('\n'),
        };
      }
      return tc;
    });

    // Add extra edge-case test based on the edge focus dimension
    const edgeCaseTests = {
      empty_or_minimal_input: { input: '0', expectedOutput: '0' },
      all_same_values: { input: '5\n5\n5', expectedOutput: '5' },
      negative_numbers: { input: '-1\n-2\n-3', expectedOutput: '-6' },
      boundary_max_values: { input: String(cr.valMax), expectedOutput: String(cr.valMax) },
      single_element: { input: '42', expectedOutput: '42' },
      sorted_input: { input: '1\n2\n3\n4\n5', expectedOutput: '15' },
      reverse_sorted: { input: '5\n4\n3\n2\n1', expectedOutput: '15' },
      alternating_pattern: { input: '1\n-1\n1\n-1', expectedOutput: '0' },
    };
    const extraTest = edgeCaseTests[edgeCaseFocus];
    if (extraTest) {
      mutated.hiddenTestCases.push(extraTest);
    }
  }

  // ── 7. Update starter code comments ────────────────────────────────────────
  if (mutated.starterCode && typeof mutated.starterCode === 'object') {
    for (const lang of Object.keys(mutated.starterCode)) {
      let code = mutated.starterCode[lang];
      code = code.replace(
        /# Your code here|# Student code here|# Start coding here/g,
        `# ${theme.adj} ${theme.noun} Challenge — write your solution here`
      );
      mutated.starterCode[lang] = code;
    }
  }

  // ── 8. Build a truly unique title ──────────────────────────────────────────
  const titleFormats = [
    `${theme.adj} ${theme.noun}: ${p.title} #${uniqueSeed}`,
    `${contextTheme} — ${p.title} v${uniqueSeed}`,
    `[${theme.adj}] ${p.title} · Challenge ${uniqueSeed}`,
    `${theme.entity}'s ${p.title} (${theme.noun} Edition #${uniqueSeed % 1000})`,
    `${theme.noun} Protocol: ${p.title} — Run ${uniqueSeed}`,
  ];
  mutated.title = pick(titleFormats);

  return mutated;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE SIMILAR / "MORE" PROBLEMS
// ═══════════════════════════════════════════════════════════════════════════════

export async function generateSimilarProblem(problemId, difficulty, userId) {
  const original = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId);
  if (!original) throw new Error('Original problem not found');

  const levelId = original.level_id || 'level1';
  const topicId = original.topic_id || 'variables';

  // Gather ALL previous problems for this topic (not just submitted ones)
  const previousGenerated = getPreviousProblems(levelId, topicId, 30);
  const previousTitles = previousGenerated.map(p => p.title);
  const previousSignatures = previousGenerated.map(p => p.logic_signature).filter(Boolean);

  const variation = buildVariationVector();

  // ─── Try OpenAI with retry loop ──────────────────────────────────────────
  if (config.openaiApiKey && config.openaiApiKey !== 'your-openai-api-key-here') {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const v = attempt === 0 ? variation : buildVariationVector();
        const prompt = buildSimilarProblemPrompt(original, difficulty, v, previousSignatures, previousTitles);

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9 + (attempt * 0.03),
          max_tokens: 2000,
        });

        const content = completion.choices[0].message.content.trim();
        let jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        const problemData = JSON.parse(jsonStr);

        const hash = computeContentHash(problemData.title, problemData.description, problemData.constraints);
        if (isDuplicate(hash)) {
          console.log(`[SimilarGen] Duplicate hash on attempt ${attempt + 1}, retrying...`);
          continue;
        }

        const id = generateId();
        const topicField = `${levelId}_${topicId}`;
        const logicSig = problemData.logic_signature || `${v.contextTheme.replace(/\s/g, '_').toLowerCase()}_similar_${v.uniqueSeed}`;

        db.prepare(`
          INSERT INTO problems (id, title, logic_signature, content_hash, description, topic, difficulty, level_id, topic_id, constraints, examples, hidden_test_cases, starter_code, solution, generated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ai')
        `).run(
          id, problemData.title, logicSig, hash,
          problemData.description, topicField,
          difficulty || original.difficulty, levelId, topicId,
          problemData.constraints, JSON.stringify(problemData.examples),
          JSON.stringify(problemData.hiddenTestCases), JSON.stringify(problemData.starterCode),
          problemData.solution || ''
        );

        registerHash(hash);
        return { id, topic: topicField, levelId, topicId, difficulty: difficulty || original.difficulty, ...problemData };
      } catch (error) {
        console.error(`[SimilarGen] OpenAI attempt ${attempt + 1} failed:`, error.message);
      }
    }
  }

  // ─── Fallback: create a mutated version of the original problem ──────────
  // Parse the original DB row back into a problem object
  const originalProblem = {
    title: original.title,
    description: original.description,
    constraints: original.constraints || '',
    difficulty: difficulty || original.difficulty,
    examples: JSON.parse(original.examples || '[]'),
    hiddenTestCases: JSON.parse(original.hidden_test_cases || '[]'),
    starterCode: JSON.parse(original.starter_code || '{}'),
    solution: original.solution || '',
  };

  return saveMutatedProblem(originalProblem, levelId, topicId, difficulty || original.difficulty, variation);
}
