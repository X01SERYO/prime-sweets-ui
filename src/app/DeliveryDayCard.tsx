import { useLocale } from '@/shared/i18n/useLocale';

interface DeliveryDayCardProps {
  deliveryDate: string;
  onChange?: () => void;
}

export function DeliveryDayCard({ deliveryDate, onChange }: DeliveryDayCardProps) {
  const { t, locale } = useLocale();

  return (
    <section className="card delivery-day-card">
      <div className="delivery-day-text">
        <span className="customer-kicker">{t('deliveryDay')}</span>
        <span className="delivery-day-value">{formatDeliveryHeading(deliveryDate, locale)}</span>
      </div>
      {onChange ? (
        <button className="btn btn-secondary" type="button" onClick={onChange}>
          {t('changeDeliveryDay')}
        </button>
      ) : null}
    </section>
  );
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
