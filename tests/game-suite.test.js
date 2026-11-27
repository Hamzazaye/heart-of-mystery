const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

function loadCaseBibles() {
  const ctx = { console, Math, Date, RegExp, Object, Array, JSON, Set, Map };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'case-bibles.js'), 'utf8'), ctx);
  return ctx.MysteryCaseBibles;
}

function loadAiEngine() {
  const ctx = {
    console,
    Math,
    Date,
    RegExp,
    Object,
    Array,
    JSON,
    Set,
    Map,
    setTimeout,
    clearTimeout,
    fetch: async () => {
      throw new Error('offline test stub');
    }
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'case-bibles.js'), 'utf8'), ctx);
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'ai-engine.js'), 'utf8'), ctx);
  return new ctx.MysteryAIEngine();
}

function normalizeAudioKey(rawText) {
  return String(rawText || '')
    .replace(/<\s*(?:breath|gasp|sigh|laugh|chuckle|groan|whisper|short pause|medium pause|long pause|pause)\s*>/gi, ' ')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[«»"'،,.;:!؟?\-\s]+/g, ' ')
    .trim()
    .slice(0, 260);
}

test('1. Syntax check on sw.js, js/*.js, and Cloudflare Edge ESM functions', () => {
  const jsFiles = [
    'sw.js',
    ...fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => path.join('js', f))
  ];
  for (const rel of jsFiles) {
    execFileSync(process.execPath, ['--check', path.join(ROOT, rel)], { stdio: 'pipe' });
  }
  const esmFiles = [
    path.join('functions', '_middleware.js'),
    path.join('functions', 'api', 'config.js'),
    path.join('functions', 'api', 'interactions.js')
  ];
  for (const rel of esmFiles) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    execFileSync(process.execPath, ['--input-type=module', '--check'], { input: code, stdio: 'pipe' });
  }
});

test('2. Case Bibles integrity: 7 valid cases, 3 chapters, 5 clues with red herring, 8 mythic endings', () => {
  const { CASE_BIBLES, MYTHIC_SECRET_ENDINGS, validateCaseBible } = loadCaseBibles();
  const coreIds = ['daily', 'manor', 'station', 'train', 'museum', 'island', 'unknown_land'];
  for (const id of coreIds) {
    const bible = CASE_BIBLES[id];
    assert.ok(bible, `Missing CASE_BIBLES.${id}`);
    const check = validateCaseBible(bible);
    assert.equal(check.valid, true, `validateCaseBible(${id}) failed: ${JSON.stringify(check)}`);
    assert.equal(bible.authoredChapters.length, 3, `${id} should have 3 authored chapters`);
    assert.equal(bible.clues.length, 5, `${id} should have 5 clues`);
    assert.ok(
      bible.clues.some(c => c.isRedHerring === true),
      `${id} should include at least 1 red herring clue`
    );
  }
  assert.equal(Object.keys(MYTHIC_SECRET_ENDINGS).length, 8);
});

