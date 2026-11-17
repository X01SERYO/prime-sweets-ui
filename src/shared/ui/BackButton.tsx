import type { ReactNode } from 'react';

export function NavigationHistory({ children }: { children: ReactNode }) {
  return children;
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  return (
    <div className="screen-title">
      <h1>{children}</h1>
    </div>
  );
}
