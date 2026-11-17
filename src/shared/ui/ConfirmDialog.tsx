import { useEffect, useRef, type ReactNode } from 'react';
import { StatusMessage } from '@/shared/ui/StatusMessage';

interface ConfirmDialogProps {
  title: string;
  message?: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  error?: string | null;
  confirmClassName?: string;
  alignEnd?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  children,
  confirmLabel,
  cancelLabel,
  busy = false,
  error = null,
  confirmClassName = 'btn',
  alignEnd = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    dialog.showModal();
    panelRef.current?.focus();
    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={event => {
        event.preventDefault();
        if (!busy) {
          onCancel();
        }
      }}
      onClick={event => {
        if (event.target === event.currentTarget && !busy) {
          onCancel();
        }
      }}
    >
      <div ref={panelRef} className="modal-panel" tabIndex={-1}>
      <h2>{title}</h2>
      {message ? <p>{message}</p> : null}
      {children}
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      <div className={alignEnd ? 'modal-actions modal-actions-end' : 'modal-actions'}>
        {alignEnd ? (
          <button className="btn btn-secondary" type="button" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
        ) : null}
        <button className={confirmClassName} type="button" disabled={busy} onClick={onConfirm}>
          {confirmLabel}
        </button>
        {alignEnd ? null : (
          <button className="btn btn-secondary" type="button" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
        )}
      </div>
      </div>
    </dialog>
  );
}
