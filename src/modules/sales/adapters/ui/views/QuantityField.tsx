import { useLocale } from '@/shared/i18n/useLocale';

export function parseQuantity(value: string): number | null {
  const parsed = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  const thousandths = Math.round(parsed * 1000);
  if (Math.abs(parsed * 1000 - thousandths) > 1e-6) {
    return null;
  }
  return thousandths / 1000;
}

export function QuantityField({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useLocale();
  const current = parseQuantity(value);

  function step(delta: number) {
    const next = Math.round(((current ?? 0) + delta) * 1000) / 1000;
    if (next <= 0) {
      return;
    }
    onChange(String(next));
  }

  return (
    <div className="qty">
      <button className="btn btn-secondary" type="button" aria-label={t('decreaseQuantity')} disabled={disabled || (current ?? 1) - 1 <= 0} onClick={() => step(-1)}>
        −
      </button>
      <input
        value={value}
        disabled={disabled}
        inputMode="decimal"
        aria-label={t('quantityName')}
        onChange={event => onChange(event.target.value)}
      />
      <button className="btn btn-secondary" type="button" aria-label={t('increaseQuantity')} disabled={disabled} onClick={() => step(1)}>
        +
      </button>
    </div>
  );
}
