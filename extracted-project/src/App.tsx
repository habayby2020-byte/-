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
import { HexHome } from './components/home/HexHome';
import { AppsGridScreen } from './components/appsgrid/AppsGridScreen';
import { AndroidAppsScreen } from './components/androidapps/AndroidAppsScreen';
import { AppFrame } from './components/frame/AppFrame';

/**
 * يستمع لأوامر التحكم الواصلة من الجوال (حقن JS مباشر عبر
 * MiracastPresentationPlugin.java، بدون أي شبكة) ويحوّلها لحركة
 * مؤشر/كتابة/صورة فعلية على هذه الشاشة. ما له علاقة بأي شيء يخص
 * تسجيل الدخول أو الشاشة المعروضة حالياً — يشتغل دايماً بالخلفية.
 */
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
          break;
        case 'pointer-right-click':
          cursor.rightClick();
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
          break;
        case 'key-down':
          cursor.keyDown(message.key, message.code, {
            ctrlKey: message.ctrlKey,
            altKey: message.altKey,
            shiftKey: message.shiftKey,
          });
          break;
        case 'key-up':
          cursor.keyUp(message.key, message.code);
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

type BootPhase = 'login' | 'welcome' | 'ready';

/**
 * موجّه الشاشات: دخول (لمرة وحدة لحد ما تسجّل دخروج) → ترحيب (كل مرة
 * دخول ناجح) → بعدها شاشة واحدة بكل مرة من screenStack
 * (WindowManagerContext) — بدون أي تراكب نوافذ.
 */
const AstraTv: React.FC = () => {
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

  return (
    <WindowManagerProvider>
      <CursorProvider>
        <div className="relative w-screen h-screen overflow-hidden select-none">
          {phase === 'login' && <LoginGate onSuccess={handleLoginSuccess} />}
          {phase === 'welcome' && <WelcomeIntro name={welcomeName} onDone={() => setPhase('ready')} />}
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
 * - جهاز العرض (#tv): واجهة ASTRA الكاملة، يستمع لأوامر جوال التحكم
 *   عبر MiracastPresentationPlugin.java — التلفزيون "عارض" بس، يفتحه
 *   الـ plugin تلقائياً داخل نافذة Presentation بمجرد ما يتصل
 *   Miracast. ما تغيّر شيء هنا — القاعدة هذي شغّالة ١٠٠٪.
 */
export default function App() {
  if (window.location.hash === '#tv') {
    return <AstraTv />;
  }
  return <ControllerApp />;
}
