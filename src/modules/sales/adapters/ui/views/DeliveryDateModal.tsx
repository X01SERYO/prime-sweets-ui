import { DeliveryDayCard } from '@/app/DeliveryDayCard';
import type { WeekDeliveryDay } from '@/modules/sales/domain/deliveryDays';

interface DeliveryDateModalProps {
  onSelect: (deliveryDate: string) => void;
  onClose: () => void;
  days?: WeekDeliveryDay[];
  title?: string;
}

export function DeliveryDateModal({ onSelect, days }: DeliveryDateModalProps) {
  return <DeliveryDayCard selectedDate={null} days={days} onSelect={onSelect} />;
}
