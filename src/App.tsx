/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { WindowManagerProvider, useWindowManager } from './context/WindowManagerContext';
import { ControllerApp } from './components/controller/ControllerApp';
import { CursorProvider, useCursor } from './cast/CursorContext';
import { VirtualCursor } from './components/cursor/VirtualCursor';
import { KeyFeedbackOverlay } from './components/cursor/KeyFeedbackOverlay';
import { startCastReceiver } from './cast/receiver';
import { CastMessage } from './cast/types';
import { useSuppressNativeKeyboard } from './services/suppressNativeKeyboard';
import { getSavedAccount } from './services/auth';
import { LoginGate } from './components/boot/LoginGate';
import { WelcomeIntro } from './components/boot/WelcomeIntro';
import { ProjectFolderSetup } from './components/boot/ProjectFolderSetup';
import { HexHome } from './components/home/HexHome';
import { AppsGridScreen } from './components/appsgrid/AppsGridScreen';
import { AndroidAppsScreen } from './components/androidapps/AndroidAppsScreen';
import { AppFrame } from './components/frame/AppFrame';
import { GATE_KEYS, ControlGate } from './cast/controlKeys';

/**
 * يستمع لأوامر التحكم الواصلة من الجوال (حقن JS مباشر عبر
 * MiracastPresentationPlugin.java، بدون أي شبكة) ويحوّلها لحركة
 * مؤشر/كتابة/صورة فعلية على هذه الشاشة. ما له علاقة بأي شيء يخص
 * تسجيل الدخول أو الشاشة المعروضة حالياً — يشتغل دايماً بالخلفية.
 */
/**
 * يبث حدث DOM عام (CustomEvent) باسم ثابت "astro:control" لكل ضغطة
 * زر لها buttonId — بمعزل كامل عن محاكاة الكيبورد الفعلية فوق. أي
 * لعبة/تطبيق ويب تبنيه (حتى بمحادثة ثانية ما شافت الكود هذا إطلاقاً)
 * يقدر يستمع له مباشرة:
 *
 *   document.addEventListener('astro:control', (e) => {
 *     const { phase, buttonId } = e.detail; // phase: 'down' | 'up'
 *     if (buttonId === 'gamepad.action.bottom' && phase === 'down') jump();
 *   });
 *
 * buttonId هو "المفتاح الثابت" نفسه من src/cast/controlKeys.ts —
 * بروتوكول مستقل بحاله، موثّق بالكامل بنص واحد، بدون أي حاجة لملف
 * المشروع. ما يغيّر أو يعطّل محاكاة الكيبورد العادية أبداً — إضافة
 * موازية بس.
 *
 * gateKey = مفتاح البوابة نفسها (GATE_KEYS بـ controlKeys.ts، مثلاً
 * "gate.keyboard") — يوصل بالحدث قبل buttonId، بالضبط زي ما طلبت:
 * "مفتاح البوابة" ثم "مفتاح الزر جواها". غيّر قيم GATE_KEYS أو أي
 * buttonId بملف controlKeys.ts لأي شكل تبيه (حتى لو رمز عشوائي مثل "V-4").
 */
function broadcastButtonEvent(
  phase: 'down' | 'up',
  source: ControlGate,
  buttonId: string | undefined,
  key: string,
  code: string
) {
  if (!buttonId) return;
  const gateKey = GATE_KEYS[source];
  document.dispatchEvent(
    new CustomEvent('astro:control', { detail: { phase, source, gateKey, buttonId, key, code } })
  );
}

const ReceiverBridge: React.FC = () => {
  const cursor = useCursor();
  const { createFile } = useWindowManager();

  useEffect(() => {
    const handle = (message: CastMessage) => {
      switch (message.type) {
        case 'pointer-move':
          cursor.moveBy(message.dx, message.dy);
          break;
        case 'pointer-down':
          cursor.pointerDown();
          break;
        case 'pointer-up':
          cursor.pointerUp();
          break;
        case 'pointer-click':
          cursor.click();
          broadcastButtonEvent('down', message.source, message.buttonId, 'MouseLeft', 'MouseLeft');
          broadcastButtonEvent('up', message.source, message.buttonId, 'MouseLeft', 'MouseLeft');
          break;
        case 'pointer-right-click':
          cursor.rightClick();
          broadcastButtonEvent('down', message.source, message.buttonId, 'MouseRight', 'MouseRight');
          broadcastButtonEvent('up', message.source, message.buttonId, 'MouseRight', 'MouseRight');
          break;
        case 'key-text':
          cursor.typeText(message.text);
          break;
        case 'key':
          cursor.sendKey(message.key, message.code, {
            ctrlKey: message.ctrlKey,
            altKey: message.altKey,
            shiftKey: message.shiftKey,
          });
          // أي حرف عادي (حتى لو ما له buttonId معرّف مسبقاً بـ
          // controlKeys.ts) يفتح بوابة الكيبورد نفس الشي — نولّد له
          // مفتاح تلقائي keyboard.<code> عشان الحدث يطلق دايماً، بدون
          // ما تحتاج تكتب مفتاح لكل حرف بالأبجدية يدوياً.
          broadcastButtonEvent(
            'down',
            message.source,
            message.buttonId ?? `keyboard.${message.code}`,
            message.key,
            message.code
          );
          broadcastButtonEvent(
            'up',
            message.source,
            message.buttonId ?? `keyboard.${message.code}`,
            message.key,
            message.code
          );
          break;
        case 'key-down':
          cursor.keyDown(message.key, message.code, {
            ctrlKey: message.ctrlKey,
            altKey: message.altKey,
            shiftKey: message.shiftKey,
          });
          broadcastButtonEvent('down', message.source, message.buttonId, message.key, message.code);
          break;
        case 'key-up':
          cursor.keyUp(message.key, message.code);
          broadcastButtonEvent('up', message.source, message.buttonId, message.key, message.code);
          break;
        case 'scroll':
          cursor.scrollBy(message.dy);
          break;
        case 'file-upload':
          // صورة وصلت من معرض/كاميرا الجوال — تُحفظ كملف صورة بمجلد
          // "صور الجوال" الافتراضي، تظهر فوراً بمستكشف الملفات.
          createFile('folder-photos', message.name, message.dataUrl, 'this-pc', 'image');
          break;
      }
    };
    startCastReceiver(handle);
  }, [cursor, createFile]);

  return null;
};

