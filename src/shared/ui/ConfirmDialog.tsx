import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }
    dialog.showModal();
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
      <h2>{title}</h2>
      <p>{message}</p>
      {error ? <p role="alert">{error}</p> : null}
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
    </dialog>
  );
}
