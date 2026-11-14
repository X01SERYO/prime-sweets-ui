import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StatusMessage } from '@/shared/ui/StatusMessage';

const leaveMs = 380;

export function toastDuration(message: string, durationMs?: number): number {
  if (durationMs !== undefined) {
    return durationMs;
  }
  return Math.min(12000, 4000 + message.length * 45);
}

export function AppToast({
  tone,
  message,
  durationMs,
  onDone,
  children,
}: {
  tone: 'error' | 'warning' | 'info' | 'success';
  message: string;
  durationMs?: number;
  onDone?: () => void;
  children?: ReactNode;
}) {
  const [leaving, setLeaving] = useState(false);
  const visibleFor = toastDuration(message, durationMs);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setLeaving(false);
    const hide = window.setTimeout(() => setLeaving(true), visibleFor);
    const done = window.setTimeout(() => onDoneRef.current?.(), visibleFor + leaveMs);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(done);
    };
  }, [message, visibleFor]);

  return (
    <StatusMessage tone={tone} className={`app-toast${leaving ? ' is-leaving' : ''}`}>
      {children ?? message}
    </StatusMessage>
  );
}
