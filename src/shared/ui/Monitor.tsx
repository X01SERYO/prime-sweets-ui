import { Component, type ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router';
import { log } from '@/shared/infrastructure/logging/logger';

export function ScreenMonitor() {
  const location = useLocation();

  useEffect(() => {
    const screenId = crypto.randomUUID();
    const started = Date.now();
    log('info', 'ui.screen.start', { screenId, path: location.pathname });
    return () => {
      log('info', 'ui.screen.end', {
        screenId,
        path: location.pathname,
        durationMs: Date.now() - started
      });
    };
  }, [location.pathname]);

  return null;
}

interface BoundaryProps {
  children: ReactNode;
}

interface BoundaryState {
  failed: boolean;
}

export class ScreenErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error): void {
    log('error', 'ui.screen.failed', { message: error.message });
  }

  render(): ReactNode {
    if (this.state.failed) {
      return <p role="alert">No se pudo mostrar esta pantalla.</p>;
    }
    return this.props.children;
  }
}
