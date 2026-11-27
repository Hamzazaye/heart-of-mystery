/**
 * ============================================================================
 * قلب الغموض : محرك الشخصيات الإجرائي والتعبيرات الحية (Procedural Noir Cast)
 * يولد أكثر من 240 نموذجا احترافيا + آلاف التركيبات الفريدة بـ 8 تعبيرات تفاعلية
 * ويربطها تلقائيا بشخصيات القصة وأي شخصية جديدة يذكرها المشهد
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

  const SKIN_TONES = [
    { base: '#f0cbb1', shadow: '#cfa082' },
    { base: '#e5b898', shadow: '#c28d6b' },
    { base: '#d9a784', shadow: '#b37e5b' },
    { base: '#c9936d', shadow: '#9f6a47' },
    { base: '#b57b56', shadow: '#8a5534' },
    { base: '#9b6443', shadow: '#734429' },
    { base: '#f4d6c1', shadow: '#d2ac93' },
    { base: '#c28b67', shadow: '#996240' }
  ];

  const HAIR_COLORS = [
    '#141923', // jet black
    '#1e293b', // slate dark
    '#2c1f18', // dark espresso
    '#3e2b20', // chestnut brown
    '#523828', // warm auburn-brown
    '#64748b', // silver grey
    '#cbd5e1', // distinguished white-silver
    '#472d30'  // deep burgundy-brown
  ];

  const RIM_ACCENTS = [
    '#f5b95f', // warm amber
    '#38bdf8', // sapphire cyan
    '#a78bfa', // arcane violet
    '#34d399', // emerald teal
    '#fb923c', // copper orange
    '#e2b56b'  // champagne gold
  ];

  const EYE_COLORS = ['#1e293b', '#334155', '#3b281c', '#1f3b4d', '#2b3a2e'];

  const PROFESSIONS = [
    { id: 'doctor', titleM: 'طبيب شرعي', titleF: 'طبيبة أعصاب', coat: '#d8e2ec', lapel: '#1e293b', badge: '#ef4444' },
    { id: 'scientist', titleM: 'باحث فيزيائي', titleF: 'باحثة علمية', coat: '#cbd5e1', lapel: '#0ea5e9', badge: '#38bdf8' },
    { id: 'engineer', titleM: 'مهندس تقني', titleF: 'مهندسة نظم', coat: '#243447', lapel: '#f59e0b', badge: '#fbbf24' },
    { id: 'security', titleM: 'ضابط أمن', titleF: 'مشرفة أمن', coat: '#1b263b', lapel: '#334155', badge: '#f5b95f' },
    { id: 'captain', titleM: 'قبطان بحري', titleF: 'قائدة ملاحة', coat: '#16213e', lapel: '#d4a359', badge: '#f5b95f' },
    { id: 'lawyer', titleM: 'مستشار قانوني', titleF: 'محامية جنائية', coat: '#1f2937', lapel: '#9ca3af', badge: '#cbd5e1' },
    { id: 'journalist', titleM: 'صحفي استقصائي', titleF: 'صحفية تحقيقات', coat: '#4a3728', lapel: '#785a40', badge: '#fb923c' },
    { id: 'aristocrat', titleM: 'عميد متقاعد', titleF: 'مديرة تنفيذية', coat: '#2b1f31', lapel: '#a78bfa', badge: '#fcd385' },
    { id: 'diver', titleM: 'غواص أعماق', titleF: 'خبيرة غوص', coat: '#132a3e', lapel: '#06b6d4', badge: '#22d3ee' },
    { id: 'narrator', titleM: 'الراوي المحقق', titleF: 'الراوية المحققة', coat: '#1e1b24', lapel: '#f5b95f', badge: '#fcd385' },
    { id: 'stranger', titleM: 'شاهد غامض', titleF: 'شاهدة غامضة', coat: '#18181b', lapel: '#52525b', badge: '#94a3b8' },
    { id: 'civilian', titleM: 'موظف مختص', titleF: 'موظفة مختصة', coat: '#283344', lapel: '#475569', badge: '#94a3b8' }
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

  // 21 Pinned Core Cast + Noir Narrator DNA Profiles
  const CORE_CAST_PROFILES = {
    'الراوي التفاعلي': { gender: 'M', age: 'senior', profession: 'narrator', skin: 1, hair: 5, hairStyle: 0, facialHair: 2, eyewear: 0, rim: '#f5b95f', hat: 'fedora' },
    'المحقق': { gender: 'M', age: 'adult', profession: 'narrator', skin: 1, hair: 1, hairStyle: 1, facialHair: 1, eyewear: 0, rim: '#f5b95f', hat: 'fedora' },
    // Daily
    'كريم نصار': { gender: 'M', age: 'adult', profession: 'engineer', skin: 1, hair: 0, hairStyle: 2, facialHair: 1, eyewear: 2, rim: '#38bdf8' },
    'طارق زيدان': { gender: 'M', age: 'senior', profession: 'scientist', skin: 2, hair: 5, hairStyle: 3, facialHair: 3, eyewear: 1, rim: '#f5b95f' },
    'مازن الكيلاني': { gender: 'M', age: 'adult', profession: 'security', skin: 3, hair: 0, hairStyle: 4, facialHair: 2, eyewear: 5, rim: '#a78bfa' },
    // Manor
    'نديم زهران': { gender: 'M', age: 'adult', profession: 'lawyer', skin: 0, hair: 2, hairStyle: 1, facialHair: 0, eyewear: 2, rim: '#f5b95f' },
    'سلمى الكيلاني': { gender: 'F', age: 'adult', profession: 'doctor', skin: 0, hair: 2, hairStyle: 1, facialHair: 0, eyewear: 1, rim: '#38bdf8' },
    'منصور الجبلي': { gender: 'M', age: 'senior', profession: 'security', skin: 4, hair: 5, hairStyle: 4, facialHair: 4, eyewear: 0, rim: '#a78bfa' },
    // Station
    'راشد النجدي': { gender: 'M', age: 'senior', profession: 'scientist', skin: 2, hair: 6, hairStyle: 5, facialHair: 3, eyewear: 1, rim: '#f5b95f' },
    'مريم الهاشمي': { gender: 'F', age: 'adult', profession: 'engineer', skin: 1, hair: 0, hairStyle: 2, facialHair: 0, eyewear: 2, rim: '#38bdf8' },
    'طارق العتيبي': { gender: 'M', age: 'adult', profession: 'security', skin: 3, hair: 1, hairStyle: 6, facialHair: 1, eyewear: 0, rim: '#a78bfa' },
    // Train
    'ليلى الموصلي': { gender: 'F', age: 'adult', profession: 'lawyer', skin: 0, hair: 3, hairStyle: 0, facialHair: 0, eyewear: 0, rim: '#f5b95f' },
    'فريد الشذر': { gender: 'M', age: 'senior', profession: 'aristocrat', skin: 2, hair: 6, hairStyle: 3, facialHair: 5, eyewear: 4, rim: '#38bdf8' },
    'عمران الحلبي': { gender: 'M', age: 'adult', profession: 'captain', skin: 3, hair: 2, hairStyle: 7, facialHair: 2, eyewear: 0, rim: '#a78bfa', hat: 'cap' },
    // Museum
    'سلمى نصار': { gender: 'F', age: 'adult', profession: 'scientist', skin: 1, hair: 0, hairStyle: 4, facialHair: 0, eyewear: 2, rim: '#f5b95f' },
    'كمال البحيري': { gender: 'M', age: 'senior', profession: 'diver', skin: 4, hair: 5, hairStyle: 4, facialHair: 3, eyewear: 0, rim: '#38bdf8' },
    'زياد الفاروقي': { gender: 'M', age: 'adult', profession: 'engineer', skin: 1, hair: 2, hairStyle: 8, facialHair: 0, eyewear: 1, rim: '#a78bfa' },
    // Island
    'مازن الغساني': { gender: 'M', age: 'senior', profession: 'doctor', skin: 2, hair: 5, hairStyle: 1, facialHair: 2, eyewear: 1, rim: '#f5b95f' },
    'رنا المقدسي': { gender: 'F', age: 'adult', profession: 'journalist', skin: 0, hair: 7, hairStyle: 3, facialHair: 0, eyewear: 0, rim: '#38bdf8' },
    'سليم بحري': { gender: 'M', age: 'senior', profession: 'captain', skin: 4, hair: 6, hairStyle: 5, facialHair: 4, eyewear: 0, rim: '#a78bfa', hat: 'cap' },
    // Unknown land
    'سنان راشد': { gender: 'M', age: 'senior', profession: 'aristocrat', skin: 2, hair: 6, hairStyle: 3, facialHair: 3, eyewear: 2, rim: '#f5b95f' },
    'لينا الحسن': { gender: 'F', age: 'adult', profession: 'scientist', skin: 1, hair: 2, hairStyle: 5, facialHair: 0, eyewear: 1, rim: '#38bdf8' },
    'جسار فهد': { gender: 'M', age: 'adult', profession: 'engineer', skin: 3, hair: 0, hairStyle: 9, facialHair: 1, eyewear: 0, rim: '#a78bfa' }
  };

  // Build 240 Combinatorial Archetypes (12 professions x 2 genders x 10 variants = 240 archetypes)
  const ARCHETYPE_CATALOG = [];
  (function buildArchetypeCatalog() {
    for (let p = 0; p < PROFESSIONS.length; p++) {
      const prof = PROFESSIONS[p];
      for (const gender of ['M', 'F']) {
        for (let v = 0; v < 10; v++) {
          const seed = p * 23 + (gender === 'F' ? 11 : 0) + v;
          const isSenior = v >= 7;
          ARCHETYPE_CATALOG.push({
            archetypeId: `${prof.id}_${gender.toLowerCase()}_${v + 1}`,
            label: `${gender === 'F' ? prof.titleF : prof.titleM} #${v + 1}`,
            profession: prof.id,
            gender,
            age: isSenior ? 'senior' : 'adult',
            skin: (seed + v * 3) % SKIN_TONES.length,
            hair: isSenior ? 5 + (v % 2) : (seed + v) % 5,
            hairStyle: (seed + v * 7) % 10,
            facialHair: gender === 'M' ? (v % 6) : 0,
            eyewear: v % 6,
            eyeColor: seed % EYE_COLORS.length,
            rim: RIM_ACCENTS[(p + v) % RIM_ACCENTS.length],
            hat: prof.id === 'narrator' ? 'fedora' : prof.id === 'captain' ? 'cap' : ''
          });
        }
      }
    }
  })();

  const FEMALE_NAME_HINTS = /(سلمى|ليلى|مريم|رنا|لينا|نور|سارة|هند|دانا|ريم|فاطمة|عائشة|ياسمين|منى|هدى|ندى|أمل|علا|نادية|سمر|مها|نهى|شهد|روان|رهف|زينب|حنين|جميلة)/;
  const FEMALE_ROLE_HINTS = /(الدكتورة|المهندسة|الصحفية|السكرتيرة|السيدة|الباحثة|الآنسة|المحامية|الطبيبة|الممرضة|الشاهدة|مديرة|مسؤولة|قائدة|الراوية|أستاذة)/;
  const SENIOR_HINTS = /(كبير|متقاعد|عجوز|الأستاذ|أستاذ|عميد|القاضي|قاضي|الراحل|شيخ|قدماء)/;

  function inferProfession(combinedText, slotHint) {
    const t = String(combinedText || '');
    if (/(راوي|محقق|متحري)/.test(t)) return 'narrator';
    if (/(طبيب|طبيبة|أعصاب|دواء|صحي|ممرض|اسعاف|إسعاف)/.test(t)) return 'doctor';
    if (/(فيزياء|كيميائ|مختبر|أبحاث|باحث|فلكي|علمي|تصوير)/.test(t)) return 'scientist';
    if (/(غوص|غواص|بحري|تحت الماء|أعماق)/.test(t)) return 'diver';
    if (/(قبطان|سائق|ملاحة|قطار|سفينة|طيار)/.test(t)) return 'captain';
    if (/(أمن|حراسة|حارس|ضابط|شرطة|مباحث)/.test(t)) return 'security';
    if (/(مهندس|تطوير|برمجيات|صيانة|فني|رصد)/.test(t)) return 'engineer';
    if (/(قانون|قاضي|قضائي|محام|سكرتير)/.test(t)) return 'lawyer';
    if (/(صحفي|إعلام|مراسل|أخبار)/.test(t)) return 'journalist';
    if (/(عالم مواز|شبح|مجهول|غامض)/.test(t)) return 'stranger';
    if (/(مدير|رئيس|عميد|عقيد|متقاعد|ثرية|سيدة)/.test(t)) return 'aristocrat';
    return slotHint || 'civilian';
  }

  function resolveCharacterProfile(input) {
    if (typeof input === 'string') {
      input = { name: input };
    }
    const obj = input && typeof input === 'object' ? input : {};
    const rawName = String(obj.name || 'شخصية غامضة').trim();
    const cleanName = rawName.split('(')[0].trim();
    const roleText = String(obj.role || obj.note || '').trim();
    const fullContext = `${rawName} ${roleText}`.trim();

    // 1. Check pinned core cast map
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

    // 2. Semantic inference + deterministic archetype DNA for unlimited characters
    const voice = String(obj.voice || '');
    const isFemale =
      voice === 'Aoede' ||
      voice === 'Kore' ||
      FEMALE_ROLE_HINTS.test(fullContext) ||
      FEMALE_NAME_HINTS.test(cleanName);
    const gender = isFemale ? 'F' : 'M';
    const isSenior = SENIOR_HINTS.test(fullContext);
    const profession = inferProfession(fullContext, 'civilian');

    const h = fnv1aHash(`${cleanName}|${profession}|${gender}`);
    const matchingArchetypes = ARCHETYPE_CATALOG.filter(
      a => a.profession === profession && a.gender === gender
    );
    const chosenArch =
      matchingArchetypes[h % matchingArchetypes.length] ||
      ARCHETYPE_CATALOG[h % ARCHETYPE_CATALOG.length];

    const slotAccent =
      obj.id === 's1'
        ? '#f5b95f'
        : obj.id === 's2'
          ? '#38bdf8'
          : obj.id === 's3'
            ? '#a78bfa'
            : chosenArch.rim;

    return {
      archetypeId: chosenArch.archetypeId,
      gender,
      age: isSenior ? 'senior' : chosenArch.age,
      profession,
      skin: (chosenArch.skin + (h >>> 3)) % SKIN_TONES.length,
      hair: isSenior ? 5 + (h % 2) : (chosenArch.hair + (h >>> 5)) % 5,
      hairStyle: (chosenArch.hairStyle + (h >>> 7)) % 10,
      facialHair: gender === 'M' ? (chosenArch.facialHair + (h >>> 9)) % 6 : 0,
      eyewear: (chosenArch.eyewear + (h >>> 11)) % 6,
      eyeColor: h % EYE_COLORS.length,
      rim: slotAccent,
      hat: chosenArch.hat,
      name: rawName,
      cleanName,
      role: roleText,
      source: 'procedural_archetype'
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

  function renderMaleHair(styleIdx, color) {
    const styles = [
      `<path d="M24 33c0-10 7-17 16-17s16 7 16 17c-2-5-7-8-16-8s-14 3-16 8z" fill="${color}"/>`,
      `<path d="M24 34c-1-11 6-19 16-19 11 0 17 8 16 19-3-6-8-10-14-10-5 0-12 3-18 10z" fill="${color}"/><path d="M29 19c4-3 10-3 15 1" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`,
      `<path d="M25 32c0-9 6-16 15-16s15 7 15 16c-3-4-9-5-15-5s-12 1-15 5z" fill="${color}"/>`,
      `<path d="M24 35c0-10 6-17 16-17s16 7 16 17c-2-7-7-10-16-10s-14 3-16 10z" fill="${color}"/><circle cx="40" cy="18" r="2.5" fill="${color}"/>`,
      `<path d="M25 31c1-8 6-14 15-14s14 6 15 14c-3-3-8-5-15-5s-12 2-15 5z" fill="${color}"/>`,
      `<path d="M24 36c0-5 2-10 5-13 2 3 6 4 11 4s9-1 11-4c3 3 5 8 5 13-2-5-6-7-16-7s-14 2-16 7z" fill="${color}"/>`,
      `<path d="M24 33c1-9 7-16 16-16s15 7 16 16c-4-7-11-9-17-8-5 1-11 4-15 8z" fill="${color}"/>`,
      `<path d="M25 35c-2-9 5-18 15-18 10 0 17 9 15 18-3-6-9-8-15-8s-12 2-15 8z" fill="${color}"/>`,
      `<path d="M24 34c1-11 7-18 16-18s15 7 16 18c-3-5-8-7-16-7s-13 2-16 7z" fill="${color}"/><path d="M31 18l5 4 4-4 5 4" fill="${color}"/>`,
      `<path d="M25 32c0-7 6-12 15-12s15 5 15 12c-3-4-9-6-15-6s-12 2-15 6z" fill="${color}"/>`
    ];
    return styles[styleIdx % styles.length];
  }

  function renderFemaleHair(styleIdx, color) {
    const styles = [
      `<path d="M21 44c0-18 7-28 19-28s19 10 19 28c-3-5-6-10-6-16 0-7-6-10-13-10s-13 3-13 10c0 6-3 11-6 16z" fill="${color}"/>`,
      `<path d="M22 40c0-15 7-24 18-24s18 9 18 24c-2-5-5-9-5-13 0-6-5-9-13-9s-13 3-13 9c0 4-3 8-5 13z" fill="${color}"/><circle cx="40" cy="13" r="6" fill="${color}"/>`,
      `<path d="M21 48c-1-19 7-31 19-31s20 12 19 31c-4-7-6-14-6-20 0-6-5-9-13-9s-13 3-13 9c0 6-2 13-6 20z" fill="${color}"/>`,
      `<path d="M22 39c0-14 7-23 18-23s18 9 18 23c-3-5-5-8-5-12 0-6-6-8-13-8s-13 2-13 8c0 4-2 7-5 12z" fill="${color}"/><path d="M26 22c5-4 12-5 20-1" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`,
      `<path d="M20 43c2-17 9-27 20-27s18 10 20 27c-4-4-6-9-7-15-1-6-6-9-13-9s-12 3-13 9c-1 6-3 11-7 15z" fill="${color}"/>`,
      `<path d="M22 45c0-17 7-28 18-28s18 11 18 28c-3-6-5-11-5-17 0-6-5-9-13-9s-13 3-13 9c0 6-2 11-5 17z" fill="${color}"/><path d="M40 16c6 0 11 4 12 9" stroke="#f5b95f" stroke-width="1.3" fill="none"/>`,
      `<path d="M23 41c0-15 7-25 17-25s17 10 17 25c-3-5-5-9-5-14 0-5-5-8-12-8s-12 3-12 8c0 5-2 9-5 14z" fill="${color}"/>`,
      `<path d="M21 47c0-18 8-30 19-30s19 12 19 30c-4-6-6-13-6-19 0-6-6-9-13-9s-13 3-13 9c0 6-2 13-6 19z" fill="${color}"/><circle cx="24" cy="30" r="4" fill="${color}"/><circle cx="56" cy="30" r="4" fill="${color}"/>`,
      `<path d="M22 37c1-13 7-21 18-21s17 8 18 21c-3-5-6-8-18-8s-15 3-18 8z" fill="${color}"/><circle cx="40" cy="14" r="5" fill="${color}"/>`,
      `<path d="M21 46c1-17 7-29 19-29s18 12 19 29c-4-7-7-13-7-18 0-6-5-9-12-9s-12 3-12 9c0 5-3 11-7 18z" fill="${color}"/>`
    ];
    return styles[styleIdx % styles.length];
  }

  function renderEyewear(idx) {
    if (idx === 1) {
      return `<g stroke="#cbd5e1" stroke-width="1.3" fill="rgba(56,189,248,0.08)"><circle cx="34.5" cy="36" r="4.3"/><circle cx="45.5" cy="36" r="4.3"/><line x1="38.8" y1="36" x2="41.2" y2="36"/></g>`;
    }
    if (idx === 2) {
      return `<g stroke="#94a3b8" stroke-width="1.3" fill="rgba(148,163,184,0.08)"><rect x="29.8" y="33" width="9" height="5.5" rx="1.5"/><rect x="41.2" y="33" width="9" height="5.5" rx="1.5"/><line x1="38.8" y1="35.2" x2="41.2" y2="35.2"/></g>`;
    }
    if (idx === 3) {
      return `<g stroke="#0f172a" stroke-width="1.2" fill="rgba(15,23,42,0.78)"><rect x="29.5" y="33" width="9.4" height="5.5" rx="2"/><rect x="41.1" y="33" width="9.4" height="5.5" rx="2"/><line x1="38.9" y1="35" x2="41.1" y2="35"/></g>`;
    }
    if (idx === 4) {
      return `<g stroke="#f5b95f" stroke-width="1.3" fill="rgba(245,185,95,0.09)"><circle cx="45.5" cy="36" r="4.5"/><path d="M49.5 39l3 8" stroke-width="0.9" stroke-dasharray="1.5 1.5"/></g>`;
    }
    if (idx === 5) {
      return `<path d="M25 36v6c0 2 2 3 4 3" stroke="#38bdf8" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="29" cy="45" r="1.4" fill="#38bdf8"/>`;
    }
    return '';
  }

  function renderFacialHair(idx, color) {
    if (idx === 1) {
      return `<path d="M35 42.5c2.2 1 7.8 1 10 0" stroke="${color}" stroke-width="1.6" stroke-linecap="round" opacity="0.65"/>`;
    }
    if (idx === 2) {
      return `<path d="M35 42.5c1.5-.8 3.2-.8 5 0 1.8-.8 3.5-.8 5 0" stroke="${color}" stroke-width="1.8" stroke-linecap="round" fill="none"/>`;
    }
    if (idx === 3) {
      return `<path d="M32 45c2 5.5 14 5.5 16 0-2 3-5 4-8 4s-6-1-8-4z" fill="${color}" opacity="0.85"/>`;
    }
    if (idx === 4) {
      return `<path d="M28 38c0 9 5.5 14.5 12 14.5S52 47 52 38c-1.5 5-5 8.5-12 8.5S29.5 43 28 38z" fill="${color}" opacity="0.9"/>`;
    }
    if (idx === 5) {
      return `<path d="M33 43c2.5-1.5 4.5-1 7-.2 2.5-.8 4.5-1.3 7 .2" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M38 48.5l2 2.5 2-2.5" stroke="${color}" stroke-width="1.6" fill="none"/>`;
    }
    return '';
  }

  function renderHat(hatType, accent) {
    if (hatType === 'fedora') {
      return `<g><path d="M18 24c10-2 34-2 44 0-5 2.5-39 2.5-44 0z" fill="#0f172a" stroke="${accent}" stroke-width="1"/><path d="M26 23l3-10c3-1.5 19-1.5 22 0l3 10z" fill="#1e293b"/><path d="M26.8 20.5h26.4" stroke="${accent}" stroke-width="1.8"/></g>`;
    }
    if (hatType === 'cap') {
      return `<g><path d="M24 23c2-8 30-8 32 0z" fill="#16213e" stroke="${accent}" stroke-width="1"/><path d="M23 23c7 2.2 27 2.2 34 0" stroke="#0f172a" stroke-width="2.4" fill="none"/><circle cx="40" cy="18" r="1.8" fill="${accent}"/></g>`;
    }
    return '';
  }

  function renderPortraitSvg(characterInput, emotionOrExpr = 'calm', options = {}) {
    const profile = resolveCharacterProfile(characterInput);
    const expr = resolveExpression(emotionOrExpr, options);
    const skin = SKIN_TONES[profile.skin % SKIN_TONES.length];
    const hairColor = HAIR_COLORS[profile.hair % HAIR_COLORS.length];
    const prof = PROFESSIONS.find(p => p.id === profile.profession) || PROFESSIONS[PROFESSIONS.length - 1];
    const eyeCol = EYE_COLORS[(profile.eyeColor || 0) % EYE_COLORS.length];

    const rim =
      expr.id === 'broken'
        ? '#f43f5e'
        : expr.id === 'shocked' || expr.id === 'angry'
          ? '#fb923c'
          : expr.id === 'tense'
            ? '#f59e0b'
            : profile.rim || '#f5b95f';

    const gradId = `noirHalo_${fnv1aHash(profile.cleanName + expr.id + (options.uid || ''))}`;

    // Eyes & Brows by expression
    let browLeft = 'M31 31.5l6-.6';
    let browRight = 'M49 31.5l-6-.6';
    let eyeRadius = 1.65;
    let mouthPath = 'M36.5 45c2 .8 5 .8 7 0';

    switch (expr.id) {
      case 'suspicious':
        browLeft = 'M30.8 30.2l6.2 1.2';
        browRight = 'M49 32l-6-.3';
        eyeRadius = 1.35;
        mouthPath = 'M36.5 45.2l7-.7';
        break;
      case 'tense':
        browLeft = 'M31 32.2l6-1.4';
        browRight = 'M49 32.2l-6-1.4';
        eyeRadius = 1.75;
        mouthPath = 'M36 45.5c2-.8 6-.8 8 0';
        break;
      case 'shocked':
        browLeft = 'M31 29.2c2-1.4 4.2-1.4 6 0';
        browRight = 'M43 29.2c1.8-1.4 4-1.4 6 0';
        eyeRadius = 2.15;
        mouthPath = 'M38 45.5a2 2.2 0 1 0 4 0a2 2.2 0 1 0 -4 0';
        break;
      case 'angry':
        browLeft = 'M30.5 30.2l6.6 2.5';
        browRight = 'M49.5 30.2l-6.6 2.5';
        eyeRadius = 1.6;
        mouthPath = 'M36 46c2.2-1.4 5.8-1.4 8 0';
        break;
      case 'sad':
        browLeft = 'M30.8 32.6l6.2-1.6';
        browRight = 'M49.2 32.6l-6.2-1.6';
        eyeRadius = 1.45;
        mouthPath = 'M36.5 46.2c2-1 5-1 7 0';
        break;
      case 'whisper':
        browLeft = 'M31 31.5l6-.4';
        browRight = 'M49 31.5l-6-.4';
        eyeRadius = 1.45;
        mouthPath = 'M38.2 45.2c1.2.4 2.4.4 3.6 0';
        break;
      case 'broken':
        browLeft = 'M30.5 32.5l6.5-2.2';
        browRight = 'M49.5 32.5l-6.5-2.2';
        eyeRadius = 2.1;
        mouthPath = 'M35.8 46.3c2-1.8 6.4-1.8 8.4 0';
        break;
      default:
        break;
    }

    const sweatVfx =
      expr.id === 'tense' || expr.id === 'broken'
        ? '<path d="M51.5 29c1.2 1.8 1.5 3.1.4 3.9-1.1.8-2.3-.1-1.9-1.6.2-.8.9-1.5 1.5-2.3z" fill="#7dd3fc" opacity="0.88"/>'
        : '';
    const shockVfx =
      expr.id === 'shocked'
        ? `<path d="M16 24l5 2M15 32l5 0M64 24l-5 2M65 32l-5 0" stroke="#fcd385" stroke-width="1.5" stroke-linecap="round"/>`
        : '';
    const brokenVfx =
      expr.id === 'broken'
        ? `<path d="M59 13l-6 9 4 3-6 9" stroke="#f43f5e" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="12" y="12" width="56" height="56" rx="28" stroke="#f43f5e" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.7"/>`
        : '';
    const whisperVeil =
      expr.id === 'whisper'
        ? '<path d="M10 40a30 30 0 0 0 60 0v28H10z" fill="rgba(7,11,19,0.34)"/>'
        : '';

    const stethoscopeVfx =
      profile.profession === 'doctor'
        ? '<path d="M31 54c0 8 4 12 9 12s9-4 9-12" stroke="#94a3b8" stroke-width="1.6" fill="none"/><circle cx="40" cy="66" r="2.1" fill="#e2e8f0"/>'
        : '';
    const tieVfx =
      profile.profession === 'lawyer' || profile.profession === 'aristocrat' || profile.profession === 'narrator'
        ? `<path d="M38.5 55l1.5 14 1.5-14z" fill="${prof.badge}" opacity="0.85"/>`
        : '';

    const hairMarkup =
      profile.gender === 'F'
        ? renderFemaleHair(profile.hairStyle, hairColor)
        : renderMaleHair(profile.hairStyle, hairColor);

    const facialHairMarkup =
      profile.gender === 'M' ? renderFacialHair(profile.facialHair, hairColor) : '';

    const eyewearMarkup = renderEyewear(profile.eyewear);
    const hatMarkup = renderHat(profile.hat, rim);

    const extraClass = options.className ? ` ${escapeAttr(options.className)}` : '';
    const titleAttr = escapeAttr(`${profile.cleanName} (${expr.labelAr})`);

    return `<svg class="suspect-portrait-svg state-${escapeAttr(expr.id)}${extraClass}" viewBox="0 0 80 80" fill="none" role="img" aria-label="${titleAttr}">
      <defs>
        <radialGradient id="${gradId}" cx="50%" cy="38%" r="58%">
          <stop offset="0%" stop-color="${rim}" stop-opacity="0.24"/>
          <stop offset="100%" stop-color="#090e18" stop-opacity="0.96"/>
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="37.5" fill="url(#${gradId})" stroke="${rim}" stroke-width="2.4"/>
      <!-- Shoulders & Coat -->
      <path d="M15 70c3.2-11.5 11.8-16.5 25-16.5S61.8 58.5 65 70" fill="${prof.coat}" stroke="${prof.lapel}" stroke-width="1.6"/>
      <path d="M32 54l8 14 8-14" fill="rgba(15,23,42,0.55)" stroke="${prof.lapel}" stroke-width="1.2" stroke-linejoin="round"/>
      ${tieVfx}
      ${stethoscopeVfx}
      <!-- Neck -->
      <rect x="35" y="46" width="10" height="10" rx="4" fill="${skin.shadow}"/>
      <!-- Back Female Hair Layer -->
      ${profile.gender === 'F' ? hairMarkup : ''}
      <!-- Ears -->
      <circle cx="26.5" cy="36.5" r="3.1" fill="${skin.shadow}"/>
      <circle cx="53.5" cy="36.5" r="3.1" fill="${skin.shadow}"/>
      <!-- Head / Jaw -->
      <path d="M27 33c0-8.8 5.6-14.5 13-14.5S53 24.2 53 33c0 8.5-4.4 16.5-13 17.5C31.4 49.5 27 41.5 27 33z" fill="${skin.base}"/>
      <path d="M28.5 39c1.8 6.5 6 10.2 11.5 10.7 5.5-.5 9.7-4.2 11.5-10.7-2 5.2-6 8.2-11.5 8.7-5.5-.5-9.5-3.5-11.5-8.7z" fill="${skin.shadow}" opacity="0.45"/>
      <!-- Male Hair Layer -->
      ${profile.gender === 'M' ? hairMarkup : ''}
      <!-- Eyes, Brows & Nose -->
      <ellipse cx="34.5" cy="36" rx="2.4" ry="${(eyeRadius * 0.95).toFixed(2)}" fill="#f8fafc"/>
      <ellipse cx="45.5" cy="36" rx="2.4" ry="${(eyeRadius * 0.95).toFixed(2)}" fill="#f8fafc"/>
      <circle cx="34.5" cy="36" r="${eyeRadius}" fill="${eyeCol}"/>
      <circle cx="45.5" cy="36" r="${eyeRadius}" fill="${eyeCol}"/>
      <circle cx="35.1" cy="35.3" r="0.55" fill="#ffffff"/>
      <circle cx="46.1" cy="35.3" r="0.55" fill="#ffffff"/>
      <path d="${browLeft}" stroke="${hairColor}" stroke-width="1.9" stroke-linecap="round"/>
      <path d="${browRight}" stroke="${hairColor}" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M40 36.2v4.3c0 .8-.8 1.2-1.5 1" stroke="${skin.shadow}" stroke-width="1.3" stroke-linecap="round" fill="none"/>
      <!-- Mouth & Facial Hair -->
      <path d="${mouthPath}" stroke="#6d3a2c" stroke-width="1.65" stroke-linecap="round" fill="${expr.id === 'shocked' ? '#451a1a' : 'none'}"/>
      ${facialHairMarkup}
      ${eyewearMarkup}
      ${hatMarkup}
      ${whisperVeil}
      ${sweatVfx}
      ${shockVfx}
      ${brokenVfx}
    </svg>`;
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

    // 1. Check all core/custom suspects mentioned in this scene (or updated by suspect_update)
    for (const s of suspects) {
      const fullName = String(s.name || '').trim();
      const shortName = fullName.split('(')[0].trim();
      const words = shortName.split(/\s+/).filter(w => w.length >= 3);
      const isFocusedUpdate =
        td.suspect_update &&
        (td.suspect_update.id === s.id || td.suspect_update.name === fullName);
      const isMentioned =
        textCorpus.includes(shortName) ||
        words.some(w => !/^(الدكتور|الدكتورة|المهندس|المهندسة|الباحث|الباحثة|الضابط|القبطان|العقيد|السكرتيرة|الصحفية|الأستاذ|المسؤولة|كبير|رئيس|مدير|فريق|المتقاعد)$/.test(w) && textCorpus.includes(w));

      if (isFocusedUpdate || isMentioned) {
        const expr = resolveExpression(
          s.alibiBroken ? 'broken' : isFocusedUpdate ? sceneMood : (gs.dangerLevel >= 65 ? 'tense' : sceneMood),
          { alibiBroken: Boolean(s.alibiBroken), dangerLevel: gs.dangerLevel }
        );
        seenNames.add(shortName);
        results.push({
          id: s.id || shortName,
          name: fullName,
          shortName,
          role: s.role || 'مشتبه به في القضية',
          voice: s.voice || '',
          isSuspect: true,
          alibiBroken: Boolean(s.alibiBroken),
          expression: expr.id,
          expressionLabel: expr.labelAr
        });
      }
    }

    // 2. Smartly detect incidental, victim, or AI-generated characters from Arabic text
    const titlePatterns = [
      /(?:الأستاذ|أستاذ|القاضي|الدكتور|الدكتورة|المهندس|المهندسة|الضابط|القبطان|العقيد|السكرتيرة|الصحفية|السيد|السيدة|المحامي|المحامية|الطبيب الشرعي|الطبيب|الشاهد|الشاهدة)\s+([أ-ي]{2,14}(?:\s+[أ-ي]{2,14})?)/g,
      /(كبير المهندسين|كبير الباحثين|فني الرصد|رئيس الغواصين|المسعفون|المسعف|مسؤول الأمن|حارس البوابة)/g
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

        const isInjuredOrVictim = /(فاقدا للوعي|اختناق|يختنق|مقيدا|محبوس|حبس|ضحية|الجثة|الراحل)/.test(textCorpus);
        const expr = resolveExpression(isInjuredOrVictim ? 'tense' : sceneMood, {
          dangerLevel: gs.dangerLevel
        });

        results.push({
          id: `npc_${fnv1aHash(displayName)}`,
          name: displayName,
          shortName: displayName,
          role: 'شخصية مرتبطة بأحداث المشهد',
          voice: FEMALE_ROLE_HINTS.test(displayName) || FEMALE_NAME_HINTS.test(displayName) ? 'Aoede' : 'Puck',
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
      totalArchetypes: ARCHETYPE_CATALOG.length,
      expressionCount: Object.keys(EXPRESSIONS).length,
      totalRenderedVariants: ARCHETYPE_CATALOG.length * Object.keys(EXPRESSIONS).length
    };
  }

  global.MysteryCharacterEngine = {
    EXPRESSIONS,
    CORE_CAST_PROFILES,
    ARCHETYPE_CATALOG,
    resolveCharacterProfile,
    resolveExpression,
    renderPortraitSvg,
    extractSceneCharacters,
    getCatalogStats
  };
})(typeof window !== 'undefined' ? window : globalThis);
