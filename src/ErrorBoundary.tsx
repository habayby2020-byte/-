import React from 'react';

/**
 * يمنع "الشاشة السوداء الصامتة": لو أي مكوّن رمى خطأ أثناء العرض، React يشيل
 * الشجرة كلها وتبقى الصفحة سوداء بدون أي أثر. هنا نعرض نص الخطأ بدلها،
 * عشان نعرف السبب الحقيقي بدل التخمين.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('UI crashed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div
        dir="ltr"
        style={{
          minHeight: '100vh',
          background: '#0f172a',
          color: '#fecaca',
          padding: 16,
          fontFamily: 'monospace',
          fontSize: 12,
          whiteSpace: 'pre-wrap',
          overflow: 'auto',
        }}
      >
        <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>حدث خطأ في الواجهة (صوّر هذي الشاشة وأرسلها):</div>
        {error.message}
        {'\n\n'}
        {error.stack}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '8px 14px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 0 }}
          >
            إعادة تحميل
          </button>
        </div>
      </div>
    );
  }
}