type BootPhase = 'login' | 'welcome' | 'setup-folder' | 'ready';
const PROJECT_FOLDER_NAME_KEY = 'astro-project-folder-name';

/**
 * موجّه الشاشات: دخول (لمرة وحدة لحد ما تسجّل دخروج) → ترحيب (كل مرة
 * دخول ناجح) → بعدها شاشة واحدة بكل مرة من screenStack
 * (WindowManagerContext) — بدون أي تراكب نوافذ.
 */
const AstroTv: React.FC = () => {
  // LoginGate نفسه يقرر داخلياً تسجيل جديد أو شاشة فتح بالرمز، حسب
  // وجود حساب محفوظ (getSavedAccount) — هنا بس نبدأ دايماً بمرحلة
  // الدخول.
  const [phase, setPhase] = useState<BootPhase>('login');
  const [welcomeName, setWelcomeName] = useState('');

  useSuppressNativeKeyboard(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-tv', 'true');
    return () => document.documentElement.removeAttribute('data-tv');
  }, []);

  const handleLoginSuccess = () => {
    setWelcomeName(getSavedAccount()?.name ?? '');
    setPhase('welcome');
  };

  // أول دخول بس (ما فيه اسم مجلد محفوظ محلياً من قبل) → شاشة إنشاء
  // مجلد المشروع، بعد الترحيب مباشرة. الدخلات الجاية تتخطاها تلقائياً.
  const handleWelcomeDone = () => {
    const hasProjectFolder = !!localStorage.getItem(PROJECT_FOLDER_NAME_KEY);
    setPhase(hasProjectFolder ? 'ready' : 'setup-folder');
  };

  return (
    <WindowManagerProvider>
      <CursorProvider>
        <div className="relative w-screen h-screen overflow-hidden select-none">
          {phase === 'login' && <LoginGate onSuccess={handleLoginSuccess} />}
          {phase === 'welcome' && <WelcomeIntro name={welcomeName} onDone={handleWelcomeDone} />}
          {phase === 'setup-folder' && <ProjectFolderSetup onDone={() => setPhase('ready')} />}
          {phase === 'ready' && <ScreenRouter />}

          {/* مؤشر الفأرة البعيد + تنبيه الحرف المكتوب — دايماً فوق كل شيء، بكل الشاشات */}
          <VirtualCursor />
          <KeyFeedbackOverlay />
          <ReceiverBridge />
        </div>
      </CursorProvider>
    </WindowManagerProvider>
  );
};

const ScreenRouter: React.FC = () => {
  const { screen } = useWindowManager();

  switch (screen.kind) {
    case 'home':
      return <HexHome />;
    case 'apps-grid':
      return <AppsGridScreen />;
    case 'android-apps':
      return <AndroidAppsScreen />;
    case 'app':
      return <AppFrame appId={screen.appId} data={screen.data} />;
    default:
      return <HexHome />;
  }
};

/**
 * دورين بس:
 * - جهاز التحكم (بدون #tv): لوحة تاتش باد + كيبورد. هذا اللي تفتحه
 *   على جوالك وتتحكم منه.
 * - جهاز العرض (#tv): واجهة ASTRO الكاملة، يستمع لأوامر جوال التحكم
 *   عبر MiracastPresentationPlugin.java — التلفزيون "عارض" بس، يفتحه
 *   الـ plugin تلقائياً داخل نافذة Presentation بمجرد ما يتصل
 *   Miracast. ما تغيّر شيء هنا — القاعدة هذي شغّالة ١٠٠٪.
 */
export default function App() {
  if (window.location.hash === '#tv') {
    return <AstroTv />;
  }
  return <ControllerApp />;
}
