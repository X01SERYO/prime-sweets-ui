import { formatQuantityInput, parseQuantity, sanitizeQuantityInput } from '@/modules/sales/domain/quantity';
import { useLocale } from '@/shared/i18n/useLocale';

export function QuantityField({
  value,
  onChange,
  disabled,
  autoFocus,
  inputTabIndex,
  stepperTabIndex
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  inputTabIndex?: number;
  stepperTabIndex?: number;
}) {
  const { t } = useLocale();
  const current = parseQuantity(value);

  function step(delta: number) {
    const next = Math.round(((current ?? 0) + delta) * 1000) / 1000;
    if (next <= 0) {
      return;
    }
    onChange(formatQuantityInput(next, value.includes(',') ? ',' : '.'));
  }

  return (
    <div className="qty">
      <button className="btn btn-secondary" type="button" tabIndex={stepperTabIndex} aria-label={t('decreaseQuantity')} disabled={disabled || (current ?? 1) - 1 <= 0} onClick={() => step(-1)}>
        −
      </button>
      <input
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        tabIndex={inputTabIndex}
        inputMode="decimal"
        aria-label={t('quantityName')}
        onChange={event => onChange(sanitizeQuantityInput(event.target.value))}
      />
      <button className="btn btn-secondary" type="button" tabIndex={stepperTabIndex} aria-label={t('increaseQuantity')} disabled={disabled} onClick={() => step(1)}>
        +
      </button>
    </div>
  );
}
