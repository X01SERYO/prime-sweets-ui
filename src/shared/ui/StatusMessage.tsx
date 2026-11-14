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
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7.5v6M12 16.5h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (tone === 'warning') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M12 4.5 20 19H4L12 4.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 10v4.2M12 16.8h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (tone === 'success') {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="m8.2 12.2 2.4 2.4 5.2-5.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v5.2M12 8h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
