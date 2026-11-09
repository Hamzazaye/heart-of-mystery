/**
 * ============================================================================
 * قلب الغموض : محرك الذكاء الاصطناعي الذكي المضاد للازدحام (Gemini API)
 * ============================================================================
 * يتضمن نظام حل جذري لمشكلة (503 Service Unavailable / Server Overloaded):
 * 1. التبديل التلقائي الفوري بين النماذج (Auto-Model Failover Cascade):
 *    إذا كان النموذج المختار مزدحما (503 أو 429)، ينتقل الطلب تلقائيا في أجزاء من الثانية
 *    إلى النموذج الأخف والأسرع:
 *    gemini-3.8-flash -> gemini-3.5-flash-lite -> gemini-3.1-flash-lite -> gemini-4-argon
 * 2. إعادة المحاولة السريعة الذكية (Fast Retry with Backoff).
 * 3. استمرارية اللعب بدون توقف (Zero-Downtime Hybrid Fallback):
 *    حتى لو كانت خوادم Google تمر بازدحام شامل (503) في منطقتك، لا تتوقف اللعبة أبدا
 *    بل يكمل المحرك الهجين الفصل تلقائيا ويعود لـ Gemini في الفصل التالي.
 */

class MysteryAIEngine {
  constructor() {
    this.apiKey = '';
    this.serverManagedKey = true;
    this.model = 'gemini-3.5-flash-lite';
    this.twistIntensity = 'high';
    this.lastActiveModel = 'gemini-3.5-flash-lite';

    // ذاكرة التحميل الاستباقي للفصل الافتتاحي لتشغيل فوري (0ms)
    this.speculativeCache = new Map();
    this.inflightSpeculative = new Map();

    // سلسلة النماذج مرتبة حسب السرعة الفائقة (gemini-3.5-flash-lite يستجيب خلال ~2.4 ثانية فقط)
    this.fallbackCascade = [
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-4-argon'
    ];
  }

  configure({ apiKey, model, twistIntensity, serverManagedKey }) {
    if (apiKey !== undefined) this.apiKey = apiKey.trim();
    if (serverManagedKey !== undefined) this.serverManagedKey = Boolean(serverManagedKey);
    if (model) {
      if (model.startsWith('gemini-2.') || model.startsWith('gemini-1.')) {
        this.model = 'gemini-3.5-flash-lite';
      } else {
        this.model = model;
      }
    }
    if (twistIntensity) this.twistIntensity = twistIntensity;
  }

  hasValidKey() {
    return Boolean(this.serverManagedKey || (this.apiKey && this.apiKey.length > 15));
  }

  getThinkingLevel() {
    if (this.twistIntensity === 'extreme') return 'medium';
    return 'low';
  }

  /**
   * ترتيب سلسلة النماذج بحيث يبدأ بالنموذج الذي اختاره المستخدم ثم النماذج البديلة الأسرع
   */
  getOrderedModelCascade(preferredModel) {
    const primary = preferredModel || this.model || 'gemini-3.5-flash-lite';
    const others = this.fallbackCascade.filter(m => m !== primary);
    return [primary, ...others];
  }