test('3. End-to-end deterministic simulation & verdict endings on daily and museum', () => {
  const api = loadCaseBibles();
  const casesToTest = [
    { id: 'daily', innocentId: 's3', bluffClueId: 'c2' },
    { id: 'museum', innocentId: 's3', bluffClueId: 'c1' }
  ];

  for (const spec of casesToTest) {
    const bible = api.getLockedCaseBible(spec.id, '', 'آدم');
    const gameState = {
      playerName: 'آدم',
      scenarioId: spec.id,
      turn: 3,
      dangerLevel: 20,
      twistProgress: 80,
      caseBible: bible,
      clues: bible.clues.map(c => ({ id: c.id, title: c.title, description: c.description, isRedHerring: Boolean(c.isRedHerring) })),
      suspects: bible.suspects.map(s => ({ ...s, alibiBroken: false })),
      secrets: []
    };

    const innocentAttempt = api.interrogateSuspectWithClue(bible, gameState, spec.innocentId, spec.bluffClueId);
    assert.equal(innocentAttempt.ok, true);
    assert.equal(innocentAttempt.alibiBroken, false);

    const culpritAttempt = api.interrogateSuspectWithClue(bible, gameState, bible.culpritId, bible.decisiveClueId);
    assert.equal(culpritAttempt.ok, true);
    assert.equal(culpritAttempt.alibiBroken, true);
    assert.equal(culpritAttempt.outcomeType, 'ALIBI_BROKEN');

    const baseClues3 = bible.clues
      .filter(c => !c.isRedHerring)
      .slice(0, 3)
      .map(c => ({ id: c.id, title: c.title, description: c.description, isRedHerring: false }));
    if (!baseClues3.some(c => c.id === bible.decisiveClueId)) {
      const dc = bible.clues.find(c => c.id === bible.decisiveClueId);
      baseClues3[baseClues3.length - 1] = { id: dc.id, title: dc.title, description: dc.description, isRedHerring: false };
    }
    const perfectState = { ...gameState, clues: baseClues3, suspects: bible.suspects.map(s => ({ ...s, alibiBroken: s.id === bible.culpritId })) };

    const perfectCheck = api.evaluateVerdict(bible, {
      suspectId: bible.culpritId,
      motiveId: bible.motiveId,
      clueId: bible.decisiveClueId
    }, perfectState);
    assert.equal(perfectCheck.isPerfect, true);
    const perfectOutcome = api.buildFinalEndingOutcome(bible, perfectCheck, perfectState);
    assert.equal(perfectOutcome.endingCode, 'ENDING_1_PERFECT');
    assert.equal(perfectOutcome.stars, 5);

    const wrongMotiveCheck = api.evaluateVerdict(bible, {
      suspectId: bible.culpritId,
      motiveId: 'm_wrong',
      clueId: bible.decisiveClueId
    }, perfectState);
    assert.equal(api.buildFinalEndingOutcome(bible, wrongMotiveCheck, perfectState).endingCode, 'ENDING_2_WRONG_MOTIVE');

    const wrongCulpritCheck = api.evaluateVerdict(bible, {
      suspectId: spec.innocentId,
      motiveId: bible.motiveId,
      clueId: bible.decisiveClueId
    }, perfectState);
    const wrongCulpritOutcome = api.buildFinalEndingOutcome(bible, wrongCulpritCheck, perfectState);
    assert.ok(
      ['ENDING_4_WRONG_SUSPECT', 'ENDING_3_WEAK_PROOF', 'ENDING_5_COLD_CASE'].includes(wrongCulpritOutcome.endingCode),
      `Unexpected code for wrong culprit: ${wrongCulpritOutcome.endingCode}`
    );

    const mythicState = { ...gameState, forceMythicSecretEnding: true };
    const mythicOutcome = api.buildFinalEndingOutcome(bible, perfectCheck, mythicState);
    assert.equal(mythicOutcome.endingCode, 'ENDING_6_MYTHIC_SECRET');
    assert.equal(mythicOutcome.stars, 6);
  }
});

test('4. Free-action semantic branching produces 4 distinct moods and reactions', async () => {
  const ai = loadAiEngine();
  const { getLockedCaseBible } = loadCaseBibles();
  const bible = getLockedCaseBible('museum', '', 'آدم');
  const gameState = {
    playerName: 'آدم',
    scenarioId: 'museum',
    scenarioTitle: bible.title,
    turn: 1,
    twistProgress: 20,
    caseBible: bible,
    clues: [bible.clues[0]],
    suspects: bible.suspects.map(s => ({ ...s }))
  };

  const forceRes = await ai.generateCaseBibleTurn(gameState, 'أحطم الباب بقوة');
  const inspectRes = await ai.generateCaseBibleTurn(gameState, 'أفحص الزجاج بالعدسة');
  const stealthRes = await ai.generateCaseBibleTurn(gameState, 'أتسلل بصمت وأراقبهم');
  const confrontRes = await ai.generateCaseBibleTurn(gameState, 'أواجه المديرة بسؤال مباشر');

  const moods = new Set([forceRes.mood, inspectRes.mood, stealthRes.mood, confrontRes.mood]);
  const reactions = new Set([
    forceRes.vocal_reaction,
    inspectRes.vocal_reaction,
    stealthRes.vocal_reaction,
    confrontRes.vocal_reaction
  ]);
  assert.equal(moods.size, 4, 'Expected 4 distinct moods across force/inspect/stealth/confront');
  assert.equal(reactions.size, 4, 'Expected 4 distinct vocal reactions across semantic branches');
});

