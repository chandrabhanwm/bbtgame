import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Top-level error boundary — wraps the entire app in main.tsx. Without
 * this, any unhandled error during render (a bad array index, an
 * undefined property, anything) took the whole app down to a genuinely
 * blank white screen, with no fallback UI and no way to recover short
 * of the user knowing to manually reload. For real players on real,
 * messy devices, that reads as "the app is just broken," not a
 * recoverable hiccup.
 *
 * Deliberately simple: no error-reporting service is wired into this
 * project, so this only logs to the console (for anyone checking dev
 * tools) and gives the player a real, obvious way forward — reloading
 * picks up their actual save, which lives in localStorage/Firestore,
 * not in whatever crashed.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '24px',
            textAlign: 'center',
            backgroundColor: '#1a130e',
            color: '#f2dcae',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div style={{ fontSize: '40px' }}>⚠️</div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
            Something went wrong
          </div>
          <div style={{ fontSize: '13px', color: '#c9a878', maxWidth: '280px', lineHeight: 1.5 }}>
            Your progress is safely saved — this screen just needs a reload to get back on track.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '8px',
              padding: '12px 28px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: '#f2c14e',
              color: '#241a13',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Tap to reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