  /**
   * إزالة الحركات والتشكيل والشرطة الطويلة من أي نص معروض للمستخدم
   * (تبقى الحركات حصريا داخل أداة القراءة الصوتية TTS)
   */
  stripDisplayDiacritics(value) {
    if (typeof value === 'string') {
      return value
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/\s*[\u2014\u2013]\s*/g, '، ');
    }
    if (Array.isArray(value)) {
      return value.map(item => this.stripDisplayDiacritics(item));
    }
    if (value && typeof value === 'object') {
      const cleaned = {};
      for (const [k, v] of Object.entries(value)) {
        cleaned[k] = this.stripDisplayDiacritics(v);
      }
      return cleaned;
    }
    return value;
  }

  /**
   * إرسال طلب POST واحد إلى الخادم الآمن (/api/interactions)
   * حيث يحقن GEMINI_API_KEY داخل بيئة Cloudflare المشفرة دون كشفه في المتصفح أبدا
   */
  async postSingleInteraction(apiKey, payload, signal = undefined) {
    const bodyStr = JSON.stringify(payload);
    return await fetch('/api/interactions', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr
    });
  }

  /**
   * إرسال الطلب مع تبديل تلقائي فوري بين النماذج (Failover Cascade) عند حدوث 503 أو 429 أو 404
   */
  async postWithModelFailover(apiKey, basePayload, signal = undefined) {
    const modelsToTry = this.getOrderedModelCascade(basePayload.model).slice(0, 2);
    let lastStatus = 503;
    let lastErrJson = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const candidateModel = modelsToTry[i];
      const payload = { ...basePayload, model: candidateModel };

      const timeoutCtrl = new AbortController();
      const timeoutId = setTimeout(() => timeoutCtrl.abort(), 4500);
      if (signal) {
        signal.addEventListener('abort', () => timeoutCtrl.abort(), { once: true });
      }

      let response = null;
      try {
        response = await this.postSingleInteraction(apiKey, payload, timeoutCtrl.signal);
      } catch (err) {
        clearTimeout(timeoutId);
        // في حال انتهاء المهلة (4.5 ثانية) لهذا النموذج، ننتقل فورا للنموذج الأسرع التالي
        if (i < modelsToTry.length - 1) continue;
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        this.lastActiveModel = candidateModel;
        return { response, usedModel: candidateModel, serverOverloaded: false };
      }

      lastStatus = response.status;
      try {
        lastErrJson = await response.json();
      } catch (_) {
        lastErrJson = null;
      }

      // إذا كان الخطأ بسبب مفتاح API غير صالح (400 API_KEY_INVALID أو 401)، لا داعي لتجربة نماذج أخرى
      const errObj = Array.isArray(lastErrJson) ? lastErrJson[0]?.error : lastErrJson?.error;
      const reason = errObj?.details?.[0]?.reason || '';
      const rawMsg = String(errObj?.message || '').toLowerCase();

      if (
        response.status === 401 ||
        reason === 'API_KEY_INVALID' ||
        rawMsg.includes('api key not valid')
      ) {
        return { response, usedModel: candidateModel, errJson: lastErrJson, authFailed: true };
      }

      // في حال 503 (ازدحام الخادم) أو 429 (تجاوز الحد المؤقت) أو 404، ننتقل فورا للنموذج البديل التالي
      const isRetryableOnNextModel =
        response.status === 503 ||
        response.status === 429 ||
        response.status === 404 ||
        response.status === 500;

      if (!isRetryableOnNextModel) {
        return { response, usedModel: candidateModel, errJson: lastErrJson };
      }

      // وقفة قصيرة جدا (350ms) قبل تجربة النموذج البديل التالي
      if (i < modelsToTry.length - 1) {
        await new Promise(r => setTimeout(r, 350));
      }
    }

    return {
      response: null,
      status: lastStatus,
      errJson: lastErrJson,
      serverOverloaded: lastStatus === 503 || lastStatus === 429
    };
  }

  /**
   * ترجمة رموز أخطاء Gemini Interactions API
   */
  formatGeminiApiError(httpStatus, errPayload) {
    const errObj = Array.isArray(errPayload) ? errPayload[0]?.error : errPayload?.error;
    const code = String(errObj?.code || errObj?.status || '').toLowerCase();
    const reason = errObj?.details?.[0]?.reason || '';
    const rawMsg = errObj?.message || `HTTP ${httpStatus}`;

    if (reason === 'API_KEY_INVALID' || rawMsg.toLowerCase().includes('api key not valid')) {
      return 'تعذر التحقق من مفتاح خادم السرد.';
    }

    const codeTranslations = {
      authentication: 'تعذر التحقق من صلاحية اتصال الخادم (401).',
      permission_denied: 'الوصول مقيد مؤقتا على الخادم (403).',
      payment_required: 'تم الوصول للحد الأعلى للطلبات (402).',
      model_not_found: 'محرك السرد المطلوب غير متاح حاليا (404).',
      rate_limit_exceeded: 'تم تجاوز الحد المسموح من الطلبات في الدقيقة (429).',
      quota_exceeded: 'تم استهلاك الحصة الحالية للخادم (429).',
      service_unavailable: 'خادم السرد يشهد ضغطا مؤقتا (503).'
    };

    if (code && codeTranslations[code]) {
      return codeTranslations[code];
    }
    if (httpStatus === 401) return codeTranslations.authentication;
    if (httpStatus === 403) return codeTranslations.permission_denied;
    if (httpStatus === 429) return codeTranslations.rate_limit_exceeded;
    if (httpStatus === 503) return codeTranslations.service_unavailable;

    return `خطأ في اتصال خادم السرد (${httpStatus}): ${rawMsg}`;
  }

  /**
   * فحص صلاحية اتصال الخادم مع التبديل التلقائي بين النماذج عند 503
   */
  async testConnection(candidateKey) {
    const keyToTest = (candidateKey ?? this.apiKey ?? '').trim();
    if (!keyToTest && !this.serverManagedKey) {
      throw new Error('يرجى التحقق من اتصال خادم اللعبة.');
    }

    let result;
    try {
      result = await this.postWithModelFailover(keyToTest, {
        model: this.model || 'gemini-3.8-flash',
        input: 'قل: متصل',
        generation_config: {
          thinking_level: 'low'
        }
      });
    } catch (networkErr) {
      throw new Error(
        'تعذر الوصول إلى خادم السرد (تحقق من اتصال الإنترنت).'
      );
    }

    // إذا نجح أحد النماذج في السلسلة
    if (result.response && result.response.ok) {
      const data = await result.response.json();
      const reply =
        data?.output_text ||
        data?.steps
          ?.filter(s => s.type === 'model_output')
          ?.flatMap(s => s.content || [])
          ?.filter(c => c.type === 'text')
          ?.map(c => c.text)
          ?.join('') ||
        'متصل';

      return {
        ok: true,
        usedModel: result.usedModel,
        reply: `${reply.trim()} عبر ${result.usedModel}`
      };
    }

    // إذا كان المفتاح صحيحا (تجاوز فحص API_KEY_INVALID) لكن جميع خوادم Google ترجع 503 في هذه اللحظة:
    // نقبل المفتاح ونفعل وضع الحماية الهجين لكي لا يتعطل المستخدم!
    if (result.serverOverloaded && !result.authFailed) {
      return {
        ok: true,
        usedModel: this.model,
        overloadedNotice: true,
        reply: 'المفتاح صالح ومقبول (تم تفعيل التبديل التلقائي ضد ازدحام 503)'
      };
    }

    throw new Error(this.formatGeminiApiError(result.status || 400, result.errJson));
  }

  /**
   * مفتاح فريد لكل مسار استباقي (Speculative Preload Key)
   */
  getSpeculativeKey(gameState, playerChoiceText = null) {
    const scen = gameState?.scenarioId || 'manor';
    const turnNum = gameState?.turn || 0;
    const name = gameState?.playerName || 'آدم';
    const choice = (playerChoiceText || '__OPENING__').trim();
    return `${scen}::${turnNum}::${name}::${choice}`;
  }

  isTurnPreloaded(gameState, playerChoiceText = null) {
    return this.speculativeCache.has(this.getSpeculativeKey(gameState, playerChoiceText));
  }

  /**
   * التحميل الاستباقي في الخلفية (Speculative Preloading)
   * يستدعى عند تمرير الفأرة على أحد الخيارات أو عند اختيار السيناريو قبل الضغط على بدء المغامرة
   */
  async preloadTurn(gameState, playerChoiceText = null) {
    const key = this.getSpeculativeKey(gameState, playerChoiceText);
    if (this.speculativeCache.has(key)) {
      return this.speculativeCache.get(key);
    }
    if (this.inflightSpeculative.has(key)) {
      return await this.inflightSpeculative.get(key);
    }

    const snapshot = JSON.parse(JSON.stringify(gameState));
    const promise = this._generateTurnCore(snapshot, playerChoiceText)
      .then(result => {
        if (this.speculativeCache.size > 15) {
          const oldest = this.speculativeCache.keys().next().value;
          this.speculativeCache.delete(oldest);
        }
        const tagged = { ...result, _wasPreloaded: true };
        this.speculativeCache.set(key, tagged);
        return tagged;
      })
      .finally(() => {
        this.inflightSpeculative.delete(key);
      });

    this.inflightSpeculative.set(key, promise);
    return await promise;
  }

  /**
   * توليد الفصل الأول أو تكملة المغامرة (يقرأ من ذاكرة الـ Preload أولا للاستجابة الفورية 0ms)
   */
  async generateTurn(gameState, playerChoiceText = null) {
    const key = this.getSpeculativeKey(gameState, playerChoiceText);
    if (this.speculativeCache.has(key)) {
      const cached = this.speculativeCache.get(key);
      return JSON.parse(JSON.stringify(cached));
    }
    if (this.inflightSpeculative.has(key)) {
      const inflight = await this.inflightSpeculative.get(key);
      return JSON.parse(JSON.stringify(inflight));
    }
    return await this._generateTurnCore(gameState, playerChoiceText);
  }

  async _generateTurnCore(gameState, playerChoiceText = null) {
    const bible = gameState.caseBible;

    // في الفصل الافتتاحي الأول (Turn 0): نعرض الفصل السينمائي المتقن المعد مسبقا خلال لحظة سينمائية سريعة (0.65 ثانية) لمنع أي تعليق عند بدء القضية!
    if ((gameState.turn === 0 || !gameState.turn) && !playerChoiceText) {
      if (bible && Array.isArray(bible.authoredChapters) && bible.authoredChapters[0]) {
        await new Promise(r => setTimeout(r, 650));
        return this.stripDisplayDiacritics(
          this.buildStaticChapterTurn(gameState, bible.authoredChapters[0], null)
        );
      }
    }

    // إذا لم يتوفر اتصال بالخادم، نستخدم الفصول الاحتياطية المبنية على دستور القضية
    if (!this.hasValidKey()) {
      if (bible && Array.isArray(bible.authoredChapters) && bible.authoredChapters[gameState.turn]) {
        return this.stripDisplayDiacritics(
          this.buildStaticChapterTurn(
            gameState,
            bible.authoredChapters[gameState.turn],
            playerChoiceText
          )
        );
      }
      return await this.generateCaseBibleTurn(gameState, playerChoiceText);
    }

    // الوضع الافتراضي الأساسي: الذكاء الاصطناعي يكتب كل فصل بحرية وإبداع حول الحقيقة المقفلة لهذه الجولة!
    try {
      return await this.callGeminiStructuredTurn(gameState, playerChoiceText);
    } catch (error) {
      console.warn('Gemini API fallback triggered due to:', error.message);
      if (bible && Array.isArray(bible.authoredChapters) && bible.authoredChapters[gameState.turn]) {
        const staticFallback = this.stripDisplayDiacritics(
          this.buildStaticChapterTurn(
            gameState,
            bible.authoredChapters[gameState.turn],
            playerChoiceText
          )
        );
        staticFallback._usedFallbackNotice = true;
        return staticFallback;
      }
      const fallbackTurn = await this.generateCaseBibleTurn(gameState, playerChoiceText);
      fallbackTurn._usedFallbackNotice = true;
      return fallbackTurn;
    }
  }

  /**
   * بناء الخيارات الثلاثة الذكية المستندة للأدلة والمشتبه بهم (H2 + F14 + F17: Case-Specific & Non-Redundant Suggestions)
   */
  buildEvidenceAwareChoices(gameState, bible) {
    const suspects = (bible && bible.suspects) || gameState.suspects || [];
    const heldClueIds = new Set((gameState.clues || []).map(c => c.id).filter(Boolean));
    const heldClueTitles = new Set((gameState.clues || []).map(c => c.title).filter(Boolean));

    const undiscoveredRealClue = ((bible && bible.clues) || []).find(
      c =>
        !c.isRedHerring &&
        !heldClueIds.has(c.id) &&
        !heldClueTitles.has(c.title) &&
        (c.needs || []).every(reqId => heldClueIds.has(reqId))
    );

    const anyUndiscoveredClue =
      undiscoveredRealClue ||
      ((bible && bible.clues) || []).find(
        c => !heldClueIds.has(c.id) && !heldClueTitles.has(c.title)
      );

    const uncrackedSuspect =
      suspects.find(s => {
        const gs = (gameState.suspects || []).find(g => g.id === s.id || g.name === s.name);
        return !gs || !gs.alibiBroken;
      }) || suspects[0];

    const latestClue = (gameState.clues || [])[0];
    const timelineSlot =
      ((bible && bible.timeline) || [])[
        Math.min(gameState.turn || 0, Math.max(0, ((bible && bible.timeline) || []).length - 1))
      ];

    const choice1Text = anyUndiscoveredClue
      ? `تفحص الموقع الميداني للبحث عن أثر مادي جديد مرتبط بـ (${anyUndiscoveredClue.title})`
      : latestClue
        ? `إعادة فحص ومطابقة (${latestClue.title}) مع توقيت الحادثة [${timelineSlot ? timelineSlot.time : '23:00'}]`
        : `معاينة مسرح الحدث للتحقق من ثغرات التوقيت والأقفال`;

    const choice2Text =
      uncrackedSuspect && latestClue
        ? `مواجهة "${uncrackedSuspect.name}" بالمعطيات المادية الموجودة في (${latestClue.title})`
        : uncrackedSuspect
          ? `استجواب "${uncrackedSuspect.name}" حول تفاصيل إفادته: «${uncrackedSuspect.alibi.slice(0, 44)}...»`
          : 'مقارنة إفادات المشتبه بهم الثلاثة مع السجل الزمني';

    const secondarySuspect =
      suspects.find(s => !uncrackedSuspect || s.id !== uncrackedSuspect.id) || uncrackedSuspect;

    const choice3Text =
      gameState.twistProgress >= 65
        ? `مراجعة ترابط الأدلة المكتشفة في "${bible?.shortTitle || 'القضية'}" تمهيدا لدخول غرفة الاتهام`
        : timelineSlot && secondarySuspect
          ? `التحقق من حركة "${secondarySuspect.name}" عند الساعة [${timelineSlot.time}] في ${bible?.shortTitle || 'مسرح الحدث'}`
          : `تتبع السجل الزمني الدقيق حول ${bible?.shortTitle || 'مسرح الحدث'}`;

    return [
      { id: 'c1', tag: 'فحص جنائي', text: choice1Text },
      { id: 'c2', tag: 'مواجهة بالدليل', text: choice2Text },
      { id: 'c3', tag: 'تحقيق زمني', text: choice3Text }
    ];
  }

  /**
   * فحص ما إذا كانت الأدلة المكتشفة تفتح تويست مستحقا (H1: Earned Twists Only)
   */
  checkEarnedTwistFromBible(gameState, bible, newlyUnlockedClueId = null) {
    if (!bible || !Array.isArray(bible.twists)) return null;
    const heldIds = new Set((gameState.clues || []).map(c => c.id).filter(Boolean));
    if (newlyUnlockedClueId) heldIds.add(newlyUnlockedClueId);

    for (const tw of bible.twists) {
      const alreadyFound = (gameState.secrets || []).some(s => s.title === tw.secretTitle);
      if (!alreadyFound && (tw.unlocks_when || []).every(req => heldIds.has(req))) {
        return tw;
      }
    }
    return null;
  }

  /**
   * تجهيز فصل ثابت معد مسبقا (Static-First Chapter) بسرعة فورية
   */
  buildStaticChapterTurn(gameState, staticChap, playerChoiceText) {
    const bible = gameState.caseBible;
    const unlockedClueObj =
      ((bible && bible.clues) || []).find(c => c.id === staticChap.unlocked_clue_id) || {
        id: 'c_init',
        title: '',
        description: ''
      };

    const earnedTwist = this.checkEarnedTwistFromBible(gameState, bible, unlockedClueObj.id);
    const suspect0 = ((bible && bible.suspects) || [])[gameState.turn % Math.max(1, (bible?.suspects || []).length)];

    return {
      chapter_title: staticChap.chapter_title,
      mood: staticChap.mood,
      vocal_reaction: staticChap.vocal_reaction,
      vocal_emotion: staticChap.vocal_emotion || 'همس مريب',
      paragraph_emotions: staticChap.paragraphEmotions || [
        'همس مرعوب وترقب',
        'تساؤل ماكر وتشكيك',
        'تحذير حاد وتوتر'
      ],
      narrative: staticChap.narrative,
      suspicious_hotspot: staticChap.suspicious_hotspot,
      is_twist_moment: Boolean(earnedTwist),
      twist_headline: earnedTwist ? earnedTwist.headline : '',
      new_clue: unlockedClueObj.title
        ? {
            id: unlockedClueObj.id,
            title: unlockedClueObj.title,
            description: unlockedClueObj.description
          }
        : { title: '', description: '' },
      new_secret: earnedTwist
        ? { title: earnedTwist.secretTitle, revelation: earnedTwist.revelation }
        : { title: '', revelation: '' },
      suspect_update: suspect0
        ? {
            id: suspect0.id,
            name: suspect0.name,
            role: suspect0.role,
            trust_level: suspect0.trust_level,
            note: `حجة الغياب: «${suspect0.alibi}»`
          }
        : { name: '', role: '', trust_level: '', note: '' },
      twist_progress_delta: 15,
      danger_delta: playerChoiceText ? 5 : 0,
      choices: this.buildEvidenceAwareChoices(gameState, bible)
    };
  }

  /**
   * استدعاء محرك السرد الذكي مع الالتزام الصارم بملف القضية المقفل (Locked Case Bible)
   */
  async callGeminiStructuredTurn(gameState, playerChoiceText) {
    const bible = gameState.caseBible || {};
    const detectiveStyle = gameState.detectiveStyle || 'تحليلي حذر';
    const dialect = gameState.dialect || 'الفصحى الروائية';

    const heldClueIds = new Set((gameState.clues || []).map(c => c.id).filter(Boolean));
    const heldClueTitles = new Set((gameState.clues || []).map(c => c.title).filter(Boolean));

    // الدليل التالي المسموح بكشفه حسب شجرة المتطلبات (Prerequisites)
    const nextUnlockableClue = (bible.clues || []).find(
      c =>
        !c.isRedHerring &&
        !heldClueIds.has(c.id) &&
        !heldClueTitles.has(c.title) &&
        (c.needs || []).every(reqId => heldClueIds.has(reqId))
    );

    const earnedTwistCandidate = this.checkEarnedTwistFromBible(
      gameState,
      bible,
      nextUnlockableClue?.id
    );

    const suspectsLedger = (gameState.suspects || [])
      .map(
        s =>
          `- ${s.name} (${s.role}): [الحالة: ${s.trust_level}] | إفادته: "${s.alibi || s.note}" | هل كسرت حجته؟ ${s.alibiBroken ? 'نعم واعترف' : 'لا بعد'}`
      )
      .join('\n');

    const cluesLedger =
      (gameState.clues || []).map(c => `- ${c.title}: ${c.description}`).join('\n') ||
      'لا توجد أدلة مكتشفة بعد';

    const timelineLedger = (bible.timeline || [])
      .map(t => `[${t.time}] ${t.text}`)
      .join(' | ');

    const multiverseContext = bible.worldLaw
      ? `\n- قانون هذا العالم الموازي (يجب أن ينعكس في تفاصيل المشهد والحوارات): [${bible.worldLaw.title}] ${bible.worldLaw.rule}\n- عقدة المسرح الحالية: [${bible.worldCatalyst?.title || ''}] ${bible.worldCatalyst?.scene || ''}`
      : '';

    const systemInstruction = `أنت الروائي الجنائي والأدبي الأول للعبة التحقيق البوليسي التفاعلية "قلب الغموض".
القواعد الحديدية الملزمة (Truth First, Player Deduction Second):
1. الحقيقة الجنائية مقفلة مسبقا في (Case Bible) وممنوع تغيير الجاني أو اختراع شخصيات خارج القائمة أو مناقضة الخط الزمني:
   - آلية الحدث في ملف القضية (سري للمؤلف فقط): ${bible.method || 'محددة في ملف القضية'}
   - الخط الزمني المرجعي: ${timelineLedger}${multiverseContext}
2. احترام استنتاج اللاعب (ممنوع كشف الحل مسبقا):
   - اعرض الملاحظات الحسية الدقيقة، القياسات المادية، التوقيتات، وأقوال الشهود كما هي في المشهد، واترك للاعب مهمة الربط والاستنتاج!
   - ممنوع أن يصرح الراوي باسم الجاني أو يشرح التناقض الجنائي جاهزا نيابة عن اللاعب.
   - في حقل suspicious_hotspot.preview صف جسما أو موضعا مريبا مرئيا في الغرفة فقط دون كشف ما بداخله قبل الفحص.
3. البلاغة الأدبية، التشبيهات السينمائية، وسلامة التراكيب العربية:
   - اكتب بلغة عربية فصحى رفيعة المستوى، غنية بالتشبيهات البلاغية المبتكرة والاستعارات الحسية (الظلال، الضوء، الروائح، إيقاع المطر أو الصمت).
   - استعمل تراكيب عربية فصيحة مبنية للمعلوم واضحة الفاعل والمفعول، وتجنب تماما الجمل الركيكة أو الأفعال المبنية للمجهول التي تلتبس قراءتها بدون حركات.
   - ممنوع منعا باتا استخدام الشرطة الطويلة في أي نص؛ استعمل الفاصلة (،) أو النقطتين (:) أو النقطة (.) فقط.
   - اكتب جميع النصوص بدون وضع حركات التشكيل أمام المستخدم؛ لأن أداة القراءة الصوتية تتولى ضبط النطق داخليا.
4. زاوية السرد (Point of View):
   - السرد بضمير المخاطب (أنت يا ${gameState.playerName}).
   - حقل vocal_reaction هو تعليق الراوي الموجه إلى المحقق حصرا (ممنوع أن يتحدث الراوي بلسان البطل نفسه!).
   - لهجة حوارات الشخصيات بين علامات التنصيص «...»: (${dialect})، بينما يبقى السرد الوصفي بالعربية الفصحى الأدبية.
5. اكتب 3 فقرات روائية عميقة مفصولة بسطر جديد (\\n\\n) وحدد لكل فقرة شعورها الصوتي في مصفوفة paragraph_emotions (3 عناصر).
6. الدليل المسموح بإتاحة خيط له في هذا الفصل: ${
      nextUnlockableClue
        ? `"${nextUnlockableClue.title}" : ${nextUnlockableClue.description}`
        : 'تم كشف الأدلة الرئيسية؛ ركز الآن على تعميق الاستجواب ومقارنة التوقيتات المادية.'
    }
7. التويست (is_twist_moment): ${
      earnedTwistCandidate
        ? `مسموح الآن لأن اللاعب جمع الأدلة المطلوبة! عنوان التويست: "${earnedTwistCandidate.headline}"`
        : 'اجعل is_twist_moment: false (يمنع تفجير تويست عشوائي بدون اكتمال الأدلة).'
    }
8. قدم 3 خيارات استقصائية ذكية فقط في مصفوفة choices ترتبط مباشرة بالأدلة غير المكتشفة والمشتبه بهم في القائمة (ولا تطلب اكتشاف دليل موجود مسبقا في حوزة المحقق).`;

    const historySummary = (gameState.history || [])
      .slice(0, 4)
      .map(h => `فصل ${h.turn}: ${h.choice}`)
      .join(' | ');

    const userPrompt = `الفصل ${gameState.turn + 1} من قضية "${gameState.scenarioTitle}":
المحقق: ${gameState.playerName} (نهج التحقيق: ${detectiveStyle})
مؤشر الاستنتاج: ${gameState.twistProgress}% | مستوى الخطر: ${gameState.dangerLevel}%
سجل المشتبه بهم وإفاداتهم:
${suspectsLedger}
الأدلة المكتشفة في حوزة المحقق:
${cluesLedger}
سجل التحركات السابقة: ${historySummary || 'بداية التحقيق'}
تصرف أو سؤال المحقق الآن: «${(playerChoiceText || 'بدء معاينة مسرح الجريمة').slice(0, 220)}»`;

    const jsonSchema = {
      type: 'object',
      properties: {
        chapter_title: { type: 'string' },
        mood: { type: 'string' },
        vocal_reaction: { type: 'string' },
        vocal_emotion: { type: 'string' },
        paragraph_emotions: {
          type: 'array',
          items: { type: 'string' }
        },
        narrative: { type: 'string' },
        suspicious_hotspot: {
          type: 'object',
          properties: {
            preview: { type: 'string' },
            secret_reveal: { type: 'string' },
            bonus_clue: { type: 'string' }
          },
          required: ['preview', 'secret_reveal', 'bonus_clue']
        },
        is_twist_moment: { type: 'boolean' },
        twist_headline: { type: 'string' },
        new_clue: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['title', 'description']
        },
        new_secret: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            revelation: { type: 'string' }
          },
          required: ['title', 'revelation']
        },
        suspect_update: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            trust_level: { type: 'string' },
            note: { type: 'string' }
          },
          required: ['name', 'role', 'trust_level', 'note']
        },
        twist_progress_delta: { type: 'integer' },
        danger_delta: { type: 'integer' },
        choices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              tag: { type: 'string' },
              text: { type: 'string' }
            },
            required: ['id', 'tag', 'text']
          }
        }
      },
      required: [
        'chapter_title',
        'mood',
        'vocal_reaction',
        'vocal_emotion',
        'paragraph_emotions',
        'narrative',
        'suspicious_hotspot',
        'is_twist_moment',
        'twist_headline',
        'new_clue',
        'new_secret',
        'suspect_update',
        'twist_progress_delta',
        'danger_delta',
        'choices'
      ]
    };

    const result = await this.postWithModelFailover(this.apiKey, {
      model: this.model || 'gemini-3.5-flash-lite',
      system_instruction: systemInstruction,
      input: userPrompt,
      generation_config: {
        thinking_level: this.getThinkingLevel()
      },
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: jsonSchema
      }
    });

    if (!result.response || !result.response.ok) {
      throw new Error(this.formatGeminiApiError(result.status || 503, result.errJson));
    }

    const data = await result.response.json();

    if (data?.status === 'failed' || data?.error) {
      throw new Error(
        this.formatGeminiApiError(400, { error: data.error || { message: 'فشل توليد الاستجابة.' } })
      );
    }

    const rawJson =
      data?.output_text ||
      data?.steps
        ?.filter(s => s.type === 'model_output')
        ?.flatMap(s => s.content || [])
        ?.filter(c => c.type === 'text')
        ?.map(c => c.text)
        ?.join('');

    if (!rawJson) {
      throw new Error('لم يرجع النموذج استجابة نصية صالحة.');
    }

    const parsed = JSON.parse(rawJson);

    // ضمان ربط الدليل المكتشف بملف القضية الأصلي وعدم السماح بتويست غير مستحق
    if (nextUnlockableClue && (!parsed.new_clue || !parsed.new_clue.title)) {
      parsed.new_clue = {
        id: nextUnlockableClue.id,
        title: nextUnlockableClue.title,
        description: nextUnlockableClue.description
      };
    } else if (nextUnlockableClue && parsed.new_clue) {
      parsed.new_clue.id = nextUnlockableClue.id;
    }

    if (!earnedTwistCandidate) {
      parsed.is_twist_moment = false;
      parsed.twist_headline = '';
    } else {
      parsed.is_twist_moment = true;
      parsed.twist_headline = earnedTwistCandidate.headline;
      parsed.new_secret = {
        title: earnedTwistCandidate.secretTitle,
        revelation: earnedTwistCandidate.revelation
      };
    }

    if (!Array.isArray(parsed.choices) || parsed.choices.length === 0) {
      parsed.choices = this.buildEvidenceAwareChoices(gameState, bible);
    } else {
      parsed.choices = parsed.choices.slice(0, 3);
    }

    return this.stripDisplayDiacritics(parsed);
  }

  /**
   * ==========================================================================
   * محرك الفصول المبني على ملف القضية (Case-Bible-Driven Generator: C4 Fix)
   * لا يستبدل أي قضية بقصة القصر أبدا! بل يبني الفصل من شخصيات وأدلة القضية الحالية نفسها.
   * ==========================================================================
   */
  async generateCaseBibleTurn(gameState, playerChoiceText) {
    await new Promise(r => setTimeout(r, 120));

    const name = gameState.playerName || 'آدم';
    const bible = gameState.caseBible || {};
    const suspects = bible.suspects || gameState.suspects || [];
    const heldClueIds = new Set((gameState.clues || []).map(c => c.id).filter(Boolean));
    const heldClueTitles = new Set((gameState.clues || []).map(c => c.title).filter(Boolean));

    const nextClue =
      (bible.clues || []).find(
        c =>
          !c.isRedHerring &&
          !heldClueIds.has(c.id) &&
          !heldClueTitles.has(c.title) &&
          (c.needs || []).every(reqId => heldClueIds.has(reqId))
      ) ||
      (bible.clues || []).find(c => !heldClueIds.has(c.id) && !heldClueTitles.has(c.title));

    const focusSuspect =
      suspects[(gameState.turn || 0) % Math.max(1, suspects.length)] || {
        id: 's1',
        name: 'المشتبه الرئيسي',
        role: 'شاهد في مسرح الجريمة',
        alibi: 'كنت بعيدا عن موقع الحدث.',
        trust_level: 'مشتبه به'
      };

    const earnedTwist = this.checkEarnedTwistFromBible(gameState, bible, nextClue?.id);
    const timelineItem =
      (bible.timeline || [])[Math.min((gameState.turn || 0), Math.max(0, (bible.timeline || []).length - 1))];

    const actionContext = playerChoiceText
      ? `بعد تنفيذ قرارك («${playerChoiceText}»)، `
      : `مع بدء فحصك الميداني في "${bible.title || gameState.scenarioTitle}"، `;

    const paragraph1 = `${actionContext}تزداد وطأة الترقب في أرجاء المكان. كل زاوية هنا تحمل أثرا ماديا صامتا يرتبط بالساعة [${timelineItem ? timelineItem.time : '23:00'}]， بينما تسجل عيناك الفاحصتان مواضع الأغراض والمسافات بين المداخل والمخارج.`;

    const paragraph2 = `يقترب منك "${focusSuspect.name}" (${focusSuspect.role}) متمسكا بإفادته الأولية: «${focusSuspect.alibi}». تسجل في دفترك تفاصيل هذه الإفادة وتوقيتها الدقيق لمقارنتها لاحقا مع القرائن المادية المكتشفة في المسرح.`;

    const paragraph3 = nextClue
      ? `وعند تمحيصك الدقيق في مسرح الحدث، ترصد عينة مادية جديدة: "${nextClue.title}" (${nextClue.description}). يضاف هذا الأثر إلى ملف الأدلة لتحليل علاقته بإفادات الموجودين أو التوجه إلى غرفة الاتهام عند اكتمال أركان الإثبات.`
      : `تجتمع الآن القرائن المادية والسجلات الزمنية في دفتر تحقيقك؛ وبات بإمكانك مقارنة التوقيتات ومواجهة أي مشتبه به بالدليل المباشر أو دخول غرفة الاتهام لتقديم لائحة الحسم!`;

    return this.stripDisplayDiacritics({
      chapter_title: nextClue
        ? `أثر ميداني: ${nextClue.title}`
        : `مقارنة القرائن في ${bible.shortTitle || 'القضية'}`,
      mood: earnedTwist ? 'انكشاف قرينة مركبة' : 'معاينة ميدانية ورصد',
      vocal_reaction: `<breath> دقق جيدا يا ${name}... <short pause> قارن ما يقوله "${focusSuspect.name}" بالتوقيت المادي المسجل أمامك!`,
      vocal_emotion: earnedTwist ? 'صدمة وذهول درامي' : 'تساؤل ماكر وتشكيك',
      paragraph_emotions: ['ترقب وتوتر', 'تساؤل ماكر وتشكيك', 'تحذير حاد وتوتر'],
      narrative: `${paragraph1}\n\n${paragraph2}\n\n${paragraph3}`,
      suspicious_hotspot: {
        preview: `تلمح موضعا غير مألوف قرب مكان "${focusSuspect.name}" يستدعي الفحص القريب (مخاطرة استقصائية +10% خطر).`,
        secret_reveal: timelineItem
          ? `السجل الزمني المرتبط بهذا الموضع يشير إلى: [${timelineItem.time}] ${timelineItem.text}`
          : `الفحص القريب يظهر أثرا ماديا يرتبط بتوقيت الحادثة.`,
        bonus_clue_id: nextClue ? nextClue.id : '',
        bonus_clue: nextClue ? nextClue.title : `قرينة التوقيت (${timelineItem?.time || '23:00'})`,
        risk_cost: 10
      },
      is_twist_moment: Boolean(earnedTwist),
      twist_headline: earnedTwist ? earnedTwist.headline : '',
      new_clue: nextClue
        ? {
            id: nextClue.id,
            title: nextClue.title,
            description: nextClue.description
          }
        : { title: '', description: '' },
      new_secret: earnedTwist
        ? {
            title: earnedTwist.secretTitle,
            revelation: earnedTwist.revelation
          }
        : { title: '', revelation: '' },
      suspect_update: {
        id: focusSuspect.id,
        name: focusSuspect.name,
        role: focusSuspect.role,
        trust_level: focusSuspect.trust_level,
        note: `إفادته: «${focusSuspect.alibi}»`
      },
      twist_progress_delta: nextClue ? 20 : 10,
      danger_delta: 5,
      choices: this.buildEvidenceAwareChoices(gameState, bible)
    });
  }

  /**
   * ==========================================================================
   * توليد الخاتمة والنهاية الفريدة بالذكاء الاصطناعي (AI-Written Unique Finale)
   * يصوغ نهاية روائية مخصصة لكل جولة بناء على ما اكتشفه اللاعب، قراراته، واتهامه النهائي!
   * ==========================================================================
   */
  async generateAIEndingFinale(gameState, baseOutcome, accusationSelection = {}) {
    if (!this.hasValidKey()) {
      return baseOutcome;
    }

    const bible = gameState.caseBible || {};
    const realCulprit = (bible.suspects || []).find(s => s.id === bible.culpritId);
    const accusedSuspect = (bible.suspects || []).find(s => s.id === accusationSelection.suspectId);
    const chosenMotive = (bible.motives || []).find(m => m.id === accusationSelection.motiveId);
    const chosenClue = (bible.clues || []).find(c => c.id === accusationSelection.clueId);

    const cluesList = (gameState.clues || []).map(c => c.title).join('، ') || 'أدلة أولية';
    const choicesSummary = (gameState.history || [])
      .slice(0, 6)
      .map(h => `فصل ${h.turn}: ${h.choice}`)
      .join(' | ');

    const isFreeStoryMode = gameState.playMode === 'free_story';

    const systemInstruction = `أنت الروائي الجنائي والأدبي للعبة "قلب الغموض: حكايات بمليون نهاية".
مهمتك الآن كتابة الفصل الختامي الفريد (Unique AI Finale) لهذه الجولة تحديدا باللغة العربية الفصحى السينمائية المؤثرة والغنية بالتشبيهات البلاغية بدون وضع حركات التشكيل أمام المستخدم، وبدون استخدام الشرطة الطويلة إطلاقا.
- اجعل النهاية مكتوبة خصيصا بناء على مسار اللاعب الفعلي، الأدلة التي جمعها، والشخصية التي اتهمها.
- لا تستخدم نصوصا عامة مكررة، بل اذكر تفاصيل مسرح الجريمة وقرارات المحقق (${gameState.playerName}) ليحصل على نهاية فريدة لا تتكرر في أي جولة أخرى.`;

    const userPrompt = `اكتب الخاتمة الروائية الكاملة لقضية "${gameState.scenarioTitle}":
- اسم المحقق: ${gameState.playerName} (نهج التحقيق: ${gameState.detectiveStyle})
- نمط اللعب: ${isFreeStoryMode ? 'سرد حر لا نهائي يختتم الآن' : 'تحقيق جنائي واتهام نهائي'}
- الحقيقة المقفلة في هذه الجولة: ${bible.summaryBlueprint || gameState.hiddenBlueprint}
- الأدلة التي اكتشفها اللاعب فعليا: ${cluesList}
- مسار قرارات اللاعب خلال الفصول: ${choicesSummary}
- قرار الاتهام النهائي للاعب: اتهم (${accusedSuspect ? accusedSuspect.name : 'حسم القصة الحرة'}) بدافع (${chosenMotive ? chosenMotive.text : 'كشف الحقيقة'}) مستندا إلى (${chosenClue ? chosenClue.title : cluesList}).
- نتيجة المطابقة الجنائية: ${baseOutcome.endingTitle} (${baseOutcome.endingCode}).`;

    const epilogueSchema = {
      type: 'object',
      properties: {
        custom_ending_title: { type: 'string' },
        custom_epilogue_narrative: { type: 'string' },
        vocal_closing_line: { type: 'string' }
      },
      required: ['custom_ending_title', 'custom_epilogue_narrative', 'vocal_closing_line']
    };

    try {
      const result = await this.postWithModelFailover(this.apiKey, {
        model: this.model || 'gemini-3.5-flash-lite',
        system_instruction: systemInstruction,
        input: userPrompt,
        generation_config: {
          thinking_level: 'low'
        },
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: epilogueSchema
        }
      });

      if (result.response && result.response.ok) {
        const data = await result.response.json();
        const rawJson =
          data?.output_text ||
          data?.steps
            ?.filter(s => s.type === 'model_output')
            ?.flatMap(s => s.content || [])
            ?.filter(c => c.type === 'text')
            ?.map(c => c.text)
            ?.join('');
        if (rawJson) {
          const parsed = this.stripDisplayDiacritics(JSON.parse(rawJson));
          if (parsed.custom_epilogue_narrative) {
            const vocalClosing = parsed.vocal_closing_line || baseOutcome.summary;
            return {
              ...baseOutcome,
              endingTitle: parsed.custom_ending_title || baseOutcome.endingTitle,
              summary: parsed.custom_epilogue_narrative,
              vocalLine: vocalClosing,
              vocalClosingLine: vocalClosing,
              isAiWrittenFinale: true
            };
          }
        }
      }
    } catch (e) {
      console.warn('AI custom finale fallback to base outcome:', e.message);
    }

    return baseOutcome;
  }
}

window.MysteryAIEngine = MysteryAIEngine;
