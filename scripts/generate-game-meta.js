#!/usr/bin/env node
/**
 * generate-game-meta.js
 *
 * Writes a meta.json file into each games/<id>/ directory.
 * Meta is used by build-episode-game.js to give DeepSeek richer context
 * when selecting the best-fit game for an episode scene.
 *
 * Usage:
 *   node scripts/generate-game-meta.js [--dry-run]
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const GAMES_DIR = path.join(ROOT, 'games');
const DRY_RUN   = process.argv.includes('--dry-run');

// ─── Game meta catalogue ──────────────────────────────────────────────────────
//
// sceneTypes : tension | action | romantic | mystery | competitive | casual
// mechanic   : tap-burst | hold-release | rhythm | dodge | puzzle | reaction |
//              memory | aim | navigation | balance | sorting | matching
// mood       : any descriptive tags (used in LLM prompt)
// difficulty : easy | moderate | hard (what difficulties this game suits)

const CATALOGUE = [
  {
    id: 'arithmetic-rush',
    title: 'Arithmetic Rush',
    description: 'Solve rapid-fire math problems under a ticking timer. Rewards quick thinking and focus.',
    sceneTypes: ['mystery', 'tension'],
    mechanic: 'reaction',
    mood: ['cerebral', 'urgent', 'high-stakes'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'balance-beam',
    title: 'Balance Beam',
    description: 'Tilt and balance a beam to keep an object centered. Tests steady nerves and fine motor control.',
    sceneTypes: ['tension', 'romantic'],
    mechanic: 'balance',
    mood: ['delicate', 'focused', 'tense'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'balloon-pop',
    title: 'Balloon Pop',
    description: 'Tap floating balloons before they drift away. Light, fast-paced, and satisfying.',
    sceneTypes: ['casual', 'romantic'],
    mechanic: 'tap-burst',
    mood: ['playful', 'carefree', 'joyful'],
    difficulty: ['easy', 'moderate'],
  },
  {
    id: 'basket-catch',
    title: 'Basket Catch',
    description: 'Move a basket to catch falling items while dodging the bad ones.',
    sceneTypes: ['action', 'competitive'],
    mechanic: 'dodge',
    mood: ['energetic', 'reflex', 'fun'],
    difficulty: ['easy', 'moderate'],
  },
  {
    id: 'bomb-defuse',
    title: 'Bomb Defuse',
    description: 'Cut the correct wire or complete precise steps before the timer hits zero. Maximum tension.',
    sceneTypes: ['tension', 'action'],
    mechanic: 'reaction',
    mood: ['desperate', 'high-stakes', 'thriller'],
    difficulty: ['hard'],
  },
  {
    id: 'breakout-blitz',
    title: 'Breakout Blitz',
    description: 'Bounce a ball to break bricks. Escalating pace rewards persistence and spatial awareness.',
    sceneTypes: ['action', 'competitive'],
    mechanic: 'aim',
    mood: ['persistent', 'energetic', 'determined'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'cannon-aim',
    title: 'Cannon Aim',
    description: 'Aim and fire a cannon at moving targets with precision timing.',
    sceneTypes: ['action', 'competitive'],
    mechanic: 'aim',
    mood: ['decisive', 'sharp', 'bold'],
    difficulty: ['moderate'],
  },
  {
    id: 'code-breaker',
    title: 'Code Breaker',
    description: 'Deduce a hidden code through logic and elimination — a cerebral puzzle under time pressure.',
    sceneTypes: ['mystery'],
    mechanic: 'puzzle',
    mood: ['analytical', 'investigative', 'clever'],
    difficulty: ['hard'],
  },
  {
    id: 'color-match',
    title: 'Color Match',
    description: 'Match colors quickly as patterns flash on screen. Simple but addictive.',
    sceneTypes: ['casual', 'romantic'],
    mechanic: 'matching',
    mood: ['cheerful', 'quick', 'light'],
    difficulty: ['easy', 'moderate'],
  },
  {
    id: 'conveyor-sort',
    title: 'Conveyor Sort',
    description: 'Sort items on a moving conveyor belt into the correct bins. Tests order and speed.',
    sceneTypes: ['mystery', 'action'],
    mechanic: 'sorting',
    mood: ['methodical', 'busy', 'focused'],
    difficulty: ['moderate'],
  },
  {
    id: 'dial-safe',
    title: 'Dial Safe',
    description: 'Rotate a combination dial with precision to crack the safe. Demands patience and steady hands.',
    sceneTypes: ['mystery', 'tension'],
    mechanic: 'balance',
    mood: ['secretive', 'precise', 'suspenseful'],
    difficulty: ['hard'],
  },
  {
    id: 'falling-rhythm',
    title: 'Falling Rhythm',
    description: 'Tap falling notes in sync with the beat. Rhythm game that rewards timing over speed.',
    sceneTypes: ['romantic', 'action'],
    mechanic: 'rhythm',
    mood: ['musical', 'flowing', 'expressive'],
    difficulty: ['moderate'],
  },
  {
    id: 'flappy-bird',
    title: 'Flappy Bird',
    description: 'Tap to keep a character airborne through narrow gaps. Punishing but compelling.',
    sceneTypes: ['action', 'tension'],
    mechanic: 'tap-burst',
    mood: ['persistent', 'frustrating', 'triumphant'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'gate-picker',
    title: 'Gate Picker',
    description: 'Choose the correct gate as they scroll past. Split-second decisions under pressure.',
    sceneTypes: ['mystery', 'action'],
    mechanic: 'reaction',
    mood: ['decisive', 'instinctive', 'risky'],
    difficulty: ['easy', 'moderate'],
  },
  {
    id: 'goalie-guard',
    title: 'Goalie Guard',
    description: 'Dive to block penalty shots as a goalkeeper. Reflex-driven and competitive.',
    sceneTypes: ['competitive', 'action'],
    mechanic: 'reaction',
    mood: ['athletic', 'clutch', 'heroic'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'jump-hurdle',
    title: 'Jump Hurdle',
    description: 'Time taps to jump over incoming hurdles. A runner with precise rhythm.',
    sceneTypes: ['action', 'competitive'],
    mechanic: 'rhythm',
    mood: ['athletic', 'determined', 'racing'],
    difficulty: ['moderate'],
  },
  {
    id: 'lane-dash',
    title: 'Lane Dash',
    description: 'Switch lanes to dodge obstacles in an endless runner. Speed increases over time.',
    sceneTypes: ['action', 'competitive'],
    mechanic: 'dodge',
    mood: ['racing', 'adrenaline', 'urgent'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'maze-escape',
    title: 'Maze Escape',
    description: 'Navigate a maze to find the exit before time runs out. Tests spatial reasoning.',
    sceneTypes: ['mystery', 'tension'],
    mechanic: 'navigation',
    mood: ['trapped', 'searching', 'escaping'],
    difficulty: ['hard'],
  },
  {
    id: 'memory-flip',
    title: 'Memory Flip',
    description: 'Flip cards to find matching pairs. Classic memory test with escalating complexity.',
    sceneTypes: ['mystery', 'romantic'],
    mechanic: 'memory',
    mood: ['nostalgic', 'patient', 'thoughtful'],
    difficulty: ['moderate'],
  },
  {
    id: 'merge-2048',
    title: 'Merge 2048',
    description: 'Slide and merge numbered tiles to reach 2048. Deep strategy under tile pressure.',
    sceneTypes: ['mystery'],
    mechanic: 'puzzle',
    mood: ['strategic', 'methodical', 'satisfying'],
    difficulty: ['hard'],
  },
  {
    id: 'meteor-dodge',
    title: 'Meteor Dodge',
    description: 'Dodge a rain of meteors with quick reflexes. Escalating intensity and chaos.',
    sceneTypes: ['tension', 'action'],
    mechanic: 'dodge',
    mood: ['chaotic', 'desperate', 'survival'],
    difficulty: ['hard'],
  },
  {
    id: 'mini-golf-putt',
    title: 'Mini Golf Putt',
    description: 'Aim and time a putt to sink the ball in as few shots as possible.',
    sceneTypes: ['romantic', 'casual'],
    mechanic: 'aim',
    mood: ['playful', 'relaxed', 'charming'],
    difficulty: ['easy', 'moderate'],
  },
  {
    id: 'odd-one-out',
    title: 'Odd One Out',
    description: 'Spot the item that doesn\'t belong in the group. Perception over speed.',
    sceneTypes: ['mystery', 'casual'],
    mechanic: 'matching',
    mood: ['observant', 'curious', 'deductive'],
    difficulty: ['easy', 'moderate'],
  },
  {
    id: 'orbit-avoid',
    title: 'Orbit Avoid',
    description: 'Orbit a center point while dodging obstacles rotating at different speeds.',
    sceneTypes: ['action', 'tension'],
    mechanic: 'dodge',
    mood: ['hypnotic', 'precise', 'tense'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'parking-rush',
    title: 'Parking Rush',
    description: 'Slide cars to clear a path for the target vehicle. A spatial puzzle race.',
    sceneTypes: ['mystery', 'action'],
    mechanic: 'puzzle',
    mood: ['methodical', 'clever', 'satisfying'],
    difficulty: ['moderate'],
  },
  {
    id: 'path-picker',
    title: 'Path Picker',
    description: 'Choose branching paths to navigate a network and reach the goal fastest.',
    sceneTypes: ['mystery', 'tension'],
    mechanic: 'navigation',
    mood: ['calculating', 'instinctive', 'consequential'],
    difficulty: ['moderate'],
  },
  {
    id: 'power-swing',
    title: 'Power Swing',
    description: 'Tap at the perfect moment to swing for maximum power — a golf-style timing game.',
    sceneTypes: ['action', 'competitive'],
    mechanic: 'rhythm',
    mood: ['bold', 'confident', 'decisive'],
    difficulty: ['moderate'],
  },
  {
    id: 'pulse-keeper',
    title: 'Pulse Keeper',
    description: 'Hold a button to sync a moving marker with a rhythm band. Sustained concentration.',
    sceneTypes: ['tension', 'romantic'],
    mechanic: 'hold-release',
    mood: ['intimate', 'steady', 'tense'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'qte-boss-parry',
    title: 'QTE Boss Parry',
    description: 'React to a boss\'s attacks with precisely timed parry inputs. High-pressure confrontation.',
    sceneTypes: ['action', 'tension'],
    mechanic: 'reaction',
    mood: ['confrontational', 'intense', 'heroic'],
    difficulty: ['hard'],
  },
  {
    id: 'qte-challenge',
    title: 'QTE Challenge',
    description: 'General quick-time events — hit the correct input at the right moment.',
    sceneTypes: ['action', 'tension'],
    mechanic: 'reaction',
    mood: ['urgent', 'reactive', 'kinetic'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'qte-direction-switch',
    title: 'QTE Direction Switch',
    description: 'Swipe in the indicated direction before the window closes. Tests spatial reflexes.',
    sceneTypes: ['action', 'competitive'],
    mechanic: 'reaction',
    mood: ['instinctive', 'fast', 'energetic'],
    difficulty: ['moderate'],
  },
  {
    id: 'qte-hold-release',
    title: 'QTE Hold & Release',
    description: 'Hold a button until the perfect moment, then release. The tension of perfect timing.',
    sceneTypes: ['tension', 'romantic'],
    mechanic: 'hold-release',
    mood: ['anticipation', 'restraint', 'release'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'qte-sequence-recall',
    title: 'QTE Sequence Recall',
    description: 'Memorize and replay a button sequence under time pressure.',
    sceneTypes: ['mystery', 'tension'],
    mechanic: 'memory',
    mood: ['alert', 'focused', 'cerebral'],
    difficulty: ['hard'],
  },
  {
    id: 'quiz-gauntlet',
    title: 'Quiz Gauntlet',
    description: 'Answer a rapid series of trivia questions. Knowledge and speed win the day.',
    sceneTypes: ['mystery', 'competitive'],
    mechanic: 'reaction',
    mood: ['intellectual', 'competitive', 'triumphant'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'rapid-memory',
    title: 'Rapid Memory',
    description: 'Flash cards appear briefly — memorize and recall their positions. Speed memory test.',
    sceneTypes: ['mystery', 'action'],
    mechanic: 'memory',
    mood: ['alert', 'sharp', 'intense'],
    difficulty: ['hard'],
  },
  {
    id: 'reactor-cooler',
    title: 'Reactor Cooler',
    description: 'Balance multiple systems simultaneously to prevent overload. Demands divided attention.',
    sceneTypes: ['tension', 'action'],
    mechanic: 'balance',
    mood: ['critical', 'high-pressure', 'technical'],
    difficulty: ['hard'],
  },
  {
    id: 'red-light-green-light',
    title: 'Red Light Green Light',
    description: 'Move only on green, freeze on red — react instantly or lose everything.',
    sceneTypes: ['tension', 'competitive'],
    mechanic: 'reaction',
    mood: ['dread', 'survival', 'nerve-wracking'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'shape-match',
    title: 'Shape Match',
    description: 'Match falling shapes to their outlines. Quick pattern recognition under mild pressure.',
    sceneTypes: ['casual', 'mystery'],
    mechanic: 'matching',
    mood: ['orderly', 'satisfying', 'calm'],
    difficulty: ['easy', 'moderate'],
  },
  {
    id: 'shell-shuffle',
    title: 'Shell Shuffle',
    description: 'Track a hidden object under shuffling cups. Tests visual focus and memory.',
    sceneTypes: ['mystery', 'competitive'],
    mechanic: 'memory',
    mood: ['suspicious', 'playful', 'cunning'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'slot-machine',
    title: 'Slot Machine',
    description: 'Pull the lever and stop the reels at the right moment for the best alignment.',
    sceneTypes: ['casual', 'romantic'],
    mechanic: 'rhythm',
    mood: ['risky', 'fun', 'lucky'],
    difficulty: ['easy'],
  },
  {
    id: 'snake-sprint',
    title: 'Snake Sprint',
    description: 'Grow a snake by collecting items while avoiding walls and your own tail.',
    sceneTypes: ['action', 'competitive'],
    mechanic: 'navigation',
    mood: ['growing', 'strategic', 'escalating'],
    difficulty: ['moderate'],
  },
  {
    id: 'spotlight-seek',
    title: 'Spotlight Seek',
    description: 'Move a spotlight to reveal and tap hidden objects in the dark. Atmospheric discovery.',
    sceneTypes: ['mystery', 'romantic'],
    mechanic: 'navigation',
    mood: ['secretive', 'curious', 'intimate'],
    difficulty: ['easy', 'moderate'],
  },
  {
    id: 'stack-drop',
    title: 'Stack Drop',
    description: 'Drop blocks to build the tallest aligned stack. Each miss narrows the platform.',
    sceneTypes: ['competitive', 'action'],
    mechanic: 'rhythm',
    mood: ['precise', 'building', 'pressured'],
    difficulty: ['moderate'],
  },
  {
    id: 'stardew-fishing',
    title: 'Stardew Fishing',
    description: 'Hold a button to lift a bobber and keep it in the moving catch zone. Peaceful tension.',
    sceneTypes: ['romantic', 'casual'],
    mechanic: 'hold-release',
    mood: ['patient', 'serene', 'rewarding'],
    difficulty: ['easy', 'moderate'],
  },
  {
    id: 'survive-30-seconds',
    title: 'Survive 30 Seconds',
    description: 'Dodge everything thrown at you for exactly 30 seconds. Pure survival instinct.',
    sceneTypes: ['tension', 'action'],
    mechanic: 'dodge',
    mood: ['desperate', 'survival', 'relentless'],
    difficulty: ['hard'],
  },
  {
    id: 'target-tap',
    title: 'Target Tap',
    description: 'Tap shrinking targets before they vanish. Precision and speed under time pressure.',
    sceneTypes: ['action', 'competitive'],
    mechanic: 'tap-burst',
    mood: ['sharp', 'focused', 'quick'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'tile-trace',
    title: 'Tile Trace',
    description: 'Trace a highlighted path across tiles without error. Memory meets spatial execution.',
    sceneTypes: ['mystery', 'tension'],
    mechanic: 'memory',
    mood: ['careful', 'deliberate', 'focused'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'traffic-control',
    title: 'Traffic Control',
    description: 'Manage intersections to prevent collisions. Multi-tasking under growing pressure.',
    sceneTypes: ['mystery', 'action'],
    mechanic: 'sorting',
    mood: ['hectic', 'orchestrating', 'stressful'],
    difficulty: ['moderate', 'hard'],
  },
  {
    id: 'whack-a-mole',
    title: 'Whack-a-Mole',
    description: 'Tap pop-up targets as fast as possible. Classic reflex action with escalating speed.',
    sceneTypes: ['action', 'competitive'],
    mechanic: 'tap-burst',
    mood: ['energetic', 'frenetic', 'fun'],
    difficulty: ['easy', 'moderate'],
  },
  {
    id: 'will-surge',
    title: 'Will Surge',
    description: 'Player taps rapidly to maintain a willpower bar against rising threat pressure. Periodic surge events test burst resistance. A countdown represents rescue arriving. Best for scenes requiring the protagonist to resist, endure, or hold their ground.',
    sceneTypes: ['tension'],
    mechanic: 'tap-burst',
    mood: ['defiant', 'desperate', 'enduring', 'survival'],
    difficulty: ['hard'],
    copyFields: ['gameTitle', 'hint', 'buttonLabel', 'statusHolding', 'statusNeutral', 'statusLosing', 'surgeWarning', 'surgeDefeated', 'rescueLabel', 'threatLabel', 'willLabel'],
  },
  {
    id: 'word-scramble',
    title: 'Word Scramble',
    description: 'Unscramble a shuffled word as fast as possible. Vocabulary and pattern recognition.',
    sceneTypes: ['mystery', 'romantic'],
    mechanic: 'puzzle',
    mood: ['witty', 'playful', 'cerebral'],
    difficulty: ['moderate'],
  },
];

// ─── Write meta files ─────────────────────────────────────────────────────────

let written = 0;
let skipped = 0;
let missing = 0;

for (const meta of CATALOGUE) {
  const gameDir = path.join(GAMES_DIR, meta.id);
  if (!fs.existsSync(gameDir)) {
    console.warn(`[SKIP] games/${meta.id}/ not found`);
    missing++;
    continue;
  }

  const metaPath = path.join(gameDir, 'meta.json');
  const content  = JSON.stringify(meta, null, 2) + '\n';

  if (DRY_RUN) {
    console.log(`[DRY]  Would write: games/${meta.id}/meta.json`);
    skipped++;
    continue;
  }

  fs.writeFileSync(metaPath, content, 'utf8');
  console.log(`[OK]   games/${meta.id}/meta.json`);
  written++;
}

console.log(`\nDone. Written: ${written}  Dry/skipped: ${skipped}  Missing dirs: ${missing}`);
