/**
 * ============================================================================
 * قلب الغموض — محرك الصوت السينمائي متعدد المشاعر والبيئات الصوتية الواقعية
 * ============================================================================
 * يدعم:
 * 1. تعدد المشاعر التلقائي للراوي (Multi-Emotion Dynamic Narrator) لكل فقرة وجملة
 *    (همس مرعوب، صدمة وذهول، تحذير حاد، شجن وحزن، تساؤل ساخر، وتصاعد درامي).
 * 2. محرك البيئات الصوتية الواقعية (Real Acoustic Environmental Soundscapes):
 *    - مطر غزير حقيقي بقطرات ماء متناثرة على الزجاج ورعد بعيد (بدون أي ترددات Oscillator)
 *    - رياح عاصفة قطبية واقعية تعصف عبر الممرات الحجرية
 *    - قطار منتصف الليل الإيقاعي على القضبان الحديدية تحت المطر
 * 3. التحميل المسبق المتوازي لمقاطع الصوت بدون حجب واجهة اللعب.
 */

class MysteryAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.currentAudio = null;
    this.currentMediaSource = null;
    this.abortController = null;
    this.speechSessionId = 0;
    this.isSpeaking = false;
    this.isSynthesizing = false;
    this.sfxEnabled = true;
    this.autoTtsEnabled = true;

    // ذاكرة تخزين مؤقت للصوتيات المولدة + تتبع الطلبات الجارية في الخلفية لمنع التكرار
    this.audioCache = new Map();
    this.inflightFetches = new Map();
    this.rateLimitedModels = new Map();

    this.settings = {
      engine: 'gemini-3.8-flash-tts',
      voiceName: 'Charon',
      speed: 1.0,
      autoSpeakReaction: true,
      autoSpeakScene: true,
      ambientMode: 'auto',     // 'auto' | 'rain' | 'wind' | 'train' | 'off'
      ambientVolume: 0.45,
      geminiApiKey: '',
      cloudTtsApiKey: '',
      serverManagedKey: true
    };

    this.onSpeakingStateChange = null;
    this.onSynthesizingStateChange = null;
    this.onActiveParagraphChange = null;
    this.onEmotionShift = null;
    this.onSegmentProgress = null;

    this.ambientEnabled = false;
    this.activeAmbientType = 'rain';
    this.ambientNodes = null;
    this.thunderTimerId = null;
    this.musicTimerId = null;
    this.currentDangerLevel = 15;

    this.waveformCanvas = null;
    this.waveformAnimationId = null;
  }

  /**
   * تهيئة سياق الصوت Web Audio API عند أول تفاعل للمستخدم
   */
  initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * ربط لوحة الموجات الصوتية (Canvas)
   */
  attachWaveformCanvas(canvasElement) {
    this.waveformCanvas = canvasElement;
    this.drawIdleWaveform();
  }

  /**
   * تحديث الإعدادات
   */
  updateSettings(newSettings) {
    if (newSettings.engine === 'gemini-tts') {
      newSettings.engine = 'gemini-3.8-flash-tts';
    }
    this.settings = { ...this.settings, ...newSettings };
    if (typeof newSettings.ambientVolume === 'number') {
      this.setAmbientVolume(newSettings.ambientVolume);
    }
  }

  /**
   * إيقاف أي قراءة صوتية جارية حالياً وإلغاء أي طلبات شبكة قيد الانتظار
   */
  stopSpeaking() {
    this.speechSessionId += 1;

    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch (_) {}
      this.abortController = null;
    }

    if (this.currentMediaSource) {
      try {
        this.currentMediaSource.disconnect();
      } catch (_) {}
      this.currentMediaSource = null;
    }

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.setSynthesizingState(false);
    this.setSpeakingState(false);
    if (typeof this.onActiveParagraphChange === 'function') {
      this.onActiveParagraphChange(-1);
    }
    if (typeof this.onSegmentProgress === 'function') {
      this.onSegmentProgress(null);
    }
  }

  setSynthesizingState(synthesizing, statusMessage = '') {
    this.isSynthesizing = synthesizing;
    if (typeof this.onSynthesizingStateChange === 'function') {
      this.onSynthesizingStateChange(synthesizing, statusMessage);
    }
  }

  setSpeakingState(speaking, activeLabel = '') {
    this.isSpeaking = speaking;
    if (speaking) {
      this.startWaveformAnimation();
    } else {
      this.stopWaveformAnimation();
    }
    if (typeof this.onSpeakingStateChange === 'function') {
      this.onSpeakingStateChange(speaking, activeLabel);
    }
  }

  /**
   * ============================================================================
   * تحليل المشاعر الديناميكي متعدد الطبقات للراوي (Multi-Emotion Analyzer)
   * يحلل كل فقرة أو جملة ليمنح الراوي مشاعر متبدلة وطبيعية بدل النبرة الواحدة (Mono)
   * مع توجيهات speech_metadata.style الدقيقة لنماذج Gemini 3.8 TTS
   * ============================================================================
   */
  deriveChunkEmotionProfile(text, baseEmotion = 'سرد غامض', isReaction = false, chunkIndex = 0, totalChunks = 1) {
    const clean = String(text || '');
    const combined = `${baseEmotion} ${clean}`;

    // 1. صدمة وذهول وانقلاب درامي
    if (
      /صدمة|ذهول|مستحيل|فجأة|صرخ|شهق|دم|جثة|القاتل|خيانة|انفجر|كارثة|مزق|متجمد|!/.test(combined) &&
      (isReaction || /!|فجأة|صدمة|مستحيل|جثة|دم|القاتل|شهق/.test(clean))
    ) {
      return {
        label: 'صدمة وذهول درامي',
        style:
          'gasping, shocked, out of breath, high-tension dramatic mystery revelation with trembling emotional urgency and vivid theatrical inflection',
        tagPrefix: '<gasp> ',
        rateMultiplier: 1.04,
        pitchBrowser: 1.04
      };
    }

    // 2. همس مرعوب وترقب في الظلام
    if (/همس|خلفك|ظل|خطوات|ظلام|صمت|أنفاس|مرعوب|ارتجف|خوف|ببطء|تسلل|بارد|شبح|مريب/.test(clean) || (isReaction && /همس/.test(baseEmotion))) {
      return {
        label: 'همس مرعوب وترقب',
        style:
          'whispers, hushed spine-chilling whisper close to the microphone, filled with creeping dread, shallow breath, and intimate noir suspense',
        tagPrefix: '<breath> ',
        rateMultiplier: 0.95,
        pitchBrowser: 0.82
      };
    }

    // 3. تحذير حاد وخطر داهم
    if (/احذر|خطر|فخ|توقف|إياك|سلاح|قفل|سم|انفجار|يهرب|ينفد|حصار|مغلق|إنذار/.test(clean) || /تحذير|خطر|توتر/.test(baseEmotion)) {
      return {
        label: 'تحذير حاد وتوتر لاهث',
        style:
          'tense, urgent, speaking rapidly with high adrenaline, sharp dramatic warning tone charged with imminent danger',
        tagPrefix: '<heavy breath> ',
        rateMultiplier: 1.05,
        pitchBrowser: 0.96
      };
    }

    // 4. شجن عميق وحزن وندم
    if (/حزن|دموع|ندم|ذكرى|راحل|وداع|بكت|بكى|وحدة|ألم|ماض|اعتراف|غفران|ضائع/.test(clean) || /حزن|شجن|ندم/.test(baseEmotion)) {
      return {
        label: 'شجن عميق وندم',
        style:
          'melancholic, sorrowful, speaking slowly with a heavy sigh, deeply emotional and poignant voice heavy with heartbreak and hidden grief',
        tagPrefix: '<sigh> ',
        rateMultiplier: 0.93,
        pitchBrowser: 0.85
      };
    }

    // 5. تساؤل ساخر وشكوك محقق
    if (/؟|لماذا|كيف|أحقا|غريب|مريب|كذب|خدعة|قناع|سخرية|ابتسامة باردة|لغز|تناقض/.test(clean) || /سخرية|مكر|تساؤل|شك/.test(baseEmotion)) {
      return {
        label: 'تساؤل ماكر وتشكيك',
        style:
          'sarcastic, shrewd, probing detective voice with sharp vocal emphasis on questions, dark irony, and knowing suspicion',
        tagPrefix: '<short pause> ',
        rateMultiplier: 0.99,
        pitchBrowser: 0.91
      };
    }

    // 6. ذروة المشهد في الفقرة الختامية
    if (!isReaction && totalChunks > 1 && chunkIndex === totalChunks - 1) {
      return {
        label: 'تصاعد درامي حاسم',
        style:
          'theatrical cliffhanger narration, slowing down with deep gravitas, intense emotional weight, and dramatic suspense on the final words',
        tagPrefix: '<short pause> ',
        rateMultiplier: 0.97,
        pitchBrowser: 0.87
      };
    }

    // 7. افتتاحية مشهد سينمائي غامر أو رد فعل مباشر
    return {
      label: isReaction ? (baseEmotion || 'همس تفاعلي') : 'سرد سينمائي متدرج',
      style: isReaction
        ? 'vividly expressive, theatrical Arabic mystery narrator reacting directly to the detective with intense emotion and natural vocal dynamics'
        : 'expressive theatrical Arabic mystery actor with rich emotional variation, dynamic pitch inflection, and gripping noir atmosphere',
      tagPrefix: isReaction ? '<breath> ' : '',
      rateMultiplier: 1.0,
      pitchBrowser: 0.9
    };
  }

  /**
   * تقسيم النصوص الطويلة إلى مقاطع قصيرة متتالية لتسريع خروج أول مقطع صوتي
   * وإعطاء كل فقرة/جملة نبرة مشاعر مستقلة
   */
  splitIntoFastSpeechChunks(text) {
    const rawParagraphs = String(text || '')
      .split(/\n+/)
      .map(p => p.trim())
      .filter(Boolean);

    const chunks = [];
    rawParagraphs.forEach((para, pIdx) => {
      if (para.length <= 360) {
        chunks.push({ text: para, paraIndex: pIdx });
      } else {
        const sentences = para.match(/[^.!?؟]+[.!?؟]*/g) || [para];
        let buffer = '';
        for (const s of sentences) {
          const maxLen = 340;
          if ((buffer + ' ' + s).trim().length > maxLen && buffer) {
            chunks.push({ text: buffer.trim(), paraIndex: pIdx });
            buffer = s;
          } else {
            buffer = (buffer + ' ' + s).trim();
          }
        }
        if (buffer.trim()) chunks.push({ text: buffer.trim(), paraIndex: pIdx });
      }
    });
    return chunks.length ? chunks : [{ text: String(text || '').trim(), paraIndex: 0 }];
  }

  /**
   * التحميل المسبق المقسم للصوت في الخلفية: يجهز المقطع الأول فقط لتجنب استهلاك الحصة (429)
   */
  prefetchTurnAudio({ reactionText, emotion, narrativeText }) {
    const activeEngine = this.settings.engine;
    const apiKey = (this.settings.geminiApiKey || '').trim();
    const hasGeminiAccess = Boolean(apiKey || this.settings.serverManagedKey);
    const isGemini38Tts =
      activeEngine === 'gemini-3.8-flash-tts' ||
      activeEngine === 'gemini-3.8-flash-lite-tts' ||
      activeEngine === 'gemini-tts';

    if (!isGemini38Tts || !hasGeminiAccess) return [];

    const modelName =
      activeEngine === 'gemini-3.8-flash-lite-tts'
        ? 'gemini-3.8-flash-lite-tts'
        : 'gemini-3.8-flash-tts';

    const promises = [];

    if (reactionText && this.settings.autoSpeakReaction) {
      const profile = this.deriveChunkEmotionProfile(reactionText, emotion || 'همس مريب', true, 0, 1);
      promises.push(
        this.fetchGemini38AudioBlob(reactionText, profile, true, apiKey, modelName).catch(() => {})
      );
    }

    return promises;
  }

  /**
   * ينتظر فقط تجهيز أول مقطع صوتي جاهز (بحد أقصى 380ms) لكي يبدأ الكلام فوراً بينما تُحمّل بقية المقاطع بالخلفية
   */
  async awaitReactionPreload({ reactionText, emotion, narrativeText, maxWaitMs = 380, onProgress = null }) {
    const promises = this.prefetchTurnAudio({ reactionText, emotion, narrativeText });
    if (!promises.length) {
      if (typeof onProgress === 'function') onProgress(100);
      return;
    }

    let completed = 0;
    const total = promises.length;
    promises.forEach(p => {
      Promise.resolve(p).finally(() => {
        completed += 1;
        if (typeof onProgress === 'function') {
          onProgress(Math.round((completed / total) * 100));
        }
      });
    });

    try {
      await Promise.race([
        Promise.resolve(promises[0]),
        new Promise(resolve => setTimeout(resolve, maxWaitMs))
      ]);
    } catch (_) {}
  }

  /**
   * تشغيل المقاطع الصوتية الجاهزة مع احترام مشاعر كل فقرة (paragraphEmotions)
   * وتجميع فقرات السرد في طلب متعدد النبرات (Multi-Segment speech_metadata) لمنع استنزاف الحصة (429)
   * وضمان أعلى تفاعل درامي دون تقطيع بين الفقرات.
   */
  async speakTurn({ reactionText, emotion, paragraphEmotions = null, narrativeText, forceSpeak = false }) {
    if (!this.autoTtsEnabled && !forceSpeak) return;

    this.stopSpeaking();
    const activeSession = this.speechSessionId;

    const reactionEnabled = Boolean(reactionText && (this.settings.autoSpeakReaction || forceSpeak));
    const narrativeEnabled = Boolean(narrativeText && (this.settings.autoSpeakScene || forceSpeak));
    if (!reactionEnabled && !narrativeEnabled) return;

    const activeEngine = this.settings.engine;
    const apiKey = (this.settings.geminiApiKey || '').trim();
    const hasGeminiAccess = Boolean(apiKey || this.settings.serverManagedKey);
    const isGemini38Tts =
      activeEngine === 'gemini-3.8-flash-tts' ||
      activeEngine === 'gemini-3.8-flash-lite-tts' ||
      activeEngine === 'gemini-tts';
    const modelName =
      activeEngine === 'gemini-3.8-flash-lite-tts'
        ? 'gemini-3.8-flash-lite-tts'
        : 'gemini-3.8-flash-tts';

    const narrativeSegments = [];
    if (narrativeEnabled) {
      const chunks = this.splitIntoFastSpeechChunks(narrativeText);
      chunks.forEach((chunkObj, idx) => {
        const explicitParaEmotion =
          Array.isArray(paragraphEmotions) && paragraphEmotions[chunkObj.paraIndex]
            ? paragraphEmotions[chunkObj.paraIndex]
            : emotion || 'سرد غامض';
        const chunkProfile = this.deriveChunkEmotionProfile(
          chunkObj.text,
          explicitParaEmotion,
          false,
          idx,
          chunks.length
        );
        narrativeSegments.push({
          text: chunkObj.text,
          profile: chunkProfile,
          isReaction: false,
          paraIndex: chunkObj.paraIndex
        });
      });
    }

    const totalLogicalSteps = (reactionEnabled ? 1 : 0) + narrativeSegments.length;

    try {
      // بينما يُنطق رد الفعل التفاعلي القصير، نبدأ بتجهيز المشهد الكامل متعدد المشاعر في الخلفية بطلب واحد!
      let multiNarrativePromise = null;
      if (narrativeSegments.length > 0 && isGemini38Tts && hasGeminiAccess) {
        multiNarrativePromise = this.fetchGemini38MultiTurnAudioBlob(
          narrativeSegments,
          apiKey,
          modelName
        ).catch(() => null);
      }

      if (reactionEnabled) {
        if (this.speechSessionId !== activeSession) return;
        const reactionProfile = this.deriveChunkEmotionProfile(
          reactionText,
          emotion || 'همس مريب',
          true,
          0,
          1
        );

        if (typeof this.onActiveParagraphChange === 'function') {
          this.onActiveParagraphChange(-1);
        }
        if (typeof this.onEmotionShift === 'function' && reactionProfile.label) {
          this.onEmotionShift(reactionProfile.label);
        }
        if (typeof this.onSegmentProgress === 'function') {
          this.onSegmentProgress({
            current: 1,
            total: totalLogicalSteps,
            readyCount: 1,
            label: reactionProfile.label
          });
        }
        if (this.sfxEnabled) {
          this.playReactionCue(reactionProfile.label);
        }

        await this.speakSingleText(reactionText, reactionProfile, true, activeSession);
      }

      if (narrativeSegments.length > 0 && this.speechSessionId === activeSession) {
        if (isGemini38Tts && hasGeminiAccess) {
          const firstSeg = narrativeSegments[0];
          this.initAudioContext();
          this.setSpeakingState(true, `الراوي: ${firstSeg.profile.label}`);

          if (typeof this.onActiveParagraphChange === 'function') {
            this.onActiveParagraphChange(firstSeg.paraIndex);
          }
          if (typeof this.onEmotionShift === 'function') {
            this.onEmotionShift(firstSeg.profile.label);
          }

          let wavBlob = multiNarrativePromise ? await multiNarrativePromise : null;
          if (!wavBlob && this.speechSessionId === activeSession) {
            this.playTapeWarmupCue();
            this.setSynthesizingState(
              true,
              `جاري ضبط الأداء التمثيلي للمشهد (${firstSeg.profile.label})...`
            );
            try {
              wavBlob = await this.fetchGemini38MultiTurnAudioBlob(
                narrativeSegments,
                apiKey,
                modelName
              );
            } finally {
              if (this.speechSessionId === activeSession) {
                this.setSynthesizingState(false);
              }
            }
          }

          if (wavBlob && this.speechSessionId === activeSession) {
            // حساب الأوزان النسبية لكل فقرة لمزامنة إضاءة الفقرات وتبدل شارة المشاعر أثناء الصوت المتصل
            const totalChars = Math.max(
              1,
              narrativeSegments.reduce((acc, s) => acc + s.text.length, 0)
            );
            let accChars = 0;
            const timeline = narrativeSegments.map((seg, idx) => {
              const startRatio = accChars / totalChars;
              accChars += seg.text.length;
              const endRatio = accChars / totalChars;
              return { seg, idx, startRatio, endRatio };
            });

            let lastActiveIdx = -1;
            const updateTimelineHighlight = ratio => {
              const found =
                timeline.find(item => ratio >= item.startRatio && ratio <= item.endRatio) ||
                timeline[timeline.length - 1];
              if (found && found.idx !== lastActiveIdx) {
                lastActiveIdx = found.idx;
                if (typeof this.onActiveParagraphChange === 'function') {
                  this.onActiveParagraphChange(found.seg.paraIndex);
                }
                if (typeof this.onEmotionShift === 'function' && found.seg.profile?.label) {
                  this.onEmotionShift(found.seg.profile.label);
                }
                if (typeof this.onSegmentProgress === 'function') {
                  this.onSegmentProgress({
                    current: (reactionEnabled ? 1 : 0) + found.idx + 1,
                    total: totalLogicalSteps,
                    readyCount: totalLogicalSteps,
                    label: found.seg.profile.label
                  });
                }
              }
            };

            updateTimelineHighlight(0);
            const baseSpeed = Number(this.settings.speed) || 1.0;
            await this.playAudioBlob(wavBlob, baseSpeed, activeSession, updateTimelineHighlight);
            return;
          }
        }

        // الاحتياطي المحلي إذا تعذرت جميع نماذج السحابة الخمسة
        for (let i = 0; i < narrativeSegments.length; i++) {
          if (this.speechSessionId !== activeSession) return;
          const seg = narrativeSegments[i];
          if (typeof this.onActiveParagraphChange === 'function') {
            this.onActiveParagraphChange(seg.paraIndex);
          }
          if (typeof this.onEmotionShift === 'function' && seg.profile?.label) {
            this.onEmotionShift(seg.profile.label);
          }
          if (typeof this.onSegmentProgress === 'function') {
            this.onSegmentProgress({
              current: (reactionEnabled ? 1 : 0) + i + 1,
              total: totalLogicalSteps,
              readyCount: (reactionEnabled ? 1 : 0) + i + 1,
              label: seg.profile.label
            });
          }
          await this.speakSingleText(seg.text, seg.profile, false, activeSession);
        }
      }
    } finally {
      if (this.speechSessionId === activeSession) {
        if (typeof this.onActiveParagraphChange === 'function') {
          this.onActiveParagraphChange(-1);
        }
        if (typeof this.onSegmentProgress === 'function') {
          this.onSegmentProgress(null);
        }
        this.setSpeakingState(false);
      }
    }
  }

  /**
   * نطق نص منفرد عبر المحرك المختار مع تطبيق البصمة العاطفية الخاصة بالمقطع
   */
  async speakSingleText(
    text,
    emotionOrProfile = 'سرد غامض',
    isReaction = false,
    sessionId = null,
    voiceOverride = null
  ) {
    if (!text || !text.trim()) return;

    const profile =
      typeof emotionOrProfile === 'object' && emotionOrProfile !== null
        ? emotionOrProfile
        : this.deriveChunkEmotionProfile(text, String(emotionOrProfile || 'سرد غامض'), isReaction, 0, 1);

    const currentSession = sessionId !== null ? sessionId : ++this.speechSessionId;
    this.initAudioContext();
    this.setSpeakingState(true, `${isReaction ? 'رد فعل صوتي' : 'الراوي'}: ${profile.label}`);

    if (typeof this.onEmotionShift === 'function' && profile.label) {
      this.onEmotionShift(profile.label);
    }

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    try {
      const activeEngine = this.settings.engine;
      const apiKey = (this.settings.geminiApiKey || '').trim();
      const cloudKey = (this.settings.cloudTtsApiKey || apiKey).trim();
      const hasGeminiAccess = Boolean(apiKey || this.settings.serverManagedKey);

      const isGemini38Tts =
        activeEngine === 'gemini-3.8-flash-tts' ||
        activeEngine === 'gemini-3.8-flash-lite-tts' ||
        activeEngine === 'gemini-tts';

      if (isGemini38Tts && hasGeminiAccess) {
        const modelName =
          activeEngine === 'gemini-3.8-flash-lite-tts'
            ? 'gemini-3.8-flash-lite-tts'
            : 'gemini-3.8-flash-tts';

        await this.speakWithGemini38Tts(
          text,
          profile,
          isReaction,
          apiKey,
          modelName,
          signal,
          currentSession,
          voiceOverride
        );
      } else if (activeEngine === 'google-cloud-tts' && cloudKey) {
        const plainText = this.stripInlineVocalTags(text);
        await this.speakWithGoogleCloudTts(plainText, profile, isReaction, cloudKey, signal, currentSession);
      } else {
        const plainText = this.stripInlineVocalTags(text);
        await this.speakWithBrowserTts(plainText, profile, isReaction, currentSession);
      }
    } catch (err) {
      if (err?.name === 'AbortError' || this.speechSessionId !== currentSession) {
        return;
      }
      if (typeof this.onEngineFallbackNotice === 'function') {
        this.onEngineFallbackNotice('محرك النطق المحلي التفاعلي (نشط مؤقتا)');
      }
      try {
        const plainText = this.stripInlineVocalTags(text);
        await this.speakWithBrowserTts(plainText, profile, isReaction, currentSession);
      } catch (_) {}
    } finally {
      if (this.speechSessionId === currentSession) {
        this.setSpeakingState(false);
      }
    }
  }

  /**
   * إرجاع قائمة نماذج الصوت السحابية المتاحة مرتبة حسب الأولوية مع تخطي النماذج المستنفدة مؤقتاً (Per-Model Cooldown)
   */
  getAvailableTtsModelsCascade(preferredModel = 'gemini-3.8-flash-tts') {
    const now = Date.now();
    const baseOrder =
      preferredModel === 'gemini-3.8-flash-lite-tts'
        ? [
            'gemini-3.8-flash-lite-tts',
            'gemini-3.8-flash-tts',
            'gemini-3.1-flash-tts-preview',
            'gemini-2.5-flash-preview-tts',
            'gemini-2.5-pro-preview-tts'
          ]
        : [
            'gemini-3.8-flash-tts',
            'gemini-3.8-flash-lite-tts',
            'gemini-3.1-flash-tts-preview',
            'gemini-2.5-flash-preview-tts',
            'gemini-2.5-pro-preview-tts'
          ];

    const available = baseOrder.filter(m => {
      const until = this.rateLimitedModels.get(m) || 0;
      return now >= until;
    });

    return available.length > 0 ? available : ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
  }

  /**
   * توليد مشهد سردي كامل متعدد الفقرات والنبرات العاطفية في طلب واحد عبر مصفوفة content + speech_metadata.style
   */
  async fetchGemini38MultiTurnAudioBlob(
    segments,
    apiKey,
    modelName = 'gemini-3.8-flash-tts',
    signal = undefined,
    voiceOverride = null
  ) {
    if (!Array.isArray(segments) || segments.length === 0) return null;
    if (segments.length === 1) {
      const s = segments[0];
      return this.fetchGemini38AudioBlob(s.text, s.profile, s.isReaction, apiKey, modelName, signal, voiceOverride);
    }

    const voice = voiceOverride || this.settings.voiceName || 'Charon';
    const contentTurns = segments.map(seg => {
      const profile = seg.profile || this.deriveChunkEmotionProfile(seg.text, 'سرد غامض', false, 0, 1);
      const transcriptWithTags = this.prepareGemini38Transcript(seg.text, profile, Boolean(seg.isReaction));
      const styleInstruction = profile.style || this.getGemini38SpeechStyle(profile.label, Boolean(seg.isReaction));
      return {
        type: 'text',
        text: transcriptWithTags,
        annotations: [
          {
            type: 'speech_metadata',
            style: styleInstruction
          }
        ]
      };
    });

    const cacheKey = `MULTI::${voice}::${contentTurns.map(c => `${c.annotations[0].style}|${c.text}`).join('||')}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey);
    }
    const idbMultiBlob = await this.getPersistedAudioBlob(cacheKey);
    if (idbMultiBlob) {
      this.audioCache.set(cacheKey, idbMultiBlob);
      return idbMultiBlob;
    }
    if (this.inflightFetches.has(cacheKey)) {
      return await this.inflightFetches.get(cacheKey);
    }

    const fetchPromise = (async () => {
      const endpoint = '/api/interactions';
      const ttsModelsOrder = this.getAvailableTtsModelsCascade(modelName);
      const combinedPlainTranscript = contentTurns.map(c => c.text).join('\n\n');

      let response = null;
      for (const candidateTtsModel of ttsModelsOrder) {
        const is38Model = candidateTtsModel.startsWith('gemini-3.8-');
        const requestPayload = is38Model
          ? {
              model: candidateTtsModel,
              input: [
                {
                  type: 'user_input',
                  content: contentTurns
                }
              ],
              response_format: {
                type: 'audio'
              },
              generation_config: {
                speech_config: [{ voice }]
              }
            }
          : {
              model: candidateTtsModel,
              input: combinedPlainTranscript,
              response_format: {
                type: 'audio'
              },
              generation_config: {
                speech_config: [{ voice }]
              }
            };

        response = await fetch(endpoint, {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        if (response.ok) {
          break;
        }
        if (response.status === 429) {
          // تجميد النموذج المستنفد مؤقتاً لمدة 10 دقائق والانتقال فوراً للنموذج السحابي التالي
          this.rateLimitedModels.set(candidateTtsModel, Date.now() + 10 * 60 * 1000);
          continue;
        }
        if (response.status !== 503 && response.status !== 404 && response.status !== 400) {
          break;
        }
      }

      if (!response || !response.ok) {
        const errBody = response ? await response.text() : 'Network Error';
        throw new Error(`Voice HTTP ${response ? response.status : 0}: ${errBody}`);
      }

      const data = await response.json();
      const audioBlock =
        data?.output_audio ||
        data?.outputs?.find(o => o.type === 'audio') ||
        data?.steps
          ?.filter(step => step.type === 'model_output')
          ?.flatMap(step => step.content || [])
          ?.filter(item => item.type === 'audio')
          ?.pop();

      if (!audioBlock || !audioBlock.data) {
        throw new Error('لم يتم استلام بيانات صوتية من الخادم');
      }

      const wavBlob = this.base64AudioToWavBlob(audioBlock.data, audioBlock.mime_type);
      if (this.audioCache.size > 35) {
        const firstKey = this.audioCache.keys().next().value;
        this.audioCache.delete(firstKey);
      }
      this.audioCache.set(cacheKey, wavBlob);
      this.savePersistedAudioBlob(cacheKey, wavBlob);
      return wavBlob;
    })();

    this.inflightFetches.set(cacheKey, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this.inflightFetches.delete(cacheKey);
    }
  }

  /**
   * ذاكرة تخزين صوتية دائمة في المتصفح (IndexedDB) لتقليص استهلاك الحصة اليومية إلى الصفر عند إعادة الاستماع
   */
  openAudioCacheDB() {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    return new Promise(resolve => {
      try {
        const req = indexedDB.open('MysteryAudioCacheDB_v1', 1);
        req.onupgradeneeded = e => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('blobs')) {
            db.createObjectStore('blobs');
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }

  async getPersistedAudioBlob(key) {
    try {
      const db = await this.openAudioCacheDB();
      if (!db) return null;
      return await new Promise(resolve => {
        const tx = db.transaction('blobs', 'readonly');
        const store = tx.objectStore('blobs');
        const getReq = store.get(key);
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      });
    } catch (_) {
      return null;
    }
  }

  async savePersistedAudioBlob(key, blob) {
    try {
      const db = await this.openAudioCacheDB();
      if (!db) return;
      const tx = db.transaction('blobs', 'readwrite');
      tx.objectStore('blobs').put(blob, key);
    } catch (_) {}
  }

  /**
   * جلب وتوليد الملف الصوتي مع ذاكرة تخزين مؤقت (Cache) ودعم تخصيص صوت المشتبه به (voiceOverride)
   * وتمرير توجيهات التمثيل الصوتي (speech_metadata.style) لنماذج Gemini 3.8 TTS
   */
  async fetchGemini38AudioBlob(
    text,
    profileOrEmotion,
    isReaction,
    apiKey,
    modelName = 'gemini-3.8-flash-tts',
    signal = undefined,
    voiceOverride = null
  ) {
    const profile =
      typeof profileOrEmotion === 'object' && profileOrEmotion !== null
        ? profileOrEmotion
        : this.deriveChunkEmotionProfile(text, String(profileOrEmotion || ''), isReaction, 0, 1);

    const voice = voiceOverride || this.settings.voiceName || 'Charon';
    const transcriptWithTags = this.prepareGemini38Transcript(text, profile, isReaction);
    const speechStyle = profile.style || this.getGemini38SpeechStyle(profile.label, isReaction);
    const cacheKey = `${voice}::${profile.label}::${isReaction ? 'R' : 'S'}::${transcriptWithTags}`;

    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey);
    }

    const idbSingleBlob = await this.getPersistedAudioBlob(cacheKey);
    if (idbSingleBlob) {
      this.audioCache.set(cacheKey, idbSingleBlob);
      return idbSingleBlob;
    }

    if (this.inflightFetches.has(cacheKey)) {
      return await this.inflightFetches.get(cacheKey);
    }

    const fetchPromise = (async () => {
      // الاتصال حصرياً عبر الخادم الآمن (/api/interactions) حيث يُحقن GEMINI_API_KEY في بيئة Cloudflare المشفرة دون كشفه في المتصفح
      const endpoint = '/api/interactions';
      const ttsModelsOrder = this.getAvailableTtsModelsCascade(modelName);

      let response = null;
      for (const candidateTtsModel of ttsModelsOrder) {
        const is38Model = candidateTtsModel.startsWith('gemini-3.8-');
        const requestPayload = is38Model
          ? {
              model: candidateTtsModel,
              input: [
                {
                  type: 'user_input',
                  content: [
                    {
                      type: 'text',
                      text: transcriptWithTags,
                      annotations: [
                        {
                          type: 'speech_metadata',
                          style: speechStyle
                        }
                      ]
                    }
                  ]
                }
              ],
              response_format: {
                type: 'audio'
              },
              generation_config: {
                speech_config: [
                  {
                    voice
                  }
                ]
              }
            }
          : {
              model: candidateTtsModel,
              input: transcriptWithTags,
              response_format: {
                type: 'audio'
              },
              generation_config: {
                speech_config: [
                  {
                    voice
                  }
                ]
              }
            };

        response = await fetch(endpoint, {
          method: 'POST',
          signal,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload)
        });

        if (response.ok) {
          break;
        }
        if (response.status === 429) {
          // تجميد النموذج المستنفد مؤقتاً لمدة 10 دقائق والانتقال فوراً للنموذج السحابي التالي دون تعطيل الصوت السحابي
          this.rateLimitedModels.set(candidateTtsModel, Date.now() + 10 * 60 * 1000);
          continue;
        }
        if (response.status !== 503 && response.status !== 404 && response.status !== 400) {
          break;
        }
      }

      if (!response || !response.ok) {
        if (typeof this.onEngineFallbackNotice === 'function') {
          this.onEngineFallbackNotice('محرك النطق المحلي التفاعلي (نشط مؤقتا)');
        }
        const errBody = response ? await response.text() : 'Network Error';
        throw new Error(`Voice HTTP ${response ? response.status : 0}: ${errBody}`);
      }

      const data = await response.json();
      const audioBlock =
        data?.output_audio ||
        data?.outputs?.find(o => o.type === 'audio') ||
        data?.steps
          ?.filter(step => step.type === 'model_output')
          ?.flatMap(step => step.content || [])
          ?.filter(item => item.type === 'audio')
          ?.pop();

      if (!audioBlock || !audioBlock.data) {
        throw new Error('لم يتم استلام بيانات صوتية من الخادم');
      }

      const wavBlob = this.base64AudioToWavBlob(audioBlock.data, audioBlock.mime_type);
      if (this.audioCache.size > 35) {
        const firstKey = this.audioCache.keys().next().value;
        this.audioCache.delete(firstKey);
      }
      this.audioCache.set(cacheKey, wavBlob);
      this.savePersistedAudioBlob(cacheKey, wavBlob);
      return wavBlob;
    })();

    this.inflightFetches.set(cacheKey, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this.inflightFetches.delete(cacheKey);
    }
  }

  /**
   * تشغيل الصوت التمثيلي مع تعديل السرعة التعبيرية الدقيقة لكل شعور
   */
  async speakWithGemini38Tts(
    text,
    profile,
    isReaction,
    apiKey,
    modelName = 'gemini-3.8-flash-tts',
    signal = undefined,
    sessionId = 0,
    voiceOverride = null
  ) {
    const voice = voiceOverride || this.settings.voiceName || 'Charon';
    const transcriptWithTags = this.prepareGemini38Transcript(text, profile, isReaction);
    const cacheKey = `${voice}::${profile.label}::${isReaction ? 'R' : 'S'}::${transcriptWithTags}`;
    const isCached = this.audioCache.has(cacheKey);

    if (!isCached) {
      this.playTapeWarmupCue();
      this.setSynthesizingState(
        true,
        `جاري ضبط النبرة الصوتية (${profile.label}) وتنقية الشريط...`
      );
    }

    let wavBlob;
    try {
      wavBlob = await this.fetchGemini38AudioBlob(
        text,
        profile,
        isReaction,
        apiKey,
        modelName,
        signal,
        voiceOverride
      );
    } finally {
      if (this.speechSessionId === sessionId) {
        this.setSynthesizingState(false);
      }
    }

    if (this.speechSessionId !== sessionId) return;
    const baseSpeed = Number(this.settings.speed) || 1.0;
    const expressiveSpeed = Math.min(1.45, Math.max(0.75, baseSpeed * (profile.rateMultiplier || 1.0)));
    await this.playAudioBlob(wavBlob, expressiveSpeed, sessionId);
  }

  getGemini38SpeechStyle(emotion = '', isReaction = false) {
    if (emotion.includes('همس')) {
      return 'whispered urgently, mysterious, hushed and suspenseful tone';
    }
    if (emotion.includes('صدمة') || emotion.includes('ذهول')) {
      return 'shocked, breathless, dramatic plot twist revelation with intense emotion';
    }
    if (emotion.includes('تحذير') || emotion.includes('خطر')) {
      return 'tense, urgent warning tone, serious and suspenseful';
    }
    if (emotion.includes('شجن') || emotion.includes('حزن')) {
      return 'melancholic, sorrowful, deeply emotional and poignant tone';
    }
    if (emotion.includes('سخرية') || emotion.includes('ماكر')) {
      return 'calm, enigmatic, subtly ironic and mysterious detective tone';
    }
    if (isReaction) {
      return 'expressive, mysterious, dramatic narrator reaction';
    }
    return 'expressive Arabic mystery actor with rich emotional variation and dramatic suspense';
  }

  /**
   * مُشكِّل الحركات الأساسية الذكي (Essential Arabic Diacritizer for Accurate Pronunciation)
   * يضيف التشكيل الصوتي الأساسي على الأفعال المبنية للمجهول، المصطلحات الجنائية، الكلمات المتشابهة رسماً،
   * وأسماء الشخصيات والأماكن لضمان نطق عربي سليم وفصيح في جميع محركات النطق.
   */
  applyEssentialArabicDiacritics(rawText) {
    if (!rawText) return '';
    let t = String(rawText);

    const lexicon = [
      // الأفعال المبنية للمجهول والكلمات التي يتغير معناها بدون تشكيل
      ['وجدت', 'وُجِدَتْ'],
      ['وجد', 'وُجِدَ'],
      ['عثر', 'عُثِرَ'],
      ['قتل', 'قُتِلَ'],
      ['سرقت', 'سُرِقَتْ'],
      ['سرق', 'سُرِقَ'],
      ['أغلق', 'أُغْلِقَ'],
      ['أغلقت', 'أُغْلِقَتْ'],
      ['فتحت', 'فُتِحَتْ'],
      ['فتح', 'فُتِحَ'],
      ['كتبت', 'كُتِبَتْ'],
      ['كتب', 'كُتِبَ'],
      ['خبئت', 'خُبِّئَتْ'],
      ['خبئ', 'خُبِّئَ'],
      ['انتشل', 'انْتُشِلَ'],
      ['سمع', 'سُمِعَ'],
      ['قطع', 'قُطِعَ'],
      ['كسر', 'كَسْرِ'],
      ['انكسرت', 'انْكَسَرَتْ'],
      // المصطلحات الجنائية والاستقصائية الأساسية
      ['المحقق', 'المُحَقِّقُ'],
      ['محقق', 'مُحَقِّقٌ'],
      ['المشتبه بهم', 'المُشْتَبَهُ بِهِمْ'],
      ['المشتبه به', 'المُشْتَبَهُ بِهِ'],
      ['الجاني', 'الجَانِي'],
      ['الدليل القاطع', 'الدَّلِيلُ القَاطِعُ'],
      ['الدليل', 'الدَّلِيلُ'],
      ['الأدلة', 'الأَدِلَّةِ'],
      ['حجة غيابه', 'حُجَّةُ غِيَابِهِ'],
      ['حجة الغياب', 'حُجَّةُ الغِيَابِ'],
      ['مسرح الجريمة', 'مَسْرَحِ الجَرِيمَةِ'],
      ['غرفة الاتهام', 'غُرْفَةِ الاتِّهَامِ'],
      ['الوصية', 'الوَصِيَّةِ'],
      ['المخطوطة', 'المَخْطُوطَةِ'],
      ['الخزانة', 'الخِزَانَةِ'],
      ['المقصورة', 'المَقْصُورَةِ'],
      ['البوصلة', 'البَوْصَلَةِ'],
      ['الإسطرلاب', 'الإِسْطُرْلَابِ'],
      ['أرض السراب المجهولة', 'أَرْضِ السَّرَابِ المَجْهُولَةِ'],
      ['أرض مجهولة', 'أَرْضٍ مَجْهُولَةٍ'],
      ['مدينة النحاس', 'مَدِينَةِ النُّحَاسِ'],
      ['قصر آل السهروردي', 'قَصْرِ آلِ السَّهْرَوَرْدِيِّ'],
      ['المحطة القطبية', 'المَحَطَّةِ القُطْبِيَّةِ'],
      ['الصدى التاسع', 'الصَّدَى التَّاسِعِ'],
      ['سوق الوراقين', 'سُوقِ الوَرَّاقِينَ'],
      ['التفاحات الثلاث', 'التُّفَّاحَاتِ الثَّلَاثِ'],
      ['جزيرة الضباب', 'جَزِيرَةِ الضَّبَابِ'],
      ['السفينة أوريون', 'السَّفِينَةِ أُورْيُون'],
      ['سفينة أوريون', 'سَفِينَةِ أُورْيُون'],
      // أسماء الشخصيات والأعلام في جميع القضايا لضبط النطق الصوتي السليم داخلياً فقط
      ['بهزاد الوراق', 'بِهْزَادُ الوَرَّاقُ'],
      ['فيروز العطار', 'فَيْرُوزُ العَطَّارُ'],
      ['ريحان الحارس', 'رَيْحَانُ الحَارِسُ'],
      ['عمران النحاس', 'عِمْرَانُ النَّحَّاسُ'],
      ['عمران', 'عِمْرَانُ'],
      ['جمانة الفلكية', 'جُمَانَةُ الفَلَكِيَّةُ'],
      ['جمانة', 'جُمَانَةُ'],
      ['سلافة الحارسة', 'سُلَافَةُ الحَارِسَةُ'],
      ['سلافة', 'سُلَافَةُ'],
      ['غياث الموصلي', 'غِيَاثٌ المَوْصِلِيُّ'],
      ['غياث', 'غِيَاثٌ'],
      ['صفوان الكاتب', 'صَفْوَانُ الكَاتِبُ'],
      ['صفوان', 'صَفْوَانُ'],
      ['خلدون العسس', 'خَلْدُونُ العَسَسِ'],
      ['خلدون', 'خَلْدُونُ'],
      ['الميرزا قاسم', 'المِيرْزَا قَاسِمٌ'],
      ['يعقوب الساعاتي', 'يَعْقُوبُ السَّاعَاتِي'],
      ['حكمت الحاجب', 'حِكْمَتُ الحَاجِبُ'],
      ['نادر بك', 'نَادِرُ بَكْ'],
      ['الدكتورة سيرين', 'الدُّكْتُورَةُ سِيرِينُ'],
      ['سيرين', 'سِيرِينُ'],
      ['طارق السائق', 'طَارِقٌ السَّائِقُ'],
      ['الدكتور راشد', 'الدُّكْتُورُ رَاشِدٌ'],
      ['المهندسة ليلى', 'المُهَنْدِسَةُ لَيْلَى'],
      ['الحارس إلياس', 'الحَارِسُ إِلْيَاسُ'],
      ['الكابتن فؤاد', 'الكَابْتِنُ فُؤَادٌ'],
      ['الطبيب مروان', 'الطَّبِيبُ مَرْوَانُ'],
      ['المهندس وليد', 'المُهَنْدِسُ وَلِيدٌ'],
      ['الأدميرال تيمور', 'الأَدْمِيرَالُ تَيْمُورُ'],
      ['الأدميرال', 'الأَدْمِيرَالِ'],
      ['الدكتورة سلمى', 'الدُّكْتُورَةُ سَلْمَى'],
      ['الأستاذ يونس', 'الأُسْتَاذُ يُونُسُ'],
      ['منصور الحارس', 'مَنْصُورٌ الحَارِسُ'],
      ['منصور', 'مَنْصُورٌ'],
      ['القاضي العلام', 'القَاضِي العَلَّامُ'],
      ['نديم', 'نَدِيمٌ'],
      ['المهندسة مايا', 'المُهَنْدِسَةُ مَايَا'],
      ['الضابط طارق', 'الضَّابِطُ طَارِقٌ'],
      ['العقيد فريد', 'العَقِيدُ فَرِيدٌ'],
      ['القاضي سليمان', 'القَاضِي سُلَيْمَانُ'],
      ['الدكتور مازن', 'الدُّكْتُورُ مَازِنٌ'],
      ['القبطان سليم', 'القُبْطَانُ سَلِيمٌ'],
      ['الصحفية رنا', 'الصَّحَفِيَّةُ رَنَا'],
      ['الرحالة سنان', 'الرَّحَّالَةُ سِنَانٌ'],
      ['العالمة ياقوت', 'العَالِمَةُ يَاقُوتُ'],
      ['الدليل جسار', 'الدَّلِيلُ جَسَّارٌ']
    ];

    for (const [word, replacement] of lexicon) {
      const pattern = new RegExp(`(?<![\\u0621-\\u064A\\u064B-\\u065F])${word}(?![\\u0621-\\u064A\\u064B-\\u065F])`, 'g');
      t = t.replace(pattern, replacement);
    }
    return t;
  }

  prepareGemini38Transcript(text, profileOrEmotion = '', isReaction = false) {
    const profile =
      typeof profileOrEmotion === 'object' && profileOrEmotion !== null
        ? profileOrEmotion
        : { label: String(profileOrEmotion || ''), tagPrefix: '' };

    let cleaned = String(text || '')
      .replace(/[*_#`~]/g, '')
      .replace(/«|»/g, '"')
      .trim();

    cleaned = this.applyEssentialArabicDiacritics(cleaned);

    // حقن الوقفات التمثيلية والتنفس والشهقات الطبيعية داخل الجمل (Inline Vocal Tags)
    cleaned = cleaned
      .replace(/\.{3,}|…/g, '... <short pause> ')
      .replace(/\s*—\s*|\s+-\s+/g, ' <short pause> ')
      .replace(/([!！])\s+(?=[أ-ي])/g, '$1 <short pause> ')
      .replace(/([؟?])\s+(?=[أ-ي])/g, '$1 <short pause> ');

    // إضافة تعبيرات صوتية بشرية تلقائية عند الكلمات الدرامية داخل النص إذا لم تكن مسبوقة بوسم
    cleaned = cleaned
      .replace(/(?<!<gasp>\s*)(?=(فَجْأَةً|فجأة|مُسْتَحِيل|مستحيل|يَا إِلَهِي|يا إلهي))/g, '<gasp> ')
      .replace(/(?<!<whispers>\s*)(?=(هَمَسَ|همس|بِصَوْتٍ خَافِت|بصوت خافت))/g, '<whispers> ')
      .replace(/(?<!<sigh>\s*)(?=(تَنَهَّدَ|تنهد|بِأَسًى|بأسى|لِلْأَسَف|للأسف))/g, '<sigh> ')
      .replace(/(?<!<heavy breath>\s*)(?=(يَلْهَث|يلهث|أَنْفَاس|أنفاس|ارْتَجَف|ارتجف))/g, '<heavy breath> ')
      .replace(/(?<!<chuckle>\s*)(?=(ابْتَسَمَ بِسُخْرِيَة|ابتسم بسخرية|ضَحِكَ|ضحك))/g, '<chuckle> ');

    const hasStartingTag = /^\s*<(gasp|sigh|laugh|chuckle|breath|heavy breath|whispers|cough|throat-clearing|short pause|long pause)>/i.test(
      cleaned
    );
    if (!hasStartingTag && profile.tagPrefix) {
      cleaned = `${profile.tagPrefix}${cleaned}`;
    }

    return cleaned.replace(/\s{2,}/g, ' ').trim();
  }

  stripInlineVocalTags(text) {
    if (!text) return '';
    return String(text)
      .replace(
        /<(gasp|sigh|sighs|laugh|laughter|chuckle|chuckles|breath|heavy breath|exhales|whispers|whispering|cough|throat-clearing|pant|groan|sob|short pause|long pause)>/gi,
        ''
      )
      .replace(/[*_#`~<>]/g, '')
      .replace(/«|»/g, '"')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  async speakWithGoogleCloudTts(text, profile, isReaction, apiKey, signal = undefined, sessionId = 0) {
    const cloudVoiceMap = {
      Charon: { name: 'ar-XA-Wavenet-B', gender: 'MALE' },
      Fenrir: { name: 'ar-XA-Wavenet-C', gender: 'MALE' },
      Aoede: { name: 'ar-XA-Wavenet-A', gender: 'FEMALE' },
      Kore: { name: 'ar-XA-Wavenet-D', gender: 'FEMALE' },
      Puck: { name: 'ar-XA-Wavenet-B', gender: 'MALE' }
    };

    const chosen = cloudVoiceMap[this.settings.voiceName] || cloudVoiceMap.Charon;
    const ssml = this.buildExpressiveSsml(text, profile?.label || '', isReaction);

    const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { ssml },
        voice: {
          languageCode: 'ar-XA',
          name: chosen.name,
          ssmlGender: chosen.gender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: (Number(this.settings.speed) || 1.0) * (profile?.rateMultiplier || 1.0),
          effectsProfileId: ['headphone-class-device']
        }
      })
    });

    if (this.speechSessionId !== sessionId) return;
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Cloud TTS HTTP ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    if (!data.audioContent) {
      throw new Error('لا يوجد محتوى صوتي في الاستجابة');
    }

    const binary = atob(data.audioContent);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const mp3Blob = new Blob([bytes], { type: 'audio/mp3' });
    await this.playAudioBlob(mp3Blob, 1.0, sessionId);
  }

  speakWithBrowserTts(text, profile, isReaction, sessionId = 0) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || this.speechSessionId !== sessionId) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const vocalizedText = this.applyEssentialArabicDiacritics(text);
      const utterance = new SpeechSynthesisUtterance(vocalizedText);
      utterance.lang = 'ar-SA';

      const voices = window.speechSynthesis.getVoices();
      const arabicVoice =
        voices.find(v => v.lang.toLowerCase().startsWith('ar') && v.name.toLowerCase().includes('google')) ||
        voices.find(v => v.lang.toLowerCase().startsWith('ar'));

      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }

      const baseRate = Number(this.settings.speed) || 1.0;
      const rate = baseRate * (profile?.rateMultiplier || 1.0);
      const pitch = profile?.pitchBrowser || (isReaction ? 0.85 : 0.92);

      utterance.rate = Math.min(Math.max(rate, 0.65), 1.5);
      utterance.pitch = pitch;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  buildExpressiveSsml(text, emotion = '', isReaction = false) {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\.\.\./g, '<break time="450ms"/>')
      .replace(/،/g, '،<break time="220ms"/>')
      .replace(/！|!/g, '!<break time="350ms"/>');

    let pitch = '-1.5st';
    let rate = '96%';

    if (emotion.includes('همس')) {
      pitch = '-3.0st';
      rate = '90%';
    } else if (emotion.includes('صدمة') || emotion.includes('ذهول')) {
      pitch = '+1.2st';
      rate = '104%';
    } else if (emotion.includes('شجن') || emotion.includes('حزن')) {
      pitch = '-2.5st';
      rate = '91%';
    } else if (isReaction) {
      pitch = '-2.0st';
    }

    return `<speak><prosody rate="${rate}" pitch="${pitch}">${escaped}</prosody></speak>`;
  }

  base64AudioToWavBlob(base64Data, mimeType = 'audio/wav', sampleRate = 24000) {
    const binaryString = atob(base64Data);
    const len = binaryString.length;

    const isRiffWav =
      len > 44 &&
      binaryString.charCodeAt(0) === 0x52 &&
      binaryString.charCodeAt(1) === 0x49 &&
      binaryString.charCodeAt(2) === 0x46 &&
      binaryString.charCodeAt(3) === 0x46;

    if (isRiffWav || (mimeType && mimeType.includes('wav'))) {
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type: 'audio/wav' });
    }

    const wavBuffer = new ArrayBuffer(44 + len);
    const view = new DataView(wavBuffer);

    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + len, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, len, true);

    const uint8 = new Uint8Array(wavBuffer, 44);
    for (let i = 0; i < len; i++) {
      uint8[i] = binaryString.charCodeAt(i);
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  playAudioBlob(blob, playbackRate = 1.0, sessionId = 0, onTimeProgress = null) {
    return new Promise((resolve, reject) => {
      if (this.speechSessionId !== sessionId) {
        resolve();
        return;
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.playbackRate = playbackRate;
      this.currentAudio = audio;

      if (typeof onTimeProgress === 'function') {
        audio.ontimeupdate = () => {
          if (this.speechSessionId !== sessionId) return;
          if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
            onTimeProgress(Math.min(1, Math.max(0, audio.currentTime / audio.duration)));
          }
        };
      }

      try {
        if (this.audioCtx && this.analyser) {
          this.currentMediaSource = this.audioCtx.createMediaElementSource(audio);
          this.currentMediaSource.connect(this.analyser);
        }
      } catch (_) {}

      const cleanup = () => {
        if (this.currentMediaSource) {
          try {
            this.currentMediaSource.disconnect();
          } catch (_) {}
          this.currentMediaSource = null;
        }
        URL.revokeObjectURL(url);
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      };

      audio.onended = () => {
        cleanup();
        resolve();
      };

      audio.onerror = (err) => {
        cleanup();
        reject(err);
      };

      audio.play().catch(err => {
        cleanup();
        reject(err);
      });
    });
  }

  /* ==========================================================================
     رسم الموجات الصوتية التفاعلية (Canvas Waveform Visualizer)
     ========================================================================== */
  drawIdleWaveform() {
    if (!this.waveformCanvas) return;
    const ctx = this.waveformCanvas.getContext('2d');
    const { width, height } = this.waveformCanvas;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.32)';
    const bars = 14;
    const barW = 3;
    const gap = (width - bars * barW) / (bars + 1);
    for (let i = 0; i < bars; i++) {
      const h = 4 + (i % 3) * 2;
      const x = gap + i * (barW + gap);
      const y = (height - h) / 2;
      ctx.fillRect(x, y, barW, h);
    }
  }

  startWaveformAnimation() {
    if (!this.waveformCanvas) return;
    cancelAnimationFrame(this.waveformAnimationId);

    const ctx = this.waveformCanvas.getContext('2d');
    const { width, height } = this.waveformCanvas;
    const bufferLength = this.analyser ? this.analyser.frequencyBinCount : 16;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      if (!this.isSpeaking) {
        this.drawIdleWaveform();
        return;
      }

      this.waveformAnimationId = requestAnimationFrame(renderFrame);
      ctx.clearRect(0, 0, width, height);

      if (this.analyser && this.currentAudio) {
        this.analyser.getByteFrequencyData(dataArray);
      } else {
        const t = performance.now() / 120;
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = 90 + Math.sin(t + i * 0.7) * 70;
        }
      }

      const bars = 14;
      const barW = 3;
      const gap = (width - bars * barW) / (bars + 1);

      for (let i = 0; i < bars; i++) {
        const val = dataArray[i % bufferLength] || 30;
        const barH = Math.max(4, (val / 255) * (height - 6));
        const x = gap + i * (barW + gap);
        const y = (height - barH) / 2;

        ctx.fillStyle = val > 160 ? '#f6c967' : '#e2b049';
        ctx.fillRect(x, y, barW, barH);
      }
    };

    renderFrame();
  }

  stopWaveformAnimation() {
    cancelAnimationFrame(this.waveformAnimationId);
    this.drawIdleWaveform();
  }

  /* ==========================================================================
     المؤثرات الصوتية التفاعلية (لفك الأقفال والألغاز والأدلة)
     ========================================================================== */
  playTapeWarmupCue() {
    if (!this.sfxEnabled) return;
    try {
      this.initAudioContext();
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.09);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (_) {}
  }

  playPuzzleClickSound() {
    if (!this.sfxEnabled) return;
    try {
      this.initAudioContext();
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(310, now + 0.055);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (_) {}
  }

  playPuzzleSolvedSound() {
    if (!this.sfxEnabled) return;
    try {
      this.initAudioContext();
      const now = this.audioCtx.currentTime;
      [587.33, 880.0].forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.32);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.34);
      });
    } catch (_) {}
  }

  playReactionCue(emotion = '') {
    if (!this.sfxEnabled) return;
    this.initAudioContext();
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    if (emotion.includes('صدمة') || emotion.includes('خطر') || emotion.includes('تحذير')) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.35);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    }

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playClueSound() {
    if (!this.sfxEnabled) return;
    this.initAudioContext();
    const now = this.audioCtx.currentTime;

    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.085, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.45);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.46);
    });
  }

  playTwistSound() {
    if (!this.sfxEnabled) return;
    this.initAudioContext();
    const now = this.audioCtx.currentTime;
    this.triggerDistantThunder(0.95);

    [220, 311.13, 440].forEach((freq) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.05);
      gain.gain.setValueAtTime(0.07, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.35);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now + 0.05);
      osc.stop(now + 1.4);
    });
  }

  /* ==========================================================================
     محرك البيئات الصوتية الواقعية (Real Acoustic Environmental Soundscapes)
     بدون أي ترددات Oscillator — يحاكي فيزيائياً صوت المطر وقطرات الماء والرياح والقطار
     ========================================================================== */
  resolveAmbientType(scenarioId = 'manor') {
    const mode = this.settings.ambientMode || 'auto';
    if (mode !== 'auto') return mode;
    if (scenarioId === 'train') return 'train';
    if (scenarioId === 'station' || scenarioId === 'hospital') return 'wind';
    return 'rain';
  }

  /**
   * توليد مخزن صوتي ستيريو واقعي (7 ثوانٍ) للمطر الغزير وقطرات الماء المتناثرة على الزجاج،
   * أو الرياح القطبية، أو إيقاع عجلات قطار منتصف الليل على القضبان الحديدية.
   */
  createRealisticEnvironmentBuffer(type = 'rain') {
    const sr = this.audioCtx.sampleRate;
    const duration = type === 'train' ? 4.8 : 7.2;
    const length = Math.floor(sr * duration);
    const buffer = this.audioCtx.createBuffer(2, length, sr);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      let lastBrown = 0;

      for (let i = 0; i < length; i++) {
        const t = i / sr;
        const white = Math.random() * 2 - 1;

        // فلتر Paul Kellet للـ Pink Noise الطبيعي (صوت هطول المطر المستمر)
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;

        // Brown noise (هواء عميق طبيعي)
        lastBrown = (lastBrown + 0.02 * white) / 1.02;

        if (type === 'rain') {
          // تموج طبيعي لهبات المطر على السقف والنافذة
          const swell = 0.78 + 0.22 * Math.sin((2 * Math.PI * t) / duration + ch * 1.1);
          data[i] = (pink * 0.72 + lastBrown * 0.18) * swell;
        } else if (type === 'wind') {
          // هبات رياح قطبية طبيعية متداخلة بدون أي نغمة اصطناعية
          const gust1 = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / duration + ch * 0.8);
          const gust2 = 0.5 + 0.5 * Math.cos((4 * Math.PI * t) / duration - ch * 0.5);
          const env = 0.28 + 0.72 * Math.pow(gust1 * gust2, 1.35);
          data[i] = (lastBrown * 0.82 + pink * 0.22) * env * 1.35;
        } else if (type === 'train') {
          // صوت المطر المكتوم خلف زجاج المقصورة + تدفق الهواء
          data[i] = pink * 0.35 + lastBrown * 0.48;
        }
      }

      // إضافة التفاصيل الفيزيائية الدقيقة (قطرات المطر المنفردة أو طرقات قضبان القطار)
      if (type === 'rain') {
        // مئات قطرات الماء الطبيعية التي تنقر زجاج النافذة بتوزيع ستيريو عشوائي
        const dropletCount = 210;
        for (let d = 0; d < dropletCount; d++) {
          const startSample = Math.floor(Math.random() * (length - 900));
          const dropLen = Math.floor(sr * (0.008 + Math.random() * 0.016));
          const dropAmp = 0.035 + Math.random() * 0.065;
          const resonanceHz = 950 + Math.random() * 1650;
          for (let k = 0; k < dropLen; k++) {
            const env = Math.exp(-k / (dropLen * 0.24));
            const pat =
              (Math.random() * 2 - 1) * 0.55 +
              Math.sin((2 * Math.PI * resonanceHz * k) / sr) * 0.45;
            data[startSample + k] += pat * env * dropAmp;
          }
        }
      } else if (type === 'train') {
        // إيقاع عجلات القطار الحديدية الواقعي (تك-تك ... تك-تك) كل 1.2 ثانية
        const cycleSec = 1.2;
        const cycles = Math.floor(duration / cycleSec);
        const hitOffsets = [0.04, 0.21, 0.62, 0.79];
        for (let c = 0; c < cycles; c++) {
          for (let h = 0; h < hitOffsets.length; h++) {
            const hitTime = c * cycleSec + hitOffsets[h];
            const startSample = Math.floor(hitTime * sr);
            const clackLen = Math.floor(sr * 0.065);
            const strength = h % 2 === 0 ? 0.24 : 0.17;
            for (let k = 0; k < clackLen && startSample + k < length; k++) {
              const env = Math.exp(-k / (clackLen * 0.28));
              const woodThud = Math.sin((2 * Math.PI * 78 * k) / sr) * 0.65;
              const steelClick = (Math.random() * 2 - 1) * Math.exp(-k / (clackLen * 0.12)) * 0.55;
              data[startSample + k] += (woodThud + steelClick) * env * strength;
            }
          }
        }
      }

      // تنعيم بداية ونهاية المقطع (Crossfade 120ms) لضمان تكرار لا نهائي سلس 100% بدون أي نقرة
      const fadeSamples = Math.floor(sr * 0.12);
      for (let i = 0; i < fadeSamples; i++) {
        const fade = i / fadeSamples;
        const endIdx = length - 1 - i;
        data[i] = data[i] * fade + data[endIdx] * (1 - fade);
      }
    }

    return buffer;
  }

  /**
   * توليد صوت رعد بعيد واقعي في الخلفية أثناء أجواء المطر
   */
  triggerDistantThunder(intensity = 0.65) {
    if (!this.audioCtx) return;
    try {
      const sr = this.audioCtx.sampleRate;
      const dur = 3.6;
      const len = Math.floor(sr * dur);
      const buf = this.audioCtx.createBuffer(2, len, sr);

      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        let brown = 0;
        for (let i = 0; i < len; i++) {
          const t = i / sr;
          const white = Math.random() * 2 - 1;
          brown = (brown + 0.025 * white) / 1.025;
          // غلاف تموج الرعد البعيد المتدحرج
          const roll =
            Math.sin(Math.PI * Math.min(1, t / 0.9)) *
            Math.exp(-Math.max(0, t - 0.55) * 0.85) *
            (0.7 + 0.3 * Math.sin(t * 9.5 + ch));
          d[i] = brown * roll * 0.85;
        }
      }

      const src = this.audioCtx.createBufferSource();
      src.buffer = buf;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 145;

      const gain = this.audioCtx.createGain();
      const baseVol = Number(this.settings.ambientVolume ?? 0.45);
      gain.gain.value = Math.max(0.04, baseVol * 0.42 * intensity);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      src.start();
    } catch (_) {}
  }

  stopAmbientEnvironment() {
    if (this.thunderTimerId) {
      clearInterval(this.thunderTimerId);
      this.thunderTimerId = null;
    }
    if (this.musicTimerId) {
      clearInterval(this.musicTimerId);
      this.musicTimerId = null;
    }
    if (this.ambientNodes && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        const nodesToStop = this.ambientNodes;
        this.ambientNodes = null;
        nodesToStop.masterGain.gain.setValueAtTime(nodesToStop.masterGain.gain.value, now);
        nodesToStop.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        setTimeout(() => {
          try {
            nodesToStop.source.stop();
            nodesToStop.source.disconnect();
          } catch (_) {}
        }, 400);
      } catch (_) {
        this.ambientNodes = null;
      }
    }
    this.ambientEnabled = false;
  }

  setAmbientVolume(volume = 0.45) {
    this.settings.ambientVolume = Math.max(0, Math.min(1, Number(volume)));
    if (this.ambientNodes && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      const targetGain = Math.max(0.001, this.settings.ambientVolume * 0.38);
      this.ambientNodes.masterGain.gain.setTargetAtTime(targetGain, now, 0.15);
    }
  }

  /**
   * موسيقى النوار التصويرية التفاعلية (Dynamic Noir Score & Tension Stems - H6 & Game Changer 7)
   * تتدرج من نغمات تشيلو وعود/بيانو هادئة على مقام الحجاز/نهاوند إلى نبض توتر متسارع مع ارتفاع مؤشر الخطر
   */
  triggerNoirMusicalMotif(dangerLevel = 15) {
    if (!this.audioCtx || !this.ambientEnabled || this.settings.ambientMode === 'off') return;
    try {
      const now = this.audioCtx.currentTime;
      const baseVol = Number(this.settings.ambientVolume ?? 0.45);
      if (baseVol <= 0.02) return;

      const danger = Math.max(5, Math.min(100, Number(dangerLevel) || 15));
      // سلم موسيقي شرقي-نوار (D Hijaz / Harmonic Minor: D3, Eb3, F#3, G3, A3, Bb3, C#4, D4)
      const hijazScale = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 277.18, 293.66];

      // 1. نغمة قرار سينمائية دافئة (Cello Drone Pad)
      const droneOsc = this.audioCtx.createOscillator();
      const droneFilter = this.audioCtx.createBiquadFilter();
      const droneGain = this.audioCtx.createGain();
      droneOsc.type = 'triangle';
      droneOsc.frequency.setValueAtTime(danger >= 70 ? 77.78 : 73.42, now); // D2 or Eb2 under high danger
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(240 + danger * 1.8, now);

      const droneAmp = baseVol * (0.045 + (danger / 100) * 0.035);
      droneGain.gain.setValueAtTime(0.0001, now);
      droneGain.gain.linearRampToValueAtTime(droneAmp, now + 1.1);
      droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.4);

      droneOsc.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(this.audioCtx.destination);
      droneOsc.start(now);
      droneOsc.stop(now + 4.5);

      // 2. جملة لحنية نوارية (Plucked Noir Motif) تتغير كثافتها مع الخطر
      const noteCount = danger >= 65 ? 4 : danger >= 35 ? 3 : 2;
      for (let i = 0; i < noteCount; i++) {
        const noteTime = now + 0.35 + i * (danger >= 65 ? 0.52 : 0.78);
        const freq = hijazScale[(i * 2 + (danger >= 50 ? 1 : 0)) % hijazScale.length];
        const noteOsc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();
        noteOsc.type = 'sine';
        noteOsc.frequency.setValueAtTime(freq, noteTime);

        const noteAmp = baseVol * 0.038;
        noteGain.gain.setValueAtTime(0.0001, noteTime);
        noteGain.gain.linearRampToValueAtTime(noteAmp, noteTime + 0.04);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.45);

        noteOsc.connect(noteGain);
        noteGain.connect(this.audioCtx.destination);
        noteOsc.start(noteTime);
        noteOsc.stop(noteTime + 1.5);
      }

      // 3. نبض قلب متسارع (Tension Heartbeat Stem) عندما يتجاوز الخطر 50%
      if (danger >= 50) {
        const pulseBeats = danger >= 80 ? 3 : 2;
        for (let b = 0; b < pulseBeats; b++) {
          const tBeat = now + b * (danger >= 80 ? 0.65 : 0.95);
          const subOsc = this.audioCtx.createOscillator();
          const subGain = this.audioCtx.createGain();
          subOsc.type = 'sine';
          subOsc.frequency.setValueAtTime(58, tBeat);
          subOsc.frequency.exponentialRampToValueAtTime(34, tBeat + 0.22);

          const pulseAmp = baseVol * (0.06 + ((danger - 50) / 50) * 0.06);
          subGain.gain.setValueAtTime(0.001, tBeat);
          subGain.gain.linearRampToValueAtTime(pulseAmp, tBeat + 0.03);
          subGain.gain.exponentialRampToValueAtTime(0.0001, tBeat + 0.26);

          subOsc.connect(subGain);
          subGain.connect(this.audioCtx.destination);
          subOsc.start(tBeat);
          subOsc.stop(tBeat + 0.28);
        }
      }
    } catch (_) {}
  }

  updateTensionMusicStem(dangerLevel = 15) {
    this.currentDangerLevel = Math.max(5, Math.min(100, Number(dangerLevel) || 15));
    if (this.ambientNodes && this.audioCtx && this.ambientNodes.filter) {
      try {
        const now = this.audioCtx.currentTime;
        if (this.activeAmbientType === 'rain') {
          this.ambientNodes.filter.frequency.setTargetAtTime(
            1800 + this.currentDangerLevel * 12,
            now,
            0.4
          );
        }
      } catch (_) {}
    }
  }

  startAmbientEnvironment(scenarioId = 'mansion') {
    this.initAudioContext();
    const resolvedType = this.resolveAmbientType(scenarioId);
    if (resolvedType === 'off') {
      this.stopAmbientEnvironment();
      return false;
    }

    this.stopAmbientEnvironment();
    this.activeAmbientType = resolvedType;

    const now = this.audioCtx.currentTime;
    const buffer = this.createRealisticEnvironmentBuffer(resolvedType);
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    if (resolvedType === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);
    } else if (resolvedType === 'wind') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(420, now);
      filter.Q.setValueAtTime(1.4, now);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
    }

    const masterGain = this.audioCtx.createGain();
    const targetGain = Math.max(0.01, (Number(this.settings.ambientVolume ?? 0.45)) * 0.38);
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(targetGain, now + 0.9);

    source.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(this.audioCtx.destination);
    source.start(now);

    if (resolvedType === 'rain') {
      this.thunderTimerId = setInterval(() => {
        if (this.ambientEnabled && this.activeAmbientType === 'rain') {
          this.triggerDistantThunder(0.55 + Math.random() * 0.35);
        }
      }, 19000);
    }

    this.ambientNodes = { source, filter, masterGain };
    this.ambientEnabled = true;

    // تشغيل الموسيقى التصويرية التفاعلية (Noir Tension Stems) التي تتبع مؤشر الخطر
    this.triggerNoirMusicalMotif(this.currentDangerLevel);
    this.musicTimerId = setInterval(() => {
      if (this.ambientEnabled) {
        this.triggerNoirMusicalMotif(this.currentDangerLevel);
      }
    }, 6500);

    return true;
  }

  /**
   * تبديل حالة الصوت المحيطي الواقعي أو تحديثه حسب السيناريو المختار
   */
  toggleAmbientDrone(scenarioId = 'mansion') {
    if (this.ambientEnabled) {
      this.stopAmbientEnvironment();
      return false;
    }
    return this.startAmbientEnvironment(scenarioId);
  }
}

window.MysteryAudioEngine = MysteryAudioEngine;
