import { isToday, isYesterday, format } from 'date-fns';

interface DayBucket<T> {
  label: string;
  key: string;
  data: T[];
}

export function groupSignalsByDay<T extends { id?: string; timestamp?: string }>(
  events: T[],
  getDate: (e: T) => string | undefined = (e) => e.timestamp,
): DayBucket<T>[] {
  const buckets = new Map<string, DayBucket<T>>();
  for (const e of events) {
    const raw = getDate(e);
    if (!raw) continue;
    const d = new Date(raw);
    if (isNaN(d.getTime())) continue;
    const key = format(d, 'yyyy-MM-dd');
    const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMM d');
    if (!buckets.has(key)) buckets.set(key, { key, label, data: [] });
    buckets.get(key)!.data.push(e);
  }
  return [...buckets.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}