test('5. Audio manifest integrity: presets match, all MP3s exist (>512B), 0 orphans, 0 _queue.json', () => {
  const mCtx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'static-audio-manifest.js'), 'utf8'), mCtx);
  const manifest = mCtx.window.MYSTERY_STATIC_AUDIO_MANIFEST || {};
  const entries = Object.entries(manifest);
  assert.ok(entries.length >= 380, `Expected >= 380 audio entries, found ${entries.length}`);

  const appCode = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
  const presetsMatch = appCode.match(/const SCENARIO_PRESETS\s*=\s*\{[\s\S]*?\n\s*\};/);
  assert.ok(presetsMatch, 'SCENARIO_PRESETS must exist in app.js');
  const pCtx = {};
  vm.runInNewContext(presetsMatch[0].replace('const SCENARIO_PRESETS', 'var SCENARIO_PRESETS'), pCtx);
  for (const [key, preset] of Object.entries(pCtx.SCENARIO_PRESETS)) {
    assert.ok(
      manifest[normalizeAudioKey(preset.teaserVoice)],
      `SCENARIO_PRESETS.${key}.teaserVoice missing from static audio manifest`
    );
  }

  const referenced = new Set();
  for (const [, rel] of entries) {
    const abs = path.join(ROOT, rel);
    assert.ok(fs.existsSync(abs), `Missing mp3 file: ${rel}`);
    assert.ok(fs.statSync(abs).size > 512, `MP3 too small: ${rel}`);
    referenced.add(path.basename(rel));
  }

  const diskFiles = fs.readdirSync(path.join(ROOT, 'audio', 'clips'));
  assert.ok(!diskFiles.includes('_queue.json'), '_queue.json must not remain on disk');
  const orphans = diskFiles.filter(f => !referenced.has(f));
  assert.deepEqual(orphans, [], `Unexpected orphan audio clips: ${orphans.join(', ')}`);
});

test('6. Hygiene & Asset budgets: dashes, diacritics, CJK punctuation, CSS vars, DOM IDs, WebP scenes < 150KB', () => {
  const jsFiles = [
    'sw.js',
    ...fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f)
  ];
  const allFiles = ['index.html', 'styles.css', ...jsFiles, 'functions/_middleware.js', 'functions/api/config.js', 'functions/api/interactions.js'];

  for (const rel of allFiles) {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.equal(content.match(/[\u2013\u2014]/g), null, `Unexpected em/en dash in ${rel}`);
  }

  for (const rel of ['index.html', 'styles.css', 'sw.js', 'js/ai-engine.js', 'js/app.js', 'js/case-bibles.js', 'js/character-portrait-engine.js', 'js/multiverse-engine.js', 'js/viral-growth-engine.js']) {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.equal(content.match(/[\u064B-\u065F\u0670]/g), null, `Unexpected visible diacritic in ${rel}`);
    assert.equal(content.match(/[\u3000-\u303F\uFF00-\uFFEF]/g), null, `Unexpected CJK punctuation in ${rel}`);
  }

  const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
  const defVars = new Set([...css.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)].map(m => m[1]));
  const usedVars = new Set([...css.matchAll(/var\((--[a-zA-Z0-9_-]+)/g)].map(m => m[1]));
  const undefVars = [...usedVars].filter(v => v !== '--spot-x' && v !== '--spot-y' && !defVars.has(v));
  assert.deepEqual(undefVars, [], `Undefined CSS variables: ${undefVars.join(', ')}`);

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const appCode = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
  const idRefs = new Set([...appCode.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(m => m[1]));
  const missingIds = [...idRefs].filter(id => !new RegExp(`id=["']${id}["']`).test(html));
  assert.deepEqual(missingIds, [], `Missing DOM IDs in index.html: ${missingIds.join(', ')}`);

  const webpAssets = [
    'assets/hero-noir-backdrop.webp',
    ...['daily', 'unknown_land', 'manor', 'station', 'train', 'museum', 'island', 'multiverse', 'custom'].map(id => `assets/scenes/${id}.webp`)
  ];
  for (const rel of webpAssets) {
    const abs = path.join(ROOT, rel);
    assert.ok(fs.existsSync(abs), `Missing WebP asset: ${rel}`);
    const size = fs.statSync(abs).size;
    assert.ok(size > 1000 && size < 150 * 1024, `${rel} size (${size}B) out of <150KB WebP budget`);
  }
});

