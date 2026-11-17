import { businessToday, deliveryDaysThroughSunday, type WeekDeliveryDay } from '@/modules/sales/domain/deliveryDays';
import { useLocale } from '@/shared/i18n/useLocale';

interface DeliveryDayCardProps {
  selectedDate: string | null;
  disabled?: boolean;
  days?: WeekDeliveryDay[];
  onSelect: (deliveryDate: string) => void;
}

export function DeliveryDayCard({ selectedDate, disabled, days, onSelect }: DeliveryDayCardProps) {
  const { t, locale } = useLocale();
  const today = businessToday();
  const options = days ?? deliveryDaysThroughSunday(today);

  return (
    <section className="card delivery-day-card">
      <div className="delivery-day-head">
        <span className="step-num">2</span>
        <span>{t('deliveryDay')}</span>
        {selectedDate ? <span className="delivery-day-value">{formatDeliveryHeading(selectedDate, locale)}</span> : null}
      </div>
      <div
        className="delivery-days"
        role="group"
        aria-label={t('deliveryDay')}
        style={{ ['--day-count' as string]: String(options.length) }}
      >
        {options.map(day => {
          const pressed = day.date === selectedDate;
          return (
            <button
              key={day.date}
              className="day-chip"
              type="button"
              aria-pressed={pressed}
              disabled={disabled}
              onClick={() => onSelect(day.date)}
            >
              <small>{day.date === today ? t('today') : shortWeekday(day.date, locale)}</small>
              <b>{dayNumber(day)}</b>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function dayNumber(day: WeekDeliveryDay): number {
  if (Number.isInteger(day.dayOfMonth)) {
    return day.dayOfMonth;
  }
  return Number(day.date.slice(8, 10)) || 0;
}

function shortWeekday(date: string, locale: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const name = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    weekday: 'short',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, (month || 1) - 1, day || 1)));
  return name.replace('.', '');
}

function formatDeliveryHeading(value: string, locale: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return value;
  }
  const language = locale === 'en' ? 'en-US' : 'es-CO';
  const formatted = new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)));
  const cleaned = formatted.replace(',', '');
  return cleaned.charAt(0).toLocaleUpperCase(language) + cleaned.slice(1);
}
