/**
 * astro-control-client.js — "اربط وخلاص"
 *
 * انسخ هالملف داخل مجلد لعبتك، وحطه بـ <script src="astro-control-client.js"></script>
 * (قبل كود لعبتك)، أو انسخ المحتوى كامل جوا وسم <script> بصفحتك مباشرة.
 *
 * ملاحظة مهمة بالصدق: الكيبورد والماوس الحقيقيين يشتغلون تلقائياً
 * بأي تطبيق ويب بدون هذا الملف إطلاقاً (أحداث DOM حقيقية). هذا الملف
 * يضيف طبقتين فوق هذا بس، اختياريتين:
 *  ١) AstroControl.on(buttonId, ...) — أسماء أزرار ثابتة (بوابة/زر)
 *     بدل التعامل مع key/code خام، مفيد لتركيبات الأزرار (combos).
 *  ٢) محاكاة Gamepad API — لو لعبتك تستخدم navigator.getGamepads()
 *     (زي أغلب محركات الألعاب: Phaser, Unity WebGL، إلخ)، هذا الملف
 *     يخلي المتصفح "يشوف" يد تحكم وهمية متصلة فعلاً، وتتحرك أزرارها
 *     حسب ضغطات يد التحكم الحقيقية من الجوال — بدون ما تغيّر كود
 *     لعبتك إطلاقاً لو أصلاً يدعم Gamepad API قياسي.
 *
 * حد هذا الملف الصادق: يشتغل بس مع تطبيقات/ألعاب ويب (داخل apps/).
 * ما يقدر يخلي تطبيقات أندرويد *حقيقية* مثبّتة (APK فعلي زي
 * Minecraft أو Roblox الحقيقي) تشوف يد تحكم وهمية — هذا يحتاج صلاحية
 * نظام/root ما تتوفر لتطبيق عادي، ولا أقدر أدّعي إني حليته لأنه
 * تقنياً مو ممكن بدونها.
 */
(function () {
  const listeners = {};
  const combos = [];
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
      if (allDown && !c.fired) { c.fired = true; c.cb(); }
      else if (!allDown) { c.fired = false; }
    });
  }

  // خريطة buttonId → index زر Gamepad API القياسي (نفس ترقيم Xbox/PS
  // المعتمد بكل المتصفحات: standard gamepad mapping).
  const GAMEPAD_BUTTON_INDEX = {
    'gamepad.action.bottom': 0, // A / Cross
    'gamepad.action.right': 1,  // B / Circle
    'gamepad.action.left': 2,   // X / Square
    'gamepad.action.top': 3,    // Y / Triangle
    'gamepad.shoulder.l1': 4,
    'gamepad.shoulder.r1': 5,
    'gamepad.trigger.l2': 6,
    'gamepad.trigger.r2': 7,
    'gamepad.menu.select': 8,
    'gamepad.menu.start': 9,
    'gamepad.dpad.up': 12,
    'gamepad.dpad.down': 13,
    'gamepad.dpad.left': 14,
    'gamepad.dpad.right': 15,
  };
  // خريطة العصا الثانية (stick2) → محور Gamepad API (axes[2]/axes[3]).
  const STICK2_AXIS = {
    'gamepad.stick2.left': [2, -1], 'gamepad.stick2.right': [2, 1],
    'gamepad.stick2.up': [3, -1], 'gamepad.stick2.down': [3, 1],
  };

  const fakeGamepadButtons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
  const fakeGamepadAxes = [0, 0, 0, 0];
  let gamepadConnected = false;
  let gamepadTimestamp = 0;

  function ensureGamepadConnectedEvent() {
    if (gamepadConnected) return;
    gamepadConnected = true;
    gamepadTimestamp = performance.now();
    try {
      window.dispatchEvent(new Event('gamepadconnected'));
    } catch {}
  }

  function updateFakeGamepad(buttonId, phase) {
    const idx = GAMEPAD_BUTTON_INDEX[buttonId];
    if (idx != null) {
      ensureGamepadConnectedEvent();
      fakeGamepadButtons[idx].pressed = phase === 'down';
      fakeGamepadButtons[idx].value = phase === 'down' ? 1 : 0;
      gamepadTimestamp = performance.now();
    }
    const axis = STICK2_AXIS[buttonId];
    if (axis) {
      ensureGamepadConnectedEvent();
      fakeGamepadAxes[axis[0]] = phase === 'down' ? axis[1] : 0;
      gamepadTimestamp = performance.now();
    }
  }

  // Polyfill حقيقي لـnavigator.getGamepads — يرجّع يد تحكم وهمية
  // واحدة بمواصفات "standard" القياسية لو أي زر اتضغط ولو مرة.
  try {
    const originalGetGamepads = navigator.getGamepads ? navigator.getGamepads.bind(navigator) : null;
    Object.defineProperty(navigator, 'getGamepads', {
      value: function () {
        if (!gamepadConnected) return originalGetGamepads ? originalGetGamepads() : [];
        return [{
          id: 'Astro Virtual Controller (Standard Gamepad)',
          index: 0,
          connected: true,
          mapping: 'standard',
          timestamp: gamepadTimestamp,
          axes: fakeGamepadAxes.slice(),
          buttons: fakeGamepadButtons.map(b => ({ pressed: b.pressed, touched: b.pressed, value: b.value })),
        }];
      },
      configurable: true,
    });
  } catch {
    // بعض المتصفحات ما تسمح بإعادة تعريف navigator.getGamepads —
    // AstroControl.on/.isDown يضلون يشتغلون عادي حتى لو هذا الجزء فشل.
  }

  function handle(phase, buttonId) {
    if (!buttonId) return;
    if (phase === 'down') heldButtons.add(buttonId);
    if (phase === 'up') heldButtons.delete(buttonId);
    emit(buttonId, phase);
    checkCombos();
    updateFakeGamepad(buttonId, phase);
  }

  document.addEventListener('astro:control', (e) => {
    const { phase, buttonId } = e.detail || {};
    handle(phase, buttonId);
  });

  window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data || !data.__astroControl) return;
    handle(data.phase, data.buttonId);
  });

  window.AstroControl = {
    on(buttonId, handlers) {
      if (!listeners[buttonId]) listeners[buttonId] = [];
      listeners[buttonId].push(handlers);
    },
    onCombo(buttonIds, callback) {
      combos.push({ ids: new Set(buttonIds), fired: false, cb: callback });
    },
    isDown(buttonId) {
      return heldButtons.has(buttonId);
    },
  };
})();
