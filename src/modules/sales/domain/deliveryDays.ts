const BUSINESS_TIME_ZONE = 'America/Bogota';

export type WeekDeliveryDay = {
  date: string;
  dayOfMonth: number;
};

export function businessToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const year = parts.find(part => part.type === 'year')?.value ?? '';
  const month = parts.find(part => part.type === 'month')?.value ?? '';
  const day = parts.find(part => part.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

export function weekDeliveryDays(today: string): WeekDeliveryDay[] {
  const cursor = parseBusinessDate(today);
  if (!cursor) {
    return [];
  }
  const weekday = cursor.getUTCDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  cursor.setUTCDate(cursor.getUTCDate() - daysFromMonday);
  const days: WeekDeliveryDay[] = [];
  for (let step = 0; step < 7; step += 1) {
    days.push({
      date: cursor.toISOString().slice(0, 10),
      dayOfMonth: cursor.getUTCDate()
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function parseBusinessDate(today: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today);
  if (!match) {
    return null;
  }
  const cursor = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (
    cursor.getUTCFullYear() !== Number(match[1]) ||
    cursor.getUTCMonth() !== Number(match[2]) - 1 ||
    cursor.getUTCDate() !== Number(match[3])
  ) {
    return null;
  }
  return cursor;
}

export function deliveryDaysThroughSunday(today: string): WeekDeliveryDay[] {
  const cursor = parseBusinessDate(today);
  if (!cursor) {
    return [];
  }
  const days: WeekDeliveryDay[] = [];
  for (let step = 0; step < 7; step += 1) {
    days.push({
      date: cursor.toISOString().slice(0, 10),
      dayOfMonth: cursor.getUTCDate()
    });
    if (cursor.getUTCDay() === 0) {
      return days;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
