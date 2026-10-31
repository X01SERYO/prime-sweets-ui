import { useEffect, useRef } from 'react';
import { businessToday, deliveryDaysThroughSunday, type WeekDeliveryDay } from '@/modules/sales/domain/deliveryDays';
import { useLocale } from '@/shared/i18n/useLocale';

interface DeliveryDateModalProps {
  onSelect: (deliveryDate: string) => void;
  onClose: () => void;
  days?: WeekDeliveryDay[];
  title?: string;
}

export function DeliveryDateModal({ onSelect, onClose, days, title }: DeliveryDateModalProps) {
  const { t, locale } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const today = businessToday();
  const options = days ?? deliveryDaysThroughSunday(today);

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
      className="modal delivery-date-modal"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-toolbar">
        <h2>{title ?? t('deliveryDate')}</h2>
        <button className="modal-x" type="button" aria-label={t('close')} onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"
            />
          </svg>
        </button>
      </div>
      <div className="delivery-days">
        {options.map(day => (
          <button key={day.date} className="btn btn-secondary" type="button" onClick={() => onSelect(day.date)}>
            {day.date === today ? t('today') : weekdayLabel(day.date, day.dayOfMonth, locale)}
          </button>
        ))}
      </div>
    </dialog>
  );
}

function weekdayLabel(date: string, dayOfMonth: number, locale: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const name = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    weekday: 'long',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)));
  const lower = name.toLocaleLowerCase(locale === 'en' ? 'en-US' : 'es-CO');
  const label = `${lower} ${dayOfMonth}`;
  return label.charAt(0).toLocaleUpperCase(locale === 'en' ? 'en-US' : 'es-CO') + label.slice(1);
}
