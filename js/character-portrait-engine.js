/**
 * ============================================================================
 * قلب الغموض : محرك الشخصيات الواقعية والتعبيرات الحية (Photorealistic Noir Cast)
 * 20 بورتريها بشريا واقعيا عالي الجودة (12 ذكر / 8 أنثى) + 240 نموذجا + 8 تعبيرات حية
 * مع تصنيف لغوي دقيق بالوحدات الكلامية يمنع أي التباس بين المذكر والمؤنث نهائيا
 * ============================================================================
 */
(function (global) {
  'use strict';

  function escapeAttr(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fnv1aHash(str) {
    const s = String(str || 'noir');
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  const MALE_PORTRAIT_POOL = [
    'assets/portraits/m_01.webp', // m_01: young software engineer / glasses
    'assets/portraits/m_02.webp', // m_02: senior scientist / grey beard & glasses
    'assets/portraits/m_03.webp', // m_03: stern security officer
    'assets/portraits/m_04.webp', // m_04: sharp corporate lawyer
    'assets/portraits/m_05.webp', // m_05: weathered maritime captain
    'assets/portraits/m_06.webp', // m_06: distinguished retired colonel/director
    'assets/portraits/m_07.webp', // m_07: rugged diving chief
    'assets/portraits/m_08.webp', // m_08: young researcher / assistant
    'assets/portraits/m_09.webp', // m_09: senior forensic doctor
    'assets/portraits/m_10.webp', // m_10: classic fedora noir detective narrator
    'assets/portraits/m_11.webp', // m_11: train engineer / driver
    'assets/portraits/m_12.webp'  // m_12: mysterious witness in shadows
  ];

  const FEMALE_PORTRAIT_POOL = [
    'assets/portraits/f_01.webp', // f_01: Arab neurologist / doctor
    'assets/portraits/f_02.webp', // f_02: Arab lab director / scientist
    'assets/portraits/f_03.webp', // f_03: Arab systems engineer
    'assets/portraits/f_04.webp', // f_04: Arab legal secretary
    'assets/portraits/f_05.webp', // f_05: Arab investigative journalist
    'assets/portraits/f_06.webp', // f_06: Arab astronomer / researcher
    'assets/portraits/f_07.webp', // f_07: distinguished Arab female judge / executive
    'assets/portraits/f_08.webp'  // f_08: young female witness
  ];

  const PROFESSION_PORTRAIT_MAP = {
    M: {
      engineer: 'assets/portraits/m_01.webp',
      scientist: 'assets/portraits/m_02.webp',
      security: 'assets/portraits/m_03.webp',
      lawyer: 'assets/portraits/m_04.webp',
      captain: 'assets/portraits/m_05.webp',
      aristocrat: 'assets/portraits/m_06.webp',
      diver: 'assets/portraits/m_07.webp',
      doctor: 'assets/portraits/m_09.webp',
      narrator: 'assets/portraits/m_10.webp',
      driver: 'assets/portraits/m_11.webp',
      journalist: 'assets/portraits/m_08.webp',
      stranger: 'assets/portraits/m_12.webp',
      civilian: 'assets/portraits/m_08.webp'
    },
    F: {
      doctor: 'assets/portraits/f_01.webp',
      scientist: 'assets/portraits/f_02.webp',
      engineer: 'assets/portraits/f_03.webp',
      lawyer: 'assets/portraits/f_04.webp',
      journalist: 'assets/portraits/f_05.webp',
      astronomer: 'assets/portraits/f_06.webp',
      aristocrat: 'assets/portraits/f_07.webp',
      judge: 'assets/portraits/f_07.webp',
      diver: 'assets/portraits/f_03.webp',
      captain: 'assets/portraits/f_07.webp',
      security: 'assets/portraits/f_05.webp',
      narrator: 'assets/portraits/f_07.webp',
      stranger: 'assets/portraits/f_08.webp',
      civilian: 'assets/portraits/f_08.webp'
    }
  };

  const PROFESSIONS = [
    { id: 'doctor', titleM: 'طبيب شرعي', titleF: 'طبيبة أعصاب' },
    { id: 'scientist', titleM: 'باحث فيزيائي', titleF: 'باحثة علمية' },
    { id: 'engineer', titleM: 'مهندس تقني', titleF: 'مهندسة نظم' },
    { id: 'security', titleM: 'ضابط أمن', titleF: 'مشرفة أمن' },
    { id: 'captain', titleM: 'قبطان بحري', titleF: 'قائدة ملاحة' },
    { id: 'lawyer', titleM: 'مستشار قانوني', titleF: 'محامية جنائية' },
    { id: 'journalist', titleM: 'صحفي استقصائي', titleF: 'صحفية تحقيقات' },
    { id: 'aristocrat', titleM: 'عميد متقاعد', titleF: 'قاضية ومستشارة' },
    { id: 'diver', titleM: 'غواص أعماق', titleF: 'خبيرة غوص' },
    { id: 'narrator', titleM: 'الراوي المحقق', titleF: 'الراوية المحققة' },
    { id: 'stranger', titleM: 'شاهد غامض', titleF: 'شاهدة غامضة' },
    { id: 'civilian', titleM: 'موظف مختص', titleF: 'موظفة مختصة' }
  ];

  // 8 Live Reactive Expressions
  const EXPRESSIONS = {
    calm: { id: 'calm', labelAr: 'هادئ', pillTone: 'calm' },
    suspicious: { id: 'suspicious', labelAr: 'مرتاب', pillTone: 'suspicious' },
    tense: { id: 'tense', labelAr: 'متوتر', pillTone: 'tense' },
    shocked: { id: 'shocked', labelAr: 'مصدوم', pillTone: 'shocked' },
    angry: { id: 'angry', labelAr: 'منفعل', pillTone: 'angry' },
    sad: { id: 'sad', labelAr: 'حزين', pillTone: 'sad' },
    whisper: { id: 'whisper', labelAr: 'هامس', pillTone: 'whisper' },
    broken: { id: 'broken', labelAr: 'حجة مكسورة', pillTone: 'broken' }
  };

  // Pinned Core Cast + Noir Narrator + Recurring Multiverse Cast (Strict Gender & Role Mapping)
  const CORE_CAST_PROFILES = {
    'الراوي التفاعلي': { gender: 'M', profession: 'narrator', portrait: 'assets/portraits/m_10.webp', rim: '#f5b95f' },
    'المحقق': { gender: 'M', profession: 'narrator', portrait: 'assets/portraits/m_10.webp', rim: '#f5b95f' },
    // Daily
    'كريم نصار': { gender: 'M', profession: 'engineer', portrait: 'assets/portraits/m_01.webp', rim: '#38bdf8' },
    'طارق زيدان': { gender: 'M', profession: 'scientist', portrait: 'assets/portraits/m_02.webp', rim: '#f5b95f' },
    'مازن الكيلاني': { gender: 'M', profession: 'security', portrait: 'assets/portraits/m_03.webp', rim: '#a78bfa' },
    // Manor
    'نديم زهران': { gender: 'M', profession: 'lawyer', portrait: 'assets/portraits/m_04.webp', rim: '#f5b95f' },
    'سلمى الكيلاني': { gender: 'F', profession: 'doctor', portrait: 'assets/portraits/f_01.webp', rim: '#38bdf8' },
    'منصور الجبلي': { gender: 'M', profession: 'security', portrait: 'assets/portraits/m_03.webp', rim: '#a78bfa' },
    // Station
    'راشد النجدي': { gender: 'M', profession: 'scientist', portrait: 'assets/portraits/m_02.webp', rim: '#f5b95f' },
    'مريم الهاشمي': { gender: 'F', profession: 'engineer', portrait: 'assets/portraits/f_03.webp', rim: '#38bdf8' },
    'طارق العتيبي': { gender: 'M', profession: 'security', portrait: 'assets/portraits/m_03.webp', rim: '#a78bfa' },
    // Train
    'ليلى الموصلي': { gender: 'F', profession: 'lawyer', portrait: 'assets/portraits/f_04.webp', rim: '#f5b95f' },
    'فريد الشذر': { gender: 'M', profession: 'aristocrat', portrait: 'assets/portraits/m_06.webp', rim: '#38bdf8' },
    'عمران الحلبي': { gender: 'M', profession: 'captain', portrait: 'assets/portraits/m_11.webp', rim: '#a78bfa' },
    // Museum
    'سلمى نصار': { gender: 'F', profession: 'scientist', portrait: 'assets/portraits/f_02.webp', rim: '#f5b95f' },
    'كمال البحيري': { gender: 'M', profession: 'diver', portrait: 'assets/portraits/m_07.webp', rim: '#38bdf8' },
    'زياد الفاروقي': { gender: 'M', profession: 'engineer', portrait: 'assets/portraits/m_08.webp', rim: '#a78bfa' },
    // Island
    'مازن الغساني': { gender: 'M', profession: 'doctor', portrait: 'assets/portraits/m_09.webp', rim: '#f5b95f' },
    'رنا المقدسي': { gender: 'F', profession: 'journalist', portrait: 'assets/portraits/f_05.webp', rim: '#38bdf8' },
    'سليم بحري': { gender: 'M', profession: 'captain', portrait: 'assets/portraits/m_05.webp', rim: '#a78bfa' },
    // Unknown Land
    'سنان راشد': { gender: 'M', profession: 'aristocrat', portrait: 'assets/portraits/m_06.webp', rim: '#f5b95f' },
    'لينا الحسن': { gender: 'F', profession: 'scientist', portrait: 'assets/portraits/f_06.webp', rim: '#38bdf8' },
    'جسار فهد': { gender: 'M', profession: 'engineer', portrait: 'assets/portraits/m_08.webp', rim: '#a78bfa' },
    // Recurring Multiverse Cast
    'ريما نصار': { gender: 'F', profession: 'scientist', portrait: 'assets/portraits/f_02.webp', rim: '#38bdf8' },
    'غسان الكيلاني': { gender: 'M', profession: 'engineer', portrait: 'assets/portraits/m_01.webp', rim: '#f5b95f' },
    'سلافة الأنصاري': { gender: 'F', profession: 'aristocrat', portrait: 'assets/portraits/f_07.webp', rim: '#a78bfa' },
    'رامي سنان': { gender: 'M', profession: 'security', portrait: 'assets/portraits/m_03.webp', rim: '#f5b95f' },
    'منذر العلي': { gender: 'M', profession: 'doctor', portrait: 'assets/portraits/m_09.webp', rim: '#38bdf8' },
    'ليلى الشامي': { gender: 'F', profession: 'engineer', portrait: 'assets/portraits/f_03.webp', rim: '#a78bfa' }
  };

  // Strict Word-Token Sets (Prevents substring collisions like المهندس matching هند!)
  const FEMALE_TITLE_TOKENS = new Set([
    'الدكتورة', 'دكتورة', 'المهندسة', 'مهندسة', 'القاضية', 'قاضية', 'الصحفية', 'صحفية',
    'السكرتيرة', 'سكرتيرة', 'السيدة', 'سيدة', 'الباحثة', 'باحثة', 'الآنسة', 'آنسة',
    'المحامية', 'محامية', 'الطبيبة', 'طبيبة', 'الممرضة', 'ممرضة', 'الشاهدة', 'شاهدة',
    'المديرة', 'مديرة', 'مسؤولة', 'كبيرة', 'خبيرة', 'محللة', 'محققة', 'الراوية', 'أستاذة', 'الأستاذة'
  ]);

  const MALE_TITLE_TOKENS = new Set([
    'المهندس', 'مهندس', 'الدكتور', 'دكتور', 'القاضي', 'قاضي', 'الضابط', 'ضابط',
    'القبطان', 'قبطان', 'العقيد', 'عقيد', 'الكابتن', 'كابتن', 'الأستاذ', 'أستاذ',
    'السيد', 'سيد', 'الباحث', 'باحث', 'السائق', 'سائق', 'الطبيب', 'طبيب',
    'المحامي', 'محامي', 'الصحفي', 'صحفي', 'الشاهد', 'شاهد', 'الحارس', 'حارس',
    'مسؤول', 'كبير', 'رئيس', 'مدير', 'خبير', 'محلل', 'محقق', 'الراوي', 'فني'
  ]);

  const FEMALE_FIRST_NAMES = new Set([
    'سلمى', 'ليلى', 'مريم', 'رنا', 'لينا', 'ريما', 'سلافة', 'نور', 'سارة', 'هند',
    'دانا', 'ريم', 'فاطمة', 'عائشة', 'ياسمين', 'منى', 'هدى', 'ندى', 'أمل', 'علا',
    'نادية', 'سمر', 'مها', 'نهى', 'شهد', 'روان', 'رهف', 'زينب', 'حنين', 'جميلة'
  ]);

  const MALE_FIRST_NAMES = new Set([
    'كريم', 'طارق', 'مازن', 'نديم', 'منصور', 'راشد', 'فريد', 'عمران', 'كمال', 'زياد',
    'سليم', 'سنان', 'جسار', 'يونس', 'سليمان', 'غسان', 'منذر', 'رامي', 'آدم', 'سامي',
    'أحمد', 'خالد', 'عمر', 'فيصل', 'وليد', 'حسام', 'باسل', 'تيم', 'فهد', 'سعد', 'ناصر', 'وليم'
  ]);

  function tokenizeArabicWords(text) {
    return String(text || '')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[()«»"'،,.;:!؟?\-_/]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function inferGenderStrict(name, role = '', voice = '') {
    const cleanName = String(name || '').split('(')[0].trim();
    const nameTokens = tokenizeArabicWords(cleanName);
    const roleTokens = tokenizeArabicWords(role);
    const allTokens = [...nameTokens, ...roleTokens];

    // 1. Check explicit gendered titles in name tokens first
    for (const tok of nameTokens) {
      if (FEMALE_TITLE_TOKENS.has(tok)) return 'F';
      if (MALE_TITLE_TOKENS.has(tok)) return 'M';
    }

    // 2. Check exact standalone first-name tokens
    for (const tok of nameTokens) {
      if (FEMALE_FIRST_NAMES.has(tok)) return 'F';
      if (MALE_FIRST_NAMES.has(tok)) return 'M';
    }

    // 3. Check explicit gendered titles in role/context tokens
    for (const tok of roleTokens) {
      if (FEMALE_TITLE_TOKENS.has(tok)) return 'F';
      if (MALE_TITLE_TOKENS.has(tok)) return 'M';
    }

    // 4. Voice fallback
    const v = String(voice || '').trim();
    if (v === 'Aoede' || v === 'Kore') return 'F';
    if (v === 'Charon' || v === 'Fenrir' || v === 'Puck') return 'M';

    // 5. Ta marbuta ending on primary given name token (excluding male exceptions)
    const maleTaExceptions = new Set(['حمزة', 'أسامة', 'حذيفة', 'معاوية', 'قتيبة', 'عكرمة']);
    for (const tok of allTokens) {
      if (tok.endsWith('ة') && !maleTaExceptions.has(tok) && tok.length >= 3) {
        return 'F';
      }
    }
    return 'M';
  }

  function inferProfession(combinedText, slotHint) {
    const t = String(combinedText || '');
    if (/(راوي|محقق|متحري)/.test(t)) return 'narrator';
    if (/(طبيب|طبيبة|أعصاب|دواء|صحي|ممرض|إسعاف)/.test(t)) return 'doctor';
    if (/(فلك|مرصد|تلسكوب|كواكب|نجوم)/.test(t)) return 'astronomer';
    if (/(فيزياء|كيميائ|مختبر|أبحاث|باحث|باحثة|علمي|تصوير)/.test(t)) return 'scientist';
    if (/(غوص|غواص|بحري|تحت الماء|أعماق)/.test(t)) return 'diver';
    if (/(سائق|قطار|سكة)/.test(t)) return 'driver';
    if (/(قبطان|ملاحة|سفينة|طيار)/.test(t)) return 'captain';
    if (/(أمن|حراسة|حارس|ضابط|شرطة|مباحث)/.test(t)) return 'security';
    if (/(مهندس|مهندسة|تطوير|برمجيات|صيانة|فني|رصد)/.test(t)) return 'engineer';
    if (/(قاضية|قاضي|قضائي)/.test(t)) return 'judge';
    if (/(قانون|محام|سكرتير|سكرتيرة)/.test(t)) return 'lawyer';
    if (/(صحفي|صحفية|إعلام|مراسل|أخبار)/.test(t)) return 'journalist';
    if (/(عالم مواز|شبح|مجهول|غامض)/.test(t)) return 'stranger';
    if (/(مدير|مديرة|رئيس|عميد|عقيد|متقاعد|ثرية)/.test(t)) return 'aristocrat';
    return slotHint || 'civilian';
  }

  // Build 240 Combinatorial Archetypes (12 professions x 2 genders x 10 variants = 240)
  const RIM_ACCENTS = ['#f5b95f', '#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#e2b56b'];
  const ARCHETYPE_CATALOG = [];
  (function buildArchetypeCatalog() {
    for (let p = 0; p < PROFESSIONS.length; p++) {
      const prof = PROFESSIONS[p];
      for (const gender of ['M', 'F']) {
        const pool = gender === 'F' ? FEMALE_PORTRAIT_POOL : MALE_PORTRAIT_POOL;
        const primaryPortrait =
          (PROFESSION_PORTRAIT_MAP[gender] && PROFESSION_PORTRAIT_MAP[gender][prof.id]) ||
          pool[p % pool.length];
        for (let v = 0; v < 10; v++) {
          const altPortrait = v === 0 ? primaryPortrait : pool[(p + v) % pool.length];
          ARCHETYPE_CATALOG.push({
            archetypeId: `${prof.id}_${gender.toLowerCase()}_${v + 1}`,
            label: `${gender === 'F' ? prof.titleF : prof.titleM} #${v + 1}`,
            profession: prof.id,
            gender,
            portrait: altPortrait,
            rim: RIM_ACCENTS[(p + v) % RIM_ACCENTS.length]
          });
        }
      }
    }
  })();

  function resolveCharacterProfile(input) {
    if (typeof input === 'string') {
      input = { name: input };
    }
    const obj = input && typeof input === 'object' ? input : {};
    const rawName = String(obj.name || 'شخصية غامضة').trim();
    const cleanName = rawName.split('(')[0].trim();
    const roleText = String(obj.role || obj.note || '').trim();
    const fullContext = `${rawName} ${roleText}`.trim();

    // 1. Check pinned core & multiverse recurring cast
    for (const [key, pinned] of Object.entries(CORE_CAST_PROFILES)) {
      if (cleanName === key || cleanName.includes(key) || rawName.includes(key)) {
        return {
          ...pinned,
          name: rawName,
          cleanName,
          role: roleText,
          source: 'pinned_core'
        };
      }
    }

    // 2. Strict gender separation + semantic profession match
    const gender = inferGenderStrict(cleanName, roleText, obj.voice || '');
    const profession = inferProfession(fullContext, 'civilian');
    const pool = gender === 'F' ? FEMALE_PORTRAIT_POOL : MALE_PORTRAIT_POOL;
    const profMap = PROFESSION_PORTRAIT_MAP[gender];
    const h = fnv1aHash(`${cleanName}|${profession}|${gender}`);

    let chosenPortrait = (profMap && profMap[profession]) || pool[h % pool.length];
    // For generic civilian/scientist/stranger, vary across matching gender pool deterministically
    if (!profMap || !profMap[profession] || profession === 'civilian' || profession === 'stranger') {
      chosenPortrait = pool[h % pool.length];
    }

    const slotAccent =
      obj.id === 's1'
        ? '#f5b95f'
        : obj.id === 's2'
          ? '#38bdf8'
          : obj.id === 's3'
            ? '#a78bfa'
            : RIM_ACCENTS[h % RIM_ACCENTS.length];

    return {
      archetypeId: `${profession}_${gender.toLowerCase()}_${(h % 10) + 1}`,
      gender,
      profession,
      portrait: chosenPortrait,
      rim: slotAccent,
      name: rawName,
      cleanName,
      role: roleText,
      source: 'procedural_photorealistic'
    };
  }

  function resolveExpression(emotionOrState, opts = {}) {
    if (opts && opts.alibiBroken) return EXPRESSIONS.broken;
    const raw = String(emotionOrState || '').trim().toLowerCase();

    if (EXPRESSIONS[raw]) return EXPRESSIONS[raw];
    if (/(مكسورة|انهيار|كسر الحجة|اعتراف|متورط)/.test(raw)) return EXPRESSIONS.broken;
    if (/(صدمة|ذهول|مذهول|مفاج|فزع|رعب)/.test(raw)) return EXPRESSIONS.shocked;
    if (/(غضب|تحذير حاد|انفعال حاد|عنيف|مواجهة|اتهام)/.test(raw)) return EXPRESSIONS.angry;
    if (/(توتر|قلق|دفاعي|عاصف|خطر|ارتباك)/.test(raw) || opts.isSelected) return EXPRESSIONS.tense;
    if (/(همس|خافت|مخبأ|سر|ظل|تسلل)/.test(raw)) return EXPRESSIONS.whisper;
    if (/(شجن|حزن|كئيب|أسى|ندم)/.test(raw)) return EXPRESSIONS.sad;
    if (/(ماكر|تشكيك|مريب|شك|غامض|ترقب)/.test(raw)) return EXPRESSIONS.suspicious;
    if (Number(opts.dangerLevel) >= 75) return EXPRESSIONS.tense;
    return EXPRESSIONS.calm;
  }

  function renderPortraitSvg(characterInput, emotionOrExpr = 'calm', options = {}) {
    const profile = resolveCharacterProfile(characterInput);
    const expr = resolveExpression(emotionOrExpr, options);
    const extraClass = options.className ? ` ${escapeAttr(options.className)}` : '';
    const titleAttr = escapeAttr(`${profile.cleanName} (${expr.labelAr})`);

    const crackOverlay =
      expr.id === 'broken'
        ? `<svg class="portrait-broken-shatter" viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <path d="M58 6L43 27l9 6-14 22 6 5-11 16" stroke="#f43f5e" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="40" cy="40" r="38" stroke="#f43f5e" stroke-width="2.6" stroke-dasharray="6 3"/>
          </svg>`
        : '';

    return `<span class="realistic-portrait-frame suspect-portrait-svg gender-${escapeAttr(
      profile.gender.toLowerCase()
    )} state-${escapeAttr(expr.id)}${extraClass}" style="--portrait-rim:${escapeAttr(
      profile.rim || '#f5b95f'
    )};" title="${titleAttr}">
      <img src="${escapeAttr(profile.portrait)}" alt="${titleAttr}" class="realistic-portrait-img" loading="lazy" />
      <span class="realistic-portrait-mood-veil" aria-hidden="true"></span>
      ${crackOverlay}
    </span>`;
  }

  /**
   * المستكشف الذكي لشخصيات المشهد (يربط المشتبه بهم وأي شخصية ثانوية أو متخيلة يذكرها النص لحظيا)
   */
  function extractSceneCharacters(turnData, gameState) {
    const td = turnData && typeof turnData === 'object' ? turnData : {};
    const gs = gameState && typeof gameState === 'object' ? gameState : {};
    const suspects = Array.isArray(gs.suspects)
      ? gs.suspects
      : Array.isArray(gs.caseBible?.suspects)
        ? gs.caseBible.suspects
        : [];
    const textCorpus = `${td.chapter_title || ''} ${td.vocal_reaction || ''} ${td.narrative || ''}`;
    const sceneMood = `${td.vocal_emotion || ''} ${td.mood || ''}`;

    const results = [];
    const seenNames = new Set();

    const genericTitleStop = new Set([
      'الدكتور', 'الدكتورة', 'المهندس', 'المهندسة', 'الباحث', 'الباحثة',
      'الضابط', 'القبطان', 'العقيد', 'السكرتيرة', 'الصحفية', 'الأستاذ',
      'المسؤولة', 'كبير', 'رئيس', 'مدير', 'فريق', 'المتقاعد', 'القاضية', 'الكابتن'
    ]);

    // 1. Core / custom suspects mentioned or focused in this scene
    for (const s of suspects) {
      const fullName = String(s.name || '').trim();
      const shortName = fullName.split('(')[0].trim();
      const words = shortName.split(/\s+/).filter(w => w.length >= 3);
      const isFocusedUpdate =
        td.suspect_update &&
        (td.suspect_update.id === s.id || td.suspect_update.name === fullName);
      const isMentioned =
        textCorpus.includes(shortName) ||
        words.some(w => !genericTitleStop.has(w) && textCorpus.includes(w));

      if (isFocusedUpdate || isMentioned) {
        const prof = resolveCharacterProfile(s);
        const expr = resolveExpression(
          s.alibiBroken ? 'broken' : isFocusedUpdate ? sceneMood : gs.dangerLevel >= 65 ? 'tense' : sceneMood,
          { alibiBroken: Boolean(s.alibiBroken), dangerLevel: gs.dangerLevel }
        );
        seenNames.add(shortName);
        results.push({
          id: s.id || shortName,
          name: fullName,
          shortName,
          role: s.role || 'مشتبه به في القضية',
          voice: s.voice || (prof.gender === 'F' ? 'Aoede' : 'Puck'),
          gender: prof.gender,
          isSuspect: true,
          alibiBroken: Boolean(s.alibiBroken),
          expression: expr.id,
          expressionLabel: expr.labelAr
        });
      }
    }

    // 2. Incidental, victim, or AI-generated characters detected from text
    const titlePatterns = [
      /(?:الأستاذ|أستاذ|القاضي|الدكتور|الدكتورة|المهندس|المهندسة|الضابط|القبطان|العقيد|السكرتيرة|الصحفية|السيد|السيدة|المحامي|المحامية|الطبيب الشرعي|الطبيب|الطبيبة|الشاهد|الشاهدة)\s+([أ-ي]{2,14}(?:\s+[أ-ي]{2,14})?)/g,
      /(كبير المهندسين|كبير الباحثين|فني الرصد|رئيس الغواصين|المسعف|مسؤول الأمن|حارس البوابة)/g
    ];

    const stopWords = new Set(['الذي', 'التي', 'الذين', 'المغلق', 'المفقود', 'القديم', 'الأصلي', 'الرئيسي', 'العليا', 'الأزرق', 'الزجاجي', 'الأول', 'الثاني', 'الثالث']);

    for (const rx of titlePatterns) {
      let m;
      while ((m = rx.exec(textCorpus)) !== null) {
        const matchedFull = m[0].trim();
        const nameTail = (m[1] || matchedFull).trim().split(/\s+/).filter(w => !stopWords.has(w)).join(' ');
        if (!nameTail || nameTail.length < 3) continue;

        const alreadyExists = Array.from(seenNames).some(
          sn => sn.includes(nameTail) || nameTail.includes(sn) || sn.split(/\s+/).some(w => w.length >= 3 && nameTail.includes(w))
        );
        if (alreadyExists) continue;

        const displayName = matchedFull.replace(/\s+(?:الذي|التي|إلى|من|في|على|بعد|قبل)$/, '').trim();
        seenNames.add(nameTail);

        const gender = inferGenderStrict(displayName, '', '');
        const isInjuredOrVictim = /(فاقدا للوعي|اختناق|يختنق|مقيدا|محبوس|حبس|ضحية|الجثة|الراحل)/.test(textCorpus);
        const expr = resolveExpression(isInjuredOrVictim ? 'tense' : sceneMood, {
          dangerLevel: gs.dangerLevel
        });

        results.push({
          id: `npc_${fnv1aHash(displayName)}`,
          name: displayName,
          shortName: displayName,
          role: 'شخصية مرتبطة بأحداث المشهد',
          voice: gender === 'F' ? 'Aoede' : 'Puck',
          gender,
          isSuspect: false,
          alibiBroken: false,
          expression: expr.id,
          expressionLabel: expr.labelAr
        });

        if (results.length >= 6) break;
      }
      if (results.length >= 6) break;
    }

    return results.slice(0, 6);
  }

  function getCatalogStats() {
    return {
      pinnedCoreCount: Object.keys(CORE_CAST_PROFILES).length,
      malePortraitsCount: MALE_PORTRAIT_POOL.length,
      femalePortraitsCount: FEMALE_PORTRAIT_POOL.length,
      totalArchetypes: ARCHETYPE_CATALOG.length,
      expressionCount: Object.keys(EXPRESSIONS).length,
      totalRenderedVariants: ARCHETYPE_CATALOG.length * Object.keys(EXPRESSIONS).length
    };
  }

  global.MysteryCharacterEngine = {
    EXPRESSIONS,
    CORE_CAST_PROFILES,
    ARCHETYPE_CATALOG,
    MALE_PORTRAIT_POOL,
    FEMALE_PORTRAIT_POOL,
    inferGenderStrict,
    resolveCharacterProfile,
    resolveExpression,
    renderPortraitSvg,
    extractSceneCharacters,
    getCatalogStats
  };
})(typeof window !== 'undefined' ? window : globalThis);
