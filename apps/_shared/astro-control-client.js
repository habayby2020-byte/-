/**
 * astro-control-client.js — "اربط وخلاص"
 *
 * انسخ هالملف داخل مجلد لعبتك، وحطه بـ <script src="astro-control-client.js"></script>
 * (قبل كود لعبتك)، أو انسخ المحتوى كامل جوا وسم <script> بصفحتك مباشرة.
 * ما يحتاج أي مكتبة ثانية ولا بناء (build) — جافاسكربت عادي بس.
 *
 * بيستمع تلقائياً لحدث astro:control اللي يبثه تطبيق Astro TV، ويوفر
 * لك AstroControl.on(buttonId, {down, up}) لكل زر لحاله، و
 * AstroControl.onCombo([buttonId1, buttonId2, ...], callback) لما
 * تبي زرين (أو أكثر) "يضغطون سوا" — بالضبط زي ما طلبت.
 */
(function () {
  const listeners = {};      // buttonId -> [{down, up}]
  const combos = [];         // { ids: Set, fired: bool, cb: fn }
  const heldButtons = new Set();

  function emit(buttonId, phase) {
    (listeners[buttonId] || []).forEach(l => {
      if (phase === 'down' && l.down) l.down();
      if (phase === 'up' && l.up) l.up();
    });
  }

  function checkCombos() {
    combos.forEach(c => {
      const allDown = [...c.ids].every(id => heldButtons.has(id));
      if (allDown && !c.fired) {
        c.fired = true;
        c.cb();
      } else if (!allDown) {
        c.fired = false;
      }
    });
  }

  document.addEventListener('astro:control', (e) => {
    const { phase, buttonId } = e.detail || {};
    if (!buttonId) return;

    if (phase === 'down') heldButtons.add(buttonId);
    if (phase === 'up') heldButtons.delete(buttonId);

    emit(buttonId, phase);
    checkCombos();
  });

  window.AstroControl = {
    /** زر واحد لحاله: AstroControl.on('gamepad.action.bottom', { down: () => jump() }) */
    on(buttonId, handlers) {
      if (!listeners[buttonId]) listeners[buttonId] = [];
      listeners[buttonId].push(handlers);
    },

    /** أكثر من زر "يُضغطون سوا" بنفس اللحظة — ينادي callback مرة
     * وحدة بس أول ما كل الأزرار تصير نازلة سوا (مو مع كل تحديث).
     * مثال: AstroControl.onCombo(['gamepad.shoulder.l1','gamepad.action.bottom'], () => specialMove()) */
    onCombo(buttonIds, callback) {
      combos.push({ ids: new Set(buttonIds), fired: false, cb: callback });
    },

    /** هل الزر "نازل" (مضغوط) هذي اللحظة بالضبط؟ مفيد لحلقة اللعبة (game loop). */
    isDown(buttonId) {
      return heldButtons.has(buttonId);
    },
  };
})();
