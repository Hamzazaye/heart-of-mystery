/**
 * ============================================================================
 * قلب الغموض: محرك الانتشار الفيروسي والدخل السلبي (Viral Growth & Monetization Engine)
 * ============================================================================
 * يطبق خطة الانتشار والدخل السلبي عمليا داخل الموقع:
 * 1. روابط التحدي المباشرة (Deep Links): ?world=lawId-catId أو ?case=scenarioId
 * 2. استوديو صناع المحتوى الفيروسي (TikTok / Reels / Shorts 30s Hook Generator)
 * 3. مولد بطاقة الستوري البصرية (1080x1350 Canvas PNG Generator) بدون حرق للأحداث
 * 4. نظام عضوية المحقق الأعلى (Pro Pass)، وحزم العوالم، وفرصة الاستئناف الإضافية
 */
(function () {
  'use strict';

  const STORAGE_KEY_PRO_PASS = 'heart_of_mystery_pro_pass_v1';
  const STORAGE_KEY_MYTHIC_RELICS = 'heart_of_mystery_mythic_relics_v1';
  const VALID_PRO_CODES = new Set([
    'MYSTERY-PRO-2026',
    'MYTHIC-LEGEND-2026',
    'VIP-DETECTIVE',
    'CREATOR-HIT',
    'HEART-OF-MYSTERY-VIP',
    'MULTIVERSE-10000'
  ]);

  function getUnlockedMythicRelics() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MYTHIC_RELICS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return Object.values(parsed);
      return [];
    } catch (_) {
      return [];
    }
  }

  function recordUnlockedMythicRelic(mythicReward) {
    const key = mythicReward && (mythicReward.relicId || mythicReward.id);
    if (!key) return false;
    const list = getUnlockedMythicRelics();
    const existsIdx = list.findIndex(r => (r.relicId || r.id) === key);
    const entry = {
      ...mythicReward,
      relicId: key,
      id: key,
      unlockedAt: new Date().toLocaleDateString('ar-EG')
    };
    if (existsIdx >= 0) {
      list[existsIdx] = entry;
    } else {
      list.push(entry);
    }
    try {
      localStorage.setItem(STORAGE_KEY_MYTHIC_RELICS, JSON.stringify(list));
      // مكافأة خاصة للمستخدم عند كشف أي نهاية سرية أسطورية: تفعيل تلقائي لعضوية المحقق الأعلى ومختبر مهندس العوالم!
      localStorage.setItem(
        STORAGE_KEY_PRO_PASS,
        JSON.stringify({
          active: true,
          code: 'MYTHIC-LEGEND-2026',
          activatedByMythicEnding: true,
          activatedAt: new Date().toISOString()
        })
      );
    } catch (_) {}
    return existsIdx < 0;
  }

  function isProPassActive() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRO_PASS);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(parsed && parsed.active);
    } catch (_) {
      return false;
    }
  }

  function activateProPassWithCode(rawCode) {
    const code = String(rawCode || '').trim().toUpperCase();
    if (!code) {
      return { ok: false, message: 'يرجى إدخال كود التفعيل أولا.' };
    }
    if (VALID_PRO_CODES.has(code) || code.startsWith('HOM-PRO-')) {
      try {
        localStorage.setItem(
          STORAGE_KEY_PRO_PASS,
          JSON.stringify({
            active: true,
            code,
            activatedAt: new Date().toISOString()
          })
        );
      } catch (_) {}
      return {
        ok: true,
        message: '👑 تم تفعيل عضوية المحقق الأعلى بنجاح! جميع المزايا الاحترافية وحزم العوالم مفتوحة الآن.'
      };
    }
    return {
      ok: false,
      message: 'كود التفعيل غير صالح. يمكنك تجربة كود صناع المحتوى المجاني: MYSTERY-PRO-2026'
    };
  }

  /**
   * قراءة رابط التحدي المباشر عند فتح الموقع (?world=1-1 أو ?case=manor)
   */
  function parseIncomingDeepLink() {
    try {
      const params = new URLSearchParams(window.location.search);
      const worldParam = params.get('world');
      const caseParam = params.get('case');

      if (worldParam && /^\d+-\d+$/.test(worldParam.trim())) {
        const [lawStr, catStr] = worldParam.trim().split('-');
        const lawIndex = Math.max(0, (parseInt(lawStr, 10) || 1) - 1);
        const catalystIndex = Math.max(0, (parseInt(catStr, 10) || 1) - 1);
        return {
          type: 'multiverse',
          scenarioId: 'multiverse',
          lawIndex,
          catalystIndex
        };
      }

      if (caseParam) {
        return {
          type: 'case',
          scenarioId: caseParam.trim()
        };
      }
    } catch (_) {}
    return null;
  }

  /**
   * بناء رابط مباشر لتحدي الأصدقاء في نفس العالم أو القضية
   */
  function buildChallengeUrl(options = {}) {
    const baseUrl = window.location.origin + window.location.pathname;
    if (options.scenarioId === 'multiverse' && typeof options.lawIndex === 'number' && typeof options.catalystIndex === 'number') {
      return `${baseUrl}?world=${options.lawIndex + 1}-${options.catalystIndex + 1}`;
    }
    if (options.scenarioId) {
      return `${baseUrl}?case=${encodeURIComponent(options.scenarioId)}`;
    }
    return baseUrl;
  }

  /**
   * توليد سيناريو فيديو قصير جاهز للتصوير والنشر (TikTok / Reels / Shorts) من عوالم اللعبة الـ 10,000
   */
  function generateViralShortScript(comboOrOptions = {}) {
    const mv = window.MysteryMultiverse;
    if (!mv) return null;

    const combo =
      comboOrOptions && comboOrOptions.law && comboOrOptions.catalyst
        ? comboOrOptions
        : mv.rollMultiverseCombination(comboOrOptions);

    const { law, catalyst, worldNumber, lawIndex, catalystIndex } = combo;
    const challengeUrl = buildChallengeUrl({
      scenarioId: 'multiverse',
      lawIndex: typeof lawIndex === 'number' ? lawIndex : law.id - 1,
      catalystIndex: typeof catalystIndex === 'number' ? catalystIndex : catalyst.id - 1
    });

    const hookLine = `تخيل أن تفتح عينيك في عالم مواز يحكمه قانون واحد صارم: (${law.rule}).`;
    const bodyLine = `في قلب "${catalyst.setting}"، وقعت للتو حادثة "${catalyst.title}"؛ إذ عثر الحراس على (${catalyst.victim}) فاقدا للوعي، بينما اختفى الأثر الأخطر في هذا العالم: (${catalyst.artifact}). ثلاثة مشتبه بهم يقفون أمامك، وكل واحد منهم يخفي كذبة تتناقض مع التوقيت المادي!`;
    const ctaLine = `هل تملك بصيرة المحقق لكشف الفاعل قبل وصول الخطر إلى 100%؟ ادخل العالم رقم (${worldNumber}) الآن من الرابط، واكتب في التعليقات من اتهمت!`;
    const hashtags = `#قلب_الغموض #عابر_العوالم #ماذا_لو #الغاز_بوليسية #قصص_غموض #تحقيق_جنائي`;

    const fullCopyText = [
      `🎬 سيناريو فيديو قصير (TikTok / Reels / Shorts) • العالم #${worldNumber}`,
      `العنوان: ${law.title} × ${catalyst.title}`,
      ``,
      `⏱️ [00:00 - 00:04 | الخطاف الخاطف]:`,
      `«${hookLine}»`,
      ``,
      `⏱️ [00:04 - 00:22 | عقدة الجريمة]:`,
      `«${bodyLine}»`,
      ``,
      `⏱️ [00:22 - 00:30 | التحدي والدعوة للتفاعل]:`,
      `«${ctaLine}»`,
      ``,
      `🔗 رابط التحدي المباشر لهذا العالم: ${challengeUrl}`,
      `${hashtags}`
    ].join('\n');

    const spokenScript = `<breath> ${hookLine} <short pause> ${bodyLine} <short pause> ${ctaLine}`;

    return {
      combo,
      worldNumber,
      title: `العالم #${worldNumber}: ${law.title} × ${catalyst.title}`,
      hookLine,
      bodyLine,
      ctaLine,
      challengeUrl,
      hashtags,
      fullCopyText,
      spokenScript
    };
  }

  /**
   * رسم وتوليد صورة بطاقة النتيجة البصرية (1080x1350 Story PNG) للمشاركة على إنستغرام وواتساب وتيك توك
   */
  async function downloadVerdictStoryCardPng(gameState, outcome) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const isMythic = Boolean(outcome?.isMythicSecret || Number(outcome?.stars) >= 6);

    // 1. خلفية Midnight Sapphire أو Royal Mythic Purple الفاخرة
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
    if (isMythic) {
      bgGrad.addColorStop(0, '#140926');
      bgGrad.addColorStop(0.5, '#1e1038');
      bgGrad.addColorStop(1, '#090612');
    } else {
      bgGrad.addColorStop(0, '#070b14');
      bgGrad.addColorStop(0.5, '#0d1424');
      bgGrad.addColorStop(1, '#090d18');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // هالة ذهبية دافئة في الأعلى
    const radial = ctx.createRadialGradient(540, 260, 40, 540, 260, 540);
    radial.addColorStop(0, isMythic ? 'rgba(251, 191, 36, 0.34)' : 'rgba(229, 169, 60, 0.22)');
    radial.addColorStop(1, 'rgba(229, 169, 60, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 1080, 1350);

    // إطار ذهبي مزدوج
    ctx.strokeStyle = isMythic ? 'rgba(251, 191, 36, 0.85)' : 'rgba(229, 169, 60, 0.55)';
    ctx.lineWidth = isMythic ? 6 : 4;
    ctx.strokeRect(48, 48, 984, 1254);

    ctx.strokeStyle = isMythic ? 'rgba(192, 132, 252, 0.45)' : 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(68, 68, 944, 1214);

    ctx.textAlign = 'center';
    ctx.direction = 'rtl';

    // 2. العنوان العلوي
    ctx.fillStyle = isMythic ? '#fde68a' : '#e5a93c';
    ctx.font = 'bold 34px Tajawal, Cairo, sans-serif';
    ctx.fillText(
      isMythic
        ? '👑 شهادة المحقق الأسطوري • كاشف النهاية السرية المخبأة'
        : '🕯️ مسرح التحقيق الصوتي التفاعلي • قلب الغموض',
      540,
      150
    );

    // 3. اسم القضية أو العالم
    const caseTitle = String(gameState?.scenarioTitle || 'قضية جنائية غامضة').slice(0, 52);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 46px Amiri, Cairo, serif';
    ctx.fillText(caseTitle, 540, 245);

    // 4. النجوم (6 نجوم للنهاية الأسطورية!)
    const starsCount = Math.max(1, Math.min(6, Number(outcome?.stars) || 1));
    const starsStr = isMythic
      ? '👑 ★ ★ ★ ★ ★ ★ 👑'
      : '★'.repeat(starsCount) + '☆'.repeat(Math.max(0, 5 - starsCount));
    ctx.fillStyle = '#fbbf24';
    ctx.font = isMythic ? 'bold 62px sans-serif' : 'bold 76px sans-serif';
    ctx.fillText(starsStr, 540, 360);

    // 5. عنوان النهاية المحققة
    ctx.fillStyle = isMythic ? '#fde047' : '#34d399';
    ctx.font = 'bold 38px Cairo, Tajawal, sans-serif';
    ctx.fillText(String(outcome?.endingTitle || 'حسم القضية الجنائية').slice(0, 56), 540, 445);

    // شريط الأثر الأسطوري إن وجد
    if (isMythic && outcome?.mythicReward) {
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 32px Tajawal, sans-serif';
      ctx.fillText(
        `🏆 الأثر الأسطوري المكتسب: ${outcome.mythicReward.relicIcon} ${outcome.mythicReward.relicName}`,
        540,
        505
      );
    }

    // 6. صندوق إحصائيات المحقق (بدون حرق لهوية الجاني!)
    ctx.fillStyle = isMythic ? 'rgba(28, 16, 52, 0.92)' : 'rgba(17, 25, 43, 0.9)';
    ctx.fillRect(110, 545, 860, 420);
    ctx.strokeStyle = isMythic ? 'rgba(251, 191, 36, 0.65)' : 'rgba(229, 169, 60, 0.38)';
    ctx.lineWidth = 2;
    ctx.strokeRect(110, 545, 860, 420);

    const stats = [
      `🕵️ المحقق: ${gameState?.playerName || 'آدم'} (${isMythic ? 'رتبة المحقق الأسطوري 👑' : gameState?.detectiveStyle || 'محقق جنائي'})`,
      `📖 الفصول المنجزة: ${gameState?.turn || 1} فصول`,
      `🔍 الأدلة المادية المكتشفة: ${(gameState?.clues || []).length} أدلة`,
      `🧠 تغطية الاستنتاج الجنائي: ${gameState?.twistProgress || 0}%`,
      `⚡ مستوى الخطر النهائي: ${gameState?.dangerLevel || 15}%`
    ];

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 34px Tajawal, sans-serif';
    stats.forEach((line, idx) => {
      ctx.fillText(line, 540, 625 + idx * 70);
    });

    // 7. دعوة التحدي في الأسفل
    ctx.fillStyle = '#e5a93c';
    ctx.font = 'bold 34px Tajawal, sans-serif';
    ctx.fillText(
      isMythic
        ? 'لقد كشفت النهاية السرية الأسطورية المخبأة! هل يستطيع أصدقاؤك الوصول إليها؟'
        : 'هل تستطيع كشف الحقيقة بأدلة أقل؟ جرب التحدي الآن:',
      540,
      1085
    );

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 32px JetBrains Mono, monospace';
    ctx.fillText('labyrinth-of-shadows.pages.dev', 540, 1155);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '26px Tajawal, sans-serif';
    ctx.fillText('بطاقة نتيجة خالية من حرق الأحداث • شاركها مع أصدقائك', 540, 1225);

    return new Promise(resolve => {
      canvas.toBlob(blob => {
        if (!blob) {
          resolve(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `heart-of-mystery-verdict-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        resolve(true);
      }, 'image/png');
    });
  }

  /**
   * مشاركة سريعة عبر واتساب أو منصة X أو نافذة المشاركة الأصلية للجوال
   */
  function shareViaChannel(channel, text, url) {
    const cleanUrl = url || window.location.origin;
    const combined = `${text}\n\n🔗 جرب التحدي مباشرة: ${cleanUrl}`;

    if (channel === 'whatsapp') {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(combined)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (channel === 'twitter') {
      const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(cleanUrl)}`;
      window.open(xUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (channel === 'telegram') {
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(cleanUrl)}&text=${encodeURIComponent(text)}`;
      window.open(tgUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (navigator.share) {
      navigator.share({ title: 'قلب الغموض', text, url: cleanUrl }).catch(() => {});
    }
  }

  window.MysteryViralEngine = {
    isProPassActive,
    activateProPassWithCode,
    getUnlockedMythicRelics,
    recordUnlockedMythicRelic,
    parseIncomingDeepLink,
    buildChallengeUrl,
    generateViralShortScript,
    downloadVerdictStoryCardPng,
    shareViaChannel
  };
})();
