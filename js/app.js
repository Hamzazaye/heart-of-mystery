/**
 * ============================================================================
 * قلب الغموض : المتحكم الرئيسي باللعبة، الاستنتاج الجنائي، الاستجواب، والنهايات الخمس
 * ============================================================================
 */

(function () {
  const STORAGE_KEY_SETTINGS = 'heart_of_mystery_settings_v2';
  const STORAGE_KEY_SAVE = 'heart_of_mystery_savestate_v3';
  const STORAGE_KEY_THEME = 'heart_of_mystery_theme_v2';
  const STORAGE_KEY_LIBRARY = 'heart_of_mystery_library_v1';
  const SESSION_KEY_BOOTED = 'hom_booted_v2';

  const SCENARIO_PRESETS = {
    daily: {
      id: 'daily',
      title: 'قضية اليوم: بروتوكول المختبر الموصد',
      shortTitle: 'قضية اليوم: المختبر الموصد',
      teaserVoice:
        'داخل مختبر الأبحاث الرقمية المعزول... توقف الحاسوب المركزي عن العمل وفتحت خزانة الشرائح الثلاث، وأحد الباحثين الثلاثة في القاعة يخفي الشريحة المسروقة!',
      teaserEmotion: 'شجن غامض وترقب',
      prompt:
        'أحقق في مختبر الأبحاث الرقمية بعد توقف الحاسوب المركزي وفتح الحافظة المبردة للشرائح الثلاث، وتحوم الشبهات حول ثلاثة أشخاص: المهندس كريم نصار، الدكتور طارق زيدان، ومسؤول الأمن مازن الكيلاني.'
    },
    multiverse: {
      id: 'multiverse',
      title: 'عابر العوالم: شذوذ القوانين الكونية',
      shortTitle: 'عابر العوالم (10,000 عالم)',
      teaserVoice:
        '<breath> تنفتح البوابة الزمكانية أمامك نحو المجهول... <short pause> في كل قفزة تستيقظ داخل عالم مواز انقلبت فيه قاعدة كونية واحدة، ولن تدرك شريعته الخفية إلا حين تطأ قدماك مسرح الجريمة!',
      teaserEmotion: 'رهبة وترقب',
      prompt:
        'أعبر بوابة العوالم الموازية لأحقق في جريمة غامضة داخل عالم تغيرت فيه قاعدة كونية واحدة، حيث تندمج شريعة العالم الجديد مع خيوط مسرح الجريمة.'
    },
    unknown_land: {
      id: 'unknown_land',
      title: 'مرصد الأفق: لغز القبة المغلقة',
      shortTitle: 'مرصد الأفق الفلكي',
      teaserVoice:
        '<breath> داخل مرصد الأفق الفلكي فوق الجبل الصحراوي... <short pause> انطلق جرس الإنذار عند الفجر، وحبس فني الرصد داخل قاعة التلسكوب بعد اختفاء قرص الصور الفلكية!',
      teaserEmotion: 'رهبة وترقب',
      prompt:
        'في مرصد الأفق الفلكي فوق الهضبة الصحراوية، يختفي قرص الصور الفلكية عند الفجر ويحبس فني الرصد داخل قاعة التلسكوب بعد فك مقبض الباب، بين ثلاثة عاملين: الدكتور سنان راشد، الدكتورة لينا الحسن، والمهندس جسار فهد.'
    },
    manor: {
      id: 'manor',
      title: 'المصحة الجبلية: ذاكرة الساعتين المفقودتين',
      shortTitle: 'المصحة الجبلية: الذاكرة المفقودة',
      teaserVoice:
        'المطر يطرق نوافذ المركز الطبي الجبلي كأصابع قلقة... وفي جيبك رسالة كتبتها بخط يدك تحذرك: محا العقار الساعتين الأخيرتين من ذاكرتك، لا تثق بمن يدعي أنه أنقذك الليلة!',
      teaserEmotion: 'همس مرعوب وترقب',
      prompt:
        'أستيقظ في مكتب الأبحاث داخل مصحة جبلية معزولة ليلة عاصفة ممطرة. في قبضتي مفتاح معدني بارد (A-12)، وعلى الطاولة رسالة كتبتها يدي تحذرني: لا تثق بمن يدعي أنه أنقذك الليلة. المدير القانوني نديم زهران والطبيبة سلمى الكيلاني ومسؤول الأمن منصور الجبلي داخل المركز، وساعة الحائط متوقفة عند 11:47.'
    },
    station: {
      id: 'station',
      title: 'المحطة القطبية: الصدى التاسع',
      shortTitle: 'المحطة القطبية: الصدى التاسع',
      teaserVoice:
        'تحت الجليد القطبي ينكر العلماء إرسال نداء الاستغاثة... غير أن سجل الخادم في القبو الحراري يفضح نشاطا حيا خلف البوابة الفولاذية الموصدة!',
      teaserEmotion: 'صدمة وذهول درامي',
      prompt:
        'أصل إلى محطة أبحاث قطبية تحت الجليد بعد تلقي نداء استغاثة مشفر باسم الصدى التاسع. الدكتور راشد النجدي والمهندسة مريم الهاشمي والضابط طارق العتيبي يتبادلون الإفادات حول إغلاق القبو الحراري B4.'
    },
    train: {
      id: 'train',
      title: 'قطار منتصف الليل: الرحلة 404',
      shortTitle: 'قطار منتصف الليل 404',
      teaserVoice:
        'القطار يشق عباب الضباب كالسهم... القاضي سليمان اختفى خلف باب المقصورة الثالثة الموصد من الداخل، وكل راكب في العربة يخفي سرا تحت معطفه!',
      teaserEmotion: 'تساؤل ماكر وتشكيك',
      prompt:
        'يشق قطار فخم ستائر الضباب دون توقف. في المقصورة رقم 3 اختفى القاضي سليمان العلام خلف باب موصد بالسلسلة من الداخل، تاركا رائحة لوز مر. السكرتيرة ليلى الموصلي، العقيد فريد الشذر، والسائق عمران الحلبي هم المشتبه بهم.'
    },
    museum: {
      id: 'museum',
      title: 'المختبر البحري الغارق: سر القبة الزجاجية',
      shortTitle: 'المختبر البحري الغارق',
      teaserVoice:
        'ثلاثون مترا تحت أمواج البحر... سقط كبير المهندسين الأستاذ يونس فاقدا للوعي داخل الغرفة الزجاجية المغلقة، واختفى جهاز الطاقة الأزرق من خلف الأبواب المصفحة!',
      teaserEmotion: 'رهبة وترقب',
      prompt:
        'في مختبر أبحاث زجاجي شيد على عمق ثلاثين مترا تحت سطح البحر، يعثر الفريق على كبير المهندسين الأستاذ يونس فاقدا للوعي داخل الغرفة الزجاجية المغلقة، وقد رسم بأنفاسه الأخيرة رمزا هندسيا مقلوبا على الزجاج قبل اختفاء جهاز الطاقة الأزرق وسط الدكتورة سلمى نصار، رئيس الغواصين كمال البحيري، والباحث زياد الفاروقي.'
    },
    island: {
      id: 'island',
      title: 'جزيرة الضباب الأسود: المحكمة الأخيرة',
      shortTitle: 'جزيرة الضباب الأسود',
      teaserVoice:
        'تلتهم النيران القارب الوحيد في المرفأ... وفي قلب محطة الفنار ينطلق صوت من جهاز البث ليحاكم الجميع على سر غرق السفينة أوريون قبل عشر سنوات!',
      teaserEmotion: 'تحذير حاد',
      prompt:
        'تجمع رسائل مجهولة شهود الماضي داخل محطة فنار صخري معزول وسط البحر. وعند منتصف الليل ينطلق صوت عبر المذياع ليحاكم الدكتور مازن الغساني، الصحفية رنا المقدسي، والقبطان سليم بحري على جريمة غرق السفينة أوريون.'
    },
    custom: {
      id: 'custom',
      title: 'قضية غموض مخصصة',
      shortTitle: 'قضية غموض مخصصة (دستور جنائي ثابت)',
      teaserVoice:
        '<breath> اكتب خيوط الجريمة وأسماء المشتبه بهم أو مسرح الحادثة الذي تتخيله... وسأثبت لك دستورا جنائيا محكما بأدلة ونهايات حقيقية.',
      teaserEmotion: 'سرد سينمائي متدرج',
      prompt: ''
    }
  };

  const MYSTERY_LOADING_QUOTES = [
    '«في قلب الغموض، كل تناقض بين الإفادة والدليل هو خيط يقودك إلى الجاني الحقيقي...»',
    '«تذكر: المذنب يترك دائما تفصيلا ماديا يكسر حجة غيابه...»',
    '«واجه المشتبه بهم بالأدلة المكتشفة؛ وقارن توقيت كل إفادة بالسجل الزمني.»',
    '«اربط الأدلة بالمشتبه بهم في دفتر التحقيق لرفع تغطية الاستنتاج الجنائي.»',
    '«حين تكتمل أركان الإثبات الثلاثة لديك، ادخل غرفة الاتهام لإصدار حكمك النهائي.»'
  ];

  const TTS_DECODING_MESSAGES = [
    'جاري ضبط المشاعر الصوتية للراوي وتجهيز المقطع التالي...',
    'تنقية همسات وانفعالات الشخصيات ومزامنة الأجواء المحيطية...',
    'تحليل نبرة المشهد وتوليف الأداء التمثيلي متعدد الأصوات...'
  ];

  const audioEngine = new window.MysteryAudioEngine();
  const aiEngine = new window.MysteryAIEngine();

  const SCENE_ARTWORK_MAP = {
    daily: 'assets/scenes/daily.webp',
    unknown_land: 'assets/scenes/unknown_land.webp',
    manor: 'assets/scenes/manor.webp',
    station: 'assets/scenes/station.webp',
    train: 'assets/scenes/train.webp',
    museum: 'assets/scenes/museum.webp',
    island: 'assets/scenes/island.webp',
    multiverse: 'assets/hero-noir-backdrop.webp',
    custom: 'assets/hero-noir-backdrop.webp'
  };

  function updateSceneArtwork(scenarioId, chapterTitle = '') {
    const imgEl = document.getElementById('sceneArtworkImg');
    const capEl = document.getElementById('sceneArtworkCaption');
    if (imgEl) {
      const nextSrc = SCENE_ARTWORK_MAP[scenarioId] || 'assets/hero-noir-backdrop.webp';
      if (imgEl.getAttribute('src') !== nextSrc) {
        imgEl.setAttribute('src', nextSrc);
      }
    }
    if (capEl) {
      const preset = SCENARIO_PRESETS[scenarioId];
      const label = preset ? preset.shortTitle : 'ملف القضية';
      capEl.textContent = chapterTitle ? `${label} • ${chapterTitle}` : label;
    }
  }

  function hydrateScenarioCardThumbnails() {
    if (!dom.scenarioCards) return;
    dom.scenarioCards.forEach(card => {
      const sid = card.dataset.scenario;
      const artSrc = SCENE_ARTWORK_MAP[sid];
      if (!artSrc || sid === 'multiverse' || sid === 'custom') return;
      if (card.querySelector('.scenario-card-thumb')) return;
      const header = card.querySelector('.scenario-card-header');
      if (!header || !header.parentNode) return;
      const thumb = document.createElement('div');
      thumb.className = 'scenario-card-thumb';
      thumb.setAttribute('aria-hidden', 'true');
      const img = document.createElement('img');
      img.src = artSrc;
      img.alt = '';
      img.loading = 'lazy';
      thumb.appendChild(img);
      header.parentNode.insertBefore(thumb, header);
    });
  }

  function renderSuspectPortraitSvg(suspect, state = 'calm') {
    const sus = suspect || {};
    const voice = String(sus.voice || '');
    const isFemale = voice === 'Aoede' || voice === 'Kore';
    const susId = String(sus.id || 's1');
    const accentBySlot = {
      s1: '#f5b95f',
      s2: '#38bdf8',
      s3: '#a78bfa'
    };
    const rim =
      state === 'broken'
        ? '#f43f5e'
        : state === 'tense'
          ? '#fb923c'
          : accentBySlot[susId] || '#94a3b8';

    const browOffset = state === 'broken' ? -1.5 : state === 'tense' ? 1.2 : 0;
    const hairPath = isFemale
      ? '<path d="M12 20c0-6 3.5-10 8-10s8 4 8 10v6c-1.5-2-2.5-4.5-2.5-7 0-3.2-2.4-5.5-5.5-5.5S14.5 15.8 14.5 19c0 2.5-1 5-2.5 7v-6z" fill="#1e293b"/>'
      : '<path d="M13 17c0-4.8 3.2-7.8 7-7.8s7 3 7 7.8c-1.2-2-3.5-3.2-7-3.2s-5.8 1.2-7 3.2z" fill="#1e293b"/>';
    const crackMark =
      state === 'broken'
        ? '<path d="M29 7l-3 5 2 2-3 5" stroke="#f43f5e" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
        : '';

    return `<svg class="suspect-portrait-svg state-${escapeHtml(state)}" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" stroke="${rim}" stroke-width="1.8" fill="rgba(15,23,42,0.88)"/>
      <path d="M9.5 34.5c1.5-5.2 5.4-8 10.5-8s9 2.8 10.5 8" fill="#1e293b" stroke="${rim}" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="20" cy="18.5" r="6.3" fill="#cbd5e1"/>
      ${hairPath}
      <line x1="16.5" y1="${17 + browOffset}" x2="18.8" y2="${17.4}" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="23.5" y1="${17 + browOffset}" x2="21.2" y2="${17.4}" stroke="#0f172a" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="17.8" cy="19" r="0.9" fill="#0f172a"/>
      <circle cx="22.2" cy="19" r="0.9" fill="#0f172a"/>
      <path d="M18 22.3c1.2.4 2.8.4 4 0" stroke="#0f172a" stroke-width="1.1" stroke-linecap="round"/>
      ${crackMark}
    </svg>`;
  }

  let selectedScenarioId = 'daily';
  let pendingMultiverseCombo = null;
  let currentTurnData = null;
  let hotspotInspectedThisTurn = false;
  let isLoadingTurn = false;
  let turnGenerationToken = 0;
  let lastFocusedElementBeforeModal = null;
  let activeTwistResolver = null;
  let isServerKeyAvailable = true;
  let loadingCycleInterval = null;
  let preloadProgressInterval = null;
  let currentPreloadPercent = 0;
  let ttsDecodingInterval = null;
  let narrativeFontSizeRem = 1.34;
  let turnSnapshots = [];

  // إعدادات نظام الجزيئات المناخية ووضع توفير الطاقة للهواتف
  let particleMode = 'auto';
  let lowPowerMode = false;
  let prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let particlesList = [];
  let fogCloudsList = [];
  let particleAnimId = null;

  let gameState = createInitialGameState();

  function createInitialGameState() {
    return {
      active: false,
      playerName: 'آدم',
      detectiveStyle: 'تحليلي حذر',
      dialect: 'fusha',
      scenarioId: 'daily',
      scenarioTitle: SCENARIO_PRESETS.daily.title,
      scenarioPrompt: SCENARIO_PRESETS.daily.prompt,
      turn: 0,
      twistProgress: 12,
      dangerLevel: 15,
      hiddenBlueprint: '',
      caseBible: null,
      lastNarrative: '',
      clues: [],
      secrets: [],
      suspects: [],
      boardLinks: [],
      history: [],
      verdictAttemptsRemaining: 3,
      caseSolved: false,
      finalVerdictResult: null
    };
  }

  // عناصر الواجهة (DOM)
  const dom = {
    appPreloader: document.getElementById('appPreloader'),
    preloaderStageText: document.getElementById('preloaderStageText'),
    bootProgressBar: document.getElementById('bootProgressBar'),
    bootStatusSub: document.getElementById('bootStatusSub'),
    bootPercentText: document.getElementById('bootPercentText'),
    bootCheckFonts: document.getElementById('bootCheckFonts'),
    bootCheckApi: document.getElementById('bootCheckApi'),
    bootCheckAudio: document.getElementById('bootCheckAudio'),
    skipPreloaderBtn: document.getElementById('skipPreloaderBtn'),

    weatherParticlesCanvas: document.getElementById('weatherParticlesCanvas'),
    mainWorkspace: document.getElementById('mainWorkspace'),
    mysterySidebar: document.getElementById('mysterySidebar'),
    closeMobileSidebarBtn: document.getElementById('closeMobileSidebarBtn'),

    mobileBottomNav: document.getElementById('mobileBottomNav'),
    mobNavStoryBtn: document.getElementById('mobNavStoryBtn'),
    mobNavNotebookBtn: document.getElementById('mobNavNotebookBtn'),
    mobCluesBadge: document.getElementById('mobCluesBadge'),
    mobNavVerdictBtn: document.getElementById('mobNavVerdictBtn'),
    mobNavMenuBtn: document.getElementById('mobNavMenuBtn'),

    openLibraryBtn: document.getElementById('openLibraryBtn'),
    dailyStreakBadge: document.getElementById('dailyStreakBadge'),
    newGameBtn: document.getElementById('newGameBtn'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),

    scenarioScreen: document.getElementById('scenarioScreen'),
    resumeSavedBanner: document.getElementById('resumeSavedBanner'),
    resumeSavedTitle: document.getElementById('resumeSavedTitle'),
    resumeSavedBtn: document.getElementById('resumeSavedBtn'),
    scenarioCards: document.querySelectorAll('.scenario-card'),
    caseVoicePreviewBtns: document.querySelectorAll('.case-voice-preview-btn'),
    cardStartActionBtns: document.querySelectorAll('.card-start-action-btn'),
    rerollMultiverseCardBtn: document.getElementById('rerollMultiverseCardBtn'),
    multiverseRollTitleText: document.getElementById('multiverseRollTitleText'),
    jumpMultiverseWorldBtn: document.getElementById('jumpMultiverseWorldBtn'),
    customScenarioBox: document.getElementById('customScenarioBox'),
    customScenarioInput: document.getElementById('customScenarioInput'),
    customBiblePreviewBox: document.getElementById('customBiblePreviewBox'),
    playerNameInput: document.getElementById('playerNameInput'),
    namePresetChips: document.querySelectorAll('.name-preset-chip'),
    scenarioFilterPills: document.querySelectorAll('.scenario-filter-pill'),
    selectedCaseSummaryText: document.getElementById('selectedCaseSummaryText'),
    heroQuickStartBtn: document.getElementById('heroQuickStartBtn'),
    heroListenTeaserBtn: document.getElementById('heroListenTeaserBtn'),
    heroSelectedCasePill: document.getElementById('heroSelectedCasePill'),
    heroCaseCategoryText: document.getElementById('heroCaseCategoryText'),
    heroDynamicTitle: document.getElementById('heroDynamicTitle'),
    heroDynamicLead: document.getElementById('heroDynamicLead'),
    heroChipSuspects: document.getElementById('heroChipSuspects'),
    heroChipClues: document.getElementById('heroChipClues'),
    startAdventureBtn: document.getElementById('startAdventureBtn'),

    gameStage: document.getElementById('gameStage'),
    quickEvidencePillsGroup: document.getElementById('quickEvidencePillsGroup'),
    chapterBadge: document.getElementById('chapterBadge'),
    sceneTitle: document.getElementById('sceneTitle'),
    detectiveStyleText: document.getElementById('detectiveStyleText'),
    sceneMoodText: document.getElementById('sceneMoodText'),
    undoTurnBtn: document.getElementById('undoTurnBtn'),
    openVerdictBtn: document.getElementById('openVerdictBtn'),

    vocalPulseRing: document.getElementById('vocalPulseRing'),
    vocalSpeakerLabel: document.getElementById('vocalSpeakerLabel'),
    vocalEmotionBadge: document.getElementById('vocalEmotionBadge'),
    activeTtsEngineTag: document.getElementById('activeTtsEngineTag'),
    vocalReactionText: document.getElementById('vocalReactionText'),
    ttsDecodingBar: document.getElementById('ttsDecodingBar'),
    ttsDecodingText: document.getElementById('ttsDecodingText'),
    ttsWaveformCanvas: document.getElementById('ttsWaveformCanvas'),
    replayReactionBtn: document.getElementById('replayReactionBtn'),
    speakSceneBtn: document.getElementById('speakSceneBtn'),
    speakSceneBtnText: document.getElementById('speakSceneBtnText'),
    stopTtsBtn: document.getElementById('stopTtsBtn'),

    narrativeCard: document.getElementById('narrativeCard'),
    narrativeTwistRibbon: document.getElementById('narrativeTwistRibbon'),
    narrativeTwistText: document.getElementById('narrativeTwistText'),
    narrativeBody: document.getElementById('narrativeBody'),

    suspiciousHotspot: document.getElementById('suspiciousHotspot'),
    inspectHotspotBtn: document.getElementById('inspectHotspotBtn'),
    hotspotPreviewText: document.getElementById('hotspotPreviewText'),
    hotspotRevealBox: document.getElementById('hotspotRevealBox'),
    hotspotRevealText: document.getElementById('hotspotRevealText'),

    aiLoadingBox: document.getElementById('aiLoadingBox'),
    loadingPuzzleCategory: document.getElementById('loadingPuzzleCategory'),
    loadingStepCounter: document.getElementById('loadingStepCounter'),
    loadingTitle: document.getElementById('loadingTitle'),
    loadingSub: document.getElementById('loadingSub'),
    turnPreloadProgressBar: document.getElementById('turnPreloadProgressBar'),
    preloadStageLabel: document.getElementById('preloadStageLabel'),
    preloadRemainingText: document.getElementById('preloadRemainingText'),

    invStep1: document.getElementById('invStep1'),
    invStep2: document.getElementById('invStep2'),
    invStep3: document.getElementById('invStep3'),
    segState1: document.getElementById('segState1'),
    segState2: document.getElementById('segState2'),
    segState3: document.getElementById('segState3'),
    segFill1: document.getElementById('segFill1'),
    segFill2: document.getElementById('segFill2'),
    segFill3: document.getElementById('segFill3'),
    loadingMysteryQuote: document.getElementById('loadingMysteryQuote'),

    choicesSection: document.getElementById('choicesSection'),
    actionModeTabs: document.querySelectorAll('.action-mode-tab'),
    choicesGrid: document.getElementById('choicesGrid'),
    interrogationBar: document.getElementById('interrogationBar'),
    interrogateSuspectSelect: document.getElementById('interrogateSuspectSelect'),
    interrogateClueSelect: document.getElementById('interrogateClueSelect'),
    interrogateSubmitBtn: document.getElementById('interrogateSubmitBtn'),
    customActionForm: document.getElementById('customActionForm'),
    customActionInput: document.getElementById('customActionInput'),
    choicesVerdictBtn: document.getElementById('choicesVerdictBtn'),

    twistMeterValue: document.getElementById('twistMeterValue'),
    twistMeterBar: document.getElementById('twistMeterBar'),
    twistMeterHint: document.getElementById('twistMeterHint'),
    dangerMeterValue: document.getElementById('dangerMeterValue'),
    dangerMeterBar: document.getElementById('dangerMeterBar'),
    statChapterNum: document.getElementById('statChapterNum'),
    statCluesCount: document.getElementById('statCluesCount'),
    statSecretsCount: document.getElementById('statSecretsCount'),
    dedChipClues: document.getElementById('dedChipClues'),
    dedChipAlibis: document.getElementById('dedChipAlibis'),
    dedChipLinks: document.getElementById('dedChipLinks'),

    notebookTabs: document.querySelectorAll('.notebook-tab'),
    notebookSearchInput: document.getElementById('notebookSearchInput'),
    tabCountClues: document.getElementById('tabCountClues'),
    tabCountSecrets: document.getElementById('tabCountSecrets'),
    tabCountSuspects: document.getElementById('tabCountSuspects'),
    tabCountHistory: document.getElementById('tabCountHistory'),

    corkboardLinkerBox: document.getElementById('corkboardLinkerBox'),
    linkClueSelect: document.getElementById('linkClueSelect'),
    linkRelationSelect: document.getElementById('linkRelationSelect'),
    linkSuspectSelect: document.getElementById('linkSuspectSelect'),
    addBoardLinkBtn: document.getElementById('addBoardLinkBtn'),
    corkboardLinksList: document.getElementById('corkboardLinksList'),

    clueList: document.getElementById('clueList'),
    secretList: document.getElementById('secretList'),
    suspectList: document.getElementById('suspectList'),
    historyTimeline: document.getElementById('historyTimeline'),

    twistOverlay: document.getElementById('twistOverlay'),
    twistOverlayTitle: document.getElementById('twistOverlayTitle'),
    twistOverlaySub: document.getElementById('twistOverlaySub'),
    skipTwistBtn: document.getElementById('skipTwistBtn'),

    // غرفة الاتهام والحسم (#verdictModal)
    verdictModal: document.getElementById('verdictModal'),
    closeVerdictBtn: document.getElementById('closeVerdictBtn'),
    verdictBuilderSection: document.getElementById('verdictBuilderSection'),
    verdictCaseTitleBadge: document.getElementById('verdictCaseTitleBadge'),
    verdictAttemptsBadge: document.getElementById('verdictAttemptsBadge'),
    verdictSuspectSelect: document.getElementById('verdictSuspectSelect'),
    verdictMotiveSelect: document.getElementById('verdictMotiveSelect'),
    verdictClueSelect: document.getElementById('verdictClueSelect'),
    readyPillSuspect: document.getElementById('readyPillSuspect'),
    readyPillMotive: document.getElementById('readyPillMotive'),
    readyPillClue: document.getElementById('readyPillClue'),
    readyPillChain: document.getElementById('readyPillChain'),
    verdictCoarseFeedback: document.getElementById('verdictCoarseFeedback'),
    cancelVerdictBtn: document.getElementById('cancelVerdictBtn'),
    freeFinaleBtn: document.getElementById('freeFinaleBtn'),
    submitVerdictBtn: document.getElementById('submitVerdictBtn'),
    verdictOutcomeBox: document.getElementById('verdictOutcomeBox'),
    verdictEndingBadge: document.getElementById('verdictEndingBadge'),
    verdictEndingStars: document.getElementById('verdictEndingStars'),
    verdictEndingTitle: document.getElementById('verdictEndingTitle'),
    verdictEndingSummary: document.getElementById('verdictEndingSummary'),
    verdictMethodReveal: document.getElementById('verdictMethodReveal'),
    verdictTruthTimeline: document.getElementById('verdictTruthTimeline'),
    shareCardPreview: document.getElementById('shareCardPreview'),
    copyShareCardBtn: document.getElementById('copyShareCardBtn'),
    verdictOpenLibraryBtn: document.getElementById('verdictOpenLibraryBtn'),
    verdictNewCaseBtn: document.getElementById('verdictNewCaseBtn'),

    // سجل القضايا والنهايات (#libraryModal)
    libraryModal: document.getElementById('libraryModal'),
    closeLibraryBtn: document.getElementById('closeLibraryBtn'),
    doneLibraryBtn: document.getElementById('doneLibraryBtn'),
    libSolvedCasesCount: document.getElementById('libSolvedCasesCount'),
    libUnlockedEndingsCount: document.getElementById('libUnlockedEndingsCount'),
    libStreakCount: document.getElementById('libStreakCount'),
    libraryCasesGrid: document.getElementById('libraryCasesGrid'),

    // القائمة الموحدة للإعدادات (#settingsModal)
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    themeSelect: document.getElementById('themeSelect'),
    particleModeSelect: document.getElementById('particleModeSelect'),
    fontSizeSelect: document.getElementById('fontSizeSelect'),
    dialectSelect: document.getElementById('dialectSelect'),
    twistIntensitySelect: document.getElementById('twistIntensitySelect'),
    lowPowerModeCheck: document.getElementById('lowPowerModeCheck'),
    ttsVoiceSelect: document.getElementById('ttsVoiceSelect'),
    ambientSoundSelect: document.getElementById('ambientSoundSelect'),
    ttsSpeedRange: document.getElementById('ttsSpeedRange'),
    ttsSpeedVal: document.getElementById('ttsSpeedVal'),
    ambientVolumeRange: document.getElementById('ambientVolumeRange'),
    ambientVolumeVal: document.getElementById('ambientVolumeVal'),
    autoSpeakReactionCheck: document.getElementById('autoSpeakReactionCheck'),
    autoSpeakSceneCheck: document.getElementById('autoSpeakSceneCheck'),
    sfxEnabledCheck: document.getElementById('sfxEnabledCheck'),
    testTtsVoiceBtn: document.getElementById('testTtsVoiceBtn'),
    clearSavedDataBtn: document.getElementById('clearSavedDataBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),

    toastContainer: document.getElementById('toastContainer')
  };

  /**
   * تهيئة التطبيق عند التحميل
   */
  function init() {
    audioEngine.attachWaveformCanvas(dom.ttsWaveformCanvas);

    audioEngine.onSpeakingStateChange = (speaking, label) => {
      if (dom.vocalPulseRing) dom.vocalPulseRing.classList.toggle('speaking', speaking);
      if (dom.stopTtsBtn) dom.stopTtsBtn.classList.toggle('hidden', !speaking);
      if (dom.speakSceneBtnText) {
        dom.speakSceneBtnText.textContent = speaking ? (label || 'جاري الإلقاء...') : 'قراءة المشهد';
      }
    };

    audioEngine.onEmotionShift = emotionLabel => {
      if (dom.vocalEmotionBadge && emotionLabel) {
        dom.vocalEmotionBadge.textContent = emotionLabel;
      }
      if (dom.gameStage && emotionLabel) {
        let aura = 'cinema';
        if (/همس/.test(emotionLabel)) aura = 'whisper';
        else if (/صدمة|ذهول|انهيار|اعتراف/.test(emotionLabel)) aura = 'shock';
        else if (/تحذير|خطر|توتر|انفعال/.test(emotionLabel)) aura = 'danger';
        else if (/رهبة|مهابة/.test(emotionLabel)) aura = 'awe';
        else if (/حزم|ثقة|تصاعد/.test(emotionLabel)) aura = 'verdict';
        dom.gameStage.setAttribute('data-emotion-aura', aura);
      }
    };

    audioEngine.onSegmentProgress = info => {
      if (!dom.activeTtsEngineTag) return;
      if (!info) {
        const ttsVoice = dom.ttsVoiceSelect ? dom.ttsVoiceSelect.value : 'Charon';
        const voiceTitles = {
          Charon: 'راو رخيم • أصوات مستقلة للشخصيات',
          Fenrir: 'راو مهيب • أصوات مستقلة للشخصيات',
          Aoede: 'راوية درامية • أصوات مستقلة للشخصيات',
          Kore: 'راوية هادئة • أصوات مستقلة للشخصيات',
          Puck: 'راو متوتر • أصوات مستقلة للشخصيات'
        };
        dom.activeTtsEngineTag.textContent = audioEngine.cloudTtsCircuitOpen
          ? '🔊 نطق محلي فوري • أداء متعدد الأصوات'
          : voiceTitles[ttsVoice] || 'أداء درامي متعدد الأصوات';
        return;
      }
      const { current, total, label } = info;
      dom.activeTtsEngineTag.textContent =
        total > 1
          ? `🔊 يشغل المقطع (${current}/${total}) • ${label}`
          : `🔊 يشغل الأداء الصوتي • ${label}`;
    };

    audioEngine.onEngineFallbackNotice = () => {
      if (dom.activeTtsEngineTag) {
        dom.activeTtsEngineTag.textContent = '🔊 نطق محلي فوري • أداء متعدد الأصوات';
      }
    };

    audioEngine.onSynthesizingStateChange = (synthesizing, statusMessage) => {
      if (!dom.ttsDecodingBar) return;
      clearInterval(ttsDecodingInterval);
      if (synthesizing) {
        dom.ttsDecodingBar.classList.remove('hidden');
        dom.ttsDecodingText.textContent = statusMessage || TTS_DECODING_MESSAGES[0];
        let msgIdx = 0;
        ttsDecodingInterval = setInterval(() => {
          msgIdx = (msgIdx + 1) % TTS_DECODING_MESSAGES.length;
          dom.ttsDecodingText.textContent = TTS_DECODING_MESSAGES[msgIdx];
        }, 1200);
      } else {
        dom.ttsDecodingBar.classList.add('hidden');
      }
    };

    audioEngine.onActiveParagraphChange = paraIdx => {
      if (!dom.narrativeBody) return;
      const paras = dom.narrativeBody.querySelectorAll('p');
      paras.forEach((p, idx) => {
        p.classList.toggle('speaking-paragraph', idx === paraIdx);
      });
    };

    // تشغيل شاشة التمهيد السينمائية أولا وبشكل مضمون ضد أي أخطاء جانبية
    runInitialBootPreloader();

    try {
      loadSettingsFromStorage();
      initWeatherParticleSystem();
      bindEvents();
      tryRestoreSavedGame();
      updateHeaderStreakBadge();
      syncScenarioCardCompletionBadges();

      // عرض تدرج الصعوبة الأسبوعي لقضية اليوم (Weekly Difficulty Ramp)
      if (window.MysteryCaseBibles && typeof window.MysteryCaseBibles.getWeeklyDifficultyProfile === 'function') {
        const ramp = window.MysteryCaseBibles.getWeeklyDifficultyProfile();
        const dailyBadge = document.querySelector('.scenario-card[data-scenario="daily"] .case-difficulty-badge');
        if (dailyBadge && ramp) {
          dailyBadge.textContent = `⚡ ${ramp.stars} • ${ramp.label}`;
        }
      }

      initViralAndMonetizationFeatures();
      initImmersiveSensoryExperience();
    } catch (initErr) {
      console.warn('Init warning:', initErr);
    }
  }

  /**
   * تفعيل نظام الغمر الحسي الفائق (Ultra-Immersive Sensory HUD, Detective Flashlight & Live Telemetry)
   */
  function initImmersiveSensoryExperience() {
    document.body.classList.add('flashlight-mode-active');
    const flashlightBtn = document.getElementById('toggleFlashlightModeBtn');
    if (flashlightBtn) {
      flashlightBtn.addEventListener('click', () => {
        const active = document.body.classList.toggle('flashlight-mode-active');
        flashlightBtn.classList.toggle('active', active);
        flashlightBtn.innerHTML = active
          ? '<span>🔦 كشاف المحقق: نشط</span>'
          : '<span>🔦 كشاف المحقق: متوقف</span>';
        if (typeof audioEngine.playPuzzleClickSound === 'function') {
          audioEngine.playPuzzleClickSound();
        }
      });
    }

    const insightBtn = document.getElementById('detectiveInsightBtn');
    if (insightBtn) {
      insightBtn.addEventListener('click', triggerDetectiveInsightHint);
    }

    const updateSpotlightCoords = e => {
      if (!document.body.classList.contains('flashlight-mode-active')) return;
      const card = dom.narrativeCard;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
      const xPct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      card.style.setProperty('--spot-x', `${xPct.toFixed(1)}%`);
      card.style.setProperty('--spot-y', `${yPct.toFixed(1)}%`);
    };

    window.addEventListener('mousemove', updateSpotlightCoords, { passive: true });
    window.addEventListener('touchmove', updateSpotlightCoords, { passive: true });
  }

  function updateImmersiveForensicHud() {
    const envEl = document.getElementById('hudEnvTempText');
    const emfEl = document.getElementById('hudEmfStatusText');
    const bpmEl = document.getElementById('hudPulseBpmText');
    const pulsePill = document.getElementById('hudPulseContainer');

    const scenId = gameState.scenarioId || selectedScenarioId || 'daily';
    const envProfiles = {
      daily: 'مختبر تبريد كمي (-18°C)',
      multiverse: 'شق زمكاني نشط (تردد متغير)',
      unknown_land: 'مرصد الأفق الصحراوي (38°C • جاف)',
      manor: 'عاصفة جبلية ممطرة (8°C)',
      station: 'القطب المتجمد (-42°C • عاصف)',
      train: 'الرحلة 404 (110 كم/س • ضباب)',
      museum: 'عمق 30م تحت البحر (ضغط 4 بار)',
      island: 'فنار الجزيرة المعزول (11°C • رياح)'
    };
    if (envEl) {
      envEl.textContent = envProfiles[scenId] || 'مسرح تحقيق جنائي معزول';
    }

    const danger = Math.max(5, Math.min(100, Number(gameState.dangerLevel) || 15));
    const progress = Math.max(10, Math.min(100, Number(gameState.twistProgress) || 15));

    if (emfEl) {
      const hz = (36 + progress * 0.52 + (danger > 60 ? 14 : 0)).toFixed(1);
      const stateLabel = progress >= 75 ? 'ذروة الكشف' : danger >= 65 ? 'اضطراب حاد' : 'رصد نشط';
      emfEl.textContent = `${hz} Hz • ${stateLabel}`;
    }

    if (bpmEl) {
      const bpm = Math.round(68 + (danger / 100) * 68);
      bpmEl.textContent = `${bpm} BPM`;
    }
    if (pulsePill) {
      pulsePill.classList.toggle('high-tension', danger >= 60);
    }
  }

  /**
   * خريطة المسح الميداني التفاعلي لزوايا مسرح الجريمة (AAA Interactive Crime Scene Tactical Scanner)
   */
  function renderCrimeSceneScanner() {
    const gridEl = document.getElementById('scannerZonesGrid');
    const countPill = document.getElementById('scannerZonesCountPill');
    if (!gridEl) return;
    ensureGameStateHasLockedBible();
    const bible = gameState.caseBible;
    if (!bible || !Array.isArray(bible.clues)) return;

    const allClues = bible.clues;
    let scannedCount = 0;

    gridEl.innerHTML = allClues
      .map(clue => {
        const isScanned = hasDiscoveredClueId(clue.id);
        if (isScanned) scannedCount += 1;
        const prereqsMet = (clue.needs || []).every(reqId => hasDiscoveredClueId(reqId));
        const stateClass = isScanned
          ? `scanned${clue.isRedHerring ? ' red-herring' : ''}`
          : prereqsMet
            ? 'available'
            : 'locked';
        const badgeText = isScanned
          ? clue.isRedHerring
            ? 'تمويه مستبعد ✓'
            : 'تم المسح ✓'
          : prereqsMet
            ? '🔍 متاح للمسح'
            : '🔒 مقفل';
        const descText = isScanned
          ? `${clue.title} (اضغط لسماع التقرير)`
          : prereqsMet
            ? 'اضغط لمعاينة هذا الموضع واستخراج الأثر المادي (+5% ضغط الوقت)'
            : 'يتطلب فحص الزوايا المفتوحة في المسرح أولا';
        const locTitle = clue.locationLabel || clue.title;

        return `
          <button type="button" class="scanner-zone-card ${stateClass}" data-scan-clue-id="${escapeHtml(clue.id)}">
            <div class="scanner-zone-top">
              <span class="scanner-zone-loc">📍 ${escapeHtml(locTitle)}</span>
              <span class="scanner-zone-badge">${escapeHtml(badgeText)}</span>
            </div>
            <span class="scanner-zone-desc">${escapeHtml(descText)}</span>
          </button>
        `;
      })
      .join('');

    if (countPill) {
      countPill.textContent = `${scannedCount} / ${allClues.length} مواقع مفحوصة`;
    }

    gridEl.querySelectorAll('[data-scan-clue-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cid = btn.getAttribute('data-scan-clue-id');
        const targetClue = (bible.clues || []).find(c => c.id === cid);
        if (!targetClue) return;

        const alreadyScanned = hasDiscoveredClueId(targetClue.id);
        if (alreadyScanned) {
          audioEngine.stopSpeaking();
          if (dom.vocalSpeakerLabel) dom.vocalSpeakerLabel.textContent = `🔍 تقرير الموقع (${targetClue.locationLabel || targetClue.title})`;
          if (dom.vocalEmotionBadge) dom.vocalEmotionBadge.textContent = 'تحليل علمي دقيق';
          if (dom.vocalReactionText) dom.vocalReactionText.textContent = `«${targetClue.description}»`;
          audioEngine.speakSingleText(targetClue.description, 'تحليل علمي دقيق', true);
          return;
        }

        const prereqsMet = (targetClue.needs || []).every(reqId => hasDiscoveredClueId(reqId));
        if (!prereqsMet) {
          const missingClue = (bible.clues || []).find(
            c => (targetClue.needs || []).includes(c.id) && !hasDiscoveredClueId(c.id)
          );
          const reqLoc = missingClue ? missingClue.locationLabel || missingClue.title : 'الزاوية السابقة';
          showToast(`🔒 لمعاينة هذا الموقع، افحص أولا: «${reqLoc}»!`);
          return;
        }

        if (typeof audioEngine.playForensicScannerBeep === 'function') {
          audioEngine.playForensicScannerBeep();
        }
        addClueToGameState(targetClue);
        gameState.dangerLevel = Math.min(100, (Number(gameState.dangerLevel) || 15) + 5);

        // فحص فتح أي سر أو تويست مشروط بهذا الدليل
        if (Array.isArray(bible.twists)) {
          for (const tw of bible.twists) {
            const alreadyUnlocked = (gameState.secrets || []).some(
              s => s.id === tw.id || s.title === tw.headline || s.title === tw.secretTitle
            );
            if (!alreadyUnlocked && (tw.unlocks_when || []).every(reqId => hasDiscoveredClueId(reqId))) {
              gameState.secrets.unshift({
                id: tw.id,
                title: tw.headline,
                revelation: tw.revelation
              });
              triggerDramaticTwistOverlay(tw.headline, tw.revelation);
              break;
            }
          }
        }

        if (dom.narrativeBody) {
          const p = document.createElement('p');
          p.className = 'interrogation-transcript-para';
          p.textContent = `[مسح جنائي ميداني • ${targetClue.locationLabel || targetClue.title}]: عثرت على «${targetClue.title}»: ${targetClue.description}`;
          dom.narrativeBody.appendChild(p);
          p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        if (dom.vocalSpeakerLabel) dom.vocalSpeakerLabel.textContent = `🔍 مسح ميداني: ${targetClue.title}`;
        if (dom.vocalEmotionBadge) dom.vocalEmotionBadge.textContent = 'تحليل علمي دقيق';
        if (dom.vocalReactionText) dom.vocalReactionText.textContent = `«${targetClue.description}»`;

        populateInterrogationAndCorkboardSelects();
        renderSidebarState();
        saveGameState();

        if (audioEngine.autoTtsEnabled) {
          audioEngine.speakSingleText(targetClue.description, 'تحليل علمي دقيق', true);
        }
      });
    });
  }

  /**
   * بصيرة المحقق الذكية (Tactical Detective Insight Hint without spoilers)
   */
  function triggerDetectiveInsightHint() {
    ensureGameStateHasLockedBible();
    const bible = gameState.caseBible;
    if (!bible) return;

    if (typeof audioEngine.playForensicScannerBeep === 'function') {
      audioEngine.playForensicScannerBeep();
    }

    // 1. هل هناك موقع في مسرح الجريمة متاح للمسح ولم يفحصه اللاعب بعد؟
    const nextAvailableClue = (bible.clues || []).find(
      c =>
        !c.isRedHerring &&
        !hasDiscoveredClueId(c.id) &&
        (c.needs || []).every(reqId => hasDiscoveredClueId(reqId))
    );

    if (nextAvailableClue) {
      const loc = nextAvailableClue.locationLabel || nextAvailableClue.title;
      const hintMsg = `بصيرة المحقق: وجه عدستك نحو موقع «${loc}» في خريطة المسح الميداني أعلاه؛ هناك أثر مادي لم تفحصه بعد!`;
      if (dom.vocalSpeakerLabel) dom.vocalSpeakerLabel.textContent = '💡 بصيرة المحقق الجنائية';
      if (dom.vocalEmotionBadge) dom.vocalEmotionBadge.textContent = 'تحليل علمي دقيق';
      if (dom.vocalReactionText) dom.vocalReactionText.textContent = `«${hintMsg}»`;
      showToast(`💡 ${hintMsg}`);
      if (audioEngine.autoTtsEnabled) {
        audioEngine.speakSingleText(hintMsg, 'تحليل علمي دقيق', true);
      }
      return;
    }

    // 2. هل يملك اللاعب دليلا يكسر حجة أحد المشتبه بهم ولم يواجهه به بعد؟
    for (const bSus of bible.suspects || []) {
      const gsSus = (gameState.suspects || []).find(s => s.id === bSus.id);
      if (gsSus && gsSus.alibiBroken) continue;
      const matchingClueId = (bSus.contradictedBy || []).find(cid => hasDiscoveredClueId(cid));
      if (matchingClueId) {
        const clueObj = (bible.clues || []).find(c => c.id === matchingClueId);
        if (typeof window.__setActiveActionMode === 'function') {
          window.__setActiveActionMode('interrogate');
        }
        if (dom.interrogateSuspectSelect) dom.interrogateSuspectSelect.value = bSus.id;
        if (dom.interrogateClueSelect) dom.interrogateClueSelect.value = matchingClueId;
        const hintMsg = `بصيرة المحقق: لاحظ التناقض بين إفادة «${bSus.name}» ودليل «${clueObj ? clueObj.title : matchingClueId}»! واجهه به الآن في منصة الاستجواب.`;
        if (dom.vocalSpeakerLabel) dom.vocalSpeakerLabel.textContent = '💡 بصيرة المحقق الجنائية';
        if (dom.vocalEmotionBadge) dom.vocalEmotionBadge.textContent = 'تساؤل ماكر وتشكيك';
        if (dom.vocalReactionText) dom.vocalReactionText.textContent = `«${hintMsg}»`;
        showToast(`💡 ${hintMsg}`);
        if (audioEngine.autoTtsEnabled) {
          audioEngine.speakSingleText(hintMsg, 'تساؤل ماكر وتشكيك', true);
        }
        return;
      }
    }

    // 3. جميع الأدلة والحجج جاهزة للحسم!
    const readyMsg =
      'بصيرة المحقق: اكتملت لديك سلسلة الأدلة المادية وانكسرت حجج الغياب! يمكنك الآن دخول غرفة الاتهام لإصدار الحكم النهائي أو تجربة شفرة النهاية السرية الأسطورية.';
    if (dom.vocalSpeakerLabel) dom.vocalSpeakerLabel.textContent = '💡 بصيرة المحقق الجنائية';
    if (dom.vocalEmotionBadge) dom.vocalEmotionBadge.textContent = 'حزم وثقة استقصائية';
    if (dom.vocalReactionText) dom.vocalReactionText.textContent = `«${readyMsg}»`;
    showToast(`⚖️ ${readyMsg}`);
    if (audioEngine.autoTtsEnabled) {
      audioEngine.speakSingleText(readyMsg, 'حزم وثقة استقصائية', true);
    }
  }

  /**
   * ============================================================================
   * قصر الذهن البصري ولوحة الخيوط الجنائية الحمراء (AAA Visual Mind Palace & Red-String Board)
   * ============================================================================
   */
  let selectedMindPalaceClueId = null;

  function openMindPalaceModal() {
    const modal = document.getElementById('mindPalaceModal');
    if (!modal) return;
    lastFocusedElementBeforeModal = document.activeElement;
    ensureGameStateHasLockedBible();
    selectedMindPalaceClueId = null;
    if (typeof audioEngine.playDossierPaperSound === 'function') {
      audioEngine.playDossierPaperSound();
    }
    renderMindPalaceBoard();
    modal.classList.remove('hidden');
    requestAnimationFrame(() => drawMindPalaceSvgThreads());
    const closeBtn = document.getElementById('closeMindPalaceBtn');
    if (closeBtn) {
      setTimeout(() => {
        try {
          closeBtn.focus();
        } catch (_) {}
      }, 40);
    }
  }

  function closeMindPalaceModal() {
    const modal = document.getElementById('mindPalaceModal');
    if (!modal) return;
    modal.classList.add('hidden');
    if (lastFocusedElementBeforeModal && typeof lastFocusedElementBeforeModal.focus === 'function') {
      try {
        lastFocusedElementBeforeModal.focus();
      } catch (_) {}
    }
  }

  function drawMindPalaceSvgThreads() {
    const stage = document.getElementById('mpBoardStage');
    const svg = document.getElementById('mpThreadsSvg');
    if (!stage || !svg) return;
    const stageRect = stage.getBoundingClientRect();
    if (stageRect.width <= 0 || stageRect.height <= 0) {
      svg.innerHTML = '';
      return;
    }

    const links = Array.isArray(gameState.boardLinks) ? gameState.boardLinks : [];
    const svgNs = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${stageRect.width} ${stageRect.height}`);

    links.forEach(link => {
      const clueEl = stage.querySelector(`[data-mp-clue-id="${CSS.escape(link.clueId)}"]`);
      const susEl = stage.querySelector(`[data-mp-suspect-id="${CSS.escape(link.suspectId)}"]`);
      if (!clueEl || !susEl) return;

      const cRect = clueEl.getBoundingClientRect();
      const sRect = susEl.getBoundingClientRect();

      const x1 = cRect.left - stageRect.left + 8;
      const y1 = cRect.top - stageRect.top + cRect.height / 2;
      const x2 = sRect.right - stageRect.left - 8;
      const y2 = sRect.top - stageRect.top + sRect.height / 2;
      const midX = (x1 + x2) / 2;

      const isVerified = Boolean(link.verified);
      const strokeColor = !isVerified
        ? '#f43f5e'
        : link.relationType === 'contradicts'
          ? '#10b981'
          : '#f5b95f';

      const path = document.createElementNS(svgNs, 'path');
      path.setAttribute('d', `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', strokeColor);
      path.setAttribute('stroke-width', isVerified ? '2.6' : '2');
      path.setAttribute('stroke-linecap', 'round');
      if (!isVerified) {
        path.setAttribute('stroke-dasharray', '6 5');
        path.setAttribute('opacity', '0.7');
      } else {
        path.setAttribute('opacity', '0.92');
      }
      svg.appendChild(path);

      [
        [x1, y1],
        [x2, y2]
      ].forEach(([px, py]) => {
        const dot = document.createElementNS(svgNs, 'circle');
        dot.setAttribute('cx', String(px));
        dot.setAttribute('cy', String(py));
        dot.setAttribute('r', '4.5');
        dot.setAttribute('fill', strokeColor);
        dot.setAttribute('stroke', '#090e18');
        dot.setAttribute('stroke-width', '1.5');
        svg.appendChild(dot);
      });
    });
  }

  function renderMindPalaceBoard() {
    ensureGameStateHasLockedBible();
    const bible = gameState.caseBible || {};
    const cluesListEl = document.getElementById('mpCluesList');
    const suspectsListEl = document.getElementById('mpSuspectsList');
    const timelineEl = document.getElementById('mpTimelineStrip');

    if (cluesListEl) {
      const discovered = Array.isArray(gameState.clues) ? gameState.clues : [];
      if (discovered.length === 0) {
        cluesListEl.innerHTML = '<div class="empty-note">لم تكتشف أدلة بعد. افحص مسرح الجريمة أولا.</div>';
      } else {
        cluesListEl.innerHTML = discovered
          .map(c => {
            const cid = c.id || c.title;
            const isSelected = selectedMindPalaceClueId === cid;
            return `
              <button type="button" class="mp-node-card ${isSelected ? 'selected-pin' : ''}" data-mp-clue-id="${escapeHtml(cid)}">
                <strong>📌 ${escapeHtml(c.title)}</strong>
                <small>${escapeHtml(c.description || '')}</small>
              </button>
            `;
          })
          .join('');

        cluesListEl.querySelectorAll('[data-mp-clue-id]').forEach(btn => {
          btn.addEventListener('click', () => {
            const cid = btn.getAttribute('data-mp-clue-id');
            selectedMindPalaceClueId = selectedMindPalaceClueId === cid ? null : cid;
            if (typeof audioEngine.playPinSnapSound === 'function') {
              audioEngine.playPinSnapSound();
            }
            renderMindPalaceBoard();
            requestAnimationFrame(() => drawMindPalaceSvgThreads());
          });
        });
      }
    }

    if (suspectsListEl) {
      const suspects = Array.isArray(gameState.suspects) ? gameState.suspects : [];
      suspectsListEl.innerHTML = suspects
        .map(s => {
          const sid = s.id || s.name;
          const pState = s.alibiBroken ? 'broken' : 'calm';
          return `
            <button type="button" class="mp-node-card ${s.alibiBroken ? 'alibi-broken' : ''}" data-mp-suspect-id="${escapeHtml(sid)}">
              <strong class="suspect-title-with-portrait">${renderSuspectPortraitSvg(s, pState)} <span>${escapeHtml(s.name)}</span></strong>
              <small>${escapeHtml(s.alibi || s.note || '')}</small>
            </button>
          `;
        })
        .join('');

      suspectsListEl.querySelectorAll('[data-mp-suspect-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sid = btn.getAttribute('data-mp-suspect-id');
          if (!selectedMindPalaceClueId) {
            const targetSus = (gameState.suspects || []).find(s => (s.id || s.name) === sid);
            if (targetSus && targetSus.alibi) {
              audioEngine.stopSpeaking();
              audioEngine.speakSingleText(targetSus.alibi, 'توتر وانفعال دفاعي', true, targetSus.voice || null);
              showToast(`📌 اختر دليلا من العمود الأيمن أولا، ثم اضغط على «${targetSus.name}» لشد الخيط بينهما.`);
            }
            return;
          }

          const relEl = document.getElementById('mpRelationSelect');
          const relationType = relEl ? relEl.value : 'contradicts';
          const check = window.MysteryCaseBibles.verifyCorkboardLink(
            gameState.caseBible,
            selectedMindPalaceClueId,
            sid,
            relationType
          );

          if (!Array.isArray(gameState.boardLinks)) gameState.boardLinks = [];
          const duplicate = gameState.boardLinks.some(
            l => l.clueId === check.clueId && l.suspectId === check.suspectId && l.relationType === relationType
          );
          if (duplicate) {
            showToast('هذا الخيط مثبت بالفعل على لوحة قصر الذهن.');
            selectedMindPalaceClueId = null;
            renderMindPalaceBoard();
            requestAnimationFrame(() => drawMindPalaceSvgThreads());
            return;
          }

          const clueObj = (gameState.caseBible?.clues || []).find(c => c.id === check.clueId) || { title: check.clueId };
          const susObj = (gameState.caseBible?.suspects || []).find(s => s.id === check.suspectId) || { name: check.suspectId };

          gameState.boardLinks.unshift({
            clueId: check.clueId,
            suspectId: check.suspectId,
            clueTitle: clueObj.title,
            suspectName: susObj.name,
            relationType,
            verified: check.verified,
            feedback: check.feedback
          });

          if (typeof audioEngine.playPinSnapSound === 'function') {
            audioEngine.playPinSnapSound();
          }
          if (check.verified) {
            audioEngine.playClueSound();
          }

          selectedMindPalaceClueId = null;
          renderSidebarState();
          saveGameState();
          renderMindPalaceBoard();
          requestAnimationFrame(() => drawMindPalaceSvgThreads());
          showToast(check.feedback);
        });
      });
    }

    const linksStripEl = document.getElementById('mpActiveLinksStrip');
    if (linksStripEl) {
      const links = Array.isArray(gameState.boardLinks) ? gameState.boardLinks : [];
      if (links.length === 0) {
        linksStripEl.innerHTML = '';
      } else {
        linksStripEl.innerHTML = links
          .map(
            (l, idx) => `
          <span class="mp-link-chip ${l.verified ? 'verified' : 'unverified'}">
            <span>${l.verified ? '✓' : '×'} ${escapeHtml(l.clueTitle)} ➔ ${escapeHtml(l.suspectName)}</span>
            <button type="button" class="mp-unpin-btn" data-mp-unpin-idx="${idx}" title="فك هذا الخيط">×</button>
          </span>`
          )
          .join('');

        linksStripEl.querySelectorAll('[data-mp-unpin-idx]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-mp-unpin-idx'));
            if (!Number.isNaN(idx) && Array.isArray(gameState.boardLinks)) {
              gameState.boardLinks.splice(idx, 1);
              if (typeof audioEngine.playPinSnapSound === 'function') {
                audioEngine.playPinSnapSound();
              }
              renderSidebarState();
              saveGameState();
              renderMindPalaceBoard();
              requestAnimationFrame(() => drawMindPalaceSvgThreads());
            }
          });
        });
      }
    }

    if (timelineEl) {
      const timeline = Array.isArray(bible.timeline) ? bible.timeline : [];
      if (timeline.length === 0) {
        timelineEl.innerHTML = '<div class="mp-time-chip">الوقائع الزمنية قيد التجميع.</div>';
      } else {
        const realCluesFound = (gameState.clues || []).filter(c => !c.isRedHerring).length;
        const brokenAlibis = (gameState.suspects || []).filter(s => s.alibiBroken).length;
        const culpritObj = (bible.suspects || []).find(s => s.id === bible.culpritId);
        const culpritBaseName = culpritObj ? culpritObj.name.split('(')[0].trim() : '';
        const culpritBroken = (gameState.suspects || []).some(
          s => s.id === bible.culpritId && s.alibiBroken
        );
        const shouldMaskCulprit = Boolean(culpritBaseName && !culpritBroken && !gameState.caseSolved);

        timelineEl.innerHTML = timeline
          .map((t, idx) => {
            const isUnlocked =
              Boolean(gameState.caseSolved) ||
              (idx === 0 && realCluesFound >= 2) ||
              (idx === 1 && (realCluesFound >= 3 || brokenAlibis >= 1)) ||
              (idx >= 2 && (realCluesFound >= 4 || culpritBroken));

            if (!isUnlocked) {
              return `<div class="mp-time-chip"><strong>🔒 [${escapeHtml(t.time)}]</strong><span>واقعة زمنية غامضة (افحص المزيد من الأدلة لكشف ما جرى في هذه الساعة)</span></div>`;
            }

            let safeText = String(t.text || '');
            if (shouldMaskCulprit && safeText.includes(culpritBaseName)) {
              safeText = safeText.split(culpritBaseName).join('الجاني المجهول');
            }
            return `<div class="mp-time-chip"><strong>[${escapeHtml(t.time)}]</strong><span>${escapeHtml(safeText)}</span></div>`;
          })
          .join('');
      }
    }
  }

  /**
   * تفعيل استوديو الانتشار الفيروسي، وعضوية المحقق الأعلى، وروابط التحدي المباشرة، وتحميل بطاقة الستوري (PNG)
   */
  function initViralAndMonetizationFeatures() {
    if (!window.MysteryViralEngine) return;
    const ve = window.MysteryViralEngine;

    const proModal = document.getElementById('proViralModal');
    const openProBtn = document.getElementById('openProViralModalBtn');
    const closeProBtn = document.getElementById('closeProViralModalBtn');
    const doneProBtn = document.getElementById('doneProViralModalBtn');
    const proHeaderBadgeLabel = document.getElementById('proHeaderBadgeLabel');
    const proStatusPill = document.getElementById('proStatusPill');
    const viralPreviewBox = document.getElementById('viralScriptPreviewBox');
    const rerollViralBtn = document.getElementById('rerollViralScriptBtn');
    const speakViralBtn = document.getElementById('speakViralScriptBtn');
    const copyViralBtn = document.getElementById('copyViralScriptBtn');
    const proCodeInput = document.getElementById('proPassCodeInput');
    const activateProBtn = document.getElementById('activateProPassBtn');
    const shareMultiverseBtn = document.getElementById('shareMultiverseWorldBtn');
    const downloadPngBtn = document.getElementById('downloadSharePngBtn');
    const shareWaBtn = document.getElementById('shareWhatsappBtn');
    const shareTwBtn = document.getElementById('shareTwitterBtn');
    const rewardedAppealRow = document.getElementById('rewardedAppealRow');
    const rewardedExtraAttemptBtn = document.getElementById('rewardedExtraAttemptBtn');

    let currentViralScript = null;

    const syncProUiState = () => {
      const active = ve.isProPassActive();
      const rawRelics = typeof ve.getUnlockedMythicRelics === 'function' ? ve.getUnlockedMythicRelics() : [];
      const unlockedRelics = Array.isArray(rawRelics)
        ? rawRelics
        : rawRelics && typeof rawRelics === 'object'
          ? Object.values(rawRelics)
          : [];
      const relicsMap = window.MysteryCaseBibles?.MYTHIC_SECRET_ENDINGS || {};
      const allRelicEntries = Object.entries(relicsMap);
      const totalRelicsCount = allRelicEntries.length || 8;

      if (proHeaderBadgeLabel) {
        if (unlockedRelics.length > 0) {
          proHeaderBadgeLabel.textContent = `خزنة الأساطير (${unlockedRelics.length}/${totalRelicsCount}) ✓`;
        } else {
          proHeaderBadgeLabel.textContent = active ? 'عضوية المحقق الأعلى ✓' : 'استوديو الانتشار والأسرار';
        }
      }
      if (proStatusPill) {
        proStatusPill.textContent = active ? '👑 عضوية المحقق الأعلى مفعلة' : 'الباقة المجانية نشطة';
      }

      const countBadge = document.getElementById('mythicRelicsCountBadge');
      if (countBadge) {
        countBadge.textContent = `${unlockedRelics.length} / ${totalRelicsCount} أسرار مكتشفة`;
      }

      const vaultGrid = document.getElementById('mythicRelicsVaultGrid');
      if (vaultGrid && allRelicEntries.length > 0) {
        vaultGrid.innerHTML = allRelicEntries
          .map(([scId, prof]) => {
            const targetId = prof.relicId || prof.id;
            const found = unlockedRelics.some(
              r => (r.relicId || r.id) === targetId || r.scenarioId === scId
            );
            const caseLabel = SCENARIO_PRESETS[scId]?.title || scId;
            const perkText = prof.rewardPerk || prof.rewardLabel || '';
            if (found) {
              return `
                <div class="mythic-relic-card unlocked">
                  <div class="mythic-relic-top">
                    <span class="mythic-relic-icon">${escapeHtml(prof.relicIcon)}</span>
                    <span class="mythic-relic-title">${escapeHtml(prof.relicName)}</span>
                  </div>
                  <p class="mythic-relic-desc">${escapeHtml(perkText)}</p>
                  <span class="mythic-relic-hint">✓ تم كشف النهاية السرية في: ${escapeHtml(caseLabel)}</span>
                </div>`;
            }
            return `
              <div class="mythic-relic-card locked">
                <div class="mythic-relic-top">
                  <span class="mythic-relic-icon">🔒</span>
                  <span class="mythic-relic-title">أثر أسطوري مخبأ (${escapeHtml(caseLabel)})</span>
                </div>
                <p class="mythic-relic-desc">${escapeHtml(prof.riddleHint)}</p>
                <span class="mythic-relic-hint">💡 اكتب تصرفا حرا يطابق الشفرة داخل القضية لفتحه</span>
              </div>`;
          })
          .join('');
      }
    };
    window.__syncMythicVaultUi = syncProUiState;

    // تهيئة مختبر مهندس العوالم الحر (Custom Multiverse Architect)
    const lawSelect = document.getElementById('customArchitectLawSelect');
    const catSelect = document.getElementById('customArchitectCatalystSelect');
    const launchArchBtn = document.getElementById('launchCustomArchitectWorldBtn');
    if (lawSelect && catSelect && window.MysteryMultiverse) {
      const laws = window.MysteryMultiverse.WORLD_LAWS_100 || [];
      const cats = window.MysteryMultiverse.WORLD_CATALYSTS_100 || [];
      if (lawSelect.options.length === 0 && laws.length > 0) {
        lawSelect.innerHTML = laws
          .map((l, idx) => `<option value="${idx}">قانون #${l.id}: ${escapeHtml(l.title)} (${escapeHtml(l.category)})</option>`)
          .join('');
      }
      if (catSelect.options.length === 0 && cats.length > 0) {
        catSelect.innerHTML = cats
          .map((c, idx) => `<option value="${idx}">شرارة #${c.id}: ${escapeHtml(c.title)} (${escapeHtml(c.setting)})</option>`)
          .join('');
      }
      if (launchArchBtn) {
        launchArchBtn.addEventListener('click', () => {
          const lawIndex = Number(lawSelect.value) || 0;
          const catalystIndex = Number(catSelect.value) || 0;
          pendingMultiverseCombo = window.MysteryMultiverse.rollMultiverseCombination({
            lawIndex,
            catalystIndex
          });
          if (dom.multiverseRollTitleText && pendingMultiverseCombo) {
            dom.multiverseRollTitleText.textContent = pendingMultiverseCombo.mergedTitle;
          }
          if (SCENARIO_PRESETS.multiverse && pendingMultiverseCombo) {
            SCENARIO_PRESETS.multiverse.title = `عابر العوالم: ${pendingMultiverseCombo.mergedTitle}`;
            SCENARIO_PRESETS.multiverse.teaserVoice = pendingMultiverseCombo.mergedTeaser;
            SCENARIO_PRESETS.multiverse.prompt = pendingMultiverseCombo.mergedPrompt;
          }
          if (proModal) proModal.classList.add('hidden');
          selectScenarioById('multiverse');
          showToast(`🌌 تم هندسة عالمك الخاص: ${pendingMultiverseCombo.mergedTitle}!`);
          startNewAdventure();
        });
      }
    }

    const refreshViralStudioScript = (options = {}) => {
      currentViralScript = ve.generateViralShortScript(options);
      if (viralPreviewBox && currentViralScript) {
        viralPreviewBox.textContent = currentViralScript.fullCopyText;
      }
    };

    syncProUiState();
    refreshViralStudioScript(pendingMultiverseCombo || {});

    if (openProBtn && proModal) {
      openProBtn.addEventListener('click', () => {
        refreshViralStudioScript(pendingMultiverseCombo || {});
        syncProUiState();
        proModal.classList.remove('hidden');
      });
    }
    const closeProModal = () => {
      if (proModal) proModal.classList.add('hidden');
    };
    if (closeProBtn) closeProBtn.addEventListener('click', closeProModal);
    if (doneProBtn) doneProBtn.addEventListener('click', closeProModal);
    if (proModal) {
      proModal.addEventListener('click', e => {
        if (e.target === proModal) closeProModal();
      });
    }

    if (rerollViralBtn) {
      rerollViralBtn.addEventListener('click', () => {
        refreshViralStudioScript({});
        showToast('🎬 تم توليد سيناريو فيديو فيروسي جديد من أصل 10,000 عالم!');
      });
    }

    if (speakViralBtn) {
      speakViralBtn.addEventListener('click', async () => {
        if (!currentViralScript) refreshViralStudioScript({});
        if (!currentViralScript) return;
        const orig = speakViralBtn.innerHTML;
        speakViralBtn.innerHTML = '<span>🔊 يقرأ المقطع الآن...</span>';
        try {
          await audioEngine.speakSingleText(currentViralScript.spokenScript, 'رهبة وترقب', true);
        } finally {
          speakViralBtn.innerHTML = orig;
        }
      });
    }

    if (copyViralBtn) {
      copyViralBtn.addEventListener('click', async () => {
        if (!currentViralScript) refreshViralStudioScript({});
        if (!currentViralScript) return;
        try {
          await navigator.clipboard.writeText(currentViralScript.fullCopyText);
          showToast('✅ تم نسخ سيناريو الفيديو والهاشتاقات ورابط التحدي المباشر!');
        } catch (_) {
          showToast('تم تجهيز السيناريو للنسخ.');
        }
      });
    }

    if (activateProBtn && proCodeInput) {
      activateProBtn.addEventListener('click', () => {
        const res = ve.activateProPassWithCode(proCodeInput.value);
        showToast(res.message);
        if (res.ok) {
          proCodeInput.value = '';
          syncProUiState();
        }
      });
    }

    if (shareMultiverseBtn) {
      shareMultiverseBtn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!pendingMultiverseCombo) rollAndPreviewMultiverseCard(false);
        const url = ve.buildChallengeUrl({
          scenarioId: 'multiverse',
          lawIndex: pendingMultiverseCombo ? pendingMultiverseCombo.lawIndex : 0,
          catalystIndex: pendingMultiverseCombo ? pendingMultiverseCombo.catalystIndex : 0
        });
        const sectorCode = pendingMultiverseCombo
          ? `#${(pendingMultiverseCombo.lawIndex || 0) + 1}-${(pendingMultiverseCombo.catalystIndex || 0) + 1}`
          : '#01-01';
        const msg = `🌀 أتحداك في طور عابر العوالم (البوابة الزمكانية المشفرة ${sectorCode})! هل تستطيع اكتشاف قانون هذا العالم وكشف الجاني؟\n${url}`;
        try {
          await navigator.clipboard.writeText(msg);
          showToast('🔗 تم نسخ رابط التحدي المباشر لهذا العالم لمشاركته مع أصدقائك!');
        } catch (_) {
          ve.shareViaChannel('whatsapp', msg, url);
        }
      });
    }

    if (downloadPngBtn) {
      downloadPngBtn.addEventListener('click', async () => {
        const ok = await ve.downloadVerdictStoryCardPng(gameState, gameState.finalVerdictResult);
        if (ok) {
          showToast('📸 تم تحميل بطاقة النتيجة كصورة (1080×1350) جاهزة للنشر في الستوري!');
        }
      });
    }

    const getCurrentChallengeUrl = () => {
      if (gameState.scenarioId === 'multiverse' && gameState.caseBible?.worldLaw && gameState.caseBible?.worldCatalyst) {
        return ve.buildChallengeUrl({
          scenarioId: 'multiverse',
          lawIndex: (gameState.caseBible.worldLaw.id || 1) - 1,
          catalystIndex: (gameState.caseBible.worldCatalyst.id || 1) - 1
        });
      }
      return ve.buildChallengeUrl({ scenarioId: gameState.scenarioId || selectedScenarioId });
    };

    if (shareWaBtn) {
      shareWaBtn.addEventListener('click', () => {
        const text = dom.shareCardPreview ? dom.shareCardPreview.textContent : 'حسمت القضية في قلب الغموض!';
        ve.shareViaChannel('whatsapp', text, getCurrentChallengeUrl());
      });
    }

    if (shareTwBtn) {
      shareTwBtn.addEventListener('click', () => {
        const text = dom.shareCardPreview ? dom.shareCardPreview.textContent : 'حسمت القضية في قلب الغموض!';
        ve.shareViaChannel('twitter', text, getCurrentChallengeUrl());
      });
    }

    if (rewardedExtraAttemptBtn && rewardedAppealRow) {
      rewardedExtraAttemptBtn.addEventListener('click', () => {
        gameState.verdictAttemptsRemaining = (gameState.verdictAttemptsRemaining || 1) + 1;
        if (dom.verdictAttemptsBadge) {
          dom.verdictAttemptsBadge.textContent = `المحاولات المتبقية: ${gameState.verdictAttemptsRemaining} / 3`;
        }
        rewardedAppealRow.classList.add('hidden');
        saveGameState();
        showToast('⚖️ تم منحك محاولة استئناف إضافية في غرفة الاتهام!');
      });
    }

    // قراءة رابط التحدي المباشر عند فتح الموقع (?world=law-cat أو ?case=id)
    const incoming = ve.parseIncomingDeepLink();
    if (incoming) {
      if (incoming.type === 'multiverse') {
        pendingMultiverseCombo = window.MysteryMultiverse.rollMultiverseCombination({
          lawIndex: incoming.lawIndex,
          catalystIndex: incoming.catalystIndex
        });
        const sectorCode = `#${(incoming.lawIndex || 0) + 1}-${(incoming.catalystIndex || 0) + 1}`;
        if (dom.multiverseRollTitleText) {
          dom.multiverseRollTitleText.textContent = `🔒 تحدي عالم مشترك (${sectorCode}) • تتكشف شريعته فور دخولك المشهد`;
        }
        if (SCENARIO_PRESETS.multiverse && pendingMultiverseCombo) {
          SCENARIO_PRESETS.multiverse.prompt = pendingMultiverseCombo.mergedPrompt;
        }
        selectScenarioById('multiverse');
        setTimeout(() => {
          showToast(`🔗 تم تجهيز تحدي العالم الموازي المشترك معك (${sectorCode}). اضغط ابدأ لاكتشاف شريعته!`);
        }, 900);
      } else if (incoming.type === 'case' && SCENARIO_PRESETS[incoming.scenarioId]) {
        selectScenarioById(incoming.scenarioId);
        setTimeout(() => {
          showToast(`🔗 تم فتح ملف القضية المشترك معك: ${SCENARIO_PRESETS[incoming.scenarioId].title}`);
        }, 900);
      }
    }
  }

  /**
   * ============================================================================
   * نظام الجزيئات المناخية السينمائية (يتوقف تلقائيا في وضع توفير الطاقة أو تقليل الحركة)
   * ============================================================================
   */
  function resolveActiveParticleType() {
    if (lowPowerMode || prefersReducedMotion) return 'off';
    if (particleMode && particleMode !== 'auto') return particleMode;
    const scen = gameState.active ? gameState.scenarioId : selectedScenarioId;
    if (scen === 'station') return 'frost';
    if (scen === 'train' || scen === 'island' || scen === 'daily' || scen === 'unknown_land') return 'fog';
    return 'rain';
  }

  function initWeatherParticleSystem() {
    const canvas = dom.weatherParticlesCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = window.innerWidth || 1280;
      canvas.height = window.innerHeight || 720;
      rebuildParticles(canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const renderParticlesFrame = () => {
      const activeType = resolveActiveParticleType();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (activeType === 'off') {
        particleAnimId = null;
        return;
      }

      particleAnimId = requestAnimationFrame(renderParticlesFrame);

      const w = canvas.width;
      const h = canvas.height;
      const now = performance.now() * 0.001;

      for (let i = 0; i < fogCloudsList.length; i++) {
        const f = fogCloudsList[i];
        f.x += f.vx;
        if (f.x - f.r > w) f.x = -f.r;
        if (f.x + f.r < 0) f.x = w + f.r;

        const grad = ctx.createRadialGradient(f.x, f.y, f.r * 0.1, f.x, f.y, f.r);
        if (activeType === 'frost') {
          grad.addColorStop(0, `rgba(186, 230, 253, ${f.alpha})`);
        } else if (activeType === 'fog') {
          grad.addColorStop(0, `rgba(226, 176, 73, ${f.alpha * 0.85})`);
        } else {
          grad.addColorStop(0, `rgba(148, 163, 184, ${f.alpha})`);
        }
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (activeType === 'rain') {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.34)';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        for (let i = 0; i < particlesList.length; i++) {
          const p = particlesList[i];
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.6, p.y + p.len);

          p.x += p.vx;
          p.y += p.vy;

          if (p.y > h) {
            p.y = -20;
            p.x = Math.random() * (w + 150) - 75;
          }
          if (p.x < -80) p.x = w + 40;
        }
        ctx.stroke();
      } else if (activeType === 'frost') {
        for (let i = 0; i < particlesList.length; i++) {
          const p = particlesList[i];
          const sway = Math.sin(now * 1.5 + p.phase) * 0.65;
          p.x += p.vx + sway;
          p.y += p.vy * 0.24;

          if (p.y > h + 10) {
            p.y = -10;
            p.x = Math.random() * w;
          }
          if (p.x > w + 10) p.x = -10;
          if (p.x < -10) p.x = w + 10;

          ctx.fillStyle = `rgba(224, 242, 254, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (activeType === 'fog') {
        for (let i = 0; i < particlesList.length; i++) {
          const p = particlesList[i];
          const driftX = Math.cos(now * 0.9 + p.phase) * 0.45;
          const driftY = Math.sin(now * 0.7 + p.phase) * 0.35;
          p.x += driftX;
          p.y += driftY - 0.18;

          if (p.y < -10) p.y = h + 10;
          if (p.x > w + 10) p.x = -10;
          if (p.x < -10) p.x = w + 10;

          const pulse = 0.55 + 0.45 * Math.sin(now * 2.2 + p.phase);
          ctx.fillStyle =
            i % 2 === 0
              ? `rgba(212, 163, 89, ${p.alpha * pulse * 0.85})`
              : `rgba(110, 193, 198, ${p.alpha * pulse * 0.75})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.15, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    window.__restartWeatherLoop = () => {
      if (particleAnimId) cancelAnimationFrame(particleAnimId);
      particleAnimId = null;
      if (resolveActiveParticleType() !== 'off') {
        renderParticlesFrame();
      } else if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    window.__restartWeatherLoop();
  }

  function rebuildParticles(w, h) {
    const count = Math.min(85, Math.max(36, Math.floor((w * h) / 18000)));
    particlesList = [];
    for (let i = 0; i < count; i++) {
      particlesList.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: -1.6 - Math.random() * 1.2,
        vy: 11 + Math.random() * 8,
        len: 14 + Math.random() * 16,
        size: 1.4 + Math.random() * 2.4,
        alpha: 0.22 + Math.random() * 0.48,
        phase: Math.random() * Math.PI * 2
      });
    }

    fogCloudsList = [];
    for (let i = 0; i < 5; i++) {
      fogCloudsList.push({
        x: Math.random() * w,
        y: h * (0.2 + Math.random() * 0.7),
        r: 180 + Math.random() * 160,
        vx: (i % 2 === 0 ? 1 : -1) * (0.18 + Math.random() * 0.22),
        alpha: 0.035 + Math.random() * 0.03
      });
    }
  }

  /**
   * شاشة التمهيد السينمائية: إضاءة مسرحية وتتابع سلس مضمون بـ Failsafe Timer لمنع التعليق نهائيا
   */
  async function runInitialBootPreloader() {
    if (!dom.appPreloader) {
      checkServerManagedKey();
      return;
    }

    // تخطي شاشة التمهيد فورا للزوار العائدين في نفس الجلسة
    try {
      if (sessionStorage.getItem(SESSION_KEY_BOOTED) === '1') {
        dom.appPreloader.classList.add('hidden');
        checkServerManagedKey();
        return;
      }
    } catch (_) {}

    let dismissed = false;
    const dismissPreloader = () => {
      if (dismissed) return;
      dismissed = true;
      try {
        sessionStorage.setItem(SESSION_KEY_BOOTED, '1');
      } catch (_) {}
      dom.appPreloader.classList.add('fade-out');
      setTimeout(() => {
        dom.appPreloader.classList.add('hidden');
      }, 460);
    };

    // مؤقت أمان صارم (Failsafe): يضمن فتح الستار السينمائي دائما حتى لو تأخر أي خط أو اتصال شبكي
    const hardFailsafeTimer = setTimeout(dismissPreloader, 1850);

    if (dom.skipPreloaderBtn) {
      dom.skipPreloaderBtn.addEventListener(
        'click',
        () => {
          clearTimeout(hardFailsafeTimer);
          dismissPreloader();
        },
        { once: true }
      );
    }

    const setBootProgress = (pct, subText, stageQuote) => {
      if (dom.bootProgressBar) dom.bootProgressBar.style.width = `${pct}%`;
      if (dom.bootPercentText) dom.bootPercentText.textContent = `${pct}%`;
      if (subText && dom.bootStatusSub) dom.bootStatusSub.textContent = subText;
      if (stageQuote && dom.preloaderStageText) dom.preloaderStageText.textContent = stageQuote;
    };

    setBootProgress(
      45,
      '🎬 اللقطة 1/3: إشعال مصابيح مسرح الجريمة وتجهيز الخطوط الروائية...',
      'كل جريمة تترك همسة في الظلام... وكل دليل مادي ينتظر من يربط خيوطه'
    );
    if (document.fonts && document.fonts.ready) {
      await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 180))]);
    }
    if (dom.bootCheckFonts) {
      dom.bootCheckFonts.classList.remove('active');
      dom.bootCheckFonts.classList.add('done');
    }
    if (dom.bootCheckApi) dom.bootCheckApi.classList.add('active');

    setBootProgress(
      82,
      '📂 اللقطة 2/3: فتح أرشيف القضايا السرية وبوابة الـ 10,000 عالم...',
      'ثلاثة مشتبه بهم في كل مسرح... لكل واحد منهم صوته المستقل وكذبته المحكمة'
    );
    await Promise.race([checkServerManagedKey(), new Promise(r => setTimeout(r, 220))]);
    if (dom.bootCheckApi) {
      dom.bootCheckApi.classList.remove('active');
      dom.bootCheckApi.classList.add('done');
    }
    if (dom.bootCheckAudio) dom.bootCheckAudio.classList.add('active');

    setBootProgress(
      100,
      '🎙️ اللقطة 3/3: اكتمل التجهيز السينمائي... يرتفع الستار الآن!',
      'مرحبا بك في قلب الغموض... اختر قضيتك وابدأ التحقيق الصوتي التفاعلي'
    );
    if (dom.bootCheckAudio) {
      dom.bootCheckAudio.classList.remove('active');
      dom.bootCheckAudio.classList.add('done');
    }

    clearTimeout(hardFailsafeTimer);
    setTimeout(dismissPreloader, 240);
  }

  async function checkServerManagedKey() {
    if (!window.location || !window.location.protocol.startsWith('http')) return;
    try {
      const res = await fetch('/api/config');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.serverManagedKey !== undefined) {
        isServerKeyAvailable = Boolean(data.serverManagedKey);
        applyCurrentFormSettingsToEngines();
      }
    } catch (_) {}
  }

  /**
   * تحميل وحفظ الإعدادات الموحدة من قائمة الإعدادات (#settingsModal)
   */
  function loadSettingsFromStorage() {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'cinema-dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
      if (dom.themeSelect) dom.themeSelect.value = savedTheme;

      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (raw) {
        const saved = JSON.parse(raw);
        if (dom.themeSelect && saved.theme) {
          dom.themeSelect.value = saved.theme;
          document.documentElement.setAttribute('data-theme', saved.theme);
        }
        if (dom.particleModeSelect && saved.particleMode) {
          dom.particleModeSelect.value = saved.particleMode;
          particleMode = saved.particleMode;
        }
        if (dom.fontSizeSelect && saved.fontSize) {
          dom.fontSizeSelect.value = String(saved.fontSize);
          narrativeFontSizeRem = parseFloat(saved.fontSize) || 1.34;
          if (dom.narrativeBody) dom.narrativeBody.style.fontSize = `${narrativeFontSizeRem}rem`;
        }
        if (dom.dialectSelect && saved.dialect) {
          dom.dialectSelect.value = saved.dialect;
        }
        if (dom.twistIntensitySelect && saved.twistIntensity) {
          dom.twistIntensitySelect.value = saved.twistIntensity;
        }
        if (dom.lowPowerModeCheck && saved.lowPowerMode !== undefined) {
          dom.lowPowerModeCheck.checked = Boolean(saved.lowPowerMode);
          lowPowerMode = Boolean(saved.lowPowerMode);
        }
        if (dom.ttsVoiceSelect && saved.ttsVoice) {
          dom.ttsVoiceSelect.value = saved.ttsVoice;
        }
        if (dom.ambientSoundSelect && saved.ambientMode) {
          dom.ambientSoundSelect.value = saved.ambientMode;
        }
        if (dom.ttsSpeedRange && saved.ttsSpeed) {
          dom.ttsSpeedRange.value = saved.ttsSpeed;
          if (dom.ttsSpeedVal) dom.ttsSpeedVal.textContent = `${Number(saved.ttsSpeed).toFixed(2)}x`;
        }
        if (dom.ambientVolumeRange && saved.ambientVolume !== undefined) {
          dom.ambientVolumeRange.value = saved.ambientVolume;
          if (dom.ambientVolumeVal) dom.ambientVolumeVal.textContent = `${saved.ambientVolume}%`;
        }
        if (dom.autoSpeakReactionCheck) {
          dom.autoSpeakReactionCheck.checked = saved.autoSpeakReaction !== false;
        }
        if (dom.autoSpeakSceneCheck) {
          dom.autoSpeakSceneCheck.checked = saved.autoSpeakScene !== false;
        }
        if (dom.sfxEnabledCheck) {
          dom.sfxEnabledCheck.checked = saved.sfxEnabled !== false;
        }
      }
    } catch (e) {
      console.warn('Could not load saved settings:', e);
    }

    applyCurrentFormSettingsToEngines();
  }

  function applyCurrentFormSettingsToEngines() {
    const theme = dom.themeSelect ? dom.themeSelect.value : 'cinema-dark';
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (_) {}

    particleMode = dom.particleModeSelect ? dom.particleModeSelect.value : 'auto';
    lowPowerMode = dom.lowPowerModeCheck ? dom.lowPowerModeCheck.checked : false;
    document.documentElement.classList.toggle('low-power-mode', Boolean(lowPowerMode));

    if (typeof window.__restartWeatherLoop === 'function') {
      window.__restartWeatherLoop();
    }

    narrativeFontSizeRem = dom.fontSizeSelect ? parseFloat(dom.fontSizeSelect.value) || 1.34 : 1.34;
    if (dom.narrativeBody) {
      dom.narrativeBody.style.fontSize = `${narrativeFontSizeRem}rem`;
    }

    const dialect = dom.dialectSelect ? dom.dialectSelect.value : 'fusha';
    if (gameState) gameState.dialect = dialect;

    const twistIntensity = dom.twistIntensitySelect ? dom.twistIntensitySelect.value : 'high';
    const ttsVoice = dom.ttsVoiceSelect ? dom.ttsVoiceSelect.value : 'Charon';
    const ambientMode = dom.ambientSoundSelect ? dom.ambientSoundSelect.value : 'auto';
    const ttsSpeed = dom.ttsSpeedRange ? parseFloat(dom.ttsSpeedRange.value) || 1.0 : 1.0;
    const ambientVolPct = dom.ambientVolumeRange ? parseInt(dom.ambientVolumeRange.value, 10) : 50;
    const ambientVolume = Math.max(0, Math.min(1, ambientVolPct / 100));

    const autoSpeakReaction = dom.autoSpeakReactionCheck ? dom.autoSpeakReactionCheck.checked : true;
    const autoSpeakScene = dom.autoSpeakSceneCheck ? dom.autoSpeakSceneCheck.checked : true;
    const sfxEnabled = dom.sfxEnabledCheck ? dom.sfxEnabledCheck.checked : true;

    aiEngine.configure({
      model: 'gemini-2.5-flash',
      twistIntensity,
      dialect,
      serverManagedKey: isServerKeyAvailable
    });

    audioEngine.sfxEnabled = sfxEnabled;
    audioEngine.autoTtsEnabled = autoSpeakReaction || autoSpeakScene;

    audioEngine.updateSettings({
      engine: 'gemini-3.8-flash-tts',
      voiceName: ttsVoice,
      speed: ttsSpeed,
      autoSpeakReaction,
      autoSpeakScene,
      ambientMode,
      ambientVolume,
      serverManagedKey: isServerKeyAvailable
    });

    if (dom.activeTtsEngineTag) {
      const voiceTitles = {
        Charon: 'راو رخيم • أصوات مستقلة للشخصيات',
        Fenrir: 'راو مهيب • أصوات مستقلة للشخصيات',
        Aoede: 'راوية درامية • أصوات مستقلة للشخصيات',
        Kore: 'راوية هادئة • أصوات مستقلة للشخصيات',
        Puck: 'راو متوتر • أصوات مستقلة للشخصيات'
      };
      dom.activeTtsEngineTag.textContent = voiceTitles[ttsVoice] || 'أداء درامي متعدد الأصوات';
    }

    const activeScen = gameState.active ? gameState.scenarioId : selectedScenarioId;
    if (ambientMode === 'off') {
      audioEngine.stopAmbientEnvironment();
    } else if (audioEngine.ambientEnabled) {
      audioEngine.startAmbientEnvironment(activeScen);
    }
  }

  function saveSettingsToStorage() {
    applyCurrentFormSettingsToEngines();
    const payload = {
      theme: dom.themeSelect ? dom.themeSelect.value : 'cinema-dark',
      particleMode: dom.particleModeSelect ? dom.particleModeSelect.value : 'auto',
      fontSize: dom.fontSizeSelect ? dom.fontSizeSelect.value : '1.34',
      dialect: dom.dialectSelect ? dom.dialectSelect.value : 'fusha',
      twistIntensity: dom.twistIntensitySelect ? dom.twistIntensitySelect.value : 'high',
      lowPowerMode: dom.lowPowerModeCheck ? dom.lowPowerModeCheck.checked : false,
      ttsVoice: dom.ttsVoiceSelect ? dom.ttsVoiceSelect.value : 'Charon',
      ambientMode: dom.ambientSoundSelect ? dom.ambientSoundSelect.value : 'auto',
      ttsSpeed: dom.ttsSpeedRange ? parseFloat(dom.ttsSpeedRange.value) || 1.0 : 1.0,
      ambientVolume: dom.ambientVolumeRange ? parseInt(dom.ambientVolumeRange.value, 10) : 50,
      autoSpeakReaction: dom.autoSpeakReactionCheck ? dom.autoSpeakReactionCheck.checked : true,
      autoSpeakScene: dom.autoSpeakSceneCheck ? dom.autoSpeakSceneCheck.checked : true,
      sfxEnabled: dom.sfxEnabledCheck ? dom.sfxEnabledCheck.checked : true
    };
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(payload));
    } catch (_) {}
    showToast('تم حفظ إعدادات اللعبة والأجواء الصوتية والبصرية بنجاح.');
  }

  /**
   * ربط أحداث الواجهة، الاستجواب، لوحة الربط، وغرفة الاتهام
   */
  function rollAndPreviewMultiverseCard(announceToast = false) {
    if (!window.MysteryMultiverseEngine?.rollMultiverseCombination) return null;
    pendingMultiverseCombo = window.MysteryMultiverseEngine.rollMultiverseCombination();
    const sectorCode = pendingMultiverseCombo
      ? `#${(pendingMultiverseCombo.lawIndex || 0) + 1}-${(pendingMultiverseCombo.catalystIndex || 0) + 1}`
      : '#01-01';
    if (dom.multiverseRollTitleText && pendingMultiverseCombo) {
      dom.multiverseRollTitleText.textContent = `🔒 إحداثيات مشفرة (${sectorCode}) • تتكشف شريعة العالم فور دخولك المشهد`;
    }
    if (SCENARIO_PRESETS.multiverse && pendingMultiverseCombo) {
      SCENARIO_PRESETS.multiverse.teaserVoice =
        '<breath> تنفتح البوابة الزمكانية أمامك نحو إحداثيات مجهولة... <short pause> في كل قفزة تستيقظ داخل عالم مواز انقلبت فيه قاعدة كونية واحدة، ولن تدرك شريعته الخفية إلا حين تطأ قدماك مسرح الجريمة!';
      SCENARIO_PRESETS.multiverse.prompt = `عالم مواز يحكمه قانون (${pendingMultiverseCombo.law.title}: ${pendingMultiverseCombo.law.rule})، ومسرح الجريمة فيه: (${pendingMultiverseCombo.catalyst.title}: ${pendingMultiverseCombo.catalyst.scene}).`;
    }
    if (announceToast && pendingMultiverseCombo) {
      showToast(`🌀 تم ضبط إحداثيات زمكانية مشفرة جديدة (${sectorCode}). اضغط ابدأ لاكتشاف العالم!`);
    }
    return pendingMultiverseCombo;
  }

  /**
   * اختيار ملف القضية في القائمة الرئيسية وتحديث الهيرو السينمائي (بدون أي استدعاء TTS تلقائي لمنع 429)
   */
  function selectScenarioById(scenId) {
    selectedScenarioId = scenId;
    dom.scenarioCards.forEach(c => {
      const isMatch = c.dataset.scenario === scenId;
      c.classList.toggle('selected', isMatch);
      c.setAttribute('aria-pressed', String(isMatch));
    });
    if (dom.customScenarioBox) {
      dom.customScenarioBox.classList.toggle('hidden', scenId !== 'custom');
    }

    const preset = SCENARIO_PRESETS[scenId] || SCENARIO_PRESETS.manor;
    if (dom.selectedCaseSummaryText) {
      dom.selectedCaseSummaryText.textContent = `الملف المختار: ${preset.shortTitle}`;
    }
    if (dom.heroSelectedCasePill) {
      dom.heroSelectedCasePill.textContent = `🕯️ الملف النشط: ${preset.shortTitle}`;
    }

    const matchedCard = Array.from(dom.scenarioCards).find(c => c.dataset.scenario === scenId);
    if (matchedCard) {
      const tagText = matchedCard.querySelector('.scenario-tag')?.textContent?.trim();
      const cardTitle = matchedCard.querySelector('h3')?.textContent?.trim();
      const cardLead = matchedCard.querySelector('p')?.textContent?.trim();
      if (dom.heroCaseCategoryText && tagText) {
        dom.heroCaseCategoryText.textContent = tagText;
      }
      if (dom.heroDynamicTitle && cardTitle) {
        dom.heroDynamicTitle.textContent = cardTitle;
      }
      if (dom.heroDynamicLead && cardLead) {
        dom.heroDynamicLead.textContent = cardLead;
      }
    }

    if (audioEngine.ambientEnabled) {
      audioEngine.startAmbientEnvironment(scenId);
    }
    if (typeof window.__restartWeatherLoop === 'function') {
      window.__restartWeatherLoop();
    }
  }

  function bindEvents() {
    rollAndPreviewMultiverseCard(false);
    hydrateScenarioCardThumbnails();

    if (dom.rerollMultiverseCardBtn) {
      dom.rerollMultiverseCardBtn.addEventListener('click', e => {
        e.stopPropagation();
        selectScenarioById('multiverse');
        rollAndPreviewMultiverseCard(true);
      });
    }

    if (dom.jumpMultiverseWorldBtn) {
      dom.jumpMultiverseWorldBtn.addEventListener('click', () => {
        selectedScenarioId = 'multiverse';
        const combo = rollAndPreviewMultiverseCard(false);
        if (combo) {
          showToast(`🌀 قفزة زمكانية إلى عالم جديد: ${combo.law.title} × ${combo.catalyst.title}`);
        }
        startNewAdventure();
      });
    }

    if (dom.cardStartActionBtns && dom.cardStartActionBtns.length > 0) {
      dom.cardStartActionBtns.forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const scenId = btn.dataset.startScenario || 'daily';
          selectScenarioById(scenId);
          if (scenId === 'custom' && dom.customScenarioInput && !dom.customScenarioInput.value.trim()) {
            if (dom.customScenarioBox) {
              dom.customScenarioBox.classList.remove('hidden');
              dom.customScenarioBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            dom.customScenarioInput.focus();
            showToast('اكتب فكرة قضيتك الخاصة في المربع أولا ثم اضغط ابدأ.');
            return;
          }
          startNewAdventure();
        });
      });
    }

    dom.scenarioCards.forEach(card => {
      card.addEventListener('click', e => {
        if (
          e.target.closest('.case-voice-preview-btn') ||
          e.target.closest('.card-start-action-btn') ||
          e.target.closest('.multiverse-reroll-chip')
        ) {
          return;
        }
        const scenId = card.dataset.scenario;
        const alreadySelected = card.classList.contains('selected') && selectedScenarioId === scenId;
        selectScenarioById(scenId);
        // النقر مرة ثانية على البطاقة المختارة يبدأ القضية مباشرة لتسهيل الدخول بدون البحث عن أزرار
        if (alreadySelected && scenId !== 'custom') {
          startNewAdventure();
        }
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (
            e.target.closest('.case-voice-preview-btn') ||
            e.target.closest('.card-start-action-btn') ||
            e.target.closest('.multiverse-reroll-chip')
          ) {
            return;
          }
          e.preventDefault();
          const scenId = card.dataset.scenario;
          const alreadySelected = card.classList.contains('selected') && selectedScenarioId === scenId;
          selectScenarioById(scenId);
          if (alreadySelected && scenId !== 'custom') {
            startNewAdventure();
          }
        }
      });
    });

    // التبديل بين أنماط اتخاذ القرار الثلاثة (المسارات / الاستجواب / التصرف الحر) لمنع تشتت المستخدم
    const setActiveActionMode = mode => {
      const targetMode = mode || 'choices';
      if (dom.actionModeTabs && dom.actionModeTabs.length > 0) {
        dom.actionModeTabs.forEach(tab => {
          const isMatch = tab.dataset.actionMode === targetMode;
          tab.classList.toggle('active', isMatch);
          tab.setAttribute('aria-selected', String(isMatch));
        });
      }
      if (dom.choicesGrid) dom.choicesGrid.classList.toggle('hidden', targetMode !== 'choices');
      if (dom.interrogationBar) dom.interrogationBar.classList.toggle('hidden', targetMode !== 'interrogate');
      if (dom.customActionForm) dom.customActionForm.classList.toggle('hidden', targetMode !== 'custom');
    };
    window.__setActiveActionMode = setActiveActionMode;

    if (dom.actionModeTabs && dom.actionModeTabs.length > 0) {
      dom.actionModeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const mode = tab.dataset.actionMode || 'choices';
          setActiveActionMode(mode);
          if (mode === 'interrogate' && dom.interrogateSuspectSelect) {
            dom.interrogateSuspectSelect.focus();
          } else if (mode === 'custom' && dom.customActionInput) {
            dom.customActionInput.focus();
          }
        });
      });
    }

    // تصفية القضايا حسب التصنيف في القائمة الرئيسية (UI/UX Category Filter)
    if (dom.scenarioFilterPills && dom.scenarioFilterPills.length > 0) {
      dom.scenarioFilterPills.forEach(pill => {
        pill.addEventListener('click', () => {
          const filter = pill.dataset.filter || 'all';
          dom.scenarioFilterPills.forEach(p => p.classList.toggle('active', p === pill));

          let firstVisibleScenario = null;
          let selectedStillVisible = false;

          dom.scenarioCards.forEach(card => {
            const cats = (card.dataset.category || '').split(/\s+/);
            const matches = filter === 'all' || cats.includes(filter);
            card.classList.toggle('filter-hidden', !matches);
            if (matches) {
              if (!firstVisibleScenario) firstVisibleScenario = card.dataset.scenario;
              if (card.dataset.scenario === selectedScenarioId) {
                selectedStillVisible = true;
              }
            }
          });

          if (!selectedStillVisible && firstVisibleScenario) {
            selectScenarioById(firstVisibleScenario);
          }
        });
      });
    }

    // أزرار سماع مقدمة القضية عند طلب اللاعب فقط
    dom.caseVoicePreviewBtns.forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const scenId = btn.dataset.previewScenario || 'manor';
        selectScenarioById(scenId);
        const preset = SCENARIO_PRESETS[scenId] || SCENARIO_PRESETS.manor;

        if (audioEngine.settings.ambientMode !== 'off' && !audioEngine.ambientEnabled) {
          audioEngine.startAmbientEnvironment(scenId);
        }

        const originalText = btn.innerHTML;
        btn.innerHTML = '<span>🔊 يتحدث الآن...</span>';
        try {
          await audioEngine.speakSingleText(preset.teaserVoice, preset.teaserEmotion, true);
        } finally {
          btn.innerHTML = originalText;
        }
      });
    });

    // أزرار الهيرو السينمائي للبدء الفوري وسماع مقدمة القضية المختارة
    if (dom.heroQuickStartBtn) {
      dom.heroQuickStartBtn.addEventListener('click', () => {
        if (selectedScenarioId === 'custom' && dom.customScenarioInput && !dom.customScenarioInput.value.trim()) {
          if (dom.customScenarioBox) {
            dom.customScenarioBox.classList.remove('hidden');
            dom.customScenarioBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          dom.customScenarioInput.focus();
          return;
        }
        startNewAdventure();
      });
    }

    if (dom.heroListenTeaserBtn) {
      dom.heroListenTeaserBtn.addEventListener('click', async () => {
        const scenId = selectedScenarioId || 'daily';
        const preset = SCENARIO_PRESETS[scenId] || SCENARIO_PRESETS.daily;
        if (audioEngine.settings.ambientMode !== 'off' && !audioEngine.ambientEnabled) {
          audioEngine.startAmbientEnvironment(scenId);
        }
        const originalText = dom.heroListenTeaserBtn.innerHTML;
        dom.heroListenTeaserBtn.innerHTML = '<span>🔊 يتحدث الآن...</span>';
        try {
          await audioEngine.speakSingleText(preset.teaserVoice, preset.teaserEmotion, true);
        } finally {
          dom.heroListenTeaserBtn.innerHTML = originalText;
        }
      });
    }

    // أزرار الاختيار السريع لاسم المحقق
    dom.namePresetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const chosenName = chip.dataset.name || 'آدم';
        if (dom.playerNameInput) dom.playerNameInput.value = chosenName;
        dom.namePresetChips.forEach(c => c.classList.toggle('active', c === chip));
      });
    });

    if (dom.playerNameInput) {
      dom.playerNameInput.addEventListener('input', () => {
        const val = dom.playerNameInput.value.trim();
        dom.namePresetChips.forEach(c => c.classList.toggle('active', c.dataset.name === val));
      });
    }

    // تحديث معاينة دستور القضية المخصصة لحظيا عند كتابة الأسماء أو الآلية (F11 Fix)
    if (dom.customScenarioInput && dom.customBiblePreviewBox) {
      dom.customScenarioInput.addEventListener('input', () => {
        const val = dom.customScenarioInput.value.trim();
        if (!val) {
          dom.customBiblePreviewBox.innerHTML = `
            <span class="mono-stat">🔒 CASE BIBLE LOCKED ON START</span>
            <span>سيتم توليد وتجميد هوية الجاني الحقيقي، الدافع، والأدلة الجنائية قبل الفصل الأول لضمان عدالة الاستنتاج.</span>
          `;
          return;
        }
        if (window.MysteryCaseBibles && typeof window.MysteryCaseBibles.extractCustomConstraints === 'function') {
          const extracted = window.MysteryCaseBibles.extractCustomConstraints(val);
          dom.customBiblePreviewBox.innerHTML = `
            <span class="mono-stat">🔒 CUSTOM CONSTRAINTS LOCKED</span>
            <span>الشخصيات المعتمدة: <strong>${escapeHtml(extracted.suspects.join(' • '))}</strong> | آلية الحدث: <strong>${escapeHtml(extracted.mechanism)}</strong></span>
          `;
        }
      });
    }

    if (dom.undoTurnBtn) {
      dom.undoTurnBtn.addEventListener('click', undoLastTurn);
    }

    // بدء المغامرة
    dom.startAdventureBtn.addEventListener('click', startNewAdventure);

    // متابعة القضية المحفوظة
    if (dom.resumeSavedBtn) {
      dom.resumeSavedBtn.addEventListener('click', () => {
        if (!gameState.active || !currentTurnData) return;
        ensureGameStateHasLockedBible();
        if (dom.mainWorkspace) dom.mainWorkspace.classList.remove('main-menu-mode');
        dom.scenarioScreen.classList.add('hidden');
        dom.gameStage.classList.remove('hidden');
        if (dom.jumpMultiverseWorldBtn) {
          dom.jumpMultiverseWorldBtn.classList.toggle('hidden', gameState.scenarioId !== 'multiverse');
        }
        setMobileDrawerOpen(false);
        syncMobileBottomNavVisibility();
        if (audioEngine.settings.ambientMode !== 'off') {
          audioEngine.startAmbientEnvironment(gameState.scenarioId);
        }
        renderTurnScene(currentTurnData);
        renderSidebarState();
      });
    }

    // العودة للقائمة الرئيسية
    const returnToMainMenu = () => {
      audioEngine.stopSpeaking();
      setMobileDrawerOpen(false);
      dom.gameStage.classList.add('hidden');
      if (dom.mainWorkspace) dom.mainWorkspace.classList.add('main-menu-mode');
      dom.scenarioScreen.classList.remove('hidden');
      syncMobileBottomNavVisibility();
      updateResumeBannerVisibility();
      syncScenarioCardCompletionBadges();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    dom.newGameBtn.addEventListener('click', returnToMainMenu);

    // شريط التنقل السفلي للموبايل
    if (dom.mobNavStoryBtn) {
      dom.mobNavStoryBtn.addEventListener('click', () => {
        setMobileDrawerOpen(false);
        if (dom.gameStage) {
          dom.gameStage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    if (dom.mobNavNotebookBtn) {
      dom.mobNavNotebookBtn.addEventListener('click', () => {
        const isOpen = dom.mysterySidebar && dom.mysterySidebar.classList.contains('mobile-drawer-open');
        setMobileDrawerOpen(!isOpen);
      });
    }

    const mobNavMindPalaceBtn = document.getElementById('mobNavMindPalaceBtn');
    if (mobNavMindPalaceBtn) {
      mobNavMindPalaceBtn.addEventListener('click', () => {
        setMobileDrawerOpen(false);
        openMindPalaceModal();
      });
    }

    if (dom.closeMobileSidebarBtn) {
      dom.closeMobileSidebarBtn.addEventListener('click', () => {
        setMobileDrawerOpen(false);
      });
    }

    if (dom.mobNavVerdictBtn) {
      dom.mobNavVerdictBtn.addEventListener('click', () => {
        setMobileDrawerOpen(false);
        openVerdictModal(false);
      });
    }

    if (dom.mobNavMenuBtn) {
      dom.mobNavMenuBtn.addEventListener('click', returnToMainMenu);
    }

    // أزرار التحكم بالصوت داخل المشهد
    dom.replayReactionBtn.addEventListener('click', () => {
      if (!currentTurnData) return;
      audioEngine.stopSpeaking();
      if (audioEngine.sfxEnabled) {
        audioEngine.playReactionCue(currentTurnData.vocal_emotion);
      }
      audioEngine.speakSingleText(
        currentTurnData.vocal_reaction,
        currentTurnData.vocal_emotion || 'همس مريب',
        true
      );
    });

    dom.speakSceneBtn.addEventListener('click', () => {
      if (!currentTurnData) return;
      audioEngine.stopSpeaking();
      audioEngine.speakTurn({
        reactionText: '',
        emotion: currentTurnData.vocal_emotion || 'سرد غامض',
        narrativeText: currentTurnData.narrative,
        paragraphEmotions: currentTurnData.paragraph_emotions || [],
        forceSpeak: true
      });
    });

    dom.stopTtsBtn.addEventListener('click', () => {
      audioEngine.stopSpeaking();
    });

    // فحص التفصيل المريب (Secret Hotspot)
    dom.inspectHotspotBtn.addEventListener('click', inspectCurrentHotspot);

    // تخطي عرض التويست
    if (dom.skipTwistBtn) {
      dom.skipTwistBtn.addEventListener('click', dismissTwistOverlayEarly);
    }

    // الاستجواب والمواجهة المباشرة بالدليل (#interrogationBar)
    if (dom.interrogateSubmitBtn) {
      dom.interrogateSubmitBtn.addEventListener('click', handleSuspectInterrogation);
    }

    // ربط الأدلة بالمشتبه بهم في لوحة الاستنتاج (#corkboardLinkerBox)
    if (dom.addBoardLinkBtn) {
      dom.addBoardLinkBtn.addEventListener('click', handleAddCorkboardLink);
    }

    // البحث الفوري في دفتر التحقيق (#notebookSearchInput)
    if (dom.notebookSearchInput) {
      dom.notebookSearchInput.addEventListener('input', () => {
        renderSidebarState();
      });
    }

    // أزرار فتح وإغلاق غرفة الاتهام والحسم (#verdictModal)
    if (dom.openVerdictBtn) {
      dom.openVerdictBtn.addEventListener('click', () => openVerdictModal(false));
    }
    if (dom.choicesVerdictBtn) {
      dom.choicesVerdictBtn.addEventListener('click', () => openVerdictModal(false));
    }
    if (dom.closeVerdictBtn) {
      dom.closeVerdictBtn.addEventListener('click', closeVerdictModal);
    }
    if (dom.cancelVerdictBtn) {
      dom.cancelVerdictBtn.addEventListener('click', closeVerdictModal);
    }
    if (dom.verdictModal) {
      dom.verdictModal.addEventListener('click', e => {
        if (e.target === dom.verdictModal) closeVerdictModal();
      });
    }
    if (dom.submitVerdictBtn) {
      dom.submitVerdictBtn.addEventListener('click', handleSubmitVerdict);
    }
    if (dom.freeFinaleBtn) {
      dom.freeFinaleBtn.addEventListener('click', handleFreeStoryFinale);
    }
    if (dom.copyShareCardBtn) {
      dom.copyShareCardBtn.addEventListener('click', copyShareCardToClipboard);
    }
    const copyFullDossierBtn = document.getElementById('copyFullDossierBtn');
    if (copyFullDossierBtn) {
      copyFullDossierBtn.addEventListener('click', copyFullDossierToClipboard);
    }
    const openShortcutsBtn = document.getElementById('openShortcutsBtn');
    const closeShortcutsBtn = document.getElementById('closeShortcutsBtn');
    const doneShortcutsBtn = document.getElementById('doneShortcutsBtn');
    const shortcutsModalEl = document.getElementById('shortcutsModal');
    if (openShortcutsBtn) openShortcutsBtn.addEventListener('click', openShortcutsModal);
    if (closeShortcutsBtn) closeShortcutsBtn.addEventListener('click', closeShortcutsModal);
    if (doneShortcutsBtn) doneShortcutsBtn.addEventListener('click', closeShortcutsModal);
    if (shortcutsModalEl) {
      shortcutsModalEl.addEventListener('click', e => {
        if (e.target === shortcutsModalEl) closeShortcutsModal();
      });
    }
    if (dom.verdictOpenLibraryBtn) {
      dom.verdictOpenLibraryBtn.addEventListener('click', () => {
        closeVerdictModal();
        openLibraryModal();
      });
    }
    if (dom.verdictNewCaseBtn) {
      dom.verdictNewCaseBtn.addEventListener('click', () => {
        closeVerdictModal();
        returnToMainMenu();
      });
    }

    // أزرار سجل القضايا والنهايات (#libraryModal)
    if (dom.openLibraryBtn) {
      dom.openLibraryBtn.addEventListener('click', openLibraryModal);
    }
    if (dom.closeLibraryBtn) {
      dom.closeLibraryBtn.addEventListener('click', closeLibraryModal);
    }
    if (dom.doneLibraryBtn) {
      dom.doneLibraryBtn.addEventListener('click', closeLibraryModal);
    }
    if (dom.libraryModal) {
      dom.libraryModal.addEventListener('click', e => {
        if (e.target === dom.libraryModal) closeLibraryModal();
      });
    }

    // أزرار قصر الذهن البصري (#mindPalaceModal)
    const openMindPalaceBtn = document.getElementById('openMindPalaceBtn');
    const closeMindPalaceBtn = document.getElementById('closeMindPalaceBtn');
    const doneMindPalaceBtn = document.getElementById('doneMindPalaceBtn');
    const mpOpenVerdictBtn = document.getElementById('mpOpenVerdictFromBoardBtn');
    const mindPalaceModal = document.getElementById('mindPalaceModal');

    if (openMindPalaceBtn) openMindPalaceBtn.addEventListener('click', openMindPalaceModal);
    if (closeMindPalaceBtn) closeMindPalaceBtn.addEventListener('click', closeMindPalaceModal);
    if (doneMindPalaceBtn) doneMindPalaceBtn.addEventListener('click', closeMindPalaceModal);
    if (mpOpenVerdictBtn) {
      mpOpenVerdictBtn.addEventListener('click', () => {
        closeMindPalaceModal();
        openVerdictModal(false);
      });
    }
    if (mindPalaceModal) {
      mindPalaceModal.addEventListener('click', e => {
        if (e.target === mindPalaceModal) closeMindPalaceModal();
      });
    }
    window.addEventListener('resize', () => {
      if (mindPalaceModal && !mindPalaceModal.classList.contains('hidden')) {
        drawMindPalaceSvgThreads();
      }
    });

    // نموذج التصرف الحر المخصص (مع فلترة وحد أقصى للطول)
    dom.customActionForm.addEventListener('submit', e => {
      e.preventDefault();
      const customText = sanitizePlayerInput(dom.customActionInput.value);
      if (!customText) return;
      dom.customActionInput.value = '';
      handlePlayerChoice(customText, 'تصرف حر');
    });

    // تبويبات دفتر المحقق
    dom.notebookTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        if (typeof audioEngine.playDossierPaperSound === 'function') {
          audioEngine.playDossierPaperSound();
        }
        const target = tab.dataset.tab;
        dom.notebookTabs.forEach(t => {
          const isMatch = t.dataset.tab === target;
          t.classList.toggle('active', isMatch);
          t.setAttribute('aria-selected', String(isMatch));
        });
        ['clues', 'secrets', 'suspects', 'history'].forEach(panelId => {
          const panel = document.getElementById(`tab-${panelId}`);
          if (panel) {
            panel.classList.toggle('hidden', panelId !== target);
            panel.classList.toggle('active', panelId === target);
          }
        });
      });
    });

    // فتح وإغلاق قائمة الإعدادات
    const openSettings = () => dom.settingsModal.classList.remove('hidden');
    const closeSettings = () => dom.settingsModal.classList.add('hidden');

    dom.openSettingsBtn.addEventListener('click', openSettings);
    dom.closeSettingsBtn.addEventListener('click', closeSettings);
    dom.settingsModal.addEventListener('click', e => {
      if (e.target === dom.settingsModal) closeSettings();
    });

    // اختصارات لوحة المفاتيح الذكية
    document.addEventListener('keydown', e => {
      const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';
      const isInteractiveTarget =
        isTyping ||
        tag === 'button' ||
        tag === 'a' ||
        tag === 'summary' ||
        (e.target && e.target.getAttribute && e.target.getAttribute('role') === 'button');
      const shortcutsModal = document.getElementById('shortcutsModal');

      if (e.key === 'Escape') {
        if (!dom.twistOverlay.classList.contains('hidden')) {
          dismissTwistOverlayEarly();
          return;
        }
        if (shortcutsModal && !shortcutsModal.classList.contains('hidden')) {
          closeShortcutsModal();
          return;
        }
        const mpModal = document.getElementById('mindPalaceModal');
        if (mpModal && !mpModal.classList.contains('hidden')) {
          closeMindPalaceModal();
          return;
        }
        if (dom.verdictModal && !dom.verdictModal.classList.contains('hidden')) {
          closeVerdictModal();
          return;
        }
        if (dom.libraryModal && !dom.libraryModal.classList.contains('hidden')) {
          closeLibraryModal();
          return;
        }
        if (!dom.settingsModal.classList.contains('hidden')) {
          closeSettings();
          return;
        }
      }

      // F23 Fix: حصر تنقل مفتاح Tab داخل النافذة المنبثقة النشطة (Focus Trap)
      if (e.key === 'Tab') {
        const mpModalEl = document.getElementById('mindPalaceModal');
        const activeModal =
          (shortcutsModal && !shortcutsModal.classList.contains('hidden') && shortcutsModal) ||
          (mpModalEl && !mpModalEl.classList.contains('hidden') && mpModalEl) ||
          (dom.verdictModal && !dom.verdictModal.classList.contains('hidden') && dom.verdictModal) ||
          (dom.libraryModal && !dom.libraryModal.classList.contains('hidden') && dom.libraryModal) ||
          (dom.settingsModal && !dom.settingsModal.classList.contains('hidden') && dom.settingsModal);
        if (activeModal) {
          const focusable = Array.from(
            activeModal.querySelectorAll(
              'button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter(el => el.offsetParent !== null);
          if (focusable.length > 0) {
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && (document.activeElement === first || !activeModal.contains(document.activeElement))) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && (document.activeElement === last || !activeModal.contains(document.activeElement))) {
              e.preventDefault();
              first.focus();
            }
          }
          return;
        }
      }

      const mpOpen =
        document.getElementById('mindPalaceModal') &&
        !document.getElementById('mindPalaceModal').classList.contains('hidden');
      const shortcutsOpen = shortcutsModal && !shortcutsModal.classList.contains('hidden');

      if (
        isTyping ||
        !dom.settingsModal.classList.contains('hidden') ||
        (dom.verdictModal && !dom.verdictModal.classList.contains('hidden')) ||
        (dom.libraryModal && !dom.libraryModal.classList.contains('hidden'))
      ) {
        return;
      }

      if ((e.key === '?' || e.key === '/') && !dom.gameStage.classList.contains('hidden')) {
        e.preventDefault();
        if (shortcutsOpen) closeShortcutsModal();
        else openShortcutsModal();
        return;
      }

      if (shortcutsOpen) return;

      if (e.key.toLowerCase() === 'm' && !dom.gameStage.classList.contains('hidden')) {
        e.preventDefault();
        if (mpOpen) closeMindPalaceModal();
        else openMindPalaceModal();
        return;
      }

      if (mpOpen || dom.gameStage.classList.contains('hidden')) return;

      if (e.code === 'Space' && !isInteractiveTarget) {
        e.preventDefault();
        if (audioEngine && audioEngine.isSpeaking) {
          audioEngine.stopSpeaking();
        } else if (dom.speakSceneBtn) {
          dom.speakSceneBtn.click();
        }
        return;
      }

      if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        openVerdictModal();
        return;
      }

      if (isLoadingTurn) return;

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const buttons = dom.choicesGrid.querySelectorAll('.choice-btn');
        if (buttons[idx] && !buttons[idx].disabled) {
          e.preventDefault();
          buttons[idx].click();
        }
      } else if (e.key.toLowerCase() === 'i') {
        if (!dom.suspiciousHotspot.classList.contains('hidden') && !dom.inspectHotspotBtn.disabled) {
          e.preventDefault();
          inspectCurrentHotspot();
        }
      } else if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        triggerDetectiveInsightHint();
      } else if (e.key.toLowerCase() === 'f') {
        const flashBtn = document.getElementById('toggleFlashlightModeBtn');
        if (flashBtn) {
          e.preventDefault();
          flashBtn.click();
        }
      } else if (e.key.toLowerCase() === 'r') {
        if (dom.speakSceneBtn) {
          e.preventDefault();
          dom.speakSceneBtn.click();
        }
      }
    });

    // تحديثات حية داخل الإعدادات
    if (dom.themeSelect) dom.themeSelect.addEventListener('change', applyCurrentFormSettingsToEngines);
    if (dom.particleModeSelect) dom.particleModeSelect.addEventListener('change', applyCurrentFormSettingsToEngines);
    if (dom.fontSizeSelect) dom.fontSizeSelect.addEventListener('change', applyCurrentFormSettingsToEngines);
    if (dom.dialectSelect) dom.dialectSelect.addEventListener('change', applyCurrentFormSettingsToEngines);
    if (dom.lowPowerModeCheck) dom.lowPowerModeCheck.addEventListener('change', applyCurrentFormSettingsToEngines);
    if (dom.ttsVoiceSelect) dom.ttsVoiceSelect.addEventListener('change', applyCurrentFormSettingsToEngines);
    if (dom.ambientSoundSelect) {
      dom.ambientSoundSelect.addEventListener('change', () => {
        applyCurrentFormSettingsToEngines();
        const mode = dom.ambientSoundSelect.value;
        if (mode !== 'off') {
          const activeScen = gameState.active ? gameState.scenarioId : selectedScenarioId;
          audioEngine.startAmbientEnvironment(activeScen);
        }
      });
    }

    if (dom.ttsSpeedRange) {
      dom.ttsSpeedRange.addEventListener('input', () => {
        if (dom.ttsSpeedVal) {
          dom.ttsSpeedVal.textContent = `${Number(dom.ttsSpeedRange.value).toFixed(2)}x`;
        }
      });
    }

    if (dom.ambientVolumeRange) {
      dom.ambientVolumeRange.addEventListener('input', () => {
        const val = parseInt(dom.ambientVolumeRange.value, 10) || 0;
        if (dom.ambientVolumeVal) dom.ambientVolumeVal.textContent = `${val}%`;
        audioEngine.setAmbientVolume(val / 100);
      });
    }

    if (dom.testTtsVoiceBtn) {
      dom.testTtsVoiceBtn.addEventListener('click', async () => {
        applyCurrentFormSettingsToEngines();
        const sampleText =
          '<breath> مرحبا بك في قلب الغموض... <short pause> كل مشتبه به يخفي كذبة، وكل دليل مادي يقربك من الحقيقة الكاملة!';
        await audioEngine.speakSingleText(sampleText, 'همس مرعوب وترقب', true);
      });
    }

    if (dom.saveSettingsBtn) {
      dom.saveSettingsBtn.addEventListener('click', () => {
        saveSettingsToStorage();
        closeSettings();
      });
    }

    if (dom.clearSavedDataBtn) {
      dom.clearSavedDataBtn.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY_SAVE);
        gameState.active = false;
        currentTurnData = null;
        updateResumeBannerVisibility();
        showToast('تم مسح التقدم المحفوظ بنجاح.');
      });
    }
  }

  function sanitizePlayerInput(raw) {
    return String(raw || '')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, 220);
  }

  /**
   * ضمان وجود Case Bible مثبت ومقفل للقضية الحالية (Game Changer 1 & C2 Fix)
   */
  function ensureGameStateHasLockedBible() {
    if (!window.MysteryCaseBibles) return null;
    const activeScenId = gameState.scenarioId || selectedScenarioId || 'daily';
    const canonicalBible =
      activeScenId !== 'custom' && activeScenId !== 'multiverse'
        ? window.MysteryCaseBibles.CASE_BIBLES?.[activeScenId]
        : null;
    const isStaleBible =
      !gameState.caseBible ||
      !gameState.caseBible.culpritId ||
      gameState.caseBible.id !== activeScenId ||
      (canonicalBible && gameState.caseBible.title !== canonicalBible.title);

    if (isStaleBible) {
      gameState.caseBible = window.MysteryCaseBibles.getLockedCaseBible(
        activeScenId,
        gameState.scenarioPrompt || '',
        gameState.playerName || 'آدم'
      );
      gameState.scenarioTitle = gameState.caseBible.title || gameState.scenarioTitle;
      if (Array.isArray(gameState.caseBible.suspects)) {
        gameState.suspects = gameState.caseBible.suspects.map(s => ({
          id: s.id,
          name: s.name,
          role: s.role,
          voice: s.voice,
          alibi: s.alibi,
          trust_level: s.trust_level || 'إفادة أولية قيد التحقق',
          note: `إفادته المعلنة: «${s.alibi}»`,
          alibiBroken: false,
          interrogatedWith: []
        }));
      }
    }
    if (!gameState.hiddenBlueprint && gameState.caseBible) {
      gameState.hiddenBlueprint = gameState.caseBible.summaryBlueprint;
    }
    return gameState.caseBible;
  }

  /**
   * بدء مغامرة جديدة وتثبيت دستور القضية (Immutable Case Bible) قبل الفصل الأول
   */
  async function startNewAdventure() {
    const playerName = sanitizePlayerInput(dom.playerNameInput.value) || 'آدم';
    const preset = SCENARIO_PRESETS[selectedScenarioId] || SCENARIO_PRESETS.manor;

    let scenarioPrompt = preset.prompt;
    let scenarioTitle = preset.title;

    if (selectedScenarioId === 'custom') {
      const customIdea = String(dom.customScenarioInput.value || '')
        .replace(/[<>]/g, '')
        .trim()
        .slice(0, 500);
      if (!customIdea) {
        showToast('يرجى كتابة فكرة القضية أو مسرح الجريمة المخصص أولا.');
        dom.customScenarioInput.focus();
        return;
      }
      scenarioPrompt = customIdea;
      scenarioTitle = 'قضية خاصة: ' + customIdea.slice(0, 38) + '...';
    }

    gameState = createInitialGameState();
    gameState.active = true;
    gameState.playerName = playerName;
    gameState.dialect = dom.dialectSelect ? dom.dialectSelect.value : 'fusha';
    gameState.scenarioId = selectedScenarioId;
    gameState.scenarioTitle = scenarioTitle;
    gameState.scenarioPrompt = scenarioPrompt;

    // تثبيت وتجميد الدستور الجنائي للقضية (Case Bible) مرة واحدة في البداية وعدم السماح للذكاء الاصطناعي بتغييره
    const bibleOptions =
      selectedScenarioId === 'multiverse' && pendingMultiverseCombo
        ? {
            lawIndex: pendingMultiverseCombo.lawIndex,
            catalystIndex: pendingMultiverseCombo.catalystIndex
          }
        : {};
    const lockedBible = window.MysteryCaseBibles.getLockedCaseBible(
      selectedScenarioId,
      scenarioPrompt,
      playerName,
      bibleOptions
    );
    gameState.caseBible = lockedBible;
    gameState.hiddenBlueprint = lockedBible.summaryBlueprint;
    if (selectedScenarioId === 'multiverse' && lockedBible.title) {
      scenarioTitle = lockedBible.title;
      gameState.scenarioTitle = lockedBible.title;
      // نجهز دمجا عشوائيا جديدا للقفزة التالية
      rollAndPreviewMultiverseCard(false);
    }
    if (dom.jumpMultiverseWorldBtn) {
      dom.jumpMultiverseWorldBtn.classList.toggle('hidden', selectedScenarioId !== 'multiverse');
    }

    // تحميل الدليل الافتتاحي الأول فقط (c1) مع عدم منح الأدلة اللاحقة تلقائيا قبل فحص المشهد (F01 Fix)
    if (Array.isArray(lockedBible.clues) && lockedBible.clues.length > 0) {
      const c1 = lockedBible.clues[0];
      gameState.clues = [
        {
          id: c1.id,
          title: c1.title,
          description: c1.description,
          isRedHerring: Boolean(c1.isRedHerring)
        }
      ];
    }

    if (Array.isArray(lockedBible.suspects)) {
      gameState.suspects = lockedBible.suspects.map(s => ({
        id: s.id,
        name: s.name,
        role: s.role,
        voice: s.voice,
        alibi: s.alibi,
        trust_level: s.trust_level || 'إفادة أولية قيد التحقق',
        note: `إفادته المعلنة: «${s.alibi}»`,
        alibiBroken: false,
        interrogatedWith: []
      }));
    }

    gameState.twistProgress = window.MysteryCaseBibles.calculateDeductionCoverage(lockedBible, gameState);

    turnSnapshots = [];
    if (dom.undoTurnBtn) dom.undoTurnBtn.classList.add('hidden');

    // مسح فوري وذري لمحتوى القضية السابقة لمنع ظهور أي نص قديم أثناء التحميل (F12 Fix)
    turnGenerationToken += 1;
    currentTurnData = null;
    audioEngine.stopSpeaking();
    if (dom.narrativeBody) dom.narrativeBody.innerHTML = '';
    if (dom.sceneTitle) dom.sceneTitle.textContent = scenarioTitle;
    if (dom.chapterBadge) dom.chapterBadge.textContent = 'الفصل 1';
    if (dom.suspiciousHotspot) dom.suspiciousHotspot.classList.add('hidden');
    if (dom.choicesGrid) dom.choicesGrid.innerHTML = '';
    if (dom.narrativeTwistRibbon) dom.narrativeTwistRibbon.classList.add('hidden');

    if (audioEngine.settings.ambientMode !== 'off') {
      audioEngine.startAmbientEnvironment(selectedScenarioId);
    }
    if (typeof window.__restartWeatherLoop === 'function') {
      window.__restartWeatherLoop();
    }

    if (dom.mainWorkspace) dom.mainWorkspace.classList.remove('main-menu-mode');
    dom.scenarioScreen.classList.add('hidden');
    dom.gameStage.classList.remove('hidden');
    setMobileDrawerOpen(false);
    syncMobileBottomNavVisibility();

    populateInterrogationAndCorkboardSelects();
    renderSidebarState();
    await executeTurnGeneration(null);
  }

  function setMobileDrawerOpen(isOpen) {
    if (!dom.mysterySidebar) return;
    dom.mysterySidebar.classList.toggle('mobile-drawer-open', Boolean(isOpen));
    if (dom.mobNavStoryBtn) dom.mobNavStoryBtn.classList.toggle('active', !isOpen);
    if (dom.mobNavNotebookBtn) dom.mobNavNotebookBtn.classList.toggle('active', Boolean(isOpen));
  }

  function syncMobileBottomNavVisibility() {
    if (!dom.mobileBottomNav) return;
    const isGameActiveOnScreen = dom.gameStage && !dom.gameStage.classList.contains('hidden');
    dom.mobileBottomNav.classList.toggle('hidden', !isGameActiveOnScreen);
  }

  /**
   * تفعيل اكتشاف السر الأسطوري المخبأ داخل القضية (Mythic Secret Discovery)
   */
  async function triggerMythicSecretDiscovery(mythicHit, actionText) {
    if (!mythicHit) return;
    gameState.mythicSecretUnlocked = true;
    gameState.detectiveStyle = 'كاشف الأسرار الأسطورية';
    gameState.twistProgress = 100;

    const secretTitle = `👑 السر الأسطوري المخبأ: ${mythicHit.relicName}`;
    const alreadyAdded = (gameState.secrets || []).some(s => s.title === secretTitle);
    if (!alreadyAdded) {
      gameState.secrets.unshift({
        title: secretTitle,
        revelation: mythicHit.secretDiscoveryText
      });
    }

    if (window.MysteryViralEngine && typeof window.MysteryViralEngine.recordUnlockedMythicRelic === 'function') {
      window.MysteryViralEngine.recordUnlockedMythicRelic(mythicHit);
      if (typeof window.__syncMythicVaultUi === 'function') {
        window.__syncMythicVaultUi();
      }
    }

    if (dom.vocalSpeakerLabel) dom.vocalSpeakerLabel.textContent = `👑 ${mythicHit.relicIcon} ${mythicHit.relicName}`;
    if (dom.vocalEmotionBadge) dom.vocalEmotionBadge.textContent = 'كشف أسطوري مهيب';
    if (dom.vocalReactionText) dom.vocalReactionText.textContent = `«${mythicHit.secretDiscoveryText}»`;

    if (dom.narrativeBody) {
      const p = document.createElement('p');
      p.className = 'interrogation-transcript-para';
      p.style.borderColor = 'rgba(229, 184, 92, 0.72)';
      p.style.background = 'linear-gradient(135deg, rgba(88, 28, 135, 0.28), rgba(229, 184, 92, 0.14))';
      p.textContent = `👑 [كشف الشفرة السرية الأسطورية: «${actionText}»]: ${mythicHit.secretDiscoveryText}`;
      dom.narrativeBody.appendChild(p);
      p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    gameState.history.unshift({
      turn: gameState.turn || 1,
      title: `👑 كشف الأثر الأسطوري: ${mythicHit.relicName}`,
      choice: actionText,
      summary: mythicHit.secretDiscoveryText
    });

    audioEngine.playTwistSound();
    triggerDramaticTwistOverlay(
      `👑 انكشف الأثر الأسطوري: ${mythicHit.relicName}`,
      `${mythicHit.secretDiscoveryText}\n\n✨ مكافأتك الفورية: ${mythicHit.rewardPerk} + فتح زر الخاتمة السرية الأسطورية (6 نجوم ★★★★★★) في غرفة الاتهام!`
    );

    renderSidebarState();
    saveGameState();
    showToast(`👑 مبروك! كشفت الأثر الأسطوري «${mythicHit.relicName}» وحصلت على مكافأة خاصة!`);

    if (audioEngine.autoTtsEnabled) {
      await audioEngine.speakSingleText(mythicHit.secretDiscoveryText, 'رهبة وذهول درامي', true);
    }
  }

  /**
   * تنفيذ اختيار اللاعب وتحديث النهج الاستقصائي (مع معالجة الصمت/الانتظار F04 والأسئلة المباشرة F05)
   */
  async function handlePlayerChoice(choiceText, choiceTag = '') {
    if (!choiceText || isLoadingTurn) return;
    audioEngine.stopSpeaking();
    setMobileDrawerOpen(false);
    ensureGameStateHasLockedBible();

    // F04 Fix: إذا كتب اللاعب أمرا سلبيا بالصمت أو عدم فحص أي شيء، لا ننتقل لفصل جديد ولا نمنح دليلا مجانيا
    const isPassiveRefusal =
      choiceTag === 'تصرف حر' &&
      (/^(اجلس بصمت|أجلس بصمت|لا أفحص|لا تفحص|لا أفعل|لا تفعل|انتظر بصمت|أنتظر بصمت|صمت|لا شيء|sit silently|inspect nothing|do nothing|wait silently)/i.test(
        choiceText.trim()
      ) ||
        (/اجلس بصمت|لا تفحص|inspect nothing|sit silently|do nothing/i.test(choiceText) &&
          choiceText.length < 75));

    if (isPassiveRefusal) {
      gameState.dangerLevel = Math.min(100, gameState.dangerLevel + 4);
      const waitMsg =
        'تجلس بصمت مراقبا المكان دون أن تفحص أي أثر مادي. يمضي الوقت ببطء وتزداد ريبة الحاضرين (+4% ضغط الوقت) دون أن ينكشف دليل جديد.';
      if (dom.vocalSpeakerLabel) dom.vocalSpeakerLabel.textContent = 'الراوي التفاعلي';
      if (dom.vocalEmotionBadge) dom.vocalEmotionBadge.textContent = 'ترقب وتوتر';
      if (dom.vocalReactionText) dom.vocalReactionText.textContent = `«${waitMsg}»`;
      if (dom.narrativeBody) {
        const p = document.createElement('p');
        p.className = 'interrogation-transcript-para';
        p.textContent = `[مرور الوقت: «${choiceText}»]: ${waitMsg}`;
        dom.narrativeBody.appendChild(p);
        p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      gameState.history.unshift({
        turn: gameState.turn || 1,
        title: 'انتظار ومراقبة صامتة',
        choice: choiceText,
        summary: waitMsg
      });
      renderSidebarState();
      saveGameState();
      showToast('⏳ مضى الوقت في صمت دون فحص أي دليل (+4% ضغط الوقت).');
      if (audioEngine.autoTtsEnabled) {
        await audioEngine.speakSingleText(waitMsg, 'ترقب وتوتر', true);
      }
      return;
    }

    // فحص ما إذا كان التصرف الحر يفتح النهاية السرية الأسطورية المخبأة في القضية (Mythic Secret Trigger)
    if (
      choiceTag === 'تصرف حر' &&
      window.MysteryCaseBibles &&
      typeof window.MysteryCaseBibles.checkMythicActionTrigger === 'function'
    ) {
      const mythicHit = window.MysteryCaseBibles.checkMythicActionTrigger(gameState.caseBible, choiceText);
      if (mythicHit) {
        await triggerMythicSecretDiscovery(mythicHit, choiceText);
        return;
      }
    }

    // F05 Fix: إذا طرح اللاعب سؤالا مباشرا في حقل التصرف الحر، نجيب عليه مباشرة من ملف القضية أو المشتبه به دون قفز قسري للفصل
    const isDirectQuestion =
      choiceTag === 'تصرف حر' &&
      (/[؟?]/.test(choiceText) ||
        /^(اسأل|سؤال|استفسر|من هو|من هي|ما هو|ما هي|ماذا عن|أين|كيف|لماذا|هل|حدثني عن|أخبرني عن|ما علاقة|ask|who|what|where|why|how)\b/i.test(
          choiceText.trim()
        ));

    if (
      isDirectQuestion &&
      window.MysteryCaseBibles &&
      typeof window.MysteryCaseBibles.answerDirectInvestigationQuestion === 'function'
    ) {
      const qAns = window.MysteryCaseBibles.answerDirectInvestigationQuestion(
        gameState.caseBible,
        gameState,
        choiceText
      );
      if (qAns && qAns.answer) {
        gameState.detectiveStyle = 'مستجوب حازم';
        if (dom.vocalSpeakerLabel) dom.vocalSpeakerLabel.textContent = `🗣️ ${qAns.speaker}`;
        if (dom.vocalEmotionBadge) dom.vocalEmotionBadge.textContent = qAns.emotion || 'تساؤل ماكر وتشكيك';
        if (dom.vocalReactionText) dom.vocalReactionText.textContent = `«${qAns.answer}»`;

        if (dom.narrativeBody) {
          const p = document.createElement('p');
          p.className = 'interrogation-transcript-para';
          p.textContent = `[سؤال استقصائي مباشر: «${choiceText}»] (${qAns.speaker}): «${qAns.answer}»`;
          dom.narrativeBody.appendChild(p);
          p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        gameState.history.unshift({
          turn: gameState.turn || 1,
          title: `سؤال مباشر: ${qAns.speaker}`,
          choice: choiceText,
          summary: qAns.answer
        });

        renderSidebarState();
        saveGameState();
        showToast(`🗣️ إجابة مباشرة من: ${qAns.speaker}`);
        if (audioEngine.autoTtsEnabled) {
          await audioEngine.speakSingleText(
            qAns.answer,
            qAns.emotion || 'تساؤل ماكر وتشكيك',
            true,
            qAns.voice || null
          );
        }
        return;
      }
    }

    if (choiceTag) {
      if (choiceTag.includes('فحص') || choiceTag.includes('تحقيق') || choiceTag.includes('مادي')) {
        gameState.detectiveStyle = 'محقق جنائي دقيق';
      } else if (choiceTag.includes('مواجهة') || choiceTag.includes('استجواب')) {
        gameState.detectiveStyle = 'مستجوب حازم';
      } else if (choiceTag.includes('تسلل') || choiceTag.includes('تفتيش')) {
        gameState.detectiveStyle = 'متقص بارع';
      }
    }

    if (currentTurnData && gameState.turn > 0) {
      turnSnapshots.push({
        gameState: JSON.parse(JSON.stringify(gameState)),
        turnData: JSON.parse(JSON.stringify(currentTurnData))
      });
      if (turnSnapshots.length > 6) turnSnapshots.shift();
      if (dom.undoTurnBtn) dom.undoTurnBtn.classList.remove('hidden');
    }

    await executeTurnGeneration(choiceText);
  }

  function undoLastTurn() {
    if (!turnSnapshots.length || isLoadingTurn) return;
    audioEngine.stopSpeaking();
    const prev = turnSnapshots.pop();
    gameState = prev.gameState;
    currentTurnData = prev.turnData;
    hotspotInspectedThisTurn = false;
    if (dom.undoTurnBtn) {
      dom.undoTurnBtn.classList.toggle('hidden', turnSnapshots.length === 0);
    }
    saveGameState();
    renderTurnScene(currentTurnData);
    renderSidebarState();
    showToast(`تم التراجع إلى الفصل ${gameState.turn}: ${currentTurnData.chapter_title}`);
  }

  /**
   * شريط التحميل المقسم التصاعدي (0% ➔ 100%)
   */
  function updateSegmentedPreloadProgress(percent, customStageLabel = null) {
    const pct = Math.max(0, Math.min(100, Math.round(percent)));
    currentPreloadPercent = pct;

    if (dom.turnPreloadProgressBar) {
      dom.turnPreloadProgressBar.style.width = `${pct}%`;
    }
    if (dom.loadingStepCounter) {
      dom.loadingStepCounter.textContent = `التحميل: ${pct}%`;
    }
    if (dom.preloadRemainingText) {
      dom.preloadRemainingText.textContent = `${pct}% / 100%`;
    }

    const seg1Pct = Math.min(100, Math.round((pct / 40) * 100));
    const seg2Pct = pct <= 40 ? 0 : Math.min(100, Math.round(((pct - 40) / 35) * 100));
    const seg3Pct = pct <= 75 ? 0 : Math.min(100, Math.round(((pct - 75) / 25) * 100));

    if (dom.segFill1) dom.segFill1.style.width = `${seg1Pct}%`;
    if (dom.segFill2) dom.segFill2.style.width = `${seg2Pct}%`;
    if (dom.segFill3) dom.segFill3.style.width = `${seg3Pct}%`;

    if (dom.invStep1) {
      dom.invStep1.classList.toggle('active', pct < 40);
      dom.invStep1.classList.toggle('done', pct >= 40);
      if (dom.segState1) dom.segState1.textContent = pct >= 40 ? 'مكتمل ✓' : `${seg1Pct}%`;
    }
    if (dom.invStep2) {
      dom.invStep2.classList.toggle('active', pct >= 40 && pct < 75);
      dom.invStep2.classList.toggle('done', pct >= 75);
      if (dom.segState2) {
        dom.segState2.textContent = pct >= 75 ? 'مكتمل ✓' : pct >= 40 ? `${seg2Pct}%` : 'انتظار';
      }
    }
    if (dom.invStep3) {
      dom.invStep3.classList.toggle('active', pct >= 75 && pct < 100);
      dom.invStep3.classList.toggle('done', pct >= 100);
      if (dom.segState3) {
        dom.segState3.textContent = pct >= 100 ? 'يعمل الآن ✓' : pct >= 75 ? `${seg3Pct}%` : 'انتظار';
      }
    }

    if (dom.preloadStageLabel) {
      if (customStageLabel) {
        dom.preloadStageLabel.textContent = customStageLabel;
      } else if (pct < 40) {
        dom.preloadStageLabel.textContent = 'القسم 1/3: جاري مطابقة قرارك مع ملف القضية الجنائي...';
      } else if (pct < 75) {
        dom.preloadStageLabel.textContent = 'القسم 2/3: جاري صياغة المشهد والأدلة والخيارات...';
      } else if (pct < 100) {
        dom.preloadStageLabel.textContent = 'القسم 3/3: جاري تجهيز الأداء الصوتي للمشهد...';
      } else {
        dom.preloadStageLabel.textContent = 'اكتمل التحميل 100%، يبدأ السرد الآن!';
      }
    }
  }

  /**
   * توليد الفصل التالي مع احترام ثبات الدستور الجنائي وحساب الاستنتاج الفعلي (Fixes C2, C3, H1, H3, F01, F12)
   */
  async function executeTurnGeneration(playerChoiceText) {
    const myToken = ++turnGenerationToken;
    const isOpeningTurn = gameState.turn === 0 && !playerChoiceText;
    setLoadingState(true);
    ensureGameStateHasLockedBible();

    try {
      updateSegmentedPreloadProgress(18, 'القسم 1/3: جاري تحليل أثر قرارك ومطابقة الأدلة...');
      const turnData = await aiEngine.generateTurn(gameState, playerChoiceText);
      if (myToken !== turnGenerationToken) return;

      currentTurnData = turnData;
      hotspotInspectedThisTurn = false;

      updateSegmentedPreloadProgress(78, 'القسم 3/3: نص المشهد جاهز! جاري تجهيز المقطع الصوتي الأول...');

      if (audioEngine.autoTtsEnabled) {
        await audioEngine.awaitReactionPreload({
          reactionText: turnData.vocal_reaction,
          emotion: turnData.vocal_emotion,
          narrativeText: turnData.narrative,
          maxWaitMs: 320,
          onProgress: pct => {
            const mapped = 78 + Math.round((pct / 100) * 22);
            updateSegmentedPreloadProgress(mapped, 'القسم 3/3: تشغيل الكلام الجاهز للراوي...');
          }
        });
      }
      if (myToken !== turnGenerationToken) return;

      updateSegmentedPreloadProgress(100, 'اكتمل التحميل 100%، يبدأ السرد الآن!');

      // تحديث رقم الفصل دون المساس بـ hiddenBlueprint المثبت في بداية القضية (C2 Fix)
      gameState.turn += 1;
      gameState.lastNarrative = turnData.narrative;

      // إصلاح H3: استخدام Number.isFinite حتى لا تتحول القيمة 0 إلى +5 إجباريا
      const parsedDangerDelta = Number(turnData.danger_delta);
      const safeDangerDelta = Number.isFinite(parsedDangerDelta) ? parsedDangerDelta : 4;
      gameState.dangerLevel = Math.min(100, Math.max(5, gameState.dangerLevel + safeDangerDelta));

      // F01 Fix: في الفصل الافتتاحي الأول، يبدأ اللاعب بدليل واحد فقط (c1)، ويكتسب الدليل الثاني (c2) عبر المسح الميداني أو التقدم في التحقيق
      if (!isOpeningTurn) {
        const ch0ClueId = gameState.caseBible?.authoredChapters?.[0]?.unlocked_clue_id;
        if (ch0ClueId && !hasDiscoveredClueId(ch0ClueId)) {
          const ch0ClueObj = (gameState.caseBible?.clues || []).find(c => c.id === ch0ClueId);
          if (ch0ClueObj) addClueToGameState(ch0ClueObj);
        }
        if (turnData.new_clue && turnData.new_clue.title) {
          addClueToGameState(turnData.new_clue);
        }
      } else if (isOpeningTurn && turnData.new_clue && turnData.new_clue.title && turnData.suspicious_hotspot) {
        if (!turnData.suspicious_hotspot.clue_id && turnData.new_clue.id) {
          turnData.suspicious_hotspot.clue_id = turnData.new_clue.id;
        }
        if (!turnData.suspicious_hotspot.bonus_clue) {
          turnData.suspicious_hotspot.bonus_clue = turnData.new_clue.title;
        }
      }

      // الحفاظ على الخيارات السياقية التي ولدها الذكاء الاصطناعي استجابة لفعل اللاعب، واستخدام القالب فقط عند غيابها أو في الفصل الافتتاحي
      if (
        (isOpeningTurn || !Array.isArray(turnData.choices) || turnData.choices.length < 2) &&
        aiEngine &&
        typeof aiEngine.buildEvidenceAwareChoices === 'function'
      ) {
        turnData.choices = aiEngine.buildEvidenceAwareChoices(gameState, gameState.caseBible);
      }
      gameState.lastChoices = Array.isArray(turnData.choices) ? turnData.choices : [];

      // إضافة السر أو التويست المكتسب إن وجد
      if (turnData.new_secret && turnData.new_secret.title) {
        const exists = gameState.secrets.some(s => s.title === turnData.new_secret.title);
        if (!exists) {
          gameState.secrets.unshift(turnData.new_secret);
          showToast(`انكشف سر موثق: ${turnData.new_secret.title}`);
        }
      }

      // تحديث بيانات المشتبه به مع الحفاظ على بياناته الجنائية في Case Bible
      if (turnData.suspect_update && turnData.suspect_update.name) {
        const idx = gameState.suspects.findIndex(
          s =>
            s.name === turnData.suspect_update.name ||
            s.name.includes(turnData.suspect_update.name) ||
            turnData.suspect_update.name.includes(s.name)
        );
        if (idx >= 0) {
          gameState.suspects[idx].trust_level =
            turnData.suspect_update.trust_level || gameState.suspects[idx].trust_level;
          if (turnData.suspect_update.note && !gameState.suspects[idx].alibiBroken) {
            gameState.suspects[idx].note = turnData.suspect_update.note;
          }
        }
      }

      // فحص ما إذا كانت الأدلة المكتشفة تفتح انقلابا دراميا مشروطا (Earned Twist - H1 Fix)
      let unlockedEarnedTwist = null;
      if (gameState.caseBible && Array.isArray(gameState.caseBible.twists)) {
        for (const tw of gameState.caseBible.twists) {
          const alreadyUnlocked = gameState.secrets.some(
            s =>
              s.id === tw.id ||
              s.title === tw.headline ||
              s.title === tw.secretTitle ||
              s.revelation === tw.revelation
          );
          if (alreadyUnlocked) continue;
          const hasAllPrereqs = (tw.unlocks_when || []).every(reqId =>
            hasDiscoveredClueId(reqId)
          );
          if (hasAllPrereqs) {
            unlockedEarnedTwist = tw;
            gameState.secrets.unshift({
              id: tw.id,
              title: tw.headline,
              revelation: tw.revelation
            });
            turnData.is_twist_moment = true;
            turnData.twist_headline = tw.headline;
            break;
          }
        }
      }

      // حساب تغطية الاستنتاج الجنائي الحقيقية بناء على الأدلة والحجج المكسورة والروابط الصحيحة
      gameState.twistProgress = window.MysteryCaseBibles.calculateDeductionCoverage(
        gameState.caseBible,
        gameState
      );

      // إضافة إلى سجل المغامرة
      gameState.history.unshift({
        turn: gameState.turn,
        title: turnData.chapter_title,
        choice: playerChoiceText || 'بداية التحقيق',
        summary: turnData.vocal_reaction
      });

      saveGameState();

      renderTurnScene(turnData);
      renderSidebarState();
      setLoadingState(false);

      if (turnData._usedFallbackNotice) {
        showToast('تم توليد الفصل من ملف القضية الجنائي المثبت لضمان استمرار التحقيق فورا.');
      }

      if (unlockedEarnedTwist || turnData.is_twist_moment) {
        await triggerDramaticTwistOverlay(
          turnData.twist_headline || 'انكشف تناقض جنائي حاسم في القضية!',
          unlockedEarnedTwist
            ? unlockedEarnedTwist.revelation
            : audioEngine.stripInlineVocalTags(turnData.vocal_reaction || '')
        );
      }

      if (dom.vocalSpeakerLabel) {
        dom.vocalSpeakerLabel.textContent = 'الراوي التفاعلي';
      }

      // تشغيل السرد الصوتي مع المشاعر المخصصة لكل فقرة (H5 Fix)
      audioEngine.speakTurn({
        reactionText: turnData.vocal_reaction,
        emotion: turnData.vocal_emotion,
        narrativeText: turnData.narrative,
        paragraphEmotions: turnData.paragraph_emotions || [],
        forceSpeak: false
      });

      // إذا وصل الخطر إلى 100%، يواجه المحقق لحظة الحسم الإجبارية قبل قيد القضية ضد مجهول (H3 Fix)
      if (gameState.dangerLevel >= 100 && !gameState.caseSolved) {
        showToast('⚠️ بلغ مستوى الخطر 100%! عليك إصدار اتهامك النهائي الآن قبل إغلاق ملف القضية!');
        setTimeout(() => openVerdictModal(true), 900);
      }
    } catch (error) {
      showToast(`تنبيه: ${error.message}`);
    } finally {
      setLoadingState(false);
    }
  }

  function hasDiscoveredClueId(clueId) {
    if (!gameState.caseBible) return false;
    const bibleClue = (gameState.caseBible.clues || []).find(c => c.id === clueId);
    if (!bibleClue) return false;
    return (gameState.clues || []).some(
      fc =>
        fc.id === clueId ||
        fc.title === bibleClue.title ||
        fc.title.includes(bibleClue.title) ||
        bibleClue.title.includes(fc.title)
    );
  }

  function addClueToGameState(clueObj) {
    if (!clueObj || !clueObj.title) return false;
    ensureGameStateHasLockedBible();
    const matchedBibleClue = (gameState.caseBible?.clues || []).find(
      bc =>
        bc.id === clueObj.id ||
        bc.title === clueObj.title ||
        clueObj.title.includes(bc.title) ||
        bc.title.includes(clueObj.title)
    );

    const normalized = {
      id: matchedBibleClue ? matchedBibleClue.id : clueObj.id || `c_${gameState.clues.length + 1}`,
      title: matchedBibleClue ? matchedBibleClue.title : clueObj.title,
      description: matchedBibleClue ? matchedBibleClue.description : clueObj.description,
      isRedHerring: Boolean(matchedBibleClue && matchedBibleClue.isRedHerring)
    };

    const exists = gameState.clues.some(
      c => c.id === normalized.id || c.title === normalized.title
    );
    if (!exists) {
      gameState.clues.unshift(normalized);
      audioEngine.playClueSound();
      showToast(`🔍 دليل جنائي جديد: ${normalized.title}`);
      return true;
    }
    return false;
  }

  /**
   * عرض تفاصيل المشهد الحالي والخيارات مع التركيز والتمرير السلس لعنوان الفصل
   */
  function renderTurnScene(turnData) {
    const cleanStr = s =>
      String(s || '')
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/\s*[\u2014\u2013]\s*/g, '، ');
    if (typeof window.__setActiveActionMode === 'function') {
      window.__setActiveActionMode('choices');
    }

    dom.chapterBadge.textContent = `الفصل ${gameState.turn}`;
    dom.sceneTitle.textContent = cleanStr(turnData.chapter_title) || 'فصل جديد';
    dom.sceneMoodText.textContent = cleanStr(turnData.mood) || 'غموض وترقب';
    updateSceneArtwork(gameState.scenarioId, cleanStr(turnData.chapter_title));
    if (typeof audioEngine.setMusicMood === 'function') {
      audioEngine.setMusicMood(turnData.is_twist_moment ? 'revelation' : 'investigation');
    }
    if (dom.detectiveStyleText) {
      dom.detectiveStyleText.textContent = cleanStr(gameState.detectiveStyle) || 'تحليلي حذر';
    }

    dom.vocalEmotionBadge.textContent = cleanStr(turnData.vocal_emotion) || 'همس مريب';
    const cleanVisibleReaction = cleanStr(audioEngine.stripInlineVocalTags(turnData.vocal_reaction || ''));
    dom.vocalReactionText.textContent = `«${cleanVisibleReaction}»`;

    if (turnData.is_twist_moment) {
      dom.narrativeCard.classList.add('twist-active');
      dom.narrativeTwistRibbon.classList.remove('hidden');
      dom.narrativeTwistText.textContent =
        cleanStr(turnData.twist_headline) || 'انكشف خيط جنائي يقلب الموازين!';
    } else {
      dom.narrativeCard.classList.remove('twist-active');
      dom.narrativeTwistRibbon.classList.add('hidden');
    }

    dom.narrativeBody.innerHTML = '';
    dom.narrativeBody.style.fontSize = `${narrativeFontSizeRem}rem`;
    const paragraphs = cleanStr(turnData.narrative || '')
      .split(/\n+/)
      .map(p => p.trim())
      .filter(Boolean);

    paragraphs.forEach((paraText, pIdx) => {
      const p = document.createElement('p');
      p.className = 'narrative-para';
      p.textContent = paraText;
      p.title = 'اضغط للاستماع إلى هذه الفقرة بصوت الراوي';
      p.style.cursor = 'pointer';
      p.addEventListener('click', () => {
        const paraEmo =
          (Array.isArray(turnData.paragraph_emotions) && turnData.paragraph_emotions[pIdx]) ||
          turnData.vocal_emotion ||
          'سرد سينمائي متدرج';
        dom.narrativeBody.querySelectorAll('p').forEach((el, i) => {
          el.classList.toggle('speaking-paragraph', i === pIdx);
          el.classList.toggle('narrative-para-active', i === pIdx);
        });
        audioEngine.speakSingleText(paraText, paraEmo, false);
      });
      dom.narrativeBody.appendChild(p);
    });

    if (turnData.suspicious_hotspot && turnData.suspicious_hotspot.preview) {
      dom.suspiciousHotspot.classList.remove('hidden');
      dom.hotspotPreviewText.textContent = turnData.suspicious_hotspot.preview;
      dom.hotspotRevealBox.classList.add('hidden');
      dom.inspectHotspotBtn.disabled = false;
      const isMobileViewport = window.innerWidth <= 768;
      dom.inspectHotspotBtn.textContent = isMobileViewport
        ? '🔍 فحص الدليل (+10% خطر)'
        : 'فحص وتحليل الآن [I] (+10% خطر)';
    } else {
      dom.suspiciousHotspot.classList.add('hidden');
    }

    dom.choicesGrid.innerHTML = '';
    const choices = Array.isArray(turnData.choices) ? turnData.choices.slice(0, 3) : [];
    choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.innerHTML = `
        <div class="choice-top-meta">
          <span class="choice-num-group">
            <span class="choice-number">${idx + 1}</span>
            <kbd class="kbd-hint" title="اضغط رقم ${idx + 1} في لوحة المفاتيح">[${idx + 1}]</kbd>
          </span>
          <span class="choice-tag">${escapeHtml(choice.tag || 'مسار استقصائي')}</span>
        </div>
        <span class="choice-text">${escapeHtml(choice.text)}</span>
      `;
      btn.addEventListener('click', () => handlePlayerChoice(choice.text, choice.tag || ''));
      dom.choicesGrid.appendChild(btn);
    });

    populateInterrogationAndCorkboardSelects();

    // تمرير وتركيز سلس على عنوان الفصل الجديد عند بدء الفصل أو التقدم فيه
    if (dom.sceneTitle && dom.gameStage && !dom.gameStage.classList.contains('hidden')) {
      setTimeout(() => {
        dom.sceneTitle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        try {
          dom.sceneTitle.focus({ preventScroll: true });
        } catch (_) {}
      }, 60);
    }
  }

  /**
   * فحص التفصيل المريب في المشهد (مع مخاطرة +10% خطر مقابل دليل مادي)
   */
  function inspectCurrentHotspot() {
    if (!currentTurnData || !currentTurnData.suspicious_hotspot || hotspotInspectedThisTurn) return;
    hotspotInspectedThisTurn = true;

    const hs = currentTurnData.suspicious_hotspot;
    if (typeof audioEngine.playForensicScannerBeep === 'function') {
      audioEngine.playForensicScannerBeep();
    }
    dom.hotspotRevealText.textContent = `نتيجة الفحص الجنائي: ${hs.secret_reveal}`;
    dom.hotspotRevealBox.classList.remove('hidden');
    dom.inspectHotspotBtn.disabled = true;
    dom.inspectHotspotBtn.textContent = 'تم الفحص الجنائي ✓';

    const hotspotClueId = hs.bonus_clue_id || hs.clue_id;
    if (hs.bonus_clue || hotspotClueId) {
      addClueToGameState({
        id: hotspotClueId,
        title: hs.bonus_clue,
        description: hs.secret_reveal
      });
    } else {
      audioEngine.playClueSound();
    }

    // تكلفة المخاطرة لفحص المخبأ السري (+10% خطر)
    gameState.dangerLevel = Math.min(100, gameState.dangerLevel + 10);
    gameState.twistProgress = window.MysteryCaseBibles.calculateDeductionCoverage(
      gameState.caseBible,
      gameState
    );

    populateInterrogationAndCorkboardSelects();
    renderSidebarState();
    saveGameState();

    if (audioEngine.autoTtsEnabled) {
      audioEngine.speakSingleText(hs.secret_reveal, 'همس مرعوب وترقب', true);
    }

    if (gameState.dangerLevel >= 100 && !gameState.caseSolved) {
      showToast('⚠️ بلغ مستوى الخطر 100% أثناء الفحص! حان وقت الحسم في غرفة الاتهام.');
      setTimeout(() => openVerdictModal(true), 1100);
    }
  }

  /**
   * تحديث قوائم الاختيار للاستجواب المباشر ولوحة ربط الأدلة
   */
  function populateInterrogationAndCorkboardSelects() {
    ensureGameStateHasLockedBible();
    const suspects = gameState.suspects || [];
    const clues = gameState.clues || [];

    if (dom.interrogateSuspectSelect) {
      const prevSus = dom.interrogateSuspectSelect.value;
      dom.interrogateSuspectSelect.innerHTML =
        '<option value="">اختر المشتبه به للاستجواب...</option>' +
        suspects
          .map(
            s =>
              `<option value="${escapeHtml(s.id || s.name)}">${escapeHtml(s.name)}${
                s.alibiBroken ? ' (انكسرت حجته ✓)' : ''
              }</option>`
          )
          .join('');
      if (prevSus) dom.interrogateSuspectSelect.value = prevSus;
    }

    if (dom.interrogateClueSelect) {
      const prevClue = dom.interrogateClueSelect.value;
      dom.interrogateClueSelect.innerHTML =
        '<option value="">اختر الدليل المادي للمواجهة...</option>' +
        clues
          .map(
            c =>
              `<option value="${escapeHtml(c.id || c.title)}">${escapeHtml(c.title)}</option>`
          )
          .join('');
      if (prevClue) dom.interrogateClueSelect.value = prevClue;
    }

    if (dom.linkClueSelect) {
      const prevClue = dom.linkClueSelect.value;
      dom.linkClueSelect.innerHTML =
        '<option value="">اختر الدليل...</option>' +
        clues
          .map(
            c =>
              `<option value="${escapeHtml(c.id || c.title)}">${escapeHtml(c.title)}</option>`
          )
          .join('');
      if (prevClue) dom.linkClueSelect.value = prevClue;
    }

    if (dom.linkSuspectSelect) {
      const prevSus = dom.linkSuspectSelect.value;
      dom.linkSuspectSelect.innerHTML =
        '<option value="">اختر المشتبه به...</option>' +
        suspects
          .map(
            s =>
              `<option value="${escapeHtml(s.id || s.name)}">${escapeHtml(s.name)}</option>`
          )
          .join('');
      if (prevSus) dom.linkSuspectSelect.value = prevSus;
    }

    renderInterrogationSuspectCards();
    if (dom.interrogateSuspectSelect && !dom.interrogateSuspectSelect.dataset.cardSyncBound) {
      dom.interrogateSuspectSelect.dataset.cardSyncBound = '1';
      dom.interrogateSuspectSelect.addEventListener('change', renderInterrogationSuspectCards);
    }
  }

  function renderInterrogationSuspectCards() {
    const container = document.getElementById('interrogationSuspectCards');
    if (!container) return;
    const suspects = gameState.suspects || [];
    const selectedVal = dom.interrogateSuspectSelect ? dom.interrogateSuspectSelect.value : '';

    container.innerHTML = suspects
      .map(s => {
        const val = s.id || s.name;
        const isSel = selectedVal === val;
        const pState = s.alibiBroken ? 'broken' : isSel ? 'tense' : 'calm';
        return `
          <button type="button" class="int-suspect-card ${isSel ? 'selected' : ''} ${
          s.alibiBroken ? 'broken' : ''
        }" data-int-card-suspect="${escapeHtml(val)}">
            <div class="int-suspect-head">
              <strong class="suspect-title-with-portrait">${renderSuspectPortraitSvg(s, pState)} <span>${escapeHtml(s.name)}</span></strong>
              <span class="int-suspect-status">${s.alibiBroken ? 'حجة مكسورة ✓' : 'قيد التحقق'}</span>
            </div>
            <span class="int-suspect-alibi">${escapeHtml(s.alibi || s.note || '')}</span>
          </button>
        `;
      })
      .join('');

    container.querySelectorAll('[data-int-card-suspect]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sVal = btn.getAttribute('data-int-card-suspect');
        if (dom.interrogateSuspectSelect) dom.interrogateSuspectSelect.value = sVal;
        if (dom.linkSuspectSelect) dom.linkSuspectSelect.value = sVal;
        if (typeof audioEngine.playPuzzleClickSound === 'function') {
          audioEngine.playPuzzleClickSound();
        }
        if (typeof audioEngine.setMusicMood === 'function') {
          audioEngine.setMusicMood('interrogation');
        }
        renderInterrogationSuspectCards();
        if (dom.interrogateClueSelect) dom.interrogateClueSelect.focus();
      });
    });
  }

  /**
   * استجواب المشتبه به ومواجهته بدليل مادي مع نطق الإفادة بصوته الخاص (Game Changer 3 & 7)
   */
  async function handleSuspectInterrogation() {
    ensureGameStateHasLockedBible();
    const suspectRef = dom.interrogateSuspectSelect ? dom.interrogateSuspectSelect.value : '';
    const clueRef = dom.interrogateClueSelect ? dom.interrogateClueSelect.value : '';

    if (!suspectRef || !clueRef) {
      showToast('اختر المشتبه به والدليل المادي أولا لبدء المواجهة.');
      return;
    }

    const result = window.MysteryCaseBibles.interrogateSuspectWithClue(
      gameState.caseBible,
      gameState,
      suspectRef,
      clueRef
    );

    if (!result.ok) {
      showToast(result.message || 'تعذر تنفيذ الاستجواب.');
      return;
    }

    audioEngine.stopSpeaking();
    if (typeof audioEngine.setMusicMood === 'function') {
      audioEngine.setMusicMood('interrogation');
    }

    // تحديث حالة المشتبه به في gameState
    const sIdx = gameState.suspects.findIndex(
      s => s.id === result.suspect.id || s.name === result.suspect.name
    );
    if (sIdx >= 0) {
      gameState.suspects[sIdx].trust_level = result.newTrust;
      gameState.suspects[sIdx].note = result.updatedNote;
      if (result.outcomeType === 'ALIBI_BROKEN') {
        gameState.suspects[sIdx].alibiBroken = true;
      }
    }

    // تحديث شريط الصوت ليعرض اسم المشتبه به وشعوره وصوته المستقل
    if (dom.vocalSpeakerLabel) {
      dom.vocalSpeakerLabel.textContent = `🗣️ إفادة: ${result.suspect.name}`;
    }
    if (dom.vocalEmotionBadge) {
      dom.vocalEmotionBadge.textContent = result.emotion;
    }
    if (dom.vocalReactionText) {
      dom.vocalReactionText.textContent = `«${result.spokenResponse}»`;
    }

    // إضافة فقرة المواجهة إلى المشهد الحالي حتى يوثقها اللاعب بصريا
    if (dom.narrativeBody) {
      const p = document.createElement('p');
      p.className = 'interrogation-transcript-para';
      p.textContent = `[استجواب مباشر: ${result.suspect.name} بمواجهة «${result.clue.title}»]: «${result.spokenResponse}»`;
      dom.narrativeBody.appendChild(p);
      p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (result.unlockedSecret) {
      const secretKey = result.unlockedSecret.id || `alibi_${result.suspect.id}`;
      const exists = gameState.secrets.some(
        s => s.id === secretKey || s.suspectId === result.suspect.id || s.title === result.unlockedSecret.title
      );
      if (!exists) {
        gameState.secrets.unshift({
          ...result.unlockedSecret,
          id: secretKey,
          suspectId: result.suspect.id
        });
      }
      audioEngine.playTwistSound();
      showToast(`💥 انكسرت حجة ${result.suspect.name}! انكشف سر حاسم في دفتر التحقيق.`);
    } else if (result.outcomeType === 'SUPPORTS_GUILT') {
      audioEngine.playClueSound();
      showToast(`📌 مواجهة قوية! الدليل يدعم الشبهة ضد ${result.suspect.name}.`);
    } else {
      // مواجهة بدليل غير مرتبط ترفع مستوى الخطر بسبب تنبيه المشتبه به
      gameState.dangerLevel = Math.min(100, gameState.dangerLevel + 8);
      showToast(`⚠️ الدليل لا يناقض إفادة ${result.suspect.name} مباشرة (+8% خطر).`);
    }

    gameState.twistProgress = window.MysteryCaseBibles.calculateDeductionCoverage(
      gameState.caseBible,
      gameState
    );

    gameState.history.unshift({
      turn: gameState.turn || 1,
      title: `استجواب: ${result.suspect.name}`,
      choice: `المواجهة بدليل «${result.clue.title}»`,
      summary: result.spokenResponse
    });

    populateInterrogationAndCorkboardSelects();
    renderSidebarState();
    saveGameState();

    // نطق رد المشتبه به بصوته الخاص المستقل (voiceOverride)
    await audioEngine.speakSingleText(
      result.spokenResponse,
      result.emotion,
      true,
      result.voice
    );
  }

  /**
   * ربط دليل بمشتبه به في لوحة الاستنتاج التفاعلية (Game Changer 4)
   */
  function handleAddCorkboardLink() {
    ensureGameStateHasLockedBible();
    const clueRef = dom.linkClueSelect ? dom.linkClueSelect.value : '';
    const relationType = dom.linkRelationSelect ? dom.linkRelationSelect.value : 'contradicts';
    const suspectRef = dom.linkSuspectSelect ? dom.linkSuspectSelect.value : '';

    if (!clueRef || !suspectRef) {
      showToast('يرجى اختيار الدليل والمشتبه به أولا لإنشاء الرابط الاستنتاجي.');
      return;
    }

    const check = window.MysteryCaseBibles.verifyCorkboardLink(
      gameState.caseBible,
      clueRef,
      suspectRef,
      relationType
    );

    if (!Array.isArray(gameState.boardLinks)) gameState.boardLinks = [];
    const duplicate = gameState.boardLinks.some(
      l => l.clueId === check.clueId && l.suspectId === check.suspectId && l.relationType === relationType
    );
    if (duplicate) {
      showToast('هذا الرابط مسجل بالفعل على لوحة الاستنتاج.');
      return;
    }

    const clueObj = (gameState.caseBible.clues || []).find(c => c.id === check.clueId) || {
      title: clueRef
    };
    const suspectObj = (gameState.caseBible.suspects || []).find(s => s.id === check.suspectId) || {
      name: suspectRef
    };

    gameState.boardLinks.unshift({
      clueId: check.clueId,
      suspectId: check.suspectId,
      clueTitle: clueObj.title,
      suspectName: suspectObj.name,
      relationType,
      verified: check.verified,
      feedback: check.feedback
    });

    if (check.verified) {
      audioEngine.playClueSound();
    }

    gameState.twistProgress = window.MysteryCaseBibles.calculateDeductionCoverage(
      gameState.caseBible,
      gameState
    );

    renderSidebarState();
    saveGameState();
    showToast(check.feedback);
  }

  /**
   * تحديث المؤشرات ودفتر الأدلة ولوحة الربط والبحث الفوري
   */
  function renderSidebarState() {
    ensureGameStateHasLockedBible();
    const coverage = window.MysteryCaseBibles.calculateDeductionCoverage(
      gameState.caseBible,
      gameState
    );
    gameState.twistProgress = coverage;

    dom.twistMeterValue.textContent = `${coverage}%`;
    dom.twistMeterBar.style.width = `${coverage}%`;

    if (coverage < 35) {
      dom.twistMeterHint.textContent = 'اجمع الأدلة من المشهد وواجه المشتبه بهم لكسر حججهم.';
    } else if (coverage < 75) {
      dom.twistMeterHint.textContent = 'خيوط القضية تتضح! اربط الأدلة بالمشتبه بهم أو استجوبهم مباشرة.';
    } else {
      dom.twistMeterHint.textContent = 'اكتملت معظم أركان الاستنتاج! يمكنك دخول غرفة الاتهام لحسم القضية.';
    }

    dom.dangerMeterValue.textContent = `${gameState.dangerLevel}%`;
    dom.dangerMeterBar.style.width = `${gameState.dangerLevel}%`;
    if (typeof audioEngine.updateTensionMusicStem === 'function') {
      audioEngine.updateTensionMusicStem(gameState.dangerLevel);
    }
    updateImmersiveForensicHud();
    renderCrimeSceneScanner();

    // F08 Fix: عدم تكرار احتساب الحجج المكسورة مع الأسرار المنبثقة عنها
    const uniqueSecretsMap = new Map();
    for (const sec of gameState.secrets || []) {
      const k = sec.id || sec.suspectId || sec.title;
      if (k && !uniqueSecretsMap.has(k)) {
        uniqueSecretsMap.set(k, sec);
      }
    }
    gameState.secrets = Array.from(uniqueSecretsMap.values());

    const brokenSuspectIds = new Set(
      (gameState.suspects || []).filter(s => s.alibiBroken).map(s => s.id || s.name)
    );
    const nonAlibiSecretsCount = gameState.secrets.filter(
      sec => !sec.suspectId || !brokenSuspectIds.has(sec.suspectId)
    ).length;
    const totalUniqueBreakthroughs = brokenSuspectIds.size + nonAlibiSecretsCount;

    dom.statChapterNum.textContent = String(gameState.turn || 1);
    dom.statCluesCount.textContent = String(gameState.clues.length);
    dom.statSecretsCount.textContent = String(totalUniqueBreakthroughs);

    const totalCoreClues = Math.max(
      4,
      (gameState.caseBible && Array.isArray(gameState.caseBible.clues)
        ? gameState.caseBible.clues.filter(c => !c.isRedHerring).length
        : 4)
    );
    const verifiedLinksCount = (gameState.boardLinks || []).filter(l => l.verified).length;

    if (dom.dedChipClues) {
      dom.dedChipClues.textContent = `🔍 الأدلة: ${gameState.clues.length}/${totalCoreClues}`;
      dom.dedChipClues.classList.toggle('completed', gameState.clues.length >= 2);
    }
    if (dom.dedChipAlibis) {
      dom.dedChipAlibis.textContent = `💥 الحجج المكسورة: ${brokenSuspectIds.size}`;
      dom.dedChipAlibis.classList.toggle('completed', brokenSuspectIds.size >= 1);
    }
    if (dom.dedChipLinks) {
      dom.dedChipLinks.textContent = `📌 الروابط الموثقة: ${verifiedLinksCount}`;
      dom.dedChipLinks.classList.toggle('completed', verifiedLinksCount >= 1);
    }

    // تحديث شريط الخيوط النشطة السريع أسفل الراوي (#quickEvidencePillsGroup)
    if (dom.quickEvidencePillsGroup) {
      const cluePillsHtml = (gameState.clues || [])
        .slice(0, 4)
        .map(
          c =>
            `<button type="button" class="quick-evidence-pill clue-pill" data-quick-clue="${escapeHtml(
              c.id || c.title
            )}" title="اضغط لاستخدام هذا الدليل في الاستجواب أو الربط">🔍 ${escapeHtml(
              c.title
            )}</button>`
        )
        .join('');

      const suspectPillsHtml = (gameState.suspects || [])
        .map(
          s =>
            `<button type="button" class="quick-evidence-pill ${
              s.alibiBroken ? 'broken-pill' : ''
            }" data-quick-suspect="${escapeHtml(
              s.id || s.name
            )}" title="اضغط لاستجواب ${escapeHtml(s.name)}">${
              s.alibiBroken ? '💥' : '👤'
            } ${escapeHtml(s.name)}</button>`
        )
        .join('');

      dom.quickEvidencePillsGroup.innerHTML =
        `<span class="quick-evidence-label">📂 خيوط القضية (${gameState.clues.length} أدلة):</span>` +
        (cluePillsHtml ||
          `<span class="quick-evidence-pill">افحص المشهد لاكتشاف أول دليل مادي</span>`) +
        suspectPillsHtml;

      dom.quickEvidencePillsGroup.querySelectorAll('[data-quick-clue]').forEach(btn => {
        btn.addEventListener('click', () => {
          const cRef = btn.getAttribute('data-quick-clue');
          if (typeof window.__setActiveActionMode === 'function') {
            window.__setActiveActionMode('interrogate');
          }
          if (dom.interrogateClueSelect) dom.interrogateClueSelect.value = cRef;
          if (dom.linkClueSelect) dom.linkClueSelect.value = cRef;
          if (dom.interrogationBar) {
            dom.interrogationBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (dom.interrogateSuspectSelect) dom.interrogateSuspectSelect.focus();
          }
          showToast('🔍 تم اختيار الدليل وفتح منصة الاستجواب المباشر.');
        });
      });

      dom.quickEvidencePillsGroup.querySelectorAll('[data-quick-suspect]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sRef = btn.getAttribute('data-quick-suspect');
          if (typeof window.__setActiveActionMode === 'function') {
            window.__setActiveActionMode('interrogate');
          }
          if (dom.interrogateSuspectSelect) dom.interrogateSuspectSelect.value = sRef;
          if (dom.linkSuspectSelect) dom.linkSuspectSelect.value = sRef;
          if (dom.interrogationBar) {
            dom.interrogationBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (dom.interrogateClueSelect) dom.interrogateClueSelect.focus();
          }
          showToast('🗣️ تم تحديد المشتبه به وفتح منصة الاستجواب المباشر.');
        });
      });
    }

    if (dom.tabCountClues) dom.tabCountClues.textContent = String(gameState.clues.length);
    if (dom.tabCountSecrets) dom.tabCountSecrets.textContent = String(gameState.secrets.length);
    if (dom.tabCountSuspects) dom.tabCountSuspects.textContent = String(gameState.suspects.length);
    if (dom.tabCountHistory) dom.tabCountHistory.textContent = String(gameState.history.length);
    if (dom.mobCluesBadge) {
      dom.mobCluesBadge.textContent = String(gameState.clues.length + gameState.secrets.length);
    }

    // عرض الروابط الاستنتاجية على لوحة الفلين (#corkboardLinksList)
    if (dom.corkboardLinksList) {
      const links = gameState.boardLinks || [];
      if (links.length === 0) {
        dom.corkboardLinksList.innerHTML =
          '<li class="corkboard-empty">لم توثق روابط بعد. اربط الدليل بالمشتبه به للتحقق من استنتاجك (+تغطية الاستنتاج).</li>';
      } else {
        dom.corkboardLinksList.innerHTML = links
          .map(
            (l, idx) => `
          <li class="corkboard-link-item ${l.verified ? 'verified' : 'unverified'}">
            <div class="corkboard-link-head">
              <strong>${escapeHtml(l.clueTitle)}</strong>
              <span class="corkboard-rel-pill">${
                l.relationType === 'contradicts' ? 'يناقض إفادة' : 'يثبت شبهة'
              }</span>
              <strong>${escapeHtml(l.suspectName)}</strong>
              <button type="button" class="corkboard-remove-btn" data-remove-link-idx="${idx}" title="حذف هذا الرابط">×</button>
            </div>
            <small>${escapeHtml(l.feedback)}</small>
          </li>`
          )
          .join('');

        dom.corkboardLinksList.querySelectorAll('[data-remove-link-idx]').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-remove-link-idx'));
            if (!Number.isNaN(idx) && Array.isArray(gameState.boardLinks)) {
              gameState.boardLinks.splice(idx, 1);
              renderSidebarState();
              saveGameState();
            }
          });
        });
      }
    }

    const searchQuery = dom.notebookSearchInput
      ? dom.notebookSearchInput.value.trim().toLowerCase()
      : '';

    const filteredClues = gameState.clues.filter(
      c =>
        !searchQuery ||
        String(c.title || '').toLowerCase().includes(searchQuery) ||
        String(c.description || '').toLowerCase().includes(searchQuery)
    );

    if (filteredClues.length === 0) {
      dom.clueList.innerHTML = searchQuery
        ? '<li class="empty-note">لا توجد أدلة تطابق كلمة البحث الحالية.</li>'
        : '<li class="empty-note">لم تكتشف أدلة مادية بعد. ابحث في المشهد أو اتخذ قرارات استقصائية.</li>';
    } else {
      dom.clueList.innerHTML = filteredClues
        .map(
          c => `
        <li class="clue-item">
          <div class="clue-item-head">
            <strong>🔍 ${escapeHtml(c.title)}</strong>
          </div>
          <span>${escapeHtml(c.description)}</span>
          <div class="notebook-item-actions">
            <button type="button" class="notebook-quick-action-btn" data-confront-clue="${escapeHtml(
              c.id || c.title
            )}">⚡ واجه بالدليل</button>
            <button type="button" class="notebook-quick-action-btn secondary" data-board-clue="${escapeHtml(
              c.id || c.title
            )}">📌 اربط في اللوحة</button>
            <button type="button" class="notebook-quick-action-btn secondary" data-speak-clue="${escapeHtml(
              c.id || c.title
            )}">🔊 سماع التقرير</button>
          </div>
        </li>`
        )
        .join('');

      dom.clueList.querySelectorAll('[data-speak-clue]').forEach(btn => {
        btn.addEventListener('click', () => {
          const cRef = btn.getAttribute('data-speak-clue');
          const found = (gameState.clues || []).find(c => (c.id || c.title) === cRef);
          if (found) {
            audioEngine.stopSpeaking();
            if (dom.vocalSpeakerLabel) dom.vocalSpeakerLabel.textContent = `🔍 تقرير جنائي: ${found.title}`;
            if (dom.vocalEmotionBadge) dom.vocalEmotionBadge.textContent = 'تحليل علمي دقيق';
            if (dom.vocalReactionText) dom.vocalReactionText.textContent = `«${found.description}»`;
            audioEngine.speakSingleText(found.description, 'تحليل علمي دقيق', true);
          }
        });
      });

      dom.clueList.querySelectorAll('[data-confront-clue]').forEach(btn => {
        btn.addEventListener('click', () => {
          const cRef = btn.getAttribute('data-confront-clue');
          if (typeof window.__setActiveActionMode === 'function') {
            window.__setActiveActionMode('interrogate');
          }
          if (dom.interrogateClueSelect) dom.interrogateClueSelect.value = cRef;
          setMobileDrawerOpen(false);
          if (dom.interrogationBar) {
            dom.interrogationBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (dom.interrogateSuspectSelect) dom.interrogateSuspectSelect.focus();
          }
          showToast('⚡ تم تجهيز الدليل في منصة الاستجواب، اختر المشتبه به للمواجهة.');
        });
      });

      dom.clueList.querySelectorAll('[data-board-clue]').forEach(btn => {
        btn.addEventListener('click', () => {
          const cRef = btn.getAttribute('data-board-clue');
          if (dom.linkClueSelect) dom.linkClueSelect.value = cRef;
          if (dom.corkboardLinkerBox) {
            dom.corkboardLinkerBox.open = true;
            dom.corkboardLinkerBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            if (dom.linkSuspectSelect) dom.linkSuspectSelect.focus();
          }
        });
      });
    }

    const filteredSecrets = gameState.secrets.filter(
      s =>
        !searchQuery ||
        String(s.title || '').toLowerCase().includes(searchQuery) ||
        String(s.revelation || '').toLowerCase().includes(searchQuery)
    );

    const mythicProfile =
      window.MysteryCaseBibles && typeof window.MysteryCaseBibles.getMythicSecretProfile === 'function'
        ? window.MysteryCaseBibles.getMythicSecretProfile(gameState.caseBible || gameState.scenarioId)
        : null;

    let mythicRiddleHtml = '';
    if (mythicProfile && !searchQuery) {
      const perkText = mythicProfile.rewardPerk || mythicProfile.rewardLabel || '';
      if (gameState.mythicSecretUnlocked) {
        mythicRiddleHtml = `
          <li class="secret-item" style="border-color:rgba(229,184,92,0.75);background:linear-gradient(135deg,rgba(88,28,135,0.28),rgba(229,184,92,0.14));">
            <strong style="color:#f5d078;">👑 ${escapeHtml(mythicProfile.relicIcon)} الأثر الأسطوري المكتشف: ${escapeHtml(mythicProfile.relicName)}</strong>
            <span>${escapeHtml(perkText)}</span>
          </li>`;
      } else {
        mythicRiddleHtml = `
          <li class="secret-item" style="border-color:rgba(168,85,247,0.55);background:rgba(46,16,101,0.28);">
            <strong style="color:#d8b4fe;">🔮 شفرة النهاية السرية الأسطورية المخبأة (★★★★★★)</strong>
            <span>${escapeHtml(mythicProfile.riddleHint)}</span>
          </li>`;
      }
    }

    if (filteredSecrets.length === 0) {
      dom.secretList.innerHTML =
        (searchQuery
          ? '<li class="empty-note">لا توجد أسرار تطابق كلمة البحث الحالية.</li>'
          : '<li class="empty-note">الأسرار الكبرى تتكشف عندما تجمع الأدلة المشروطة أو تكسر حجة المشتبه به!</li>') +
        mythicRiddleHtml;
    } else {
      dom.secretList.innerHTML =
        filteredSecrets
          .map(
            s => `
        <li class="secret-item">
          <strong>⚡ ${escapeHtml(s.title)}</strong>
          <span>${escapeHtml(s.revelation)}</span>
        </li>`
          )
          .join('') + mythicRiddleHtml;
    }

    dom.secretList.querySelectorAll('[data-try-mythic-riddle]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!mythicProfile) return;
        if ((gameState.clues || []).length < 1) {
          showToast('🔍 اكتشف دليلا ماديا واحدا على الأقل من المشهد قبل فك الشفرة الأسطورية!');
          return;
        }
        setMobileDrawerOpen(false);
        await triggerMythicSecretDiscovery(mythicProfile, mythicProfile.triggerActionExample);
      });
    });

    const filteredSuspects = gameState.suspects.filter(
      s =>
        !searchQuery ||
        String(s.name || '').toLowerCase().includes(searchQuery) ||
        String(s.role || '').toLowerCase().includes(searchQuery) ||
        String(s.note || '').toLowerCase().includes(searchQuery)
    );

    if (filteredSuspects.length === 0) {
      dom.suspectList.innerHTML = searchQuery
        ? '<li class="empty-note">لا يوجد مشتبه بهم يطابقون البحث.</li>'
        : '<li class="empty-note">ستظهر الشخصيات المشتبه بها وحجج غيابها هنا.</li>';
    } else {
      dom.suspectList.innerHTML = filteredSuspects
        .map(
          s => `
        <li class="suspect-item ${s.alibiBroken ? 'alibi-broken' : ''}">
          <div class="suspect-header">
            <strong class="suspect-title-with-portrait">${renderSuspectPortraitSvg(
              s,
              s.alibiBroken ? 'broken' : 'calm'
            )} <span>${escapeHtml(s.name)}</span></strong>
            <span class="suspect-status">${escapeHtml(s.trust_level)}</span>
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">${escapeHtml(
            s.role
          )} • 🎙️ صوت مستقل</div>
          <span>${escapeHtml(s.note)}</span>
          <div class="notebook-item-actions">
            <button type="button" class="notebook-quick-action-btn" data-confront-suspect="${escapeHtml(
              s.id || s.name
            )}">🗣️ واجه بدليل</button>
            <button type="button" class="notebook-quick-action-btn secondary" data-speak-alibi="${escapeHtml(
              s.id || s.name
            )}">🔊 سماع الإفادة</button>
          </div>
        </li>`
        )
        .join('');

      dom.suspectList.querySelectorAll('[data-speak-alibi]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sRef = btn.getAttribute('data-speak-alibi');
          const sus = (gameState.suspects || []).find(s => (s.id || s.name) === sRef);
          if (sus && sus.alibi) {
            audioEngine.stopSpeaking();
            if (dom.vocalSpeakerLabel) dom.vocalSpeakerLabel.textContent = `🗣️ إفادة: ${sus.name}`;
            if (dom.vocalEmotionBadge) dom.vocalEmotionBadge.textContent = 'توتر وانفعال دفاعي';
            if (dom.vocalReactionText) dom.vocalReactionText.textContent = `«${sus.alibi}»`;
            audioEngine.speakSingleText(sus.alibi, 'توتر وانفعال دفاعي', true, sus.voice || null);
          }
        });
      });

      dom.suspectList.querySelectorAll('[data-confront-suspect]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sRef = btn.getAttribute('data-confront-suspect');
          if (typeof window.__setActiveActionMode === 'function') {
            window.__setActiveActionMode('interrogate');
          }
          if (dom.interrogateSuspectSelect) dom.interrogateSuspectSelect.value = sRef;
          setMobileDrawerOpen(false);
          if (dom.interrogationBar) {
            dom.interrogationBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (dom.interrogateClueSelect) dom.interrogateClueSelect.focus();
          }
          showToast('🗣️ تم اختيار المشتبه به، اختر الدليل المادي لمواجهته بصوته.');
        });
      });
    }

    if (gameState.history.length === 0) {
      dom.historyTimeline.innerHTML = '<p class="empty-note">سجل القرارات والأحداث سيحفظ هنا.</p>';
    } else {
      dom.historyTimeline.innerHTML = gameState.history
        .map(
          h => `
        <div class="history-entry">
          <div class="hist-turn">الفصل ${h.turn}: ${escapeHtml(h.title)}</div>
          <div style="color:var(--text-secondary);margin:2px 0;">إجراء المحقق: «${escapeHtml(
            h.choice
          )}»</div>
        </div>`
        )
        .join('');
    }
  }

  /**
   * ============================================================================
   * غرفة الاتهام والحسم الجنائي: 5 نهايات حقيقية + بطاقة مشاركة بدون حرق (Fixes F01, F02, F23, F26, F27)
   * ============================================================================
   */
  function openVerdictModal(forcedByDanger = false) {
    if (!dom.verdictModal) return;
    if (typeof audioEngine.playGavelVerdictSound === 'function') {
      audioEngine.playGavelVerdictSound();
    }
    lastFocusedElementBeforeModal = document.activeElement;
    ensureGameStateHasLockedBible();
    const bible = gameState.caseBible;

    if (dom.verdictCaseTitleBadge) {
      dom.verdictCaseTitleBadge.textContent = bible.title || gameState.scenarioTitle;
    }

    // إذا كانت القضية قد حسمت سابقا، اعرض شاشة النتيجة مباشرة
    if (gameState.caseSolved && gameState.finalVerdictResult) {
      renderVerdictOutcomeView(gameState.finalVerdictResult);
      dom.verdictModal.classList.remove('hidden');
      setTimeout(() => {
        if (dom.closeVerdictBtn) dom.closeVerdictBtn.focus();
      }, 40);
      return;
    }

    dom.verdictBuilderSection.classList.remove('hidden');
    dom.verdictOutcomeBox.classList.add('hidden');

    if (forcedByDanger) {
      gameState.verdictAttemptsRemaining = 1;
      if (dom.cancelVerdictBtn) dom.cancelVerdictBtn.classList.add('hidden');
    } else {
      if (dom.cancelVerdictBtn) dom.cancelVerdictBtn.classList.remove('hidden');
    }

    if (dom.verdictAttemptsBadge) {
      dom.verdictAttemptsBadge.textContent = `المحاولات المتبقية: ${gameState.verdictAttemptsRemaining} / 3`;
    }

    // تعبئة المشتبه بهم
    if (dom.verdictSuspectSelect) {
      dom.verdictSuspectSelect.innerHTML = (bible.suspects || [])
        .map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} (${escapeHtml(s.role)})</option>`)
        .join('');
    }

    // F02 Fix: تعبئة الدوافع بصياغة فرضيات استقصائية غير حارقة للحبكة قبل الحسم
    if (dom.verdictMotiveSelect) {
      dom.verdictMotiveSelect.innerHTML = (bible.motives || [])
        .map(
          m =>
            `<option value="${escapeHtml(m.id)}">${escapeHtml(
              m.hypothesisLabel || m.text
            )}</option>`
        )
        .join('');
    }

    // F01 & F02 Fix: تعبئة الأدلة من الأدلة المكتشفة فعليا في دفتر المحقق فقط (ممنوع كشف الأدلة غير المكتشفة!)
    if (dom.verdictClueSelect) {
      const discoveredClues = Array.isArray(gameState.clues) ? gameState.clues : [];
      if (discoveredClues.length === 0) {
        dom.verdictClueSelect.innerHTML =
          '<option value="">لم تكتشف أي دليل مادي بعد، عد للمشهد للبحث أولا</option>';
      } else {
        dom.verdictClueSelect.innerHTML = discoveredClues
          .map(
            c =>
              `<option value="${escapeHtml(c.id || c.title)}">🔍 ${escapeHtml(
                c.title
              )}</option>`
          )
          .join('');
      }
    }

    if (dom.verdictCoarseFeedback) {
      if (forcedByDanger) {
        dom.verdictCoarseFeedback.classList.remove('hidden');
        dom.verdictCoarseFeedback.textContent =
          '⚠️ بلغ مستوى الخطر الحد الأقصى (100%). لديك محاولة أخيرة واحدة لإصدار الاتهام الصحيح قبل تقييد القضية ضد مجهول!';
      } else {
        dom.verdictCoarseFeedback.classList.add('hidden');
      }
    }

    const updateVerdictReadinessChecklist = () => {
      const hasSuspect = Boolean(dom.verdictSuspectSelect && dom.verdictSuspectSelect.value);
      const hasMotive = Boolean(dom.verdictMotiveSelect && dom.verdictMotiveSelect.value);
      const hasClue = Boolean(dom.verdictClueSelect && dom.verdictClueSelect.value);
      const selectedSuspectId = dom.verdictSuspectSelect ? dom.verdictSuspectSelect.value : '';
      const hasSuspectAlibiBroken = (gameState.suspects || []).some(
        s => (s.id === selectedSuspectId || s.name === selectedSuspectId) && s.alibiBroken
      );
      const hasVerifiedLink = (gameState.boardLinks || []).some(
        l => l.verified && (!selectedSuspectId || l.suspectId === selectedSuspectId)
      );
      const hasChain = (gameState.clues || []).length >= 2 && (hasSuspectAlibiBroken || hasVerifiedLink);

      if (dom.readyPillSuspect) {
        dom.readyPillSuspect.className = `readiness-pill ${hasSuspect ? 'ready' : 'warn'}`;
        dom.readyPillSuspect.textContent = `${hasSuspect ? '✓' : '⏳'} 1. تحديد المشتبه به`;
      }
      if (dom.readyPillMotive) {
        dom.readyPillMotive.className = `readiness-pill ${hasMotive ? 'ready' : 'warn'}`;
        dom.readyPillMotive.textContent = `${hasMotive ? '✓' : '⏳'} 2. تحديد فرضية الدافع`;
      }
      if (dom.readyPillClue) {
        dom.readyPillClue.className = `readiness-pill ${hasClue ? 'ready' : 'warn'}`;
        dom.readyPillClue.textContent = `${hasClue ? '✓' : '⏳'} 3. دليل مادي مكتشف (${(gameState.clues || []).length})`;
      }
      if (dom.readyPillChain) {
        dom.readyPillChain.className = `readiness-pill ${hasChain ? 'ready' : 'warn'}`;
        dom.readyPillChain.textContent = hasChain
          ? '✓ 4. سلسلة الإثبات الجنائية مكتملة'
          : '⏳ 4. سلسلة الإثبات (تحتاج دليلين + كسر حجة أو ربطا)';
      }
    };

    updateVerdictReadinessChecklist();
    if (dom.verdictSuspectSelect) dom.verdictSuspectSelect.onchange = updateVerdictReadinessChecklist;
    if (dom.verdictMotiveSelect) dom.verdictMotiveSelect.onchange = updateVerdictReadinessChecklist;
    if (dom.verdictClueSelect) dom.verdictClueSelect.onchange = updateVerdictReadinessChecklist;

    // إظهار زر النهاية السرية الأسطورية إذا كشف اللاعب الشفرة السرية أو بلغ اكتمال الحقيقة (85%+)
    const mythicBtn = document.getElementById('mythicSecretFinaleBtn');
    if (mythicBtn) {
      const canUnlockMythic =
        Boolean(gameState.mythicSecretUnlocked) ||
        ((gameState.twistProgress || 0) >= 85 && (gameState.clues || []).length >= 3);
      mythicBtn.classList.toggle('hidden', !canUnlockMythic);
      mythicBtn.onclick = handleMythicSecretFinale;
    }

    dom.verdictModal.classList.remove('hidden');

    // F23 Fix: نقل التركيز للوحة المفاتيح داخل نافذة الاتهام فور فتحها
    setTimeout(() => {
      if (dom.verdictSuspectSelect && !dom.verdictBuilderSection.classList.contains('hidden')) {
        dom.verdictSuspectSelect.focus();
      } else if (dom.closeVerdictBtn) {
        dom.closeVerdictBtn.focus();
      }
    }, 40);
  }

  function closeVerdictModal() {
    if (!dom.verdictModal) return;
    dom.verdictModal.classList.add('hidden');
    if (lastFocusedElementBeforeModal && typeof lastFocusedElementBeforeModal.focus === 'function') {
      try {
        lastFocusedElementBeforeModal.focus();
      } catch (_) {}
    }
  }

  async function handleSubmitVerdict() {
    ensureGameStateHasLockedBible();
    const bible = gameState.caseBible;
    const suspectId = dom.verdictSuspectSelect ? dom.verdictSuspectSelect.value : '';
    const motiveId = dom.verdictMotiveSelect ? dom.verdictMotiveSelect.value : '';
    const clueId = dom.verdictClueSelect ? dom.verdictClueSelect.value : '';

    const evalResult = window.MysteryCaseBibles.evaluateVerdict(
      bible,
      {
        suspectId,
        motiveId,
        clueId
      },
      gameState
    );

    // إذا لم يكن الاتهام كاملا ومشفوعا بسلسلة إثبات مكتشفة ولا تزال هناك محاولات متبقية، امنح مراجعة المحكمة
    if (!evalResult.isPerfect && gameState.verdictAttemptsRemaining > 1) {
      gameState.verdictAttemptsRemaining -= 1;
      if (dom.verdictAttemptsBadge) {
        dom.verdictAttemptsBadge.textContent = `المحاولات المتبقية: ${gameState.verdictAttemptsRemaining} / 3`;
      }
      if (dom.verdictCoarseFeedback) {
        dom.verdictCoarseFeedback.classList.remove('hidden');
        dom.verdictCoarseFeedback.textContent = `⚖️ مراجعة المحكمة: ${evalResult.coarseFeedback} (تبقى لديك ${gameState.verdictAttemptsRemaining} محاولة لتحقيق العدالة الكاملة أو يمكنك العودة لمواصلة التحقيق وجمع الأدلة).`;
      }
      const rewardedAppealRow = document.getElementById('rewardedAppealRow');
      if (rewardedAppealRow) {
        rewardedAppealRow.classList.remove('hidden');
      }
      saveGameState();
      return;
    }

    // حسم القضية نهائيا وتوليد إحدى النهايات الخمس الحقيقية + خاتمة مخصصة يكتبها الذكاء الاصطناعي من مسار اللاعب الفعلي
    if (!evalResult.isPerfect) {
      gameState.verdictAttemptsRemaining = 0;
    }

    const baseOutcome = window.MysteryCaseBibles.buildFinalEndingOutcome(
      bible,
      evalResult,
      gameState
    );

    const prevBtnHtml = dom.submitVerdictBtn ? dom.submitVerdictBtn.innerHTML : '';
    if (dom.submitVerdictBtn) {
      dom.submitVerdictBtn.disabled = true;
      dom.submitVerdictBtn.innerHTML = '<span>✨ جاري كتابة الخاتمة الخاصة بك بالذكاء الاصطناعي...</span>';
    }
    if (dom.freeFinaleBtn) dom.freeFinaleBtn.disabled = true;

    let finalOutcome = baseOutcome;
    try {
      finalOutcome = await aiEngine.generateAIEndingFinale(gameState, baseOutcome, {
        suspectId,
        motiveId,
        clueId
      });
    } finally {
      if (dom.submitVerdictBtn) {
        dom.submitVerdictBtn.disabled = false;
        dom.submitVerdictBtn.innerHTML = prevBtnHtml;
      }
      if (dom.freeFinaleBtn) dom.freeFinaleBtn.disabled = false;
    }

    gameState.caseSolved = true;
    gameState.finalVerdictResult = finalOutcome;
    saveGameState();
    updateResumeBannerVisibility();
    recordCaseOutcomeInLibrary(bible, finalOutcome);
    updateHeaderStreakBadge();

    renderVerdictOutcomeView(finalOutcome);

    audioEngine.stopSpeaking();
    if (finalOutcome.isMythicSecret || Number(finalOutcome.stars) >= 6) {
      if (typeof audioEngine.playVictoryFanfare === 'function') {
        audioEngine.playVictoryFanfare(true);
      }
    } else if (finalOutcome.endingCode === 'ENDING_1_PERFECT' || finalOutcome.endingCode === 'ENDING_2_WRONG_MOTIVE') {
      if (typeof audioEngine.playVictoryFanfare === 'function') {
        audioEngine.playVictoryFanfare(false);
      }
    } else {
      if (typeof audioEngine.playDefeatSting === 'function') {
        audioEngine.playDefeatSting();
      }
    }

    if (audioEngine.autoTtsEnabled) {
      const spokenClosing = finalOutcome.vocalClosingLine
        ? `${finalOutcome.vocalClosingLine} ${finalOutcome.summary}`
        : `${finalOutcome.endingTitle}. ${finalOutcome.summary}`;
      await audioEngine.speakSingleText(
        spokenClosing,
        finalOutcome.endingCode === 'ENDING_1_PERFECT' ? 'حزم وثقة' : 'رهبة وشجن',
        true
      );
    }
  }

  /**
   * خاتمة روائية حرة يكتبها الذكاء الاصطناعي من مسار اللاعب وأدلته وقراراته دون تقييد بمحاكمة رسمية
   */
  async function handleFreeStoryFinale() {
    ensureGameStateHasLockedBible();
    const bible = gameState.caseBible;
    const suspectId = dom.verdictSuspectSelect ? dom.verdictSuspectSelect.value : bible.culpritId;
    const motiveId = dom.verdictMotiveSelect ? dom.verdictMotiveSelect.value : bible.motiveId;
    const clueId = dom.verdictClueSelect ? dom.verdictClueSelect.value : '';

    const evalResult = window.MysteryCaseBibles.evaluateVerdict(
      bible,
      {
        suspectId,
        motiveId,
        clueId
      },
      gameState
    );

    const baseOutcome = window.MysteryCaseBibles.buildFinalEndingOutcome(
      bible,
      evalResult,
      gameState
    );
    baseOutcome.endingBadge = 'AI FREE STORY FINALE • خاتمة روائية حرة';

    const prevFreeHtml = dom.freeFinaleBtn ? dom.freeFinaleBtn.innerHTML : '';
    if (dom.freeFinaleBtn) {
      dom.freeFinaleBtn.disabled = true;
      dom.freeFinaleBtn.innerHTML = '<span>✨ يكتب الذكاء الاصطناعي الآن الفصل الأخير...</span>';
    }
    if (dom.submitVerdictBtn) dom.submitVerdictBtn.disabled = true;

    let finalOutcome = baseOutcome;
    try {
      finalOutcome = await aiEngine.generateAIEndingFinale(gameState, baseOutcome, {
        suspectId,
        motiveId,
        clueId
      });
    } finally {
      if (dom.freeFinaleBtn) {
        dom.freeFinaleBtn.disabled = false;
        dom.freeFinaleBtn.innerHTML = prevFreeHtml;
      }
      if (dom.submitVerdictBtn) dom.submitVerdictBtn.disabled = false;
    }

    gameState.caseSolved = true;
    gameState.finalVerdictResult = finalOutcome;
    saveGameState();
    updateResumeBannerVisibility();
    recordCaseOutcomeInLibrary(bible, finalOutcome);
    updateHeaderStreakBadge();

    renderVerdictOutcomeView(finalOutcome);

    audioEngine.stopSpeaking();
    audioEngine.playTwistSound();

    if (audioEngine.autoTtsEnabled) {
      const spokenClosing = finalOutcome.vocalClosingLine
        ? `${finalOutcome.vocalClosingLine} ${finalOutcome.summary}`
        : `${finalOutcome.endingTitle}. ${finalOutcome.summary}`;
      await audioEngine.speakSingleText(spokenClosing, 'سرد سينمائي متدرج', true);
    }
  }

  /**
   * تفعيل النهاية السرية الأسطورية المخبأة (6 نجوم ★★★★★★) ومنح اللاعب الأثر الأسطوري والرتبة الملكية
   */
  async function handleMythicSecretFinale() {
    ensureGameStateHasLockedBible();
    const bible = gameState.caseBible;
    gameState.mythicSecretUnlocked = true;
    gameState.forceMythicSecretEnding = true;

    const suspectId = bible.culpritId || (dom.verdictSuspectSelect ? dom.verdictSuspectSelect.value : '');
    const motiveId = bible.motiveId || (dom.verdictMotiveSelect ? dom.verdictMotiveSelect.value : '');
    const clueId =
      bible.decisiveClueId ||
      (bible.decisiveClueIds && bible.decisiveClueIds[0]) ||
      (dom.verdictClueSelect ? dom.verdictClueSelect.value : '');

    const evalResult = window.MysteryCaseBibles.evaluateVerdict(
      bible,
      { suspectId, motiveId, clueId },
      gameState
    );

    const baseOutcome = window.MysteryCaseBibles.buildFinalEndingOutcome(
      bible,
      evalResult,
      gameState
    );

    const mythicBtn = document.getElementById('mythicSecretFinaleBtn');
    const prevMythicHtml = mythicBtn ? mythicBtn.innerHTML : '';
    if (mythicBtn) {
      mythicBtn.disabled = true;
      mythicBtn.innerHTML = '<span>👑 جاري صياغة النهاية السرية الأسطورية (★★★★★★)...</span>';
    }
    if (dom.submitVerdictBtn) dom.submitVerdictBtn.disabled = true;
    if (dom.freeFinaleBtn) dom.freeFinaleBtn.disabled = true;

    let finalOutcome = baseOutcome;
    try {
      finalOutcome = await aiEngine.generateAIEndingFinale(gameState, baseOutcome, {
        suspectId,
        motiveId,
        clueId
      });
      // الحفاظ على وسام ونجوم ومكافأة النهاية السرية الأسطورية
      finalOutcome.endingCode = baseOutcome.endingCode;
      finalOutcome.endingBadge = baseOutcome.endingBadge;
      finalOutcome.stars = 6;
      finalOutcome.isMythicSecret = true;
      finalOutcome.mythicReward = baseOutcome.mythicReward;
      finalOutcome.shareCardText = baseOutcome.shareCardText;
    } finally {
      if (mythicBtn) {
        mythicBtn.disabled = false;
        mythicBtn.innerHTML = prevMythicHtml;
      }
      if (dom.submitVerdictBtn) dom.submitVerdictBtn.disabled = false;
      if (dom.freeFinaleBtn) dom.freeFinaleBtn.disabled = false;
    }

    gameState.caseSolved = true;
    gameState.finalVerdictResult = finalOutcome;
    saveGameState();
    updateResumeBannerVisibility();
    recordCaseOutcomeInLibrary(bible, finalOutcome);
    updateHeaderStreakBadge();

    renderVerdictOutcomeView(finalOutcome);

    audioEngine.stopSpeaking();
    if (typeof audioEngine.playVictoryFanfare === 'function') {
      audioEngine.playVictoryFanfare(true);
    }

    if (audioEngine.autoTtsEnabled) {
      const spokenClosing = finalOutcome.vocalClosingLine
        ? `${finalOutcome.vocalClosingLine} ${finalOutcome.summary}`
        : `${finalOutcome.endingTitle}. ${finalOutcome.summary}`;
      await audioEngine.speakSingleText(spokenClosing, 'رهبة وذهول درامي', true);
    }
  }

  let lastRenderedOutcome = null;

  function renderVerdictOutcomeView(outcome) {
    if (!outcome) return;
    lastRenderedOutcome = outcome;
    dom.verdictBuilderSection.classList.add('hidden');
    dom.verdictOutcomeBox.classList.remove('hidden');

    const headerBanner = document.getElementById('endingHeaderBanner');
    if (headerBanner) {
      const isMythic = Boolean(outcome.isMythicSecret || Number(outcome.stars) >= 6);
      const isVictory =
        outcome.endingCode === 'ENDING_1_PERFECT' || outcome.endingCode === 'ENDING_2_WRONG_MOTIVE';
      headerBanner.classList.toggle('mythic-glow', isMythic);
      headerBanner.classList.toggle('victory-glow', !isMythic && isVictory);
    }

    if (dom.verdictEndingBadge) {
      dom.verdictEndingBadge.textContent = outcome.endingBadge || outcome.endingCode;
    }
    if (dom.verdictEndingStars) {
      const rawStars = Number(outcome.stars) || 1;
      if (rawStars >= 6 || outcome.isMythicSecret) {
        dom.verdictEndingStars.textContent = '👑 ★ ★ ★ ★ ★ ★ 👑';
      } else {
        const stars = Math.max(1, Math.min(5, rawStars));
        dom.verdictEndingStars.textContent = '★'.repeat(stars) + '☆'.repeat(5 - stars);
      }
    }

    const mythicBanner = document.getElementById('verdictMythicRewardBanner');
    const mythicIconEl = document.getElementById('verdictMythicRelicIcon');
    const mythicTitleEl = document.getElementById('verdictMythicRelicTitle');
    const mythicDescEl = document.getElementById('verdictMythicRewardDesc');

    if (mythicBanner) {
      if (outcome.isMythicSecret && outcome.mythicReward) {
        mythicBanner.classList.remove('hidden');
        if (mythicIconEl) mythicIconEl.textContent = outcome.mythicReward.relicIcon || '👑';
        if (mythicTitleEl) {
          mythicTitleEl.textContent = `الأثر الأسطوري المكتسب: ${outcome.mythicReward.relicName}`;
        }
        if (mythicDescEl) {
          const perkLabel =
            outcome.mythicReward.rewardPerk || outcome.mythicReward.rewardLabel || '';
          mythicDescEl.textContent = `${perkLabel} (تم تفعيل عضوية المحقق الأعلى ومختبر مهندس العوالم الحر في حسابك تلقائيا!)`;
        }
        if (window.MysteryViralEngine && typeof window.MysteryViralEngine.recordUnlockedMythicRelic === 'function') {
          window.MysteryViralEngine.recordUnlockedMythicRelic(outcome.mythicReward);
          if (typeof window.__syncMythicVaultUi === 'function') {
            window.__syncMythicVaultUi();
          }
        }
      } else {
        mythicBanner.classList.add('hidden');
      }
    }

    if (dom.verdictEndingTitle) {
      dom.verdictEndingTitle.textContent = outcome.endingTitle;
    }
    if (dom.verdictEndingSummary) {
      dom.verdictEndingSummary.textContent = outcome.summary;
    }
    if (dom.verdictMethodReveal) {
      dom.verdictMethodReveal.textContent = outcome.methodReveal || '';
    }
    if (dom.verdictTruthTimeline) {
      dom.verdictTruthTimeline.innerHTML = (outcome.truthTimeline || [])
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join('');
    }
    if (dom.shareCardPreview) {
      dom.shareCardPreview.textContent = outcome.shareCardText || '';
    }
  }

  async function copyShareCardToClipboard() {
    const text = dom.shareCardPreview ? dom.shareCardPreview.textContent : '';
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        showToast('✅ تم نسخ بطاقة النتيجة العربية (بدون حرق للأحداث) لمشاركتها!');
        return;
      }
    } catch (_) {}
    showToast('تم تجهيز بطاقة النتيجة للمشاركة.');
  }

  function buildFullCaseDossierText() {
    const lib = loadLibraryData();
    const career = getDetectiveCareerProfile(lib);
    const outcome = lastRenderedOutcome || gameState.finalVerdictResult || {};
    const bible = gameState.caseBible || {};
    const title = bible.title || gameState.scenarioTitle || 'قضية غامضة';
    const player = gameState.playerName || 'المحقق';
    const starsNum = Number(outcome.stars) || 0;
    const starText = starsNum >= 6 ? '6/6 (نهاية سرية أسطورية)' : `${starsNum}/5`;
    const timelineLines = (outcome.truthTimeline || []).map(item => `- ${item}`);
    const clueLines = (gameState.clues || []).map(c => `- ${c.title}: ${c.description || ''}`);
    const suspectLines = (gameState.suspects || []).map(
      s => `- ${s.name} (${s.role || ''}): ${s.alibiBroken ? '[انكسرت حجته]' : '[قيد التقييم]'} ${s.note || s.alibi || ''}`
    );
    const historyLines = (gameState.history || []).map(
      h => `- الفصل ${h.turn}: ${h.title} (تصرف المحقق: ${h.choice || 'بداية التحقيق'})`
    );

    return [
      `====================================`,
      `ملف التحقيق الجنائي الرسمي | قلب الغموض`,
      `====================================`,
      `القضية: ${title}`,
      `اسم المحقق: ${player} | الرتبة: ${career.icon} ${career.title}`,
      `النتيجة: ${outcome.endingTitle || 'تقرير التحقيق'}`,
      `التقييم: ${starText}`,
      ``,
      `[ملخص الحسم]`,
      outcome.summary || '',
      ``,
      `[التسلسل الزمني للحقيقة]`,
      ...(timelineLines.length ? timelineLines : ['- لم يسجل تسلسل زمني بعد']),
      ``,
      `[الأدلة والقرائن المكتشفة (${clueLines.length})]`,
      ...(clueLines.length ? clueLines : ['- لا توجد أدلة مكتشفة']),
      ``,
      `[المشتبه بهم ونتائج الاستجواب (${suspectLines.length})]`,
      ...(suspectLines.length ? suspectLines : ['- لا توجد إفادات مسجلة']),
      ``,
      `[سجل خطوات التحقيق (${historyLines.length})]`,
      ...(historyLines.length ? historyLines : ['- لا توجد فصول مسجلة'])
    ].join('\n');
  }

  async function copyFullDossierToClipboard() {
    const dossierText = buildFullCaseDossierText();
    if (!dossierText) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(dossierText);
        showToast('📄 تم نسخ ملف التحقيق الرسمي الكامل إلى الحافظة!');
        return;
      }
    } catch (_) {}
    try {
      const ta = document.createElement('textarea');
      ta.value = dossierText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('📄 تم نسخ ملف التحقيق الرسمي الكامل إلى الحافظة!');
      return;
    } catch (_) {}
    showToast('تعذر النسخ التلقائي إلى الحافظة في هذا المتصفح.');
  }

  function openShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (!modal) return;
    lastFocusedElementBeforeModal = document.activeElement;
    modal.classList.remove('hidden');
    const closeBtn = document.getElementById('closeShortcutsBtn');
    if (closeBtn) closeBtn.focus();
  }

  function closeShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (!modal) return;
    modal.classList.add('hidden');
    if (lastFocusedElementBeforeModal && typeof lastFocusedElementBeforeModal.focus === 'function') {
      try {
        lastFocusedElementBeforeModal.focus();
      } catch (_) {}
    }
  }

  /**
   * ============================================================================
   * سجل القضايا والنهايات المكتشفة (#libraryModal: H7 Fix)
   * ============================================================================
   */
  function loadLibraryData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LIBRARY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (_) {}
    return {
      streak: 0,
      unlockedEndingCodes: [],
      cases: {}
    };
  }

  function recordCaseOutcomeInLibrary(bible, outcome) {
    if (!bible || !outcome) return;
    const lib = loadLibraryData();
    const caseId = bible.id || gameState.scenarioId || 'manor';

    if (!Array.isArray(lib.unlockedEndingCodes)) lib.unlockedEndingCodes = [];
    if (!lib.unlockedEndingCodes.includes(outcome.endingCode)) {
      lib.unlockedEndingCodes.push(outcome.endingCode);
    }

    if (outcome.stars >= 3) {
      lib.streak = (Number(lib.streak) || 0) + 1;
    } else {
      lib.streak = 0;
    }

    const prevCase = lib.cases[caseId] || {
      title: bible.title,
      bestStars: 0,
      bestEndingTitle: '',
      unlockedEndings: [],
      lastPlayedAt: ''
    };

    if (!prevCase.unlockedEndings.includes(outcome.endingCode)) {
      prevCase.unlockedEndings.push(outcome.endingCode);
    }
    if ((outcome.stars || 0) >= (prevCase.bestStars || 0)) {
      prevCase.bestStars = outcome.stars || 1;
      prevCase.bestEndingTitle = outcome.endingTitle;
    }
    prevCase.title = bible.title;
    prevCase.lastPlayedAt = new Date().toLocaleDateString('ar-EG');
    lib.cases[caseId] = prevCase;

    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(lib));
    } catch (_) {}
    syncScenarioCardCompletionBadges();
  }

  /**
   * عرض شارات الإنجاز والنهايات المحققة على بطاقات القضايا في القائمة الرئيسية
   */
  function syncScenarioCardCompletionBadges() {
    const lib = loadLibraryData();
    const casesObj = (lib && lib.cases) || {};
    dom.scenarioCards.forEach(card => {
      const scenId = card.dataset.scenario;
      const rec = casesObj[scenId];
      let badge = card.querySelector('.scenario-solved-badge');
      const stars = rec ? Number(rec.bestStars) || 0 : 0;
      if (stars >= 3) {
        if (!badge) {
          badge = document.createElement('div');
          const headerEl = card.querySelector('.scenario-card-header');
          if (headerEl && headerEl.parentNode) {
            headerEl.parentNode.insertBefore(badge, headerEl.nextSibling);
          } else {
            card.appendChild(badge);
          }
        }
        const isMythic = stars >= 6;
        badge.className = `scenario-solved-badge${isMythic ? ' mythic' : ''}`;
        badge.textContent = isMythic
          ? '👑 نهاية أسطورية مكتشفة • ★★★★★★'
          : `✓ قضية محلولة • ${'★'.repeat(stars)}`;
      } else if (badge) {
        badge.remove();
      }
    });
  }

  function calculateDetectiveCareerProfile(lib) {
    const casesObj = (lib && lib.cases) || {};
    let xp = (Number(lib?.streak) || 0) * 40;
    for (const rec of Object.values(casesObj)) {
      const stars = Number(rec.bestStars) || 0;
      xp += stars * 65;
      if (stars >= 6) xp += 250;
      xp += ((rec.unlockedEndings && rec.unlockedEndings.length) || 0) * 35;
    }
    const ranks = [
      { min: 2000, next: 3000, title: '👑 أسطورة قلب الغموض' },
      { min: 1200, next: 2000, title: '🎖️ عميد البصيرة الجنائية' },
      { min: 650, next: 1200, title: '🎖️ رئيس شعبة الاستنتاج' },
      { min: 250, next: 650, title: '🎖️ محقق جنائي أول' },
      { min: 0, next: 250, title: '🎖️ محقق ميداني' }
    ];
    const matched = ranks.find(r => xp >= r.min) || ranks[ranks.length - 1];
    const span = Math.max(1, matched.next - matched.min);
    const progressPct = Math.min(100, Math.max(5, Math.round(((xp - matched.min) / span) * 100)));
    return { xp, nextThreshold: matched.next, progressPct, title: matched.title };
  }

  function getDetectiveCareerProfile(lib) {
    const coreIds = ['daily', 'unknown_land', 'manor', 'station', 'train', 'museum', 'island'];
    const casesObj = (lib && lib.cases) || {};
    let totalStars = 0;
    let solvedCount = 0;
    let mythicCount = 0;
    for (const id of coreIds) {
      const rec = casesObj[id];
      if (!rec) continue;
      const best = Number(rec.bestStars) || 0;
      totalStars += best;
      if (best >= 4) solvedCount += 1;
      if (best >= 6 || (Array.isArray(rec.unlockedEndings) && rec.unlockedEndings.some(c => /MYTHIC/i.test(c)))) {
        mythicCount += 1;
      }
    }
    const tiers = [
      { min: 28, title: 'أسطورة التحقيق', icon: '👑', nextStars: 42 },
      { min: 20, title: 'رئيس المباحث', icon: '⚖️', nextStars: 28 },
      { min: 12, title: 'مفتش جنائي', icon: '🎖️', nextStars: 20 },
      { min: 5, title: 'محقق ميداني', icon: '🕵️', nextStars: 12 },
      { min: 0, title: 'محقق مبتدئ', icon: '🔎', nextStars: 5 }
    ];
    const matched = tiers.find(t => totalStars >= t.min) || tiers[tiers.length - 1];
    return {
      title: matched.title,
      icon: matched.icon,
      nextStars: matched.nextStars,
      totalStars,
      solvedCount,
      mythicCount
    };
  }

  function renderDetectiveCareerUI(libInput = null) {
    const lib = libInput || loadLibraryData();
    const xpProf = calculateDetectiveCareerProfile(lib);
    const starProf = getDetectiveCareerProfile(lib);

    const heroBadge = document.getElementById('detectiveCareerBadge');
    if (heroBadge) {
      heroBadge.textContent = `${starProf.icon} ${starProf.title} • ${starProf.solvedCount}/7 قضايا`;
    }

    const rankEl = document.getElementById('detectiveRankBadge');
    if (rankEl) {
      rankEl.textContent = `${starProf.icon} ${starProf.title} (${xpProf.xp} XP)`;
    }

    const libRankEl = document.getElementById('libCareerRankTitle');
    const libXpEl = document.getElementById('libCareerXpLabel');
    const libFillEl = document.getElementById('libCareerXpFill');
    const libBannerEl = document.getElementById('libraryCareerBanner');
    if (libRankEl) libRankEl.textContent = `${starProf.icon} ${starProf.title}`;
    if (libXpEl) libXpEl.textContent = `${starProf.totalStars} / ${starProf.nextStars} ★ (${xpProf.xp} XP)`;
    if (libFillEl) {
      const pct = Math.min(100, Math.max(6, Math.round((starProf.totalStars / Math.max(1, starProf.nextStars)) * 100)));
      libFillEl.style.width = `${pct}%`;
    }
    if (libBannerEl) {
      libBannerEl.textContent = `حسمت ${starProf.solvedCount} / 7 قضايا • ${starProf.totalStars} نجمة • ${starProf.mythicCount} آثار أسطورية`;
    }
  }

  function updateHeaderStreakBadge() {
    const lib = loadLibraryData();
    if (dom.dailyStreakBadge) {
      dom.dailyStreakBadge.textContent = `🔥 ${lib.streak || 0}`;
    }
    renderDetectiveCareerUI(lib);
  }

  function openLibraryModal() {
    if (!dom.libraryModal) return;
    lastFocusedElementBeforeModal = document.activeElement;
    const lib = loadLibraryData();
    const allCaseIds = ['multiverse', 'daily', 'unknown_land', 'manor', 'station', 'train', 'museum', 'island'];
    const solvedCount = allCaseIds.filter(id => lib.cases[id] && lib.cases[id].bestStars >= 3).length;

    renderDetectiveCareerUI(lib);

    if (dom.libSolvedCasesCount) {
      dom.libSolvedCasesCount.textContent = `${solvedCount} / ${allCaseIds.length}`;
    }
    if (dom.libUnlockedEndingsCount) {
      dom.libUnlockedEndingsCount.textContent = `${(lib.unlockedEndingCodes || []).length} / 6`;
    }
    if (dom.libStreakCount) {
      dom.libStreakCount.textContent = `🔥 ${lib.streak || 0}`;
    }

    if (dom.libraryCasesGrid) {
      dom.libraryCasesGrid.innerHTML = allCaseIds
        .map(id => {
          const preset = SCENARIO_PRESETS[id];
          const record = lib.cases[id];
          const stars = record ? Number(record.bestStars) || 0 : 0;
          const starStr =
            stars >= 6
              ? '👑 ★★★★★★'
              : stars > 0
                ? '★'.repeat(stars) + '☆'.repeat(Math.max(0, 5 - stars))
                : 'لم تحسم بعد';
          const endingText = record ? record.bestEndingTitle : 'افتح القضية لكشف الجاني والدافع';
          const endingsCount = record && record.unlockedEndings ? record.unlockedEndings.length : 0;

          return `
            <div class="lib-case-card ${stars >= 4 ? 'solved' : ''}">
              <div class="lib-case-top">
                <strong>${escapeHtml(preset ? preset.shortTitle : id)}</strong>
                <span class="mono-stat">${escapeHtml(starStr)}</span>
              </div>
              <p>${escapeHtml(endingText)}</p>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;">
                <small>النهايات المفتوحة: ${endingsCount} / 6</small>
                <button type="button" class="notebook-quick-action-btn" data-lib-play-case="${escapeHtml(id)}">▶ ${stars > 0 ? 'أعد اللعب' : 'ابدأ الآن'}</button>
              </div>
            </div>
          `;
        })
        .join('');

      dom.libraryCasesGrid.querySelectorAll('[data-lib-play-case]').forEach(btn => {
        btn.addEventListener('click', () => {
          const cid = btn.getAttribute('data-lib-play-case');
          closeLibraryModal();
          selectScenarioById(cid);
          startNewAdventure();
        });
      });
    }

    dom.libraryModal.classList.remove('hidden');
  }

  function closeLibraryModal() {
    if (!dom.libraryModal) return;
    dom.libraryModal.classList.add('hidden');
    if (lastFocusedElementBeforeModal && typeof lastFocusedElementBeforeModal.focus === 'function') {
      try {
        lastFocusedElementBeforeModal.focus();
      } catch (_) {}
    }
  }

  /**
   * عرض شاشة التويست الدرامية عند انكشاف سر مشروط بالأدلة
   */
  function triggerDramaticTwistOverlay(headline, subtext) {
    return new Promise(resolve => {
      audioEngine.playTwistSound();
      dom.twistOverlayTitle.textContent = headline;
      dom.twistOverlaySub.textContent = subtext || 'تتكشف الخيوط الجنائية الآن...';
      dom.twistOverlay.classList.remove('hidden');

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        activeTwistResolver = null;
        dom.twistOverlay.classList.add('hidden');
        resolve();
      };

      activeTwistResolver = finish;
      setTimeout(finish, 2600);
    });
  }

  function dismissTwistOverlayEarly() {
    if (typeof activeTwistResolver === 'function') {
      activeTwistResolver();
    } else {
      dom.twistOverlay.classList.add('hidden');
    }
  }

  /**
   * إدارة شاشة التحميل السينمائي متعدد اللقطات وعرض طاقم المشتبه بهم
   */
  function setLoadingState(loading) {
    isLoadingTurn = loading;
    dom.aiLoadingBox.classList.toggle('hidden', !loading);
    const buttons = dom.choicesGrid.querySelectorAll('button');
    buttons.forEach(b => (b.disabled = loading));
    dom.customActionInput.disabled = loading;

    clearInterval(loadingCycleInterval);
    clearInterval(preloadProgressInterval);

    if (loading) {
      const nextChap = (gameState.turn || 0) + 1;
      const caseTitle = gameState.scenarioTitle || gameState.caseBible?.title || 'مسرح الجريمة';
      const sceneTagEl = document.getElementById('cinemaLoaderSceneTag');
      const caseTagEl = document.getElementById('cinemaLoaderCaseTag');
      const castStripEl = document.getElementById('cinemaCastStrip');

      if (sceneTagEl) {
        sceneTagEl.textContent = `🎬 الفصل 0${nextChap} • اللقطة قيد الإخراج`;
      }
      if (caseTagEl) {
        caseTagEl.textContent = caseTitle;
      }
      if (dom.loadingTitle) {
        dom.loadingTitle.textContent =
          nextChap === 1
            ? `يرتفع الستار الآن على «${caseTitle}»...`
            : `يتغير المشهد في الفصل ${nextChap} استجابة لقرارك الاستقصائي...`;
      }
      if (dom.loadingSub) {
        dom.loadingSub.textContent =
          'إضاءة مسرح الحدث، وتحريك المشتبه بهم في مواضعهم، ومزامنة التمثيل الصوتي الدرامي';
      }

      if (castStripEl) {
        const suspects = gameState.suspects?.length
          ? gameState.suspects
          : gameState.caseBible?.suspects || [];
        castStripEl.innerHTML = suspects
          .slice(0, 3)
          .map(
            (s, i) => `
          <div class="cinema-cast-card">
            <div class="cinema-cast-avatar">${i === 0 ? '🕵️' : i === 1 ? '🎭' : '🕯️'}</div>
            <div class="cinema-cast-info">
              <strong>${escapeHtml(s.name)}</strong>
              <small>${escapeHtml(s.role)} • 🎙️ صوت مستقل</small>
            </div>
          </div>`
          )
          .join('');
      }

      updateSegmentedPreloadProgress(14);

      let quoteIdx = Math.floor(Math.random() * MYSTERY_LOADING_QUOTES.length);
      if (dom.loadingMysteryQuote) {
        dom.loadingMysteryQuote.textContent = MYSTERY_LOADING_QUOTES[quoteIdx];
      }

      preloadProgressInterval = setInterval(() => {
        if (currentPreloadPercent < 42) {
          updateSegmentedPreloadProgress(currentPreloadPercent + 7);
        } else if (currentPreloadPercent < 76) {
          updateSegmentedPreloadProgress(currentPreloadPercent + 5);
        } else if (currentPreloadPercent < 96) {
          updateSegmentedPreloadProgress(currentPreloadPercent + 2);
        }
      }, 170);

      loadingCycleInterval = setInterval(() => {
        quoteIdx = (quoteIdx + 1) % MYSTERY_LOADING_QUOTES.length;
        if (dom.loadingMysteryQuote) {
          dom.loadingMysteryQuote.textContent = MYSTERY_LOADING_QUOTES[quoteIdx];
        }
      }, 1200);
    }
  }

  function saveGameState() {
    try {
      localStorage.setItem(
        STORAGE_KEY_SAVE,
        JSON.stringify({
          gameState,
          currentTurnData
        })
      );
    } catch (_) {}
  }

  function updateResumeBannerVisibility() {
    if (!dom.resumeSavedBanner) return;
    // F27 Fix: لا نعرض شريط "قضية جارية محفوظة" إذا كانت القضية قد حسمت بالفعل
    if (gameState?.active && !gameState?.caseSolved && currentTurnData && gameState.turn > 0) {
      dom.resumeSavedBanner.classList.remove('hidden');
      if (dom.resumeSavedTitle) {
        dom.resumeSavedTitle.textContent = `${gameState.scenarioTitle || 'قضية غامضة'}، الفصل ${
          gameState.turn
        } (${currentTurnData.chapter_title || 'مشهد جار'})`;
      }
    } else {
      dom.resumeSavedBanner.classList.add('hidden');
    }
  }

  function tryRestoreSavedGame() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SAVE);
      if (!raw) return;
      // تنظيف أي حركات تشكيل أو شرطات طويلة مخزنة في الجلسات السابقة حتى لا تظهر للمستخدم أبدا
      const cleanRaw = raw
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/\s*[\u2014\u2013]\s*/g, '، ');
      const parsed = JSON.parse(cleanRaw);
      if (parsed?.gameState?.active && parsed?.currentTurnData) {
        gameState = parsed.gameState;
        currentTurnData = parsed.currentTurnData;
        ensureGameStateHasLockedBible();
        if (dom.mainWorkspace) dom.mainWorkspace.classList.add('main-menu-mode');
        dom.scenarioScreen.classList.remove('hidden');
        dom.gameStage.classList.add('hidden');
        updateResumeBannerVisibility();
      }
    } catch (_) {}
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = String(message || '')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/\s*[\u2014\u2013]\s*/g, '، ');
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3600);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/\s*[\u2014\u2013]\s*/g, '، ')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
