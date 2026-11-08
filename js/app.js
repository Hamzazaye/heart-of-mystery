/**
 * ============================================================================
 * قلب الغموض : المتحكم الرئيسي باللعبة، الاستنتاج الجنائي، الاستجواب، والنهايات الخمس
 * ============================================================================
 */

(function () {
  const STORAGE_KEY_SETTINGS = 'heart_of_mystery_settings_v2';
  const STORAGE_KEY_SAVE = 'heart_of_mystery_savestate_v2';
  const STORAGE_KEY_THEME = 'heart_of_mystery_theme_v2';
  const STORAGE_KEY_LIBRARY = 'heart_of_mystery_library_v1';
  const SESSION_KEY_BOOTED = 'hom_booted_v2';

  const SCENARIO_PRESETS = {
    daily: {
      id: 'daily',
      title: 'قضية اليوم: لغز التفاحات الثلاث',
      shortTitle: 'قضية اليوم: التفاحات الثلاث',
      teaserVoice:
        '<breath> على ضفة دجلة عند الفجر... تلفظ الأمواج صندوقا مطعما بالصدف يخفي ثلاث تفاحات سمرقندية مختومة بالشمع، وواحد من ثلاثة رجال في سوق الوراقين يخفي حقيقة الليلة الماضية.',
      teaserEmotion: 'همس مريب وترقب',
      prompt:
        'أحقق على ضفة دجلة في بغداد بعد انتشال صندوق خشبي مطعم بالصدف وبداخله ثلاث تفاحات سمرقندية نادرة مختومة بالشمع الأحمر، وتحوم الشبهات حول ثلاثة رجال: بهزاد الوراق، فيروز العطار، وريحان الدليمي.'
    },
    multiverse: {
      id: 'multiverse',
      title: 'عابر العوالم: شذوذ القوانين الكونية',
      shortTitle: 'عابر العوالم (10,000 عالم)',
      teaserVoice:
        '<breath> تنفتح البوابة الزمكانية أمامك... <short pause> في كل قفزة تستيقظ داخل عالم مواز انقلبت فيه قاعدة كونية واحدة، من سلالة الدم الحاكمة إلى طغيان الآلة، وعليك كشف الجاني وفق قوانين ذلك العالم!',
      teaserEmotion: 'رهبة وترقب',
      prompt:
        'أعبر بوابة العوالم الموازية لأحقق في جريمة غامضة داخل عالم تغيرت فيه قاعدة كونية واحدة، حيث تندمج شريعة العالم الجديد مع خيوط مسرح الجريمة.'
    },
    unknown_land: {
      id: 'unknown_land',
      title: 'أرض السراب المجهولة: مدينة النحاس المفقودة',
      shortTitle: 'أرض السراب: مدينة النحاس',
      teaserVoice:
        '<breath> وراء بحر الرمال العظيم ترتفع أسوار مدينة النحاس المفقودة... <short pause> اختفى لوح الإحداثيات الذهبي عند الفجر، وحرفت يد خفية إبرة الإسطرلاب الفلكي الكبير لحبس القافلة إلى الأبد!',
      teaserEmotion: 'رهبة وترقب',
      prompt:
        'تشق بعثتنا الاستكشافية عاصفة رملية حمراء إلى أرض مجهولة وراء حدود الخرائط، حيث نعثر على مدينة النحاس المفقودة. وعند الفجر يختفي لوح الإحداثيات الذهبي من قبة المرصد النحاسي بين ثلاثة مستكشفين: الرحالة سنان بن ماجد، العالمة ياقوت الحميري، والدليل جسار المهري.'
    },
    manor: {
      id: 'manor',
      title: 'قصر آل السهروردي: الوصية المحرمة',
      shortTitle: 'قصر آل السهروردي',
      teaserVoice:
        '<breath> المطر يطرق نوافذ القصر المهجور كأصابع شبحية... وفي جيبك رسالة خطتها يدك المرتجفة تحذرك: لا تثق بمن يدعي أنه أنقذك الليلة!',
      teaserEmotion: 'همس مرعوب وترقب',
      prompt:
        'أستيقظ في مكتبة قصر جبلي معزول ليلة عاصفة ممطرة. في قبضتي مفتاح نحاسي بارد، وعلى الطاولة رسالة خطتها يدي تحذرني: لا تثق بمن يدعي أنه أنقذك الليلة. المحامي نديم السهروردي والطبيبة سلمى الكيلاني والحارس منصور الجبلي داخل القصر، وساعة الحائط متوقفة عند 11:47.'
    },
    station: {
      id: 'station',
      title: 'المحطة القطبية: الصدى التاسع',
      shortTitle: 'المحطة القطبية: الصدى التاسع',
      teaserVoice:
        '<gasp> تحت الجليد القطبي ينكر العلماء إرسال نداء الاستغاثة... غير أن سجل الخادم في القبو الحراري يفضح سرا دفن تحت الصقيع!',
      teaserEmotion: 'صدمة وذهول درامي',
      prompt:
        'أصل إلى محطة أبحاث قطبية تحت الجليد بعد تلقي نداء استغاثة مشفر باسم الصدى التاسع. الدكتور راشد النجدي والمهندسة مريم الهاشمي والضابط طارق العتيبي يتبادلون الإفادات حول إغلاق القبو الحراري B4.'
    },
    train: {
      id: 'train',
      title: 'قطار منتصف الليل: الرحلة 404',
      shortTitle: 'قطار منتصف الليل 404',
      teaserVoice:
        '<short pause> القطار يشق الضباب بلا توقف... اختفى القاضي سليمان خلف باب موصد من الداخل، وكل راكب في العربة يخفي سرا يخشى افتضاحه قبل الفجر.',
      teaserEmotion: 'تساؤل ماكر وتشكيك',
      prompt:
        'يشق قطار فخم ستائر الضباب دون توقف. في المقصورة رقم 7 اختفى القاضي سليمان العلام خلف باب موصد بالسلسلة من الداخل، تاركا رائحة لوز مر. السكرتيرة ليلى الموصلي، العقيد فريد الشذر، والسائق عمران الحلبي هم المشتبه بهم.'
    },
    museum: {
      id: 'museum',
      title: 'متحف الإسكندرية الغارق: المخطوطة السابعة',
      shortTitle: 'متحف الإسكندرية الغارق',
      teaserVoice:
        '<breath> ثلاثون مترا تحت أمواج بحر الإسكندرية... سقط كبير المرممين الأستاذ يونس فاقدا للوعي داخل الخزانة الزجاجية، واختفت المخطوطة السابعة خلف كاميرات تلاعب الفاعل بتوقيتها!',
      teaserEmotion: 'رهبة وترقب',
      prompt:
        'في جناح زجاجي شيد تحت قاع بحر الإسكندرية، يعثر الغواصون على كبير المرممين الأستاذ يونس فاقدا للوعي داخل الخزانة المفرغة من الهواء، وقد رسم بأنفاسه الأخيرة رمزا غامضا على الزجاج قبل اختفاء المخطوطة السابعة وسط الدكتورة سلمى الإسكندراني، الغواص كمال البحيري، والمؤرخ زياد الفاروقي.'
    },
    island: {
      id: 'island',
      title: 'جزيرة الضباب الأسود: المحكمة الأخيرة',
      shortTitle: 'جزيرة الضباب الأسود',
      teaserVoice:
        '<sigh> تلتهم النيران قارب النجاة الوحيد في المرفأ... وفي قلب الفنار ينطلق صوت بارد من المذياع ليحاكم الجميع على غرق السفينة أوريون!',
      teaserEmotion: 'تحذير حاد',
      prompt:
        'تجمع رسائل مجهولة شهود الماضي داخل فنار صخري معزول وسط البحر. وعند منتصف الليل ينطلق صوت عبر المذياع ليحاكم الدكتور مازن الغساني، الصحفية رنا المقدسي، والقبطان سليم النوخذة على جريمة غرق السفينة أوريون.'
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

    loadSettingsFromStorage();
    initWeatherParticleSystem();
    bindEvents();
    tryRestoreSavedGame();
    updateHeaderStreakBadge();

    // عرض تدرج الصعوبة الأسبوعي لقضية اليوم (Weekly Difficulty Ramp)
    if (window.MysteryCaseBibles && typeof window.MysteryCaseBibles.getWeeklyDifficultyProfile === 'function') {
      const ramp = window.MysteryCaseBibles.getWeeklyDifficultyProfile();
      const dailyBadge = document.querySelector('.scenario-card[data-scenario="daily"] .case-difficulty-badge');
      if (dailyBadge && ramp) {
        dailyBadge.textContent = `⚡ ${ramp.stars} • ${ramp.label}`;
      }
    }

    initViralAndMonetizationFeatures();
    runInitialBootPreloader();
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
      if (proHeaderBadgeLabel) {
        proHeaderBadgeLabel.textContent = active ? 'عضوية المحقق الأعلى ✓' : 'استوديو الانتشار والمحقق الأعلى';
      }
      if (proStatusPill) {
        proStatusPill.textContent = active ? '👑 عضوية المحقق الأعلى مفعلة' : 'الباقة المجانية نشطة';
      }
    };

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
        const msg = `🌀 أتحداك في طور عابر العوالم (${pendingMultiverseCombo ? pendingMultiverseCombo.mergedTitle : 'شذوذ القوانين الكونية'})! هل تستطيع كشف الجاني في هذا العالم الموازي؟\n${url}`;
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
        if (dom.multiverseRollTitleText && pendingMultiverseCombo) {
          dom.multiverseRollTitleText.textContent = pendingMultiverseCombo.mergedTitle;
        }
        if (SCENARIO_PRESETS.multiverse && pendingMultiverseCombo) {
          SCENARIO_PRESETS.multiverse.title = `عابر العوالم: ${pendingMultiverseCombo.mergedTitle}`;
          SCENARIO_PRESETS.multiverse.teaserVoice = pendingMultiverseCombo.mergedTeaser;
          SCENARIO_PRESETS.multiverse.prompt = pendingMultiverseCombo.mergedPrompt;
        }
        selectScenarioById('multiverse');
        setTimeout(() => {
          showToast(`🔗 تم فتح تحدي العالم الموازي المشترك معك: ${pendingMultiverseCombo.mergedTitle}`);
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
   * شاشة التمهيد السينمائية: بدون أي استدعاء شبكي للصوت عند الفتح لمنع HTTP 429 نهائيا (C5 Fix)
   */
  async function runInitialBootPreloader() {
    if (!dom.appPreloader) {
      await checkServerManagedKey();
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
      }, 360);
    };

    if (dom.skipPreloaderBtn) {
      dom.skipPreloaderBtn.addEventListener('click', dismissPreloader, { once: true });
    }

    const setBootProgress = (pct, subText) => {
      if (dom.bootProgressBar) dom.bootProgressBar.style.width = `${pct}%`;
      if (dom.bootPercentText) dom.bootPercentText.textContent = `${pct}%`;
      if (subText && dom.bootStatusSub) dom.bootStatusSub.textContent = subText;
    };

    setBootProgress(48, 'تهيئة الخطوط الروائية وملفات التحقيق...');
    if (document.fonts && document.fonts.ready) {
      await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 180))]);
    }
    if (dom.bootCheckFonts) {
      dom.bootCheckFonts.classList.remove('active');
      dom.bootCheckFonts.classList.add('done');
    }
    if (dom.bootCheckApi) dom.bootCheckApi.classList.add('active');

    setBootProgress(82, 'التحقق من ملفات القضايا الجنائية...');
    await Promise.race([checkServerManagedKey(), new Promise(r => setTimeout(r, 240))]);
    if (dom.bootCheckApi) {
      dom.bootCheckApi.classList.remove('active');
      dom.bootCheckApi.classList.add('done');
    }
    if (dom.bootCheckAudio) dom.bootCheckAudio.classList.add('active');

    setBootProgress(100, 'اكتمل تجهيز عالم "قلب الغموض" بنجاح!');
    if (dom.bootCheckAudio) {
      dom.bootCheckAudio.classList.remove('active');
      dom.bootCheckAudio.classList.add('done');
    }

    setTimeout(dismissPreloader, 160);
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
    if (dom.multiverseRollTitleText && pendingMultiverseCombo) {
      dom.multiverseRollTitleText.textContent = `${pendingMultiverseCombo.law.title} × ${pendingMultiverseCombo.catalyst.title}`;
    }
    if (SCENARIO_PRESETS.multiverse && pendingMultiverseCombo) {
      SCENARIO_PRESETS.multiverse.teaserVoice = `<breath> عالم مواز جديد جاهز للقفزة... <short pause> قانون هذا العالم: ${pendingMultiverseCombo.law.title}، حيث ${pendingMultiverseCombo.law.rule} <gasp> وعقدة الجريمة: ${pendingMultiverseCombo.catalyst.title}!`;
      SCENARIO_PRESETS.multiverse.prompt = `عالم مواز يحكمه قانون (${pendingMultiverseCombo.law.title}: ${pendingMultiverseCombo.law.rule})، ومسرح الجريمة فيه: (${pendingMultiverseCombo.catalyst.title}: ${pendingMultiverseCombo.catalyst.scene}).`;
    }
    if (selectedScenarioId === 'multiverse' && dom.heroDynamicLead && pendingMultiverseCombo) {
      dom.heroDynamicLead.textContent = `في هذا العالم الموازي: ${pendingMultiverseCombo.law.rule} وتقذفك البوابة الزمكانية إلى ${pendingMultiverseCombo.catalyst.scene}`;
    }
    if (announceToast && pendingMultiverseCombo) {
      showToast(`🌀 تم دمج عالم جديد: ${pendingMultiverseCombo.law.title} × ${pendingMultiverseCombo.catalyst.title}`);
    }
    return pendingMultiverseCombo;
  }

  function bindEvents() {
    rollAndPreviewMultiverseCard(false);

    // اختيار ملف القضية في القائمة الرئيسية (بدون أي استدعاء TTS تلقائي لمنع 429)
    const selectScenarioById = scenId => {
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

      // تحديث الهيرو السينمائي لحظيا ليعرض تفاصيل القضية المختارة مثل منصات الألعاب الكبرى
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
        if (dom.heroDynamicLead) {
          if (scenId === 'multiverse' && pendingMultiverseCombo) {
            dom.heroDynamicLead.textContent = `في هذا العالم الموازي: ${pendingMultiverseCombo.law.rule} وتقذفك البوابة الزمكانية إلى ${pendingMultiverseCombo.catalyst.scene}`;
          } else if (cardLead) {
            dom.heroDynamicLead.textContent = cardLead;
          }
        }
      }

      if (audioEngine.ambientEnabled) {
        audioEngine.startAmbientEnvironment(scenId);
      }
      if (typeof window.__restartWeatherLoop === 'function') {
        window.__restartWeatherLoop();
      }
    };

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
              if (card.dataset.scenario === gameState.scenarioId) {
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

      if (e.key === 'Escape') {
        if (!dom.twistOverlay.classList.contains('hidden')) {
          dismissTwistOverlayEarly();
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
        const activeModal =
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

      if (
        isTyping ||
        !dom.settingsModal.classList.contains('hidden') ||
        (dom.verdictModal && !dom.verdictModal.classList.contains('hidden')) ||
        (dom.libraryModal && !dom.libraryModal.classList.contains('hidden'))
      ) {
        return;
      }
      if (dom.gameStage.classList.contains('hidden') || isLoadingTurn) return;

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
    if (!gameState.caseBible || !gameState.caseBible.culpritId) {
      gameState.caseBible = window.MysteryCaseBibles.getLockedCaseBible(
        gameState.scenarioId || selectedScenarioId,
        gameState.scenarioPrompt || '',
        gameState.playerName || 'آدم'
      );
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

      // F01 Fix: في الفصل الافتتاحي الأول، يبدأ اللاعب بدليل واحد فقط (c1)، ويكتسب الدليل الثاني (c2) عبر فحص التفصيل المريب أو قرارات التحقيق!
      if (!isOpeningTurn && turnData.new_clue && turnData.new_clue.title) {
        addClueToGameState(turnData.new_clue);
      } else if (isOpeningTurn && turnData.new_clue && turnData.new_clue.title && turnData.suspicious_hotspot) {
        if (!turnData.suspicious_hotspot.clue_id && turnData.new_clue.id) {
          turnData.suspicious_hotspot.clue_id = turnData.new_clue.id;
        }
        if (!turnData.suspicious_hotspot.bonus_clue) {
          turnData.suspicious_hotspot.bonus_clue = turnData.new_clue.title;
        }
      }

      // إعادة بناء الخيارات الثلاثة بناء على الأدلة الفعلية الموجودة في حوزة المحقق الآن (F14 Fix)
      if (aiEngine && typeof aiEngine.buildEvidenceAwareChoices === 'function') {
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
            s => s.id === tw.id || s.title === tw.headline
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

    paragraphs.forEach(paraText => {
      const p = document.createElement('p');
      p.textContent = paraText;
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
    dom.hotspotRevealText.textContent = `نتيجة الفحص الجنائي: ${hs.secret_reveal}`;
    dom.hotspotRevealBox.classList.remove('hidden');
    dom.inspectHotspotBtn.disabled = true;
    dom.inspectHotspotBtn.textContent = 'تم الفحص الجنائي ✓';

    if (hs.bonus_clue || hs.clue_id) {
      addClueToGameState({
        id: hs.clue_id,
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
          if (dom.interrogateClueSelect) dom.interrogateClueSelect.value = cRef;
          if (dom.linkClueSelect) dom.linkClueSelect.value = cRef;
          if (dom.interrogationBar) {
            dom.interrogationBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (dom.interrogateSuspectSelect) dom.interrogateSuspectSelect.focus();
          }
          showToast('🔍 تم اختيار الدليل للاستجواب والربط الجنائي.');
        });
      });

      dom.quickEvidencePillsGroup.querySelectorAll('[data-quick-suspect]').forEach(btn => {
        btn.addEventListener('click', () => {
          const sRef = btn.getAttribute('data-quick-suspect');
          if (dom.interrogateSuspectSelect) dom.interrogateSuspectSelect.value = sRef;
          if (dom.linkSuspectSelect) dom.linkSuspectSelect.value = sRef;
          if (dom.interrogationBar) {
            dom.interrogationBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (dom.interrogateClueSelect) dom.interrogateClueSelect.focus();
          }
          showToast('🗣️ تم تحديد المشتبه به في منصة الاستجواب.');
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
          </div>
        </li>`
        )
        .join('');

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

    if (filteredSecrets.length === 0) {
      dom.secretList.innerHTML = searchQuery
        ? '<li class="empty-note">لا توجد أسرار تطابق كلمة البحث الحالية.</li>'
        : '<li class="empty-note">الأسرار الكبرى تتكشف عندما تجمع الأدلة المشروطة أو تكسر حجة المشتبه به!</li>';
    } else {
      dom.secretList.innerHTML = filteredSecrets
        .map(
          s => `
        <li class="secret-item">
          <strong>⚡ ${escapeHtml(s.title)}</strong>
          <span>${escapeHtml(s.revelation)}</span>
        </li>`
        )
        .join('');
    }

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
            <strong>${escapeHtml(s.name)}</strong>
            <span class="suspect-status">${escapeHtml(s.trust_level)}</span>
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:4px;">${escapeHtml(
            s.role
          )} • 🎙️ صوت مستقل</div>
          <span>${escapeHtml(s.note)}</span>
          <div class="notebook-item-actions">
            <button type="button" class="notebook-quick-action-btn" data-confront-suspect="${escapeHtml(
              s.id || s.name
            )}">🗣️ واجه ${escapeHtml(s.name)} بدليل</button>
          </div>
        </li>`
        )
        .join('');

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
    if (finalOutcome.endingCode === 'ENDING_1_PERFECT') {
      audioEngine.playClueSound();
    } else {
      audioEngine.playTwistSound();
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

  function renderVerdictOutcomeView(outcome) {
    if (!outcome) return;
    dom.verdictBuilderSection.classList.add('hidden');
    dom.verdictOutcomeBox.classList.remove('hidden');

    if (dom.verdictEndingBadge) {
      dom.verdictEndingBadge.textContent = outcome.endingBadge || outcome.endingCode;
    }
    if (dom.verdictEndingStars) {
      const stars = Math.max(1, Math.min(5, Number(outcome.stars) || 1));
      dom.verdictEndingStars.textContent = '★'.repeat(stars) + '☆'.repeat(5 - stars);
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
  }

  function updateHeaderStreakBadge() {
    const lib = loadLibraryData();
    if (dom.dailyStreakBadge) {
      dom.dailyStreakBadge.textContent = `🔥 ${lib.streak || 0}`;
    }
  }

  function openLibraryModal() {
    if (!dom.libraryModal) return;
    lastFocusedElementBeforeModal = document.activeElement;
    const lib = loadLibraryData();
    const allCaseIds = ['multiverse', 'daily', 'unknown_land', 'manor', 'station', 'train', 'museum', 'island'];
    const solvedCount = allCaseIds.filter(id => lib.cases[id] && lib.cases[id].bestStars >= 3).length;

    if (dom.libSolvedCasesCount) {
      dom.libSolvedCasesCount.textContent = `${solvedCount} / ${allCaseIds.length}`;
    }
    if (dom.libUnlockedEndingsCount) {
      dom.libUnlockedEndingsCount.textContent = `${(lib.unlockedEndingCodes || []).length} / 5`;
    }
    if (dom.libStreakCount) {
      dom.libStreakCount.textContent = `🔥 ${lib.streak || 0}`;
    }

    if (dom.libraryCasesGrid) {
      dom.libraryCasesGrid.innerHTML = allCaseIds
        .map(id => {
          const preset = SCENARIO_PRESETS[id];
          const record = lib.cases[id];
          const stars = record ? record.bestStars : 0;
          const starStr = stars > 0 ? '★'.repeat(stars) + '☆'.repeat(5 - stars) : 'لم تحسم بعد';
          const endingText = record ? record.bestEndingTitle : 'افتح القضية لكشف الجاني والدافع';
          const endingsCount = record && record.unlockedEndings ? record.unlockedEndings.length : 0;

          return `
            <div class="lib-case-card ${stars >= 4 ? 'solved' : ''}">
              <div class="lib-case-top">
                <strong>${escapeHtml(preset ? preset.shortTitle : id)}</strong>
                <span class="mono-stat">${escapeHtml(starStr)}</span>
              </div>
              <p>${escapeHtml(endingText)}</p>
              <small>النهايات المفتوحة في هذا الملف: ${endingsCount} / 5</small>
            </div>
          `;
        })
        .join('');
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
   * إدارة شاشة التحميل المقسم التصاعدي
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
      updateSegmentedPreloadProgress(10);

      let quoteIdx = Math.floor(Math.random() * MYSTERY_LOADING_QUOTES.length);
      if (dom.loadingMysteryQuote) {
        dom.loadingMysteryQuote.textContent = MYSTERY_LOADING_QUOTES[quoteIdx];
      }

      preloadProgressInterval = setInterval(() => {
        if (currentPreloadPercent < 40) {
          updateSegmentedPreloadProgress(currentPreloadPercent + 5);
        } else if (currentPreloadPercent < 72) {
          updateSegmentedPreloadProgress(currentPreloadPercent + 4);
        } else if (currentPreloadPercent < 95) {
          updateSegmentedPreloadProgress(currentPreloadPercent + 1);
        }
      }, 200);

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
