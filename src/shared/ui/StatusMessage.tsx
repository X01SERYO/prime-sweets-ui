import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

type StatusTone = 'error' | 'warning' | 'info' | 'success';

export function StatusMessage({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`status status-${tone}${className ? ` ${className}` : ''}`}
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
    >
      <span className="status-mark" aria-hidden="true">
        <StatusIcon tone={tone} />
      </span>
      <div className="status-body">{children}</div>
    </div>
  );
}

function StatusIcon({ tone }: { tone: StatusTone }) {
  if (tone === 'error') {
    return <XCircle strokeWidth={1.8} />;
  }
  if (tone === 'warning') {
    return <AlertTriangle strokeWidth={1.8} />;
  }
  if (tone === 'success') {
    return <CheckCircle strokeWidth={1.8} />;
  }
  return <Info strokeWidth={1.8} />;
}