test('7. Character Portrait Engine: 240+ archetypes, 8 expressions, core cast pinning & smart scene extraction', () => {
  const ctx = { console, Math, Date, RegExp, Object, Array, JSON, Set, Map };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'character-portrait-engine.js'), 'utf8'), ctx);
  const CE = ctx.MysteryCharacterEngine;
  assert.ok(CE, 'MysteryCharacterEngine should attach to window');

  const stats = CE.getCatalogStats();
  assert.ok(stats.totalArchetypes >= 240, `Expected >= 240 archetypes, found ${stats.totalArchetypes}`);
  assert.equal(stats.expressionCount, 8);

  // Core cast gender and profession accuracy across all 7 cases
  const { CASE_BIBLES } = loadCaseBibles();
  const renderedSet = new Set();
  for (const bible of Object.values(CASE_BIBLES)) {
    for (const s of bible.suspects) {
      const prof = CE.resolveCharacterProfile(s);
      if (s.voice === 'Aoede' || s.voice === 'Kore') {
        assert.equal(prof.gender, 'F', `${s.name} should resolve as female`);
      }
      const svg = CE.renderPortraitSvg(s, 'calm');
      assert.ok(svg.includes('<svg') && svg.includes('suspect-portrait-svg'), `Invalid SVG for ${s.name}`);
      renderedSet.add(prof.cleanName);
    }
  }
  assert.equal(renderedSet.size, 21, 'All 21 core cast suspects should be distinct');

  assert.equal(CE.resolveExpression('صدمة وذهول درامي').id, 'shocked');
  assert.equal(CE.resolveExpression('توتر وانفعال دفاعي').id, 'tense');
  assert.equal(CE.resolveExpression('همس مريب').id, 'whisper');
  assert.equal(CE.resolveExpression('calm', { alibiBroken: true }).id, 'broken');

  // Museum Chapter 1 extraction: 3 suspects + الأستاذ يونس
  const museum = CASE_BIBLES.museum;
  const museumCast = CE.extractSceneCharacters(museum.authoredChapters[0], {
    suspects: museum.suspects,
    dangerLevel: 20
  });
  assert.ok(museumCast.some(c => c.isSuspect && c.id === 's1'));
  assert.ok(museumCast.some(c => c.isSuspect && c.id === 's2'));
  assert.ok(museumCast.some(c => c.isSuspect && c.id === 's3'));
  assert.ok(museumCast.some(c => !c.isSuspect && c.name.includes('يونس')), 'Should detect incidental NPC الأستاذ يونس');

  // Dynamic AI-invented custom characters
  const customCast = CE.extractSceneCharacters(
    {
      chapter_title: 'مسرح مخصص',
      mood: 'توتر وغموض',
      vocal_emotion: 'تساؤل ماكر وتشكيك',
      narrative: 'يدخل الطبيب الشرعي سامي وبجواره السيدة نادية التي تراقب الباب بصمت.'
    },
    { suspects: [], dangerLevel: 40 }
  );
  const sami = customCast.find(c => c.name.includes('سامي'));
  const nadia = customCast.find(c => c.name.includes('نادية'));
  assert.ok(sami && nadia, 'Should extract both dynamic custom NPCs');
  assert.equal(CE.resolveCharacterProfile(sami).gender, 'M');
  assert.equal(CE.resolveCharacterProfile(nadia).gender, 'F');
});
